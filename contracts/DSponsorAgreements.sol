// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IDSponsorAgreements.sol";
import "./interfaces/IERC4907.sol";
import "./lib/ERC2771ContextOwnable.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";

/**
 * @title DSponsorAgreements
 * @author Anthony Gourraud
 * @notice This contract manages sponsorship offers and ad proposals for ERC721 tokens,
 * enabling creators/publishers to set up sponsoring conditions and sponsors to submit ad proposals.
 * Offers and proposals are managed through structured data and access control mechanisms.
 */
contract DSponsorAgreements is IDSponsorAgreements, ERC2771ContextOwnable {
    /// @dev Counter for sponsoring offers from creators/publishers
    uint256 private _offerCountId;

    /// @dev Counter for ad proposals from sponsors
    uint256 private _proposalCounterId;

    /// @dev offer id => sponsoring offer
    mapping(uint256 => SponsoringOffer) private _sponsoringOffers;

    /* ****************
     *  MODIFIERS
     *****************/

    modifier onlyAdmin(uint256 offerId) {
        if (!_sponsoringOffers[offerId].admins[_msgSender()]) {
            revert UnallowedAdminOperation(_msgSender(), offerId);
        }
        _;
    }

    modifier onlyAllowedAdParameter(
        uint256 offerId,
        string memory adParameter
    ) {
        if (
            !_sponsoringOffers[offerId].adParameters[_hashString(adParameter)]
        ) {
            revert UnallowedAdParameter(offerId, adParameter);
        }
        _;
    }

    /// @dev authorize 'user' (ERC4907 tenant) or 'owner' (ERC721) of the token to submit a proposal
    modifier onlySponsor(uint256 offerId, uint256 tokenId) {
        bool isOwner = _sponsoringOffers[offerId].nftContract.ownerOf(
            tokenId
        ) == _msgSender();

        if (!isOwner) {
            bool isUser = false;
            try
                IERC4907(address(_sponsoringOffers[offerId].nftContract))
                    .userOf(tokenId)
            returns (address user) {
                isUser = user == _msgSender();
            } catch (bytes memory) {
                /// @dev means NFT contract is not ERC4907 compliant
            }

            if (!isUser) {
                revert UnallowedSponsorOperation(
                    _msgSender(),
                    offerId,
                    tokenId
                );
            }
        }

        _;
    }

    modifier onlyValidator(uint256 offerId) {
        if (
            !_sponsoringOffers[offerId].admins[_msgSender()] &&
            !_sponsoringOffers[offerId].validators[_msgSender()]
        ) {
            revert UnallowedValidatorOperation(_msgSender(), offerId);
        }
        _;
    }

    /* ****************
     *  CONSTRUCTOR
     *****************/
    /**
     * @param forwarder EIP2771 forwarder address, for gasless transactions
     * @param initialOwner Admin address to set forwarder
     */
    constructor(
        address forwarder,
        address initialOwner
    ) ERC2771ContextOwnable(forwarder, initialOwner) {}

    /* ****************
     *  PUBLIC FUNCTIONS
     *****************/

    /**
     * @notice Creates a new sponsoring offer for a specified ERC721 contract.
     * @param nftContract The ERC721 contract address associated with the offer.
     * @param offerParams Struct containing offer details such as name, rulesURI, and options including admins, validators, and ad parameters.
     * @dev Emits an `UpdateOffer` event upon successful creation.
     */
    function createOffer(
        IERC721 nftContract,
        OfferInitParams calldata offerParams
    ) public {
        if (bytes(offerParams.rulesURI).length == 0) {
            revert EmptyString("rulesURI");
        }

        if (offerParams.options.admins.length == 0) {
            revert NoAdminsProvided();
        }

        if (offerParams.options.adParameters.length == 0) {
            revert NoAdParametersProvided();
        }

        _offerCountId++;

        _sponsoringOffers[_offerCountId].nftContract = nftContract;
        _updateOffer(
            _offerCountId,
            false,
            offerParams.name,
            offerParams.rulesURI
        );

        _updateOfferAdmins(_offerCountId, true, offerParams.options.admins);
        _updateOfferValidators(
            _offerCountId,
            true,
            offerParams.options.validators
        );
        _updateOfferAdParameters(
            _offerCountId,
            true,
            offerParams.options.adParameters
        );
    }

    /**
     * @notice Submits an ad proposal for a given token within a sponsoring offer.
     * @param offerId Identifier of the sponsoring offer.
     * @param tokenId Token ID targeted by the ad proposal.
     * @param adParameter The ad parameter defining the characteristic of the ad proposal (eg. logo, link).
     * @param data The actual ad content or metadata.
     * @dev Checks if the sender is authorized as a sponsor and if the ad parameter is allowed. Reverts if the offer is disabled. Emits an `UpdateAdProposal` event.
     */
    function submitAdProposal(
        uint256 offerId,
        uint256 tokenId,
        string calldata adParameter,
        string calldata data
    ) public onlySponsor(offerId, tokenId) {
        _submitAdProposal(offerId, tokenId, adParameter, data);
    }

    /**
     * @notice Submits multiple ad proposals. See {submitAdProposal}
     */
    function submitAdProposals(
        uint256[] calldata offerIds,
        uint256[] calldata tokenIds,
        string[] calldata adParameters,
        string[] calldata data
    ) external {
        if (
            offerIds.length != tokenIds.length ||
            offerIds.length != adParameters.length ||
            offerIds.length != data.length
        ) {
            revert InvalidArrayLength();
        }

        for (uint256 i = 0; i < offerIds.length; i++) {
            submitAdProposal(
                offerIds[i],
                tokenIds[i],
                adParameters[i],
                data[i]
            );
        }
    }

    /**
     * @notice Validates or rejects an ad proposal for a specific token and ad parameter within an offer.
     * @param offerId The ID of the offer containing the proposal.
     * @param tokenId The token ID the proposal is associated with.
     * @param proposalId The ID of the proposal being validated or rejected.
     * @param adParameter The ad parameter the proposal pertains to.
     * @param validated Boolean indicating whether the proposal is validated or rejected.
     * @param reason Reason for validation or rejection, useful for feedback.
     * @dev Only callable by validators of the offer. Updates the status of the proposal. Emits `UpdateAdValidation` event.
     */
    function reviewAdProposal(
        uint256 offerId,
        uint256 tokenId,
        uint256 proposalId,
        string calldata adParameter,
        bool validated,
        string calldata reason
    ) public onlyValidator(offerId) {
        SponsoringProposal storage adParameterProposals = _sponsoringOffers[
            offerId
        ].proposals[tokenId][_hashString(adParameter)];

        if (proposalId != adParameterProposals.lastSubmitted) {
            revert ProposalNotSubmittedBySponsor(
                offerId,
                tokenId,
                adParameter,
                proposalId
            );
        }

        if (validated) {
            adParameterProposals.lastValidated = proposalId;
        } else {
            adParameterProposals.lastRejected = proposalId;
        }

        // The validator action is final. He cannot change the status of the proposal
        adParameterProposals.lastSubmitted = 0;

        emit UpdateAdValidation(
            offerId,
            tokenId,
            proposalId,
            adParameter,
            validated,
            reason
        );
    }

    /**
     * @notice Validates or rejects multiple ad proposals. See {reviewAdProposal}
     **/
    function reviewAdProposals(ReviewAdProposal[] calldata reviews) external {
        for (uint256 i = 0; i < reviews.length; i++) {
            reviewAdProposal(
                reviews[i].offerId,
                reviews[i].tokenId,
                reviews[i].proposalId,
                reviews[i].adParameter,
                reviews[i].validated,
                reviews[i].reason
            );
        }
    }

    /**
     * @notice Updates the details and settings of an existing sponsoring offer.
     * @param offerId The ID of the offer to update.
     * @param disable Flag to disable or enable the offer.
     * @param name New name for the offer. Set empty string to keep the current name.
     * @param rulesURI New URI for the offer's description and conditions. Set empty string to keep the current URI.
     * @param addOptions Add admins, validators, and ad parameters.
     * @param removeOptions Remove admins, validators, and ad parameters.
     * @dev Only callable by offer admins. Emits `UpdateOffer` and potentially `UpdateOfferAdmin`, `UpdateOfferValidator`, `UpdateOfferAdParameter` events.
     */
    function updateOffer(
        uint256 offerId,
        bool disable,
        string calldata name,
        string calldata rulesURI,
        OfferOptions calldata addOptions,
        OfferOptions calldata removeOptions
    ) external onlyAdmin(offerId) {
        _updateOffer(offerId, disable, name, rulesURI);

        _updateOfferAdmins(offerId, true, addOptions.admins);
        _updateOfferAdmins(offerId, false, removeOptions.admins);

        _updateOfferValidators(offerId, true, addOptions.validators);
        _updateOfferValidators(offerId, false, removeOptions.validators);

        _updateOfferAdParameters(offerId, true, addOptions.adParameters);
        _updateOfferAdParameters(offerId, false, removeOptions.adParameters);
    }

    /* ****************
     *  EXTERNAL VIEW FUNCTIONS
     *****************/

    function getOfferContract(uint256 offerId) public view returns (IERC721) {
        return _sponsoringOffers[offerId].nftContract;
    }

    function getOfferProposals(
        uint256 offerId,
        uint256 tokenId,
        string calldata adParameter
    )
        external
        view
        returns (
            uint256 lastSubmitted,
            uint256 lastValidated,
            uint256 lastRejected
        )
    {
        SponsoringProposal storage proposal = _sponsoringOffers[offerId]
            .proposals[tokenId][_hashString(adParameter)];

        lastRejected = proposal.lastRejected;
        lastSubmitted = proposal.lastSubmitted;
        lastValidated = proposal.lastValidated;
    }

    function isAllowedAdParameter(
        uint256 offerId,
        string calldata adParameter
    ) external view returns (bool) {
        return
            _sponsoringOffers[offerId].adParameters[_hashString(adParameter)];
    }

    function isOfferAdmin(
        uint256 offerId,
        address admin
    ) external view returns (bool) {
        return _sponsoringOffers[offerId].admins[admin];
    }

    function isOfferDisabled(uint256 offerId) external view returns (bool) {
        return _sponsoringOffers[offerId].disabled;
    }

    function isOfferValidator(
        uint256 offerId,
        address validator
    ) external view returns (bool) {
        return _sponsoringOffers[offerId].validators[validator];
    }

    /* ****************
     *  PRIVATE FUNCTIONS
     *****************/

    function _hashString(string memory input) private pure returns (bytes32) {
        if (bytes(input).length == 0) {
            revert EmptyString("inputHashString");
        }
        return keccak256(abi.encodePacked(input));
    }

    function _submitAdProposal(
        uint256 offerId,
        uint256 tokenId,
        string calldata adParameter,
        string calldata data
    ) internal onlyAllowedAdParameter(offerId, adParameter) {
        if (bytes(data).length == 0) {
            revert NoAdDataSubmitted();
        }

        if (_sponsoringOffers[offerId].disabled) {
            revert DisabledOffer(offerId);
        }

        _proposalCounterId++;

        _sponsoringOffers[offerId]
        .proposals[tokenId][_hashString(adParameter)]
            .lastSubmitted = _proposalCounterId;

        emit UpdateAdProposal(
            offerId,
            tokenId,
            _proposalCounterId,
            adParameter,
            data
        );
    }

    function _updateOffer(
        uint256 offerId,
        bool disable,
        string calldata name,
        string calldata rulesURI
    ) private {
        _sponsoringOffers[offerId].disabled = disable;

        /// @dev: When indexing from events, ignore updated name & rulesURI if empty
        emit UpdateOffer(
            offerId,
            disable,
            name,
            rulesURI,
            _sponsoringOffers[offerId].nftContract
        );
    }

    function _updateOfferAdParameters(
        uint256 offerId,
        bool enable,
        string[] calldata adParameters
    ) private {
        for (uint256 i = 0; i < adParameters.length; i++) {
            _sponsoringOffers[offerId].adParameters[
                _hashString(adParameters[i])
            ] = enable;
            emit UpdateOfferAdParameter(offerId, adParameters[i], enable);
        }
    }

    function _updateOfferAdmins(
        uint256 offerId,
        bool enable,
        address[] calldata admins
    ) private {
        for (uint256 i = 0; i < admins.length; i++) {
            if (!enable && admins[i] == _msgSender()) {
                revert CannotRemoveSelfAsAdmin();
            }
            _sponsoringOffers[offerId].admins[admins[i]] = enable;
            emit UpdateOfferAdmin(offerId, admins[i], enable);
        }
    }

    function _updateOfferValidators(
        uint256 offerId,
        bool enable,
        address[] calldata validators
    ) private {
        for (uint256 i = 0; i < validators.length; i++) {
            _sponsoringOffers[offerId].validators[validators[i]] = enable;
            emit UpdateOfferValidator(offerId, validators[i], enable);
        }
    }
}
