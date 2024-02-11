// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IProtocolFee.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

interface UniV3SwapRouter is ISwapRouter {
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

    UniV3SwapRouter public immutable swapRouter;
    uint96 public bps;
    address public recipient;

    constructor(UniV3SwapRouter _swapRouter, address _recipient, uint96 _bps) {
        swapRouter = _swapRouter;
        _updateProtocolFee(_recipient, _bps);
    }

    /**
     * @notice Executes a call to an external contract with protocol fee handling.
     * If the tx is sent with a positive value and a valid ERC20 currency is specified,
     * the contract swaps native coins to ERC20 tokens via Uniswap V3.
     *
     * @param target The address of the contract to call
     * @param callData The calldata to be sent with the call
     * @param currency The address of the ERC20 token for fee payment, or address(0) for native currency
     * @param baseAmount The base amount on which the fee is calculated
     * @param referral Referral information for the transaction
     * @return returnData The data returned by the external call
     *
     * Emits a `CallWithProtocolFee` event upon successful execution
     */
    function callWithProtocolFee(
        address target,
        bytes memory callData,
        address currency,
        uint256 baseAmount,
        ReferralRevenue memory referral
    ) public payable nonReentrant returns (bytes memory) {
        uint256 fee = (baseAmount * bps) / 10000;
        uint256 totalAmount = fee + baseAmount;
        if (currency == address(0)) {
            if (msg.value < totalAmount) {
                revert InsufficientFunds();
            }
            if (fee > 0) {
                Address.sendValue(payable(recipient), fee);
            }
        } else {
            // the transaction is not in native currency,
            // IF the user has sent value
            //    we swap to the ERC20 currency
            // ELSE
            //    we transfer ERC tokens from user to this contract
            if (msg.value > 0) {
                // contract receives tokens in ERC20
                _swapNativeToERC20(currency, totalAmount);

                // send fee to recipient
                IERC20(currency).safeTransfer(recipient, fee);
            } else {
                uint256 allowance = IERC20(currency).allowance(
                    _msgSender(),
                    address(this)
                );
                if (allowance < totalAmount) {
                    revert InsufficientAllowance();
                }

                // send fee to recipient
                IERC20(currency).safeTransferFrom(_msgSender(), recipient, fee);

                // send base amount to this contract
                IERC20(currency).safeTransferFrom(
                    _msgSender(),
                    address(this),
                    baseAmount
                );
            }

            // Approve the target to spend the received tokens
            IERC20(currency).forceApprove(address(target), baseAmount);
        }

        (bool success, bytes memory returnData) = target.call{
            value: currency == address(0) ? msg.value - fee : 0
        }(callData);
        if (!success) {
            revert ExternalCallError(string(returnData));
        }

        emit CallWithProtocolFee(
            target,
            currency,
            fee,
            referral.enabler,
            referral.spender,
            referral.additionalInformation
        );

        return returnData;
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
        bps = _bps;
        recipient = _recipient;
        emit FeeUpdate(_recipient, _bps);
    }

    function _swapNativeToERC20(
        address currency,
        uint256 amount
    ) private returns (uint256 amountOut) {
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
    }
}
