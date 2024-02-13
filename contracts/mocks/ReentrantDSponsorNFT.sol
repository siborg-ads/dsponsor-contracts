// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/Reentrant.sol";
import "../interfaces/IDSponsorNFT.sol";

contract ReentrantDSponsorNFT is Reentrancy {
    uint256 public constant tokenId = 15;

    function _executeAttack() internal override {
        if (reentrancyStage != State.ATTACK) {
            // slither-disable-next-line reentrancy-eth
            IDSponsorNFT(msg.sender).mint{value: msg.value}(
                tokenId,
                address(this),
                address(0),
                ""
            );
            reentrancyStage = State.ATTACK;
        }
    }

    function _completeAttack() internal override {}
}
