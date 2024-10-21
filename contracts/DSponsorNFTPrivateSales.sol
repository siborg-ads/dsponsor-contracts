// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DSponsorNFT.sol";

// import "hardhat/console.sol";

/**
 * @title DSponsorNFTPrivateSales
 * @author Anthony Gourraud
 * @notice This contract extends the DSponsorNFT contract to support private sales by allowing certain NFT holders to mint early or reserve ad spaces.
 * It provides early access to minting for holders of a compatible ERC721Enumerable collection.
 */
contract DSponsorNFTPrivateSales is DSponsorNFT {
    using SafeERC20 for IERC20;

    event PrivateSaleSettingsUpdated(
        address currency,
        IERC721Enumerable nftContract,
        uint256 maxMintsPerToken
    );

    error UnsupportedERC721EnumerableContract();

    // Struct to store the result of a mint price query for a user
    struct MintPriceResult {
        IERC721Enumerable privateSaleContract; // The eligible NFT contract for private sale
        uint256 privateSaleTokenId; // The eligible token ID for private sale
        bool enabled; // Whether the minting is enabled for this user
        uint256 amount; // The minting price for this token
    }

    struct PrivateSaleSettings {
        IERC721Enumerable nftContract; // Address of the eligible ERC721Enumerable contract
        uint256 maxMintsPerToken; // Maximum number of mints allowed per eligible token
    }

    // Mapping to track how many times each token has been used to mint in private sales
    // nftContract => tokenId => mint count
    mapping(IERC721Enumerable => mapping(uint256 => uint256))
        public tokenMintCount;

    // Mapping to store private sale settings for each currency
    // currency => private sale settings
    mapping(address => PrivateSaleSettings) public privateSaleSettings;

    // Constant for the ERC721Enumerable interface ID (used in ERC165 interface checks)
    bytes4 private constant INTERFACE_ID_ERC721ENUMERABLE = 0x780e9d63;

    /**
     * @notice Allows the contract owner to configure private sale settings for an eligible NFT collection.
     * @param currency The address of the ERC20 token used for mint payment, or address(0) for native currency.
     * @param nftContract The address of the NFT contract that will grant private sale minting rights. Set to address(0) to disable private sale restrictions.
     * @param maxMintsPerToken The maximum number of mints allowed per token from the eligible NFT collection.
     * @dev Reverts if the provided `nftContract` does not support the ERC721Enumerable interface.
     */
    function setPrivateSaleSettings(
        address currency,
        address nftContract,
        uint256 maxMintsPerToken
    ) external onlyOwner {
        if (nftContract != address(0)) {
            // Ensure the NFT contract supports ERC721Enumerable interface
            try
                IERC165(nftContract).supportsInterface(
                    INTERFACE_ID_ERC721ENUMERABLE
                )
            returns (bool supported) {
                if (!supported) {
                    revert UnsupportedERC721EnumerableContract();
                }
            } catch {
                revert UnsupportedERC721EnumerableContract();
            }
        }

        // Store private sale settings for the given currency
        privateSaleSettings[currency] = PrivateSaleSettings(
            IERC721Enumerable(nftContract),
            maxMintsPerToken
        );

        emit PrivateSaleSettingsUpdated(
            currency,
            IERC721Enumerable(nftContract),
            maxMintsPerToken
        );
    }

    /**
     * @notice Retrieves the mint price for a user based on their ownership of eligible NFTs for a private sale.
     * @param user The address of the user querying the mint price.
     * @param tokenId The token ID for which the mint price is being queried.
     * @param currency The ERC20 token address used for mint payment, or address(0) for native currency.
     * @return result The result structure with mint price details (eligible NFT contract, eligible token ID, enabled status, and amount to pay).
     * @dev This function checks whether the user holds eligible NFTs and whether the user can mint based on the private sale settings.
     */
    function getMintPriceForUser(
        address user,
        uint256 tokenId,
        address currency
    ) public view returns (MintPriceResult memory result) {
        (bool enabled, uint256 amount) = getMintPrice(tokenId, currency);
        result.amount = amount;
        result.enabled = enabled;

        if (enabled) {
            PrivateSaleSettings storage settings = privateSaleSettings[
                currency
            ];
            IERC721Enumerable nftContract = settings.nftContract;
            uint256 maxMintsPerToken = settings.maxMintsPerToken;

            // If private sale settings are active for the provided currency
            if (address(nftContract) != address(0)) {
                result.privateSaleContract = nftContract;
                result.enabled = false;

                uint256 userBalance = nftContract.balanceOf(user);

                // Ensure the user holds eligible tokens and there are mints left
                if (userBalance > 0 && maxMintsPerToken > 0) {
                    // Iterate through the user's NFTs to find one that can still mint
                    for (
                        uint256 balanceIndex = 0;
                        balanceIndex < userBalance;
                        balanceIndex++
                    ) {
                        uint256 ownedTokenId = nftContract.tokenOfOwnerByIndex(
                            user,
                            balanceIndex
                        );
                        uint256 mintCountForToken = tokenMintCount[nftContract][
                            ownedTokenId
                        ];
                        if (maxMintsPerToken > mintCountForToken) {
                            result.privateSaleTokenId = ownedTokenId;
                            result.enabled = true;
                            break;
                        }
                    }
                }
            }
        }
    }

    /**
     * @notice Mints a token with payment in the specified currency and transfers it to the recipient.
     * If the currency is native (address(0)), payment is expected in the native cryptocurrency.
     * @param tokenId The unique identifier for the token to be minted. Must not have been minted previously.
     * @param to The address receiving the minted token.
     * @param currency The ERC20 token address used for payment, or address(0) for native currency.
     * @param tokenData Additional metadata or data related to the token (emitted in events).
     * @dev The function checks if minting is allowed, validates the payment, and transfers the funds or native currency to the owner.
     * It also ensures reentrancy protection to avoid exploitation.
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

            MintPriceResult memory mintPrice = getMintPriceForUser(
                to,
                tokenId,
                currency
            );

            if (!mintPrice.enabled) {
                revert ForbiddenCurrency(currency);
            }

            // If the user is participating in a private sale, update their mint count for the eligible token
            if (
                mintPrice.privateSaleContract != IERC721Enumerable(address(0))
            ) {
                tokenMintCount[mintPrice.privateSaleContract][
                    mintPrice.privateSaleTokenId
                ]++;
            }

            address payable ownerRecipient = payable(owner());

            if (mintPrice.amount > 0) {
                if (currency == address(0)) {
                    if (msg.value < mintPrice.amount) {
                        revert AmountValueTooLow(msg.value);
                    }
                    Address.sendValue(ownerRecipient, mintPrice.amount);
                } else {
                    IERC20(currency).safeTransferFrom(
                        _msgSender(),
                        ownerRecipient,
                        mintPrice.amount
                    );
                }
                paidAmount = mintPrice.amount;
            }
        }

        _safeMint(tokenId, to);

        emit Mint(tokenId, _msgSender(), to, currency, paidAmount, tokenData);
    }
}
