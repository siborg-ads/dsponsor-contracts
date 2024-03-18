// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "./interfaces/IDSponsorMarketplace.sol";
import "./lib/ERC2771ContextOwnable.sol";
import "./lib/ProtocolFee.sol";

/**
 * @title DSponsorMarketplace
 * @notice This contract is a marketplace for direct and auction listings of NFTs with ERC20 tokens as currency.
 * A large part of the code is from Thirdweb's Marketplace V2 implementation - https://github.com/thirdweb-dev/contracts/blob/2fa9b0f73a6854e8ae96845da7f14436892f0634/contracts/prebuilts/marketplace-legacy/marketplace.md
 */
contract DSponsorMarketplace is
    IDSponsorMarketplace,
    ERC2771ContextOwnable,
    ProtocolFee,
    IERC721Receiver,
    IERC1155Receiver
{
    /*///////////////////////////////////////////////////////////////
                            State variables
    //////////////////////////////////////////////////////////////*/

    /// @dev Total number of listings ever created in the marketplace.
    uint256 public totalListings;

    /**
     *  @dev The amount of time added to an auction's 'endTime', if a bid is made within `timeBuffer`
     *       seconds of the existing `endTime`.
     */
    uint64 public constant timeBuffer = 15 minutes;

    /// @dev The minimum % increase required from the previous winning bid.
    uint64 public bidBufferBps = 500; // 5%

    /*///////////////////////////////////////////////////////////////
                                Mappings
    //////////////////////////////////////////////////////////////*/

    /// @dev Mapping from uid of listing => listing info.
    mapping(uint256 => Listing) public listings;

    /// @dev Mapping from uid of a direct listing => offeror address => offer made to the direct listing by the respective offeror.
    mapping(uint256 => mapping(address => Offer)) public offers;

    /// @dev Mapping from uid of an auction listing => current winning bid in an auction.
    mapping(uint256 => Offer) public winningBid;

    /*///////////////////////////////////////////////////////////////
                                Modifiers
    //////////////////////////////////////////////////////////////*/

    /// @dev Checks whether caller is a listing creator.
    modifier onlyListingCreator(uint256 _listingId) {
        require(listings[_listingId].tokenOwner == _msgSender(), "!OWNER");
        _;
    }

    /// @dev Checks whether a listing exists.
    modifier onlyExistingListing(uint256 _listingId) {
        require(listings[_listingId].assetContract != address(0), "DNE");
        _;
    }

    /*///////////////////////////////////////////////////////////////
                                Constructor 
    //////////////////////////////////////////////////////////////*/

    constructor(
        address forwarder,
        address initialOwner,
        UniV3SwapRouter _swapRouter,
        address payable _recipient,
        uint96 _bps
    )
        ERC2771ContextOwnable(forwarder, initialOwner)
        ProtocolFee(_swapRouter, _recipient, _bps)
    {}

    /*///////////////////////////////////////////////////////////////
                        ERC 165 / 721 / 1155 logic
    //////////////////////////////////////////////////////////////*/

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(IERC165) returns (bool) {
        return
            interfaceId == type(IERC1155Receiver).interfaceId ||
            interfaceId == type(IERC721Receiver).interfaceId;
    }

    /*///////////////////////////////////////////////////////////////
                Listing (create-update-delete) logic
    //////////////////////////////////////////////////////////////*/

    /// @dev Lets a token owner list tokens for sale: Direct Listing or Auction.
    function createListing(ListingParameters memory _params) external override {
        // Get values to populate `Listing`.
        uint256 listingId = totalListings;
        totalListings += 1;

        address tokenOwner = _msgSender();
        TokenType tokenTypeOfListing = getTokenType(_params.assetContract);
        uint256 tokenAmountToList = getSafeQuantity(
            tokenTypeOfListing,
            _params.quantityToList
        );

        require(tokenAmountToList > 0, "QUANTITY");

        uint256 startTime = _params.startTime;
        if (startTime < block.timestamp) {
            // do not allow listing to start in the past (1 hour buffer)
            require(block.timestamp - startTime < 1 hours, "ST");
            startTime = block.timestamp;
        }

        validateOwnershipAndApproval(
            tokenOwner,
            _params.assetContract,
            _params.tokenId,
            tokenAmountToList,
            tokenTypeOfListing
        );

        Listing memory newListing = Listing({
            listingId: listingId,
            tokenOwner: tokenOwner,
            assetContract: _params.assetContract,
            tokenId: _params.tokenId,
            startTime: startTime,
            endTime: startTime + _params.secondsUntilEndTime,
            quantity: tokenAmountToList,
            currency: _params.currencyToAccept,
            reservePricePerToken: _params.reservePricePerToken,
            buyoutPricePerToken: _params.buyoutPricePerToken,
            tokenType: tokenTypeOfListing,
            listingType: _params.listingType
        });

        listings[listingId] = newListing;

        // Tokens listed for sale in an auction are escrowed in Marketplace.
        if (newListing.listingType == ListingType.Auction) {
            require(
                newListing.buyoutPricePerToken == 0 ||
                    newListing.buyoutPricePerToken >=
                    newListing.reservePricePerToken,
                "RESERVE"
            );
            transferListingTokens(
                tokenOwner,
                address(this),
                tokenAmountToList,
                newListing
            );
        }

        emit ListingAdded(
            listingId,
            _params.assetContract,
            tokenOwner,
            newListing
        );
    }

    /// @dev Lets a listing's creator edit the listing's parameters.
    function updateListing(
        uint256 _listingId,
        uint256 _quantityToList,
        uint256 _reservePricePerToken,
        uint256 _buyoutPricePerToken,
        address _currencyToAccept,
        uint256 _startTime,
        uint256 _secondsUntilEndTime
    ) external override onlyListingCreator(_listingId) {
        Listing memory targetListing = listings[_listingId];
        uint256 safeNewQuantity = getSafeQuantity(
            targetListing.tokenType,
            _quantityToList
        );
        bool isAuction = targetListing.listingType == ListingType.Auction;

        require(safeNewQuantity != 0, "QUANTITY");

        // Can only edit auction listing before it starts.
        if (isAuction) {
            require(block.timestamp < targetListing.startTime, "STARTED");
            require(
                _buyoutPricePerToken == 0 ||
                    _buyoutPricePerToken >= _reservePricePerToken,
                "RESERVE"
            );
        }

        if (_startTime < block.timestamp) {
            // do not allow listing to start in the past (1 hour buffer)
            require(block.timestamp - _startTime < 1 hours, "ST");
            _startTime = block.timestamp;
        }

        uint256 newStartTime = _startTime == 0
            ? targetListing.startTime
            : _startTime;
        listings[_listingId] = Listing({
            listingId: _listingId,
            tokenOwner: _msgSender(),
            assetContract: targetListing.assetContract,
            tokenId: targetListing.tokenId,
            startTime: newStartTime,
            endTime: _secondsUntilEndTime == 0
                ? targetListing.endTime
                : newStartTime + _secondsUntilEndTime,
            quantity: safeNewQuantity,
            currency: _currencyToAccept,
            reservePricePerToken: _reservePricePerToken,
            buyoutPricePerToken: _buyoutPricePerToken,
            tokenType: targetListing.tokenType,
            listingType: targetListing.listingType
        });

        // Must validate ownership and approval of the new quantity of tokens for direct listing.
        if (targetListing.quantity != safeNewQuantity) {
            // Transfer all escrowed tokens back to the lister, to be reflected in the lister's
            // balance for the upcoming ownership and approval check.
            if (isAuction) {
                transferListingTokens(
                    address(this),
                    targetListing.tokenOwner,
                    targetListing.quantity,
                    targetListing
                );
            }

            validateOwnershipAndApproval(
                targetListing.tokenOwner,
                targetListing.assetContract,
                targetListing.tokenId,
                safeNewQuantity,
                targetListing.tokenType
            );

            // Escrow the new quantity of tokens to list in the auction.
            if (isAuction) {
                transferListingTokens(
                    targetListing.tokenOwner,
                    address(this),
                    safeNewQuantity,
                    targetListing
                );
            }
        }

        emit ListingUpdated(_listingId, targetListing.tokenOwner);
    }

    /// @dev Lets a direct listing creator cancel their listing.
    function cancelDirectListing(
        uint256 _listingId
    ) external onlyListingCreator(_listingId) {
        Listing memory targetListing = listings[_listingId];

        require(targetListing.listingType == ListingType.Direct, "!DIRECT");

        delete listings[_listingId];

        emit ListingRemoved(_listingId, targetListing.tokenOwner);
    }

    /*///////////////////////////////////////////////////////////////
                    Direct listings sales logic
    //////////////////////////////////////////////////////////////*/

    /// @dev Buy from several listings in one transaction.
    function buy(
        BuyParams[] calldata _buyParams
    ) external override nonReentrant {
        for (uint256 i = 0; i < _buyParams.length; i++) {
            BuyParams memory buyParams = _buyParams[i];
            _buy(
                buyParams.listingId,
                buyParams.buyFor,
                buyParams.quantity,
                buyParams.currency,
                buyParams.totalPrice,
                buyParams.referralAdditionalInformation
            );
        }
    }

    /**
     * @dev Buy from a single listing, with the option to pay with native currency
     * (to allow payment with delegated payment systems, payment by credit card)
     */
    function buy(
        BuyParams calldata buyParams
    ) external payable override nonReentrant {
        if (msg.value > 0) {
            // Swap native currency to ERC20 if value is sent
            _swapNativeToERC20(
                buyParams.currency,
                buyParams.totalPrice,
                buyParams.buyFor // refund to "spender", as _msgSender() can be the address of a delegating payment system
            );
        }
        _buy(
            buyParams.listingId,
            buyParams.buyFor,
            buyParams.quantity,
            buyParams.currency,
            buyParams.totalPrice,
            buyParams.referralAdditionalInformation
        );
    }

    /// @dev Lets an account buy a given quantity of tokens from a listing.
    function _buy(
        uint256 _listingId,
        address _buyFor,
        uint256 _quantityToBuy,
        address _currency,
        uint256 _totalPrice,
        string memory referralAdditionalInformation
    ) internal onlyExistingListing(_listingId) {
        Listing memory targetListing = listings[_listingId];
        address payer = _msgSender();

        // Check whether the settled total price and currency to use are correct.
        require(
            _currency == targetListing.currency &&
                _totalPrice ==
                (targetListing.buyoutPricePerToken * _quantityToBuy),
            "!PRICE"
        );

        ReferralRevenue memory referral = ReferralRevenue({
            enabler: targetListing.tokenOwner,
            spender: _buyFor,
            additionalInformation: referralAdditionalInformation
        });

        uint256 currencyAmountToTransfer = _totalPrice;
        targetListing.buyoutPricePerToken * _quantityToBuy;

        executeSale(
            targetListing,
            payer,
            _buyFor,
            targetListing.currency,
            currencyAmountToTransfer,
            _quantityToBuy,
            referral
        );
    }

    /// @dev Lets a listing's creator accept an offer for their direct listing.
    function acceptOffer(
        uint256 _listingId,
        address _offeror,
        address _currency,
        uint256 _pricePerToken
    )
        external
        override
        nonReentrant
        onlyListingCreator(_listingId)
        onlyExistingListing(_listingId)
    {
        Offer memory targetOffer = offers[_listingId][_offeror];
        Listing memory targetListing = listings[_listingId];

        require(
            _currency == targetOffer.currency &&
                _pricePerToken == targetOffer.pricePerToken,
            "!PRICE"
        );
        require(targetOffer.expirationTimestamp > block.timestamp, "EXPIRED");

        delete offers[_listingId][_offeror];

        ReferralRevenue memory referral = ReferralRevenue({
            enabler: targetListing.tokenOwner,
            spender: _offeror,
            additionalInformation: targetOffer.referralAdditionalInformation
        });

        executeSale(
            targetListing,
            _offeror,
            _offeror,
            targetOffer.currency,
            targetOffer.pricePerToken * targetOffer.quantityWanted,
            targetOffer.quantityWanted,
            referral
        );
    }

    /// @dev Performs a direct listing sale.
    function executeSale(
        Listing memory _targetListing,
        address _payer,
        address _receiver,
        address _currency,
        uint256 _currencyAmountToTransfer,
        uint256 _listingTokenAmountToTransfer,
        ReferralRevenue memory referral
    ) internal {
        validateDirectListingSale(
            _targetListing,
            _listingTokenAmountToTransfer
        );

        _targetListing.quantity -= _listingTokenAmountToTransfer;
        listings[_targetListing.listingId] = _targetListing;

        payout(
            _payer,
            _targetListing.tokenOwner,
            _currency,
            _currencyAmountToTransfer,
            _targetListing,
            referral
        );
        transferListingTokens(
            _targetListing.tokenOwner,
            _receiver,
            _listingTokenAmountToTransfer,
            _targetListing
        );

        emit NewSale(
            _targetListing.listingId,
            _targetListing.assetContract,
            _targetListing.tokenOwner,
            _receiver,
            _listingTokenAmountToTransfer,
            _currencyAmountToTransfer
        );
    }

    /*///////////////////////////////////////////////////////////////
                        Offer/bid logic
    //////////////////////////////////////////////////////////////*/

    /// @dev Lets an account (1) make an offer to a direct listing, or (2) make a bid in an auction.
    function offer(
        uint256 _listingId,
        uint256 _quantityWanted,
        address _currency,
        uint256 _pricePerToken,
        uint256 _expirationTimestamp,
        string memory _referralAdditionalInformation
    ) external override nonReentrant onlyExistingListing(_listingId) {
        Listing memory targetListing = listings[_listingId];

        require(
            targetListing.endTime > block.timestamp &&
                targetListing.startTime < block.timestamp,
            "inactive listing."
        );

        // Both - (1) offers to direct listings, and (2) bids to auctions - share the same structure.
        Offer memory newOffer = Offer({
            listingId: _listingId,
            offeror: _msgSender(),
            quantityWanted: _quantityWanted,
            currency: _currency,
            pricePerToken: _pricePerToken,
            expirationTimestamp: _expirationTimestamp,
            referralAdditionalInformation: _referralAdditionalInformation
        });

        if (targetListing.listingType == ListingType.Auction) {
            // A bid to an auction must be made in the auction's desired currency.
            require(
                newOffer.currency == targetListing.currency,
                "must use approved currency to bid"
            );
            require(newOffer.pricePerToken != 0, "bidding zero amount");

            // A bid must be made for all auction items.
            newOffer.quantityWanted = getSafeQuantity(
                targetListing.tokenType,
                targetListing.quantity
            );

            handleBid(targetListing, newOffer);
        } else if (targetListing.listingType == ListingType.Direct) {
            newOffer.currency = _currency;
            newOffer.quantityWanted = getSafeQuantity(
                targetListing.tokenType,
                _quantityWanted
            );

            handleOffer(targetListing, newOffer);
        }
    }

    /// @dev Processes a new offer to a direct listing.
    function handleOffer(
        Listing memory _targetListing,
        Offer memory _newOffer
    ) internal {
        require(
            _newOffer.quantityWanted <= _targetListing.quantity &&
                _targetListing.quantity > 0,
            "insufficient tokens in listing."
        );

        offers[_targetListing.listingId][_newOffer.offeror] = _newOffer;

        emit NewOffer(
            _targetListing.listingId,
            _newOffer.offeror,
            _targetListing.listingType,
            _newOffer.quantityWanted,
            _newOffer.pricePerToken * _newOffer.quantityWanted,
            _newOffer.currency
        );
    }

    /// @dev Processes an incoming bid in an auction.
    function handleBid(
        Listing memory _targetListing,
        Offer memory _incomingBid
    ) internal {
        Offer memory currentWinningBid = winningBid[_targetListing.listingId];
        uint256 currentOfferAmount = currentWinningBid.pricePerToken *
            currentWinningBid.quantityWanted;
        uint256 incomingOfferAmount = _incomingBid.pricePerToken *
            _incomingBid.quantityWanted;

        // Close auction and execute sale if there's a buyout price and incoming offer amount is buyout price.
        if (
            _targetListing.buyoutPricePerToken > 0 &&
            incomingOfferAmount >=
            _targetListing.buyoutPricePerToken * _targetListing.quantity
        ) {
            _closeAuctionForBidder(_targetListing, _incomingBid);
        } else {
            /**
             *      If there's an existing winning bid, incoming bid amount must be bid buffer % greater.
             *      Else, bid amount must be at least as great as reserve price
             */
            require(
                isNewWinningBid(
                    _targetListing.reservePricePerToken *
                        _targetListing.quantity,
                    currentOfferAmount,
                    incomingOfferAmount
                ),
                "not winning bid."
            );

            // Update the winning bid and listing's end time before external contract calls.
            winningBid[_targetListing.listingId] = _incomingBid;

            if (_targetListing.endTime - block.timestamp <= timeBuffer) {
                _targetListing.endTime += timeBuffer;
                listings[_targetListing.listingId] = _targetListing;
            }
        }

        // Payout previous highest bid.
        if (currentWinningBid.offeror != address(0) && currentOfferAmount > 0) {
            _pay(
                address(this),
                currentWinningBid.offeror,
                _targetListing.currency,
                currentOfferAmount
            );
        }

        // Collect incoming bid
        _pay(
            _incomingBid.offeror,
            address(this),
            _incomingBid.currency,
            incomingOfferAmount
        );
        emit NewOffer(
            _targetListing.listingId,
            _incomingBid.offeror,
            _targetListing.listingType,
            _incomingBid.quantityWanted,
            _incomingBid.pricePerToken * _incomingBid.quantityWanted,
            _incomingBid.currency
        );
    }

    /// @dev Checks whether an incoming bid is the new current highest bid.
    function isNewWinningBid(
        uint256 _reserveAmount,
        uint256 _currentWinningBidAmount,
        uint256 _incomingBidAmount
    ) internal view returns (bool isValidNewBid) {
        if (_currentWinningBidAmount == 0) {
            isValidNewBid = _incomingBidAmount >= _reserveAmount;
        } else {
            isValidNewBid = (_incomingBidAmount > _currentWinningBidAmount &&
                ((_incomingBidAmount - _currentWinningBidAmount) * MAX_BPS) /
                    _currentWinningBidAmount >=
                bidBufferBps);
        }
    }

    /*///////////////////////////////////////////////////////////////
                    Auction lisitngs sales logic
    //////////////////////////////////////////////////////////////*/

    /// @dev Lets an account close an auction for either the (1) winning bidder, or (2) auction creator.
    function closeAuction(
        uint256 _listingId,
        address _closeFor
    ) external override nonReentrant onlyExistingListing(_listingId) {
        Listing memory targetListing = listings[_listingId];

        require(
            targetListing.listingType == ListingType.Auction,
            "not an auction."
        );

        Offer memory targetBid = winningBid[_listingId];

        // Cancel auction if (1) auction hasn't started, or (2) auction doesn't have any bids.
        bool toCancel = targetListing.startTime > block.timestamp ||
            targetBid.offeror == address(0);

        if (toCancel) {
            // cancel auction listing owner check
            _cancelAuction(targetListing);
        } else {
            require(
                targetListing.endTime < block.timestamp,
                "cannot close auction before it has ended."
            );

            // No `else if` to let auction close in 1 tx when targetListing.tokenOwner == targetBid.offeror.
            if (_closeFor == targetListing.tokenOwner) {
                _closeAuctionForAuctionCreator(targetListing, targetBid);
            }

            if (_closeFor == targetBid.offeror) {
                _closeAuctionForBidder(targetListing, targetBid);
            }
        }
    }

    /// @dev Cancels an auction.
    function _cancelAuction(Listing memory _targetListing) internal {
        require(
            listings[_targetListing.listingId].tokenOwner == _msgSender(),
            "caller is not the listing creator."
        );

        delete listings[_targetListing.listingId];

        transferListingTokens(
            address(this),
            _targetListing.tokenOwner,
            _targetListing.quantity,
            _targetListing
        );

        emit AuctionClosed(
            _targetListing.listingId,
            _msgSender(),
            true,
            _targetListing.tokenOwner,
            address(0)
        );
    }

    /// @dev Closes an auction for an auction creator; distributes winning bid amount to auction creator.
    function _closeAuctionForAuctionCreator(
        Listing memory _targetListing,
        Offer memory _winningBid
    ) internal {
        uint256 payoutAmount = _winningBid.pricePerToken *
            _targetListing.quantity;

        _targetListing.quantity = 0;
        _targetListing.endTime = block.timestamp;
        listings[_targetListing.listingId] = _targetListing;

        _winningBid.pricePerToken = 0;
        winningBid[_targetListing.listingId] = _winningBid;

        ReferralRevenue memory referral = ReferralRevenue({
            enabler: _targetListing.tokenOwner,
            spender: _winningBid.offeror,
            additionalInformation: _winningBid.referralAdditionalInformation
        });

        payout(
            address(this),
            _targetListing.tokenOwner,
            _targetListing.currency,
            payoutAmount,
            _targetListing,
            referral
        );

        emit AuctionClosed(
            _targetListing.listingId,
            _msgSender(),
            false,
            _targetListing.tokenOwner,
            _winningBid.offeror
        );
    }

    /// @dev Closes an auction for the winning bidder; distributes auction items to the winning bidder.
    function _closeAuctionForBidder(
        Listing memory _targetListing,
        Offer memory _winningBid
    ) internal {
        uint256 quantityToSend = _winningBid.quantityWanted;

        _targetListing.endTime = block.timestamp;
        _winningBid.quantityWanted = 0;

        winningBid[_targetListing.listingId] = _winningBid;
        listings[_targetListing.listingId] = _targetListing;

        transferListingTokens(
            address(this),
            _winningBid.offeror,
            quantityToSend,
            _targetListing
        );

        emit AuctionClosed(
            _targetListing.listingId,
            _msgSender(),
            false,
            _targetListing.tokenOwner,
            _winningBid.offeror
        );
    }

    /*///////////////////////////////////////////////////////////////
            Shared (direct+auction listings) internal functions
    //////////////////////////////////////////////////////////////*/

    /// @dev Transfers tokens listed for sale in a direct or auction listing.
    function transferListingTokens(
        address _from,
        address _to,
        uint256 _quantity,
        Listing memory _listing
    ) internal {
        if (_listing.tokenType == TokenType.ERC1155) {
            IERC1155(_listing.assetContract).safeTransferFrom(
                _from,
                _to,
                _listing.tokenId,
                _quantity,
                ""
            );
        } else if (_listing.tokenType == TokenType.ERC721) {
            IERC721(_listing.assetContract).safeTransferFrom(
                _from,
                _to,
                _listing.tokenId,
                ""
            );
        }
    }

    /// @dev Pays out stakeholders in a sale.
    function payout(
        address _payer,
        address _payee,
        address _currencyToUse,
        uint256 _totalPayoutAmount,
        Listing memory _listing,
        ReferralRevenue memory referral
    ) internal {
        // Pay protocol fee
        uint256 protocolCut = getFeeAmount(_totalPayoutAmount);
        _payFee(_payer, _currencyToUse, protocolCut, address(this), referral);

        // Distribute royalties
        uint256 royaltyCut;
        address royaltyRecipient;
        try
            IERC2981(_listing.assetContract).royaltyInfo(
                _listing.tokenId,
                _totalPayoutAmount
            )
        returns (address royaltyFeeRecipient, uint256 royaltyFeeAmount) {
            if (royaltyFeeRecipient != address(0) && royaltyFeeAmount > 0) {
                royaltyRecipient = royaltyFeeRecipient;
                royaltyCut = royaltyFeeAmount;
            }
        } catch {}
        _pay(_payer, royaltyRecipient, _currencyToUse, royaltyCut);

        // Pay to the payee
        _pay(
            _payer,
            _payee,
            _currencyToUse,
            _totalPayoutAmount - protocolCut - royaltyCut
        );
    }

    /// @dev Validates that `_tokenOwner` owns and has approved Market to transfer NFTs.
    function validateOwnershipAndApproval(
        address _tokenOwner,
        address _assetContract,
        uint256 _tokenId,
        uint256 _quantity,
        TokenType _tokenType
    ) internal view {
        address market = address(this);
        bool isValid;

        if (_tokenType == TokenType.ERC1155) {
            isValid =
                IERC1155(_assetContract).balanceOf(_tokenOwner, _tokenId) >=
                _quantity &&
                IERC1155(_assetContract).isApprovedForAll(_tokenOwner, market);
        } else if (_tokenType == TokenType.ERC721) {
            isValid =
                IERC721(_assetContract).ownerOf(_tokenId) == _tokenOwner &&
                (IERC721(_assetContract).getApproved(_tokenId) == market ||
                    IERC721(_assetContract).isApprovedForAll(
                        _tokenOwner,
                        market
                    ));
        }

        require(isValid, "!BALNFT");
    }

    /// @dev Validates conditions of a direct listing sale.
    function validateDirectListingSale(
        Listing memory _listing,
        uint256 _quantityToBuy
    ) internal view {
        require(
            _listing.listingType == ListingType.Direct,
            "cannot buy from listing."
        );

        // Check whether a valid quantity of listed tokens is being bought.
        require(
            _listing.quantity > 0 &&
                _quantityToBuy > 0 &&
                _quantityToBuy <= _listing.quantity,
            "invalid amount of tokens."
        );

        // Check if sale is made within the listing window.
        require(
            block.timestamp < _listing.endTime &&
                block.timestamp > _listing.startTime,
            "not within sale window."
        );

        // Check whether token owner owns and has approved `quantityToBuy` amount of listing tokens from the listing.
        validateOwnershipAndApproval(
            _listing.tokenOwner,
            _listing.assetContract,
            _listing.tokenId,
            _quantityToBuy,
            _listing.tokenType
        );
    }

    /*///////////////////////////////////////////////////////////////
                            Getter functions
    //////////////////////////////////////////////////////////////*/

    /// @dev Enforces quantity == 1 if tokenType is TokenType.ERC721.
    function getSafeQuantity(
        TokenType _tokenType,
        uint256 _quantityToCheck
    ) internal pure returns (uint256 safeQuantity) {
        if (_quantityToCheck == 0) {
            safeQuantity = 0;
        } else {
            safeQuantity = _tokenType == TokenType.ERC721
                ? 1
                : _quantityToCheck;
        }
    }

    /// @dev Returns the interface supported by a contract.
    function getTokenType(
        address _assetContract
    ) internal view returns (TokenType tokenType) {
        if (
            IERC165(_assetContract).supportsInterface(
                type(IERC1155).interfaceId
            )
        ) {
            tokenType = TokenType.ERC1155;
        } else if (
            IERC165(_assetContract).supportsInterface(type(IERC721).interfaceId)
        ) {
            tokenType = TokenType.ERC721;
        } else {
            revert("token must be ERC1155 or ERC721.");
        }
    }

    /*///////////////////////////////////////////////////////////////
                            Miscellaneous
    //////////////////////////////////////////////////////////////*/

    function _msgSender()
        internal
        view
        virtual
        override(Context, ERC2771ContextOwnable)
        returns (address sender)
    {
        return ERC2771ContextOwnable._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(Context, ERC2771ContextOwnable)
        returns (bytes calldata)
    {
        return ERC2771ContextOwnable._msgData();
    }

    function _contextSuffixLength()
        internal
        view
        virtual
        override(Context, ERC2771ContextOwnable)
        returns (uint256)
    {
        return ERC2771ContextOwnable._contextSuffixLength();
    }
}
