// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC4907.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

interface IDSponsorNFTBase {
    /* ****************
     *  STRUCTS
     *****************/

    /// @dev Struct to initialize a DSponsorNFT contract
    struct InitParams {
        /// @notice ERC721 name of the contract
        string name;
        /// @notice ERC721 symbol of the contract
        string symbol;
        /// @notice Base URI for the tokens metadata
        string baseURI;
        /// @notice URI linking to the contract metadata
        string contractURI;
        /// @notice Restrict mint to deployer (expect to be DSponsorAdmin address)
        address minter;
        /// @notice Immutable maximum supply of tokens
        uint256 maxSupply;
        /// @notice Address of the forwarder contract (EIP-2771)
        address forwarder;
        /// @notice Address of the initial owner, who will have admin rights and get royalties
        address initialOwner;
        /// @notice Percentage of royalties to be paid to the owner on secondary sales (in basis points, 400 means 4%)
        uint96 royaltyBps;
        /// @notice Addresses of the ERC20 tokens accepted for payment to mint tokens
        address[] currencies;
        /// @notice Prices for minting tokens, indexed by currencies addresses
        uint256[] prices;
        /// @notice List of token IDs that are allowed to be minted (empty array means all tokens are allowed)
        uint256[] allowedTokenIds;
    }

    /// @dev Struct detailing the mint price settings for a token
    struct MintPriceSettings {
        /// @notice Indicates whether the currency is enabled
        bool enabled;
        /// @notice Price to mint the token in the currency
        uint256 amount;
    }

    /* ****************
     *  ERRORS
     *****************/

    error AlreadyMinted(uint256 tokenId);
    error AmountValueTooLow(uint256 value);
    error CannotBeZeroAddress();
    error ForbiddenCurrency(address currency);
    error InvalidInputLengths();
    error InvalidPricingStructure(address[] currencies, uint256[] prices);
    error MaxSupplyExceeded();
    error MaxSupplyShouldBeGreaterThan0();
    error UnauthorizedToMint();
    error TokenNotAllowed(uint256 tokenId);

    /* ****************
     *  EVENTS
     *****************/

    /// @dev ERC-4906 events
    event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId);
    event MetadataUpdated(uint256 indexed tokenId);

    event ContractURIUpdated(string contractURI);
    event ContractURIUpdated();

    event Mint(
        uint256 tokenId,
        address indexed from,
        address indexed to,
        address indexed currency,
        uint256 amount,
        string tokenData
    );

    event TokensAllowlist(bool indexed allowed);

    event TokensAllowlistUpdated(uint256 tokenId, bool indexed allowed);

    event UpdateDefaultMintPrice(
        address indexed currency,
        bool indexed enabled,
        uint256 indexed amount
    );

    event UpdateMintPrice(
        uint256 tokenId,
        address indexed currency,
        bool indexed enabled,
        uint256 indexed amount
    );

    /* ****************
     *  FUNCTIONS
     *****************/

    function MAX_SUPPLY() external view returns (uint256);

    function baseURI() external view returns (string memory);

    function contractURI() external view returns (string memory);

    function totalSupply() external view returns (uint256);

    function mint(
        uint256 tokenId,
        address to,
        address currency,
        string calldata tokenData
    ) external payable;

    function setBaseURI(string memory URI) external;

    function setContractURI(string memory URI) external;

    function setDefaultMintPrice(
        address currency,
        bool enabled,
        uint256 amount
    ) external;

    function setMintPrice(
        uint256 tokenId,
        address currency,
        bool enabled,
        uint256 amount
    ) external;

    function setRoyalty(address receiver, uint96 bps) external;

    function setTokensAllowlist(bool _applyTokensAllowlist) external;

    function setTokensAreAllowed(
        uint256[] calldata tokenIds,
        bool[] calldata allowed
    ) external;

    function setTokenURI(uint256 tokenId, string memory URI) external;

    function setTokenURIs(
        uint256[] calldata _tokenIds,
        string[] calldata _tokenURIs
    ) external;

    function getMintPrice(
        uint256 tokenId,
        address currency
    ) external view returns (bool, uint256);

    function getOwner() external view returns (address);

    function tokenIdIsAllowedToMint(
        uint256 tokenId
    ) external view returns (bool);
}

interface IDSponsorNFT is IDSponsorNFTBase, IERC721, IERC2981, IERC4907 {}
