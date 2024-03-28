// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IProtocolFee {
    /// @notice Captures transaction details for a referral system, to track and reward contributions to the protocol treasury.
    struct ReferralRevenue {
        /// @notice The enabler, often a creator of sponsorship offers, shares revenue with the protocol.
        address enabler;
        /// @notice The spender, typically a sponsor, sends funds to the treasury.
        address spender;
        /// @notice Additional information for facilitating transactions, such as business referrer IDs or tracking codes.
        string additionalInformation;
    }

    error CannotSendValueFromSender();
    error ExternalCallError();
    error InsufficientAllowance();
    error InsufficientFunds();
    error InvalidBps();
    error ZeroAddress();

    event CallWithProtocolFee(
        address indexed origin,
        address indexed currency,
        uint256 feeAmount,
        address enabler,
        address spender,
        string additionalInformation
    );
    event FeeUpdate(address recipient, uint96 bps);

    function feeBps() external view returns (uint96);

    function feeRecipient() external view returns (address payable);

    function getFeeAmount(uint256 baseAmount) external view returns (uint256);
}
