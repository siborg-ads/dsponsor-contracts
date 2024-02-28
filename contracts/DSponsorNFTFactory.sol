// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DSponsorNFT.sol";
import "./interfaces/IDSponsorNFTFactory.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

/**
 * @dev This is a factory contract to create DSponsorNFT contracts.
 * It uses a minimal proxy for gas efficiency and to reduce deployment costs.
 */
contract DSponsorNFTFactory is IDSponsorNFTFactory {
    event NewDSponsorNFT(
        address indexed contractAddr,
        address indexed owner,
        string name,
        string symbol,
        string baseURI,
        string contractURI,
        address minter,
        uint256 maxSupply,
        address forwarder,
        uint96 royaltyBps,
        address[] currencies,
        uint256[] prices,
        uint256[] allowedTokenIds
    );

    address public immutable nftImplementation;

    constructor(address _nftImplementation) {
        if (_nftImplementation == address(0)) {
            revert ZeroAddress();
        }
        nftImplementation = _nftImplementation;
    }

    function createDSponsorNFT(
        DSponsorNFT.InitParams memory params
    ) external returns (address instance) {
        instance = Clones.clone(nftImplementation);
        DSponsorNFT(instance).initialize(params);

        emit NewDSponsorNFT(
            instance,
            params.initialOwner,
            params.name,
            params.symbol,
            params.baseURI,
            params.contractURI,
            params.minter,
            params.maxSupply,
            params.forwarder,
            params.royaltyBps,
            params.currencies,
            params.prices,
            params.allowedTokenIds
        );
        return instance;
    }
}
