// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IDSponsorNFTBase} from "./interfaces/IDSponsorNFT.sol";
import "./lib/ERC2771ContextUpgradeable.sol";
import "./lib/ERC4907Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title DSponsorNFT
 * @author Anthony Gourraud
 * @notice DSponsorNFT is an NFT contract that integrates various standards and custom functionalities.
 * It combines pricing in ERC20 tokens and in native currency, adds rental capabilities with ERC4907, and supports ERC2981 royalties.
 * Minting conditions can be set for specific tokens, and priced in any ERC20 token or native currency, and can be changed or disabled by the owner.
 * The contract owner can also set a custom base URI for token metadata and a contract-level metadata URI.
 */
contract DSponsorNFT is
    IDSponsorNFTBase,
    Initializable,
    ERC2771ContextUpgradeable,
    ERC721RoyaltyUpgradeable,
    ERC4907Upgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;
    using Strings for uint256;
    using Strings for address;

    // Counter for the number of tokens minted so far.
    uint256 public totalSupply;

    // Maximum number of NFTs that can be minted, set at initialization and immutable thereafter.
    uint256 public MAX_SUPPLY;

    // Base URI for token metadata. This is used to construct the full URI for each token.
    string public baseURI;

    // Contract-level metadata URI for platforms like OpenSea.
    string public contractURI;

    // Restrict mint to deployer (expect to be DSponsorAdmin address)
    address public MINTER;

    // Whether minting is allowed for a specific list of tokenIds or not
    bool public applyTokensAllowlist;

    // Mapping to store allowed tokenIds to mint
    mapping(uint256 => bool) private allowedTokenIds;

    // Mapping to store custom URIs for individual tokens, if set.
    mapping(uint256 => string) public tokenURIs;

    // Mapping to store default minting price settings for each ERC20 token.
    mapping(IERC20 => MintPriceSettings) private _defaultMintERC20Prices;

    // Settings for default minting price in the native currency (e.g., ETH).
    MintPriceSettings private _defaultMintNativePrice =
        MintPriceSettings(false, 0);

    // Mapping to store minting price settings for each ERC20 token, per token ID.
    mapping(uint256 => mapping(IERC20 => MintPriceSettings))
        private _mintERC20Prices;

    // Mapping to store minting price settings for the native currency, per token ID.
    mapping(uint256 => MintPriceSettings) private _mintNativePrices;

    /**
     * @dev Initializes the contract with necessary parameters
     * @param params.name ERC721 name
     * @param params.symbol ERC721 symbol
     * @param params.baseURI Base URI for token metadata
     * @param params.contractURI URL for the collection-level metadata, as specified by ERC-7572.
     * @param params.minter Address allowed to mint tokens
     * @param params.maxSupply The max number of mintable ERC721 tokens. Cannot be modified after deployment.
     * @param params.forwarder EIP2771 forwarder address, for gasless transactions
     * @param params.initialOwner Admin address to set prices,  base uris and more. Receives royalties.
     * @param params.royaltyBps Royalty fee in basis points (1% = 100 bps).
     * @param params.currencies Array of ERC20 token addresses accepted as default minting pricing
     * @param params.prices Array of prices for each currency, in the same order
     * @param params.allowedTokenIds Array of tokenIds that are allowed to be minted. If empty, all tokenIds are allowed
     */
    function initialize(InitParams memory params) public initializer {
        __Ownable_init_unchained(params.initialOwner);
        __ERC2771Context_init_unchained(params.forwarder);
        __ERC4907_init(params.name, params.symbol);
        __ReentrancyGuard_init_unchained();

        if (params.maxSupply == 0) {
            revert MaxSupplyShouldBeGreaterThan0();
        }

        if (params.currencies.length != params.prices.length) {
            revert InvalidPricingStructure(params.currencies, params.prices);
        }

        _setBaseURI(params.baseURI);
        _setContractURI(params.contractURI);
        MAX_SUPPLY = params.maxSupply;

        // Restrict mint to a minter address
        MINTER = params.minter;

        _setDefaultRoyalty(params.initialOwner, params.royaltyBps);

        for (uint256 i = 0; i < params.currencies.length; i++) {
            _setDefaultMintPrice(params.currencies[i], true, params.prices[i]);
        }

        if (params.allowedTokenIds.length > 0) {
            _setTokensAllowlist(true);
            for (uint256 i = 0; i < params.allowedTokenIds.length; i++) {
                _setTokensAllowlist(params.allowedTokenIds[i], true);
            }
        }
    }

    /* ******************
     *  EXTERNAL FUNCTIONS
     ********************/

    /**
     * @notice Mints a token with payment in the specified `currency` and transfers it to the `to` address.
     * If `currency` is address(0), payment is expected in the native currency.
     * Emits `Mint` and `IERC721-Transfer` events.
     *
     * @param tokenId The unique identifier for the minted token. Should not have been minted before and allowed to mint.
     * @param to The recipient address of the minted token.
     * @param currency The ERC20 token address for payment, or address(0) for native currency.
     * @param tokenData Additional data to be included in the Mint event.
     *
     * @dev Validates `currency` is enabled for minting and ensures the correct payment amount,
     * validates the recipient address is not zero, validates the tokenId is allowed to mint.
     * If `currency` is an ERC20 token, the contract requires an allowance to spend the tokens on the sender's behalf.
     * Uses reentrancy protection for security.
     *
     */
    function mint(
        uint256 tokenId,
        address to,
        address currency,
        string calldata tokenData
    ) public payable nonReentrant {
        if (_ownerOf(tokenId) != address(0)) {
            revert AlreadyMinted(tokenId);
        }

        if (applyTokensAllowlist && !allowedTokenIds[tokenId]) {
            revert TokenNotAllowed(tokenId);
        }

        if (to == address(0)) {
            revert CannotBeZeroAddress();
        }
        uint256 paidAmount = 0;

        // if sender is the owner, sender can mint and does not need to pay
        if (_msgSender() != owner()) {
            if (_msgSender() != MINTER) {
                revert UnauthorizedToMint();
            }

            (bool enabled, uint256 amount) = getMintPrice(tokenId, currency);

            if (!enabled) {
                revert ForbiddenCurrency(currency);
            }

            address payable ownerRecipient = payable(owner());

            if (amount > 0) {
                if (currency == address(0)) {
                    if (msg.value < amount) {
                        revert AmountValueTooLow(msg.value);
                    }
                    Address.sendValue(ownerRecipient, amount);
                } else {
                    IERC20(currency).safeTransferFrom(
                        _msgSender(),
                        ownerRecipient,
                        amount
                    );
                }
                paidAmount = amount;
            }
        }

        _safeMint(tokenId, to);

        emit Mint(tokenId, _msgSender(), to, currency, paidAmount, tokenData);
    }

    /**
     * @notice Mints a unique token based on specific input data, such as a search keyword,
     * to be used for advertising purposes (e.g., buying ad space for the "nft" keyword in the search section of an app).
     * This function ensures that each keyword is tokenized once.
     *
     * @dev The token ID is generated by hashing the `tokenData` using `keccak256`, ensuring uniqueness.
     * The function calls the `mint` function, which handle ERC-721 compliance, ownership assignment,
     * and any necessary payment logic. The `mint` function is responsible for validating that the `tokenData`
     * has not been previously minted. 
     * It's also possible to compute the tokenId off-chain and then call the `mint` function directly.
     * 
     * Here is an example of how to compute the tokenId in Typescript:
     * ```typescript
     * import { toUtf8Bytes, keccak256 } from 'ethers'
     * function stringToUint256(value: string): BigInt {
     *   return BigInt(keccak256(toUtf8Bytes(value)))
     * }
     * ```
     *
     * @param to The recipient address of the minted token. This address will become the token's owner.
     * @param currency The address of the ERC20 token to be used for payment, or the zero address (`address(0)`) to indicate payment with the native coin.
     * @param tokenData A unique string representing the keyword or data to be tokenized.

     * Payment logic and validation is handled within the `mint` function.
    
    function mintFromData(
        address to,
        address currency,
        string calldata tokenData
    ) external payable {
        uint256 tokenId = uint256(keccak256(abi.encodePacked(tokenData)));
        mint(tokenId, to, currency, tokenData);
    }
    */

    /* ******************
     *  ONLY OWNER
     ********************/

    /**
     * @notice Updates the base URI for token metadata, affecting how token URIs are generated.
     * Only callable by the contract owner. The base URI should be a directory path where token metadata is stored,
     * with each token's metadata at `{baseURI}/{tokenId}`.
     *
     * @param _baseURI The new base URI to set, typically an IPFS path or a web URL.
     *
     * @dev Ensure metadata at the new base URI follows ERC721 standards with attributes like "name", "description", and "image".
     */
    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    /**
     * @notice Updates the URI for contract-wide metadata, including collection details. Restricted to the contract owner.
     * The URI should point to a JSON file with collection metadata.
     *
     * @param _contractURI New URI for the contract metadata, typically an IPFS link or a web URL.
     *
     * @dev The metadata JSON should include keys like "name", "description", "image", and optionally "external_link",
     * "seller_fee_basis_points", and "fee_recipient" to comply with marketplace standards.
     */
    function setContractURI(string memory _contractURI) external onlyOwner {
        _setContractURI(_contractURI);
    }

    /**
     * @notice Updates default minting price for a specified currency. Only the contract owner can invoke this.
     * Triggers a `UpdateDefaultMintPrice` event upon update.
     *
     * @param currency Address of the ERC20 token or 0 for the native currency.
     * @param enabled Toggle to enable or disable minting with this currency.
     * @param amount Price for minting a single token in the specified currency.
     */
    function setDefaultMintPrice(
        address currency,
        bool enabled,
        uint256 amount
    ) external onlyOwner {
        _setDefaultMintPrice(currency, enabled, amount);
    }

    /**
     * @notice Updates minting price for a specified token. Only the contract owner can invoke this.
     * Triggers a `UpdateMintPrice` event upon update.
     *
     * @param tokenId The unique identifier for the minted token.
     * @param currency Address of the ERC20 token or 0 for the native currency.
     * @param enabled Toggle to enable or disable minting with this currency.
     * @param amount Price for minting a single token in the specified currency.
     */
    function setMintPrice(
        uint256 tokenId,
        address currency,
        bool enabled,
        uint256 amount
    ) external onlyOwner {
        _setMintPrice(tokenId, currency, enabled, amount);
    }

    /**
     * @notice Updates royalty details for secondary sales, specifying the recipient and the royalty percentage in basis points.
     *
     *  @param receiver Address to receive royalty payments.
     * @param feeBps Royalty fee in basis points (1% = 100 bps).
     */
    function setRoyalty(address receiver, uint96 feeBps) external onlyOwner {
        _setDefaultRoyalty(receiver, feeBps);
    }

    /**
     * @notice Specifies if minting should follow the tokens allowlist or not
     * Emits a `TokensAllowlist` event
     *
     * @param _applyTokensAllowlist Whether to apply the tokens allowlist or not
     */
    function setTokensAllowlist(bool _applyTokensAllowlist) external onlyOwner {
        _setTokensAllowlist(_applyTokensAllowlist);
    }

    /**
     * @notice Specifies if minting is allowed for specific tokenIds
     * Emits a `TokensAllowlistUpdated` event for each tokenId
     *
     * @param tokenIds Array of tokenIds to update
     * @param allowed Array of booleans to set for each tokenId
     */
    function setTokensAreAllowed(
        uint256[] calldata tokenIds,
        bool[] calldata allowed
    ) external onlyOwner {
        if (tokenIds.length != allowed.length) {
            revert InvalidInputLengths();
        }
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _setTokensAllowlist(tokenIds[i], allowed[i]);
        }
    }

    /**
     * @notice Assigns a custom URI to a specific token, overriding the default URI construction.
     * Allows setting URIs for future tokens, not yet minted.
     *
     * @param _tokenId Identifier of the token to assign the URI to.
     * @param _tokenURI The custom URI to set for the token.
     */
    function setTokenURI(
        uint256 _tokenId,
        string memory _tokenURI
    ) public onlyOwner {
        tokenURIs[_tokenId] = _tokenURI;
        emit MetadataUpdated(_tokenId);
    }

    /**
     * @notice Assigns custom URIs to multiple tokens, overriding the default URI construction.
     * Allows setting URIs for future tokens, not yet minted.
     *
     * @param _tokenIds Identifiers of the tokens to assign the URIs to.
     * @param _tokenURIs The custom URIs to set for the tokens.
     */
    function setTokenURIs(
        uint256[] calldata _tokenIds,
        string[] calldata _tokenURIs
    ) external onlyOwner {
        if (_tokenIds.length != _tokenURIs.length) {
            revert InvalidInputLengths();
        }
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            tokenURIs[_tokenIds[i]] = _tokenURIs[i];
            emit MetadataUpdated(_tokenIds[i]);
        }
    }

    /* ****************
     *  PUBLIC GETTERS
     *****************/

    /**
     * @notice Fetches the minting price and availability for a specific currency.
     *
     * @param tokenId The unique identifier for the minted token.
     * @param currency Address of an ERC20 token, or 0 for the native currency.
     *
     * @return enabled True if minting is enabled for the currency.
     * @return amount Required amount of the currency to mint one token.
     */
    function getMintPrice(
        uint256 tokenId,
        address currency
    ) public view returns (bool enabled, uint256 amount) {
        MintPriceSettings storage mintPriceSettings = currency != address(0)
            ? _mintERC20Prices[tokenId][IERC20(currency)]
            : _mintNativePrices[tokenId];

        if (mintPriceSettings.enabled) {
            enabled = mintPriceSettings.enabled;
            amount = mintPriceSettings.amount;
        } else {
            MintPriceSettings storage defaultMintPriceSettings = currency !=
                address(0)
                ? _defaultMintERC20Prices[IERC20(currency)]
                : _defaultMintNativePrice;

            enabled = defaultMintPriceSettings.enabled;
            amount = defaultMintPriceSettings.amount;
        }
    }

    /**
     * @notice Get the current owner of the contract.
     * @return The address of the owner.
     */
    function getOwner() public view returns (address) {
        return owner();
    }

    /**
     * @notice Indicates if a token is allowed to be minted or not
     * @param tokenId The unique identifier for the minted token.
     * @return True if the token is allowed to be minted, false otherwise.
     */
    function tokenIdIsAllowedToMint(
        uint256 tokenId
    ) external view returns (bool) {
        return
            (_ownerOf(tokenId) == address(0)) &&
            (!applyTokensAllowlist || allowedTokenIds[tokenId]);
    }

    /* ****************
     *  OVERRIDE FUNCTIONS
     *****************/

    /**
     * @notice Constructs the URI for a given token ID, combining the base URI with token-specific extensions if available.     *
     *
     * @param tokenId The unique identifier for a token.
     * @return The full URI string pointing to the token's metadata. If the base URI is not set, returns an empty string or
     * the token-specific URI if set. If both base URI and token-specific URI are set, concatenates them.
     * Otherwise, constructs a URI with the base URI, the chain ID, the contract address, and the token ID.
     * exemple: https://api.example.com/1/0x1234567890123456789012345678901234567890/1
     */
    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        string memory _tokenURI = tokenURIs[tokenId];

        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        } else {
            return
                string(
                    abi.encodePacked(
                        baseURI,
                        "/",
                        block.chainid.toString(),
                        "/",
                        address(this).toHexString(),
                        "/",
                        tokenId.toString()
                    )
                );
        }
    }

    /**
     * @notice Returns the message sender. Overridden to support meta-transactions.
     * @return The message sender address
     * @dev Override for `msg.sender`. Defaults to the original `msg.sender` whenever
     *      a call is not performed by the trusted forwarder or the calldata length is less than
     *      20 bytes (an address length).
     */
    function _msgSender()
        internal
        view
        virtual
        override(ERC2771ContextUpgradeable, ContextUpgradeable)
        returns (address)
    {
        return ERC2771ContextUpgradeable._msgSender();
    }

    /**
     * @notice Returns the message data. Overridden to support meta-transactions.
     * @return The message data bytes
     * @dev Override for `msg.data`. Defaults to the original `msg.data` whenever
     *      a call is not performed by the trusted forwarder or the calldata length is less than
     *      20 bytes (an address length).
     */
    function _msgData()
        internal
        view
        virtual
        override(ERC2771ContextUpgradeable, ContextUpgradeable)
        returns (bytes calldata)
    {
        return ERC2771ContextUpgradeable._msgData();
    }

    /**
     * @dev ERC-2771 specifies the context as being a single address (20 bytes).
     */
    function _contextSuffixLength()
        internal
        view
        virtual
        override(ERC2771ContextUpgradeable, ContextUpgradeable)
        returns (uint256)
    {
        return ERC2771ContextUpgradeable._contextSuffixLength();
    }

    /**
     * @notice Checks if the contract supports an interface.
     * @param interfaceId The interface identifier, as specified in ERC-165
     * @return True if the contract supports the interface, false otherwise
     * @dev Override to support multiple inheritance (ERC2981 and ERC4907)
     */
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(ERC721RoyaltyUpgradeable, ERC4907Upgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /* ****************
     *  INTERNAL FUNCTIONS
     *****************/

    /**
     * @notice Mints a token to a specified address with safety checks for ERC721Receiver compliance.
     * Ensures max supply is not exceeded.
     *
     * @param tokenId The unique identifier for the minted token.
     * @param to Recipient address for the minted token.
     *
     * @dev This internal function extends ERC721's `_safeMint`, adding a supply cap check.
     */
    function _safeMint(uint256 tokenId, address to) internal {
        if (MAX_SUPPLY < totalSupply + 1) {
            revert MaxSupplyExceeded();
        }
        totalSupply++;
        super._safeMint(to, tokenId);
    }

    /* ****************
     *  PRIVATE FUNCTIONS
     *****************/

    function _setBaseURI(string memory _baseURI) private {
        baseURI = _baseURI;
        emit BatchMetadataUpdate(0, type(uint256).max);
    }

    function _setContractURI(string memory _contractURI) private {
        contractURI = _contractURI;
        emit ContractURIUpdated();
    }

    function _setDefaultMintPrice(
        address currency,
        bool enabled,
        uint256 amount
    ) private {
        if (currency != address(0)) {
            _defaultMintERC20Prices[IERC20(currency)] = MintPriceSettings(
                enabled,
                amount
            );
        } else {
            _defaultMintNativePrice = MintPriceSettings(enabled, amount);
        }

        emit UpdateDefaultMintPrice(currency, enabled, amount);
    }

    function _setMintPrice(
        uint256 tokenId,
        address currency,
        bool enabled,
        uint256 amount
    ) private {
        if (_ownerOf(tokenId) != address(0)) {
            revert AlreadyMinted(tokenId);
        }
        if (currency != address(0)) {
            _mintERC20Prices[tokenId][IERC20(currency)] = MintPriceSettings(
                enabled,
                amount
            );
        } else {
            _mintNativePrices[tokenId] = MintPriceSettings(enabled, amount);
        }

        emit UpdateMintPrice(tokenId, currency, enabled, amount);
    }

    function _setTokensAllowlist(bool _applyTokensAllowlist) private {
        applyTokensAllowlist = _applyTokensAllowlist;
        emit TokensAllowlist(_applyTokensAllowlist);
    }

    function _setTokensAllowlist(uint256 tokenId, bool allowed) private {
        allowedTokenIds[tokenId] = allowed;
        emit TokensAllowlistUpdated(tokenId, allowed);
    }
}
