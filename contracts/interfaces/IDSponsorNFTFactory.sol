// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDSponsorNFT.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

/**
 * @dev This is a factory contract to create DSponsorNFT contracts.
 * It uses a minimal proxy for gas efficiency and to reduce deployment costs.
 */
interface IDSponsorNFTFactory {
    error ZeroAddress();

    function createDSponsorNFT(
        IDSponsorNFT.InitParams memory params
    ) external returns (address);
}
