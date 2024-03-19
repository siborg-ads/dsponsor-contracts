// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IProtocolFee.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IPeripheryPayments.sol";

interface WETH {
    function deposit() external payable;

    function withdraw(uint256 wad) external;
}

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
    uint96 public feeBps;
    address payable public feeRecipient;

    /**
     *
     * @param _swapRouter The address of the Uniswap V3 SwapRouter
     * @param _recipient The address to receive the protocol fee
     * @param _bps The initial protocol fee in basis points (400 for 4%)
     */
    constructor(
        UniV3SwapRouter _swapRouter,
        address payable _recipient,
        uint96 _bps
    ) {
        swapRouter = _swapRouter;
        _updateProtocolFee(_recipient, _bps);
    }

    function getFeeAmount(uint256 baseAmount) public view returns (uint256) {
        return Math.mulDiv(baseAmount, feeBps, MAX_BPS);
    }

    /**
     * @notice function intended to execute calls to external contracts with protocol fee handling,
     * with the capability to handle both native currency and ERC20 token payments.
     * It also includes logic to swap native currency to ERC20 tokens via Uniswap V3
     * if {msg.value} > 0 and the currency is not {address(0)}.
     *
     * @param target The address of the contract to call
     * @param callData The calldata to be sent with the call
     * @param currency The address of the ERC20 token for fee payment, or address(0) for native currency
     * @param baseAmount Amount to send to the {target} contract. The protocol fee will be ADDED to this amount
     * @param referral Referral information for the transaction. referral.spender will receive the refund if a swap occurs
     * @return returnData The data returned by the external call
     *
     * @dev Calling this function with no nonReentrant modifier is dangerous as it allows reentrancy
     */
    function _externalCallWithProtocolFee(
        address target,
        bytes memory callData,
        address currency,
        uint256 baseAmount,
        ReferralRevenue memory referral
    ) internal returns (bytes memory) {
        uint256 feeAmount = getFeeAmount(baseAmount);
        uint256 totalAmount = feeAmount + baseAmount;

        if (currency == address(0)) {
            // Handling native currency
            if (msg.value < totalAmount) {
                revert InsufficientFunds();
            }
        } else {
            // Handling ERC20 tokens
            if (msg.value > 0) {
                // Swap native currency to ERC20 if value is sent
                _swapNativeToERC20(currency, totalAmount, referral.spender);
            } else {
                IERC20(currency).safeTransferFrom(
                    _msgSender(),
                    address(this),
                    totalAmount
                );
            }

            // Approve the target to spend the received tokens
            IERC20(currency).forceApprove(address(target), baseAmount);
        }

        _payFee(address(this), currency, feeAmount, target, referral);

        /**
         *  @dev While this function ensures protocol fee handling and currency swapping,
         * the actual outcome of the external call is dependent on the target contract's logic.
         * This function does not enforce any constraints or expectations on the call's execution result,
         * leaving the responsibility for handling the external call's effects to the caller or the target contract.
         */
        uint256 value = currency == address(0) ? msg.value - feeAmount : 0;
        bytes memory retData = Address.functionCallWithValue(
            target,
            callData,
            value
        );

        return retData;
    }

    /**
     * @notice Send a payment with ERC20 tokens or native currency
     *
     * @param from The address of the payment sender
     * @param to The address of the recipient
     * @param currency The address of the ERC20 token for fee payment, or address(0) for native currency
     * @param feeAmount The amount to send
     */
    function _pay(
        address from,
        address to,
        address currency,
        uint256 feeAmount
    ) internal {
        if (feeAmount > 0) {
            if (currency == address(0)) {
                if (from != address(this)) {
                    revert CannotSendValueFromSender();
                } else {
                    Address.sendValue(payable(to), feeAmount);
                }
            } else {
                if (from == address(this)) {
                    IERC20(currency).safeTransfer(to, feeAmount);
                } else {
                    IERC20(currency).safeTransferFrom(from, to, feeAmount);
                }
            }
        }
    }

    /**
     * @notice Pays the protocol fee to the fee recipient, tracking the transaction details for the referral system
     *
     * @param from The address of the transaction sender
     * @param currency The address of the ERC20 token for fee payment, or address(0) for native currency
     * @param feeAmount The amount to send to the protocol fee recipient
     * @param origin To track the origin of the transaction
     * @param referral To track the referral information for the transaction
     */
    function _payFee(
        address from,
        address currency,
        uint256 feeAmount,
        address origin,
        ReferralRevenue memory referral
    ) internal {
        _pay(from, feeRecipient, currency, feeAmount);

        emit CallWithProtocolFee(
            origin,
            currency,
            feeAmount,
            referral.enabler,
            referral.spender,
            referral.additionalInformation
        );
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
        address weth = swapRouter.WETH9();
        if (currency == weth) {
            WETH(weth).deposit{value: msg.value}();
        } else {
            uint256 balanceBeforeSwap = address(this).balance - msg.value;

            // perform the swap
            ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter
                .ExactOutputSingleParams({
                    tokenIn: weth,
                    tokenOut: currency,
                    fee: 3000,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountOut: amount,
                    amountInMaximum: msg.value,
                    sqrtPriceLimitX96: 0
                });
            amountOut = swapRouter.exactOutputSingle{value: msg.value}(params);

            // refund the remaining native currency
            swapRouter.refundETH();
            uint256 balanceAfterSwap = address(this).balance;
            if (balanceAfterSwap > balanceBeforeSwap) {
                Address.sendValue(
                    payable(recipientRefund),
                    balanceAfterSwap - balanceBeforeSwap
                );
            }
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
    function _updateProtocolFee(
        address payable _recipient,
        uint96 _bps
    ) internal {
        if (_recipient == address(0)) {
            revert ZeroAddress();
        }
        if (_bps > MAX_BPS) {
            revert InvalidBps();
        }
        feeBps = _bps;
        feeRecipient = _recipient;
        emit FeeUpdate(_recipient, _bps);
    }

    receive() external payable {}
}
