// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/Reentrant.sol";
import "../interfaces/IDSponsorNFT.sol";
import "../DSponsorAdmin.sol";

contract ReentrantDSponsorAdmin is Reentrancy {
    uint256 public tokenId;

    bool public pwed = false;

    function dummy(bool _pwed) public {
        _executeAttack();
        pwed = _pwed;
    }

    function _executeAttack() internal override {
        if (reentrancyStage != State.ATTACK) {
            address currency = address(0);
            uint256 baseAmount = 0;
            ProtocolFee.ReferralRevenue memory referral = IProtocolFee
                .ReferralRevenue({
                    enabler: address(this),
                    spender: address(this),
                    additionalInformation: "none"
                });

            bytes memory callData = abi.encodeWithSignature(
                "dummy(bool)",
                true
            );

            reentrancyStage = State.ATTACK;

            DSponsorAdmin(msg.sender).callWithProtocolFee(
                address(this),
                callData,
                currency,
                baseAmount,
                referral
            );

            reentrancyStage = State.ATTACK;
        }
    }

    function _completeAttack() internal override {}
}
