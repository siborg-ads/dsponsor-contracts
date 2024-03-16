// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IProtocolFee.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IPeripheryPayments.sol";

interface UniV3SwapRouter is ISwapRouter, IPeripheryPayments {
    function WETH9() external view returns (address);
}

/**
 * @title ProtocolFee
 * @author Anthony Gourraud
 * @notice This contract incorporates protocol fee handling for transactions, enabling revenue generation for the protocol.
 *         It also supports a referral system to track and reward contributions from various ecosystem participants,
 *         including content creators, sponsors, and referrers. The contract ensures that every transaction contributing
 *         to the treasury is recorded to reward later accordingly, fostering a sustainable and growth-oriented ecosystem.
 */
abstract contract ProtocolFee is IProtocolFee, Context, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev The max bps of the contract. So, 10_000 == 100 %
    uint64 public constant MAX_BPS = 10_000;

    UniV3SwapRouter public immutable swapRouter;
    uint96 public bps;
    address public recipient;

    /**
     *
     * @param _swapRouter The address of the Uniswap V3 SwapRouter
     * @param _recipient The address to receive the protocol fee
     * @param _bps The initial protocol fee in basis points (400 for 4%)
     */
    constructor(UniV3SwapRouter _swapRouter, address _recipient, uint96 _bps) {
        swapRouter = _swapRouter;
        _updateProtocolFee(_recipient, _bps);
    }

    /**
     * @notice function intended to execute calls to external contracts with protocol fee handling,
     * with the capability to handle both native currency and ERC20 token payments.
     * It also includes logic to swap native currency to ERC20 tokens via Uniswap V3 if necessary.
     *
     * @param target The address of the contract to call
     * @param callData The calldata to be sent with the call
     * @param currency The address of the ERC20 token for fee payment, or address(0) for native currency
     * @param baseAmount The base amount on which the fee is calculated
     * @param referral Referral information for the transaction. referral.spender will receive the refund if a swap occured
     * @return returnData The data returned by the external call
     *
     * Emits a `CallWithProtocolFee` event upon successful execution
     * @dev Calling this function with no nonReentrant modifier is dangerous as it allows reentrancy
     */
    function _callWithProtocolFee(
        address target,
        bytes memory callData,
        address currency,
        uint256 baseAmount,
        ReferralRevenue memory referral
    ) internal returns (bytes memory) {
        uint256 fee = Math.mulDiv(baseAmount, bps, 10000);
        uint256 totalAmount = fee + baseAmount;

        if (currency == address(0)) {
            // Handling native currency
            if (msg.value < totalAmount) {
                revert InsufficientFunds();
            }
            if (fee > 0) {
                Address.sendValue(payable(recipient), fee);
            }
        } else {
            // Handling ERC20 tokens
            if (msg.value > 0) {
                // Swap native currency to ERC20 if value is sent
                _swapNativeToERC20(currency, totalAmount, referral.spender);
                IERC20(currency).safeTransfer(recipient, fee);
            } else {
                // Transfer ERC20 tokens from user wallet
                IERC20(currency).safeTransferFrom(_msgSender(), recipient, fee);
                IERC20(currency).safeTransferFrom(
                    _msgSender(),
                    address(this),
                    baseAmount
                );
            }

            // Approve the target to spend the received tokens
            IERC20(currency).forceApprove(address(target), baseAmount);
        }

        /**
         *  @dev While this function ensures protocol fee handling and currency swapping,
         * the actual outcome of the external call is dependent on the target contract's logic.
         * This function does not enforce any constraints or expectations on the call's execution result,
         * leaving the responsibility for handling the external call's effects to the caller or the target contract.
         */
        uint256 value = currency == address(0) ? msg.value - fee : 0;
        bytes memory retData = Address.functionCallWithValue(
            target,
            callData,
            value
        );

        emit CallWithProtocolFee(
            target,
            currency,
            fee,
            referral.enabler,
            referral.spender,
            referral.additionalInformation
        );

        return retData;
    }

    /**
     * @notice Swaps {msg.value} to ERC20 tokens via Uniswap V3
     *
     * @param currency The address of the ERC20 token to swap to
     * @param amount The amount of ERC20 tokens to get
     * @param recipientRefund The address to refund the remaining native currency
     *
     * @return amountOut The amount of ERC20 tokens received
     */
    function _swapNativeToERC20(
        address currency,
        uint256 amount,
        address recipientRefund
    ) internal returns (uint256 amountOut) {
        ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter
            .ExactOutputSingleParams({
                tokenIn: swapRouter.WETH9(),
                tokenOut: currency,
                fee: 3000,
                recipient: address(this),
                deadline: block.timestamp,
                amountOut: amount,
                amountInMaximum: msg.value,
                sqrtPriceLimitX96: 0
            });
        amountOut = swapRouter.exactOutputSingle{value: msg.value}(params);

        swapRouter.refundETH();
        if (address(this).balance > 0) {
            Address.sendValue(payable(recipientRefund), address(this).balance);
        }
    }

    /**
     * @notice Updates the protocol fee and recipient address
     *
     * @param _recipient The address to receive the protocol fee
     * @param _bps The new protocol fee in basis points
     *
     * Emits a `FeeUpdate` event upon successful execution
     */
    function _updateProtocolFee(address _recipient, uint96 _bps) internal {
        if (_recipient == address(0)) {
            revert ZeroAddress();
        }
        if (_bps > MAX_BPS) {
            revert InvalidBps();
        }
        bps = _bps;
        recipient = _recipient;
        emit FeeUpdate(_recipient, _bps);
    }

    receive() external payable {}
}
