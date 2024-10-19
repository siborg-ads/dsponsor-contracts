// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DSponsorNFT.sol";

// import "hardhat/console.sol";

/**
 * @title DSponsorNFTExtended
 * @author Anthony Gourraud
 * @notice This contract extends the DSponsorNFT functionality by adding features for private sales.
 * It allows renewing ad space offers and provides early access to minting for holders of other NFT projects
 * that must implement the ERC721Enumerable interface.
 */
contract DSponsorNFTExtended is DSponsorNFT {
    using SafeERC20 for IERC20;

    event OnlyFromEligibleContractsUpdated(bool onlyFromEligibleContracts);
    event SpecialMintPriceUpdated(
        IERC721Enumerable nftContract,
        bool isDefault,
        uint256 maxMintsPerToken,
        uint256 tokenId,
        address currency,
        bool enabled,
        uint256 price
    );

    error UnsupportedERC721EnumerableContract();

    struct MintPriceResult {
        IERC721Enumerable eligibleNftContract;
        uint256 eligibleTokenId;
        bool enabled;
        uint256 amount;
    }

    // Struct to store minting price settings for token holders from eligible NFT contracts
    struct SpecialMintPriceSettings {
        bool initialized; // Tracks if a struct has been initialized for the contract
        uint256 maxMintsPerToken; // Maximum allowed mints per token, 0 means minting is disabled
        mapping(uint256 => uint256) tokenMintCount; // Tracks the number of mints per token
        MintPriceSettings defaultMintNativePrice; // Default mint price for native tokens (e.g., ETH)
        mapping(IERC20 => MintPriceSettings) defaultMintERC20Prices; // Default mint prices with ERC20 pricing
        mapping(uint256 => MintPriceSettings) tokenSpecificMintNativePrices; // Specific mint prices per tokenId for native tokens
        mapping(uint256 => mapping(IERC20 => MintPriceSettings)) tokenSpecificMintERC20Prices; // Specific mint prices per tokenId for ERC20
    }

    bool public onlyFromEligibleContracts = false; // Whether minting is restricted to holders of eligible NFT contracts

    IERC721Enumerable[] public eligibleContracts; // Array of contracts whose token holders can mint

    // Stores the mint price settings for each eligible NFT contract
    mapping(IERC721Enumerable => SpecialMintPriceSettings)
        internal _eligibleContractsMintPrices;

    // ERC165 interface identifier for ERC721Enumerable
    bytes4 private constant INTERFACE_ID_ERC721ENUMERABLE = 0x780e9d63;

    /**
     * @notice Sets or updates the mint price for NFT token holders.
     * @param nftContract The contract implementing ERC721Enumerable whose holders are eligible to mint.
     * @param isDefault Whether to set the default mint price or a specific token price.
     * @param maxMintsPerToken Maximum number of mints allowed per token holder (0 disables minting).
     * @param tokenId The specific token ID to which the mint price applies (ignored if setting a default price).
     * @param currency The token or native currency used for minting.
     * @param enabled Whether minting is enabled for the given token/currency combination.
     * @param price The mint price amount.
     */
    function setMintPriceForTokenHolders(
        IERC721Enumerable nftContract,
        bool isDefault,
        uint256 maxMintsPerToken,
        uint256 tokenId, // Ignored if setting default mint price
        address currency,
        bool enabled,
        uint256 price
    ) external onlyOwner {
        // Ensure the NFT contract supports ERC721Enumerable
        if (
            !IERC165(address(nftContract)).supportsInterface(
                INTERFACE_ID_ERC721ENUMERABLE
            )
        ) {
            revert UnsupportedERC721EnumerableContract();
        }

        SpecialMintPriceSettings
            storage contractMintPriceSettings = _eligibleContractsMintPrices[
                nftContract
            ];

        if (!contractMintPriceSettings.initialized) {
            eligibleContracts.push(nftContract);
            contractMintPriceSettings.initialized = true;
        }

        contractMintPriceSettings.maxMintsPerToken = maxMintsPerToken;

        if (isDefault) {
            if (currency != address(0)) {
                contractMintPriceSettings.defaultMintERC20Prices[
                        IERC20(currency)
                    ] = MintPriceSettings(enabled, price);
            } else {
                contractMintPriceSettings
                    .defaultMintNativePrice = MintPriceSettings(enabled, price);
            }
        } else {
            if (currency != address(0)) {
                contractMintPriceSettings.tokenSpecificMintERC20Prices[tokenId][
                        IERC20(currency)
                    ] = MintPriceSettings(enabled, price);
            } else {
                contractMintPriceSettings.tokenSpecificMintNativePrices[
                        tokenId
                    ] = MintPriceSettings(enabled, price);
            }
        }

        emit SpecialMintPriceUpdated(
            nftContract,
            isDefault,
            maxMintsPerToken,
            tokenId,
            currency,
            enabled,
            price
        );
    }

    /**
     * @notice Set if minting is restricted to holders of eligible NFT contracts.
     * @param _onlyFromEligibleContracts Whether minting is restricted to holders of eligible NFT contracts.
     */
    function setOnlyFromEligibleContracts(
        bool _onlyFromEligibleContracts
    ) external onlyOwner {
        onlyFromEligibleContracts = _onlyFromEligibleContracts;
        emit OnlyFromEligibleContractsUpdated(_onlyFromEligibleContracts);
    }

    /**
     * @notice Retrieves the mint price for a user based on their eligible NFT ownership.
     * @param user The address of the user querying the mint price.
     * @param tokenId The token ID for which the mint price is queried.
     * @param currency The ERC20 token address for payment, or address(0) for native currency.
     * @return result The mint price result for the user with eligible NFT contract, token ID, enabled status, and amount.
     */
    function getMintPriceFromEligibleContracts(
        address user,
        uint256 tokenId,
        address currency
    ) public view returns (MintPriceResult memory result) {
        result.amount = type(uint256).max; // Default to max uint256

        // Loop through all eligible NFT contracts
        for (uint256 i = 0; i < eligibleContracts.length; i++) {
            IERC721Enumerable nftContract = eligibleContracts[i];

            uint256 userBalance = nftContract.balanceOf(user);

            if (userBalance > 0) {
                SpecialMintPriceSettings
                    storage contractMintPriceSettings = _eligibleContractsMintPrices[
                        nftContract
                    ];
                uint256 maxMintsPerToken = contractMintPriceSettings
                    .maxMintsPerToken;

                if (maxMintsPerToken > 0) {
                    MintPriceSettings memory mintPrice = currency != address(0)
                        ? contractMintPriceSettings
                            .tokenSpecificMintERC20Prices[tokenId][
                                IERC20(currency)
                            ]
                        : contractMintPriceSettings
                            .tokenSpecificMintNativePrices[tokenId];

                    if (!mintPrice.enabled) {
                        mintPrice = currency != address(0)
                            ? contractMintPriceSettings.defaultMintERC20Prices[
                                IERC20(currency)
                            ]
                            : contractMintPriceSettings.defaultMintNativePrice;
                    }

                    if (mintPrice.enabled && mintPrice.amount < result.amount) {
                        for (
                            uint256 balanceIndex = 0;
                            balanceIndex < userBalance;
                            balanceIndex++
                        ) {
                            uint256 ownedTokenId = nftContract
                                .tokenOfOwnerByIndex(user, balanceIndex);
                            uint256 mintCountForToken = contractMintPriceSettings
                                    .tokenMintCount[ownedTokenId];
                            if (maxMintsPerToken > mintCountForToken) {
                                result.eligibleNftContract = nftContract;
                                result.eligibleTokenId = ownedTokenId;
                                result.enabled = true;
                                result.amount = mintPrice.amount;
                            }
                        }
                    }
                }
            }
        }

        if (result.enabled == false && onlyFromEligibleContracts == false) {
            (bool enabledFallback, uint256 amountFallback) = getMintPrice(
                tokenId,
                currency
            );

            result = MintPriceResult(
                IERC721Enumerable(address(0)),
                0,
                enabledFallback,
                amountFallback
            );
        }
    }

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
    ) public payable virtual override nonReentrant {
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
            if (MINTER != address(0) && _msgSender() != MINTER) {
                revert UnauthorizedToMint();
            }

            MintPriceResult
                memory mintPriceResult = getMintPriceFromEligibleContracts(
                    _msgSender(),
                    tokenId,
                    currency
                );

            if (!mintPriceResult.enabled) {
                revert ForbiddenCurrency(currency);
            }

            if (
                mintPriceResult.eligibleNftContract !=
                IERC721Enumerable(address(0))
            ) {
                _eligibleContractsMintPrices[
                    mintPriceResult.eligibleNftContract
                ].tokenMintCount[mintPriceResult.eligibleTokenId]++;
            }

            address payable ownerRecipient = payable(owner());

            if (mintPriceResult.amount > 0) {
                if (currency == address(0)) {
                    if (msg.value < mintPriceResult.amount) {
                        revert AmountValueTooLow(msg.value);
                    }
                    Address.sendValue(ownerRecipient, mintPriceResult.amount);
                } else {
                    IERC20(currency).safeTransferFrom(
                        _msgSender(),
                        ownerRecipient,
                        mintPriceResult.amount
                    );
                }
                paidAmount = mintPriceResult.amount;
            }
        }

        _safeMint(tokenId, to);

        emit Mint(tokenId, _msgSender(), to, currency, paidAmount, tokenData);
    }
}
