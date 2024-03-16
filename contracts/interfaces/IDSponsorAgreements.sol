// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/interfaces/IERC721.sol";

interface IDSponsorAgreements {
    /// @dev Struct to initialize a sponsoring offer with basic information and options.
    struct OfferInitParams {
        /// @notice Name of the offer, providing a brief identifier.
        string name;
        /// @notice URI linking to description, detailed rules and publisher conditions.
        string rulesURI;
        /// @notice Configurable options for the offer, including admins, validators, and ad parameters.
        OfferOptions options;
    }

    /// @dev Struct detailing the options for a sponsoring offer, including administrative and validation controls.
    struct OfferOptions {
        /// @notice Addresses with administrative rights over the offer
        address[] admins;
        /// @notice Addresses authorized to validate ad proposals
        address[] validators;
        /// @notice Specific ad parameters (e.g., link, logo, audioAd) that define the format of ads associated with the offer.
        string[] adParameters;
    }

    /// @dev Represents a sponsorship offer associated with an ERC721 contract, managed by a sponsee (such as a creator or a media).
    struct SponsoringOffer {
        /// @notice Indicates whether new ad proposals can be submitted for this offer.
        bool disabled;
        /// @notice The ERC721 contract to which this sponsorship offer is linked. Sponsors can propose ads for tokens they own.
        IERC721 nftContract;
        /// @notice A mapping of addresses with admin rights to modify offer settings and approve ad proposals.
        mapping(address => bool) admins;
        /// @notice A mapping of addresses authorized to review and approve ad proposals.
        mapping(address => bool) validators;
        /// @notice A mapping defining which ad parameters are allowed, such as "link", "logo", or "audioAd".
        mapping(bytes32 => bool) adParameters;
        /// @notice Tracks the proposals for each token, indexed by ad parameters, including their submission and review statuses.
        mapping(uint256 => mapping(bytes32 => SponsoringProposal)) proposals;
    }

    /// @dev Holds the status of proposals tracking the latest submission, validation, and rejection.
    struct SponsoringProposal {
        uint256 lastValidated; // ID of the most recently validated ad proposal.
        uint256 lastRejected; // ID of the most recently rejected ad proposal.
        uint256 lastSubmitted; // ID of the latest ad proposal submission.
    }

    /// @dev Struct to batch review ad proposals
    struct ReviewAdProposal {
        uint256 offerId;
        uint256 tokenId;
        uint256 proposalId;
        string adParameter;
        bool validated;
        string reason;
    }

    /* ****************
     *  ERRORS
     *****************/

    error CannotRemoveSelfAsAdmin();
    error DisabledOffer(uint256 offerId);
    error EmptyString(string key);
    error InvalidArrayLength();
    error NoAdDataSubmitted();
    error NoAdminsProvided();
    error NoAdParametersProvided();
    error ProposalNotSubmittedBySponsor(
        uint256 offerId,
        uint256 tokenId,
        string adParameter,
        uint256 proposalId
    );
    error UnallowedAdminOperation(address msgSender, uint256 offerId);
    error UnallowedAdParameter(uint256 offerId, string adParameter);
    error UnallowedSponsorOperation(
        address msgSender,
        uint256 offerId,
        uint256 tokenId
    );
    error UnallowedValidatorOperation(address msgSender, uint256 offerId);

    /* ****************
     *  EVENTS
     ******************/

    event UpdateAdProposal(
        uint256 indexed offerId,
        uint256 indexed tokenId,
        uint256 indexed proposalId,
        string adParameter,
        string data
    );
    event UpdateAdValidation(
        uint256 indexed offerId,
        uint256 indexed tokenId,
        uint256 indexed proposalId,
        string adParameter,
        bool validated,
        string reason
    );

    event UpdateOffer(
        uint256 indexed offerId,
        bool indexed disable,
        string name,
        string rulesURI,
        IERC721 indexed nftContract
    );
    event UpdateOfferAdmin(
        uint256 indexed offerId,
        address indexed admin,
        bool indexed enable
    );
    event UpdateOfferValidator(
        uint256 indexed offerId,
        address indexed validator,
        bool indexed enable
    );
    event UpdateOfferAdParameter(
        uint256 indexed offerId,
        string indexed adParameter,
        bool indexed enable
    );

    /* ****************
     *  FUNCTIONS
     *****************/

    function createOffer(
        IERC721 nftContract,
        OfferInitParams calldata offerParams
    ) external;

    function submitAdProposal(
        uint256 offerId,
        uint256 tokenId,
        string calldata adParameter,
        string calldata data
    ) external;

    function submitAdProposals(
        uint256[] calldata offerId,
        uint256[] calldata tokenIds,
        string[] calldata adParameters,
        string[] calldata data
    ) external;

    function reviewAdProposal(
        uint256 offerId,
        uint256 tokenId,
        uint256 proposalId,
        string calldata adParameter,
        bool validated,
        string calldata reason
    ) external;

    function reviewAdProposals(ReviewAdProposal[] calldata reviews) external;

    function updateOffer(
        uint256 offerId,
        bool disable,
        string calldata name,
        string calldata rulesURI,
        OfferOptions calldata addOptions,
        OfferOptions calldata removeOptions
    ) external;

    /* ****************
     *  VIEW FUNCTIONS
     *****************/

    function getOfferContract(uint256 offerId) external view returns (IERC721);

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
        );

    function isAllowedAdParameter(
        uint256 offerId,
        string calldata adParameter
    ) external view returns (bool);

    function isOfferAdmin(
        uint256 offerId,
        address admin
    ) external view returns (bool);

    function isOfferDisabled(uint256 offerId) external view returns (bool);

    function isOfferValidator(
        uint256 offerId,
        address validator
    ) external view returns (bool);
}
