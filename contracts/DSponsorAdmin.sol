// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DSponsorAgreements.sol";
import "./interfaces/IDSponsorNFT.sol";
import "./interfaces/IDSponsorNFTFactory.sol";
import "./lib/ProtocolFee.sol";

/**
 * @title DSponsorAdmin
 * @author Anthony Gourraud
 * @notice This main contract is the entrypoint for frontends within the DSponsor ecosystem.
 * It provides a set of functions to create and manage sponsorship tokens and ad proposals in a single transaction.
 * It also includes a mechanism to collect minting fees sent to the protocol treasury,
 * and a referral system to track and reward fee contributions from various participants.
 */
contract DSponsorAdmin is DSponsorAgreements, ProtocolFee {
    error InvalidAdData();
    error OfferDoesNotExist();

    struct MintAndSubmitAdParams {
        // Mint parameters
        uint256 tokenId;
        address to;
        address currency;
        string tokenData;
        // Offer parameters
        uint256 offerId;
        string[] adParameters;
        string[] adDatas;
        // Protocol fee, referral parameter
        string referralAdditionalInformation;
    }

    IDSponsorNFTFactory public immutable nftFactory;

    constructor(
        IDSponsorNFTFactory _nftFactory,
        address forwarder,
        address initialOwner,
        UniV3SwapRouter _swapRouter,
        address payable _recipient,
        uint96 _bps
    )
        DSponsorAgreements(forwarder, initialOwner)
        ProtocolFee(_swapRouter, _recipient, _bps)
    {
        nftFactory = _nftFactory;
    }

    /**
     * @notice Create a new sponsorship offer by creating a new DSponsorNFT contract
     * @param nftParams Params to deploy a new DSponsorNFT contract. See {IDSponsorNFT.InitParams} for more details
     * @param offerParams Params to create a new offer. See {DSponsorAgreements.OfferInitParams} for more details
     */
    function createDSponsorNFTAndOffer(
        IDSponsorNFT.InitParams memory nftParams,
        OfferInitParams calldata offerParams
    ) external {
        // force the allowed minter to be the DSponsorAdmin contract
        nftParams.minter = address(this);
        address newDSponsorNFT = nftFactory.createDSponsorNFT(nftParams);
        createOffer(IERC721(newDSponsorNFT), offerParams);
    }

    /**
     * @notice Mint a new sponsorship token and submit an ad proposal
     * @param params.tokenId ID of the token to mint
     * @param params.to Recipient of the sponsorship token
     * @param params.currency The ERC20 token address for payment, or address(0) for native currency.
     * @param params.tokenData Data related to the token
     * @param params.offerId ID of the sponsorship offer
     * @param params.adParameters Type of the ad parameter
     * @param params.adDatas Data for the ad proposal
     * @param params.referralAdditionalInformation Referral information for the minting
     *
     * @dev This function combines minting of a token with the submission of an ad proposal, leveraging the protocol's fee mechanism
     */
    function mintAndSubmit(
        MintAndSubmitAdParams calldata params
    ) external payable nonReentrant {
        if (params.adDatas.length != params.adParameters.length) {
            revert InvalidAdData();
        }

        IDSponsorNFT contractAddr = IDSponsorNFT(
            address(getOfferContract(params.offerId))
        );

        if (address(contractAddr) == address(0)) {
            revert OfferDoesNotExist();
        }

        (, uint256 mintPrice) = contractAddr.getMintPrice(
            params.tokenId,
            params.currency
        );

        // Prepare calldata for the mint function
        bytes memory mintCallData = abi.encodeWithSignature(
            "mint(uint256,address,address,string)",
            params.tokenId,
            params.to,
            params.currency,
            params.tokenData
        );

        ReferralRevenue memory referral = ReferralRevenue(
            contractAddr.getOwner(), // Enabler: media/content creator
            params.to, // Spender: using 'to' instead of _msgSender() for delegating payment systems
            params.referralAdditionalInformation // Additional info such as dapp developper address or tracking codes
        );

        // Execute the mint with protocol fee mechanism
        _externalCallWithProtocolFee(
            address(contractAddr),
            mintCallData,
            params.currency,
            mintPrice,
            referral
        );

        for (uint256 i = 0; i < params.adParameters.length; i++) {
            // Submit the ad proposal with the newly minted tokenId
            _submitAdProposal(
                params.offerId,
                params.tokenId,
                params.adParameters[i],
                params.adDatas[i]
            );
        }
    }

    function updateProtocolFee(
        address payable _recipient,
        uint96 _bps
    ) external onlyOwner {
        _updateProtocolFee(_recipient, _bps);
    }

    function _msgSender()
        internal
        view
        virtual
        override(ERC2771ContextOwnable, Context)
        returns (address)
    {
        return ERC2771ContextOwnable._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(ERC2771ContextOwnable, Context)
        returns (bytes calldata)
    {
        return ERC2771ContextOwnable._msgData();
    }

    function _contextSuffixLength()
        internal
        view
        virtual
        override(ERC2771ContextOwnable, Context)
        returns (uint256)
    {
        return ERC2771ContextOwnable._contextSuffixLength();
    }
}
