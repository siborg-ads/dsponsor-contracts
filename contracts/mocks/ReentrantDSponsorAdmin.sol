// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/Reentrant.sol";
import "../interfaces/IDSponsorNFT.sol";
import "../DSponsorAdmin.sol";

contract ReentrantDSponsorAdmin is Reentrancy {
    uint256 tokenId = 0;

    bool public pwed = false;

    function getMintPrice(
        uint256,
        address
    ) public pure returns (bool enabled, uint256 amount) {
        return (true, 10);
    }

    function getOwner() public view returns (address) {
        return address(this);
    }

    function mint(uint256, address, address, string calldata) public payable {
        // slither-disable-next-line reentrancy-benign
        _executeAttack();
        pwed = true;
    }

    function _executeAttack() internal override {
        if (reentrancyStage != State.ATTACK) {
            address currency = address(0);
            uint256 baseAmount = 0;

            reentrancyStage = State.ATTACK;

            tokenId++;
            string[] memory adParameters = new string[](1);
            adParameters[0] = "adParameters";
            string[] memory adDatas = new string[](1);
            adDatas[0] = "adDatas";

            DSponsorAdmin.MintAndSubmitAdParams memory args = DSponsorAdmin
                .MintAndSubmitAdParams(
                    tokenId,
                    address(this), // to
                    currency,
                    "tokenData",
                    baseAmount,
                    adParameters,
                    adDatas,
                    ""
                );

            // slither-disable-next-line reentrancy-eth
            DSponsorAdmin(msg.sender).mintAndSubmit{value: msg.value}(args);
        }
    }

    function _completeAttack() internal override {}
}
