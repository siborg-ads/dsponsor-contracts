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
 * @notice This contract is a marketplace for offers, direct and auction listings of NFTs with ERC20 tokens as currency.
 * A large part of the code is from Thirdweb's Marketplace implementation
 */
contract DSponsorMarketplace is
    IDSponsorMarketplace,
    ERC2771ContextOwnable,
    ProtocolFee,
    IERC721Receiver,
    IERC1155Receiver
{
    /*///////////////////////////////////////////////////////////////
                            Constants
    //////////////////////////////////////////////////////////////*/

    /**
     *  @dev The amount of time added to an auction's 'endTime', if a bid is made within `timeBuffer`
     *       seconds of the existing `endTime`.
     */
    uint128 public constant timeBuffer = 15 minutes;

    /// @dev The minimum % increase required from the previous winning bid.
    uint128 public constant bidBufferBps = 500; // 5%

    /*///////////////////////////////////////////////////////////////
                            State variables
    //////////////////////////////////////////////////////////////*/

    /// @dev Total number of listings ever created in the marketplace.
    uint256 public totalListings;

    /// @dev Total number of offers ever created in the marketplace.
    uint256 public totalOffers;

    /// @dev Mapping from uid of listing => listing info.
    mapping(uint256 => Listing) public listings;

    /// @dev Mapping from uid of an auction listing => current winning bid in an auction.
    mapping(uint256 => Bid) public winningBid;

    mapping(uint256 => Offer) public offers;

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

    /// @dev Checks whether caller is a offer creator.
    modifier onlyOfferor(uint256 _offerId) {
        require(offers[_offerId].offeror == _msgSender(), "!Offeror");
        _;
    }

    /// @dev Checks whether an auction exists.
    modifier onlyExistingOffer(uint256 _offerId) {
        require(
            offers[_offerId].status == Status.CREATED,
            "Marketplace: invalid offer."
        );
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
    function createListing(ListingParameters memory _params) external {
        // Get values to populate `Listing`.
        uint256 listingId = totalListings;
        totalListings += 1;

        address tokenOwner = _msgSender();
        TokenType tokenTypeOfListing = _getTokenType(_params.assetContract);
        uint256 tokenAmountToList = _getSafeQuantity(
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

        _validateOwnershipAndApproval(
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
            _transferListingTokens(
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
    ) external onlyListingCreator(_listingId) {
        Listing memory targetListing = listings[_listingId];
        uint256 safeNewQuantity = _getSafeQuantity(
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
                _transferListingTokens(
                    address(this),
                    targetListing.tokenOwner,
                    targetListing.quantity,
                    targetListing
                );
            }

            _validateOwnershipAndApproval(
                targetListing.tokenOwner,
                targetListing.assetContract,
                targetListing.tokenId,
                safeNewQuantity,
                targetListing.tokenType
            );

            // Escrow the new quantity of tokens to list in the auction.
            if (isAuction) {
                _transferListingTokens(
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

    /**
     *  @dev Buy from several listings in one transaction, with the option to pay with native currency
     * (to allow payment with delegated payment systems, payment by credit card)
     */
    function buy(
        BuyParams[] calldata _buyParams
    ) external payable nonReentrant {
        uint256 remainingToSpendInSwap = msg.value;

        for (uint256 i = 0; i < _buyParams.length; i++) {
            BuyParams memory buyParams = _buyParams[i];

            // Swap native currency to ERC20 if value is sent
            if (remainingToSpendInSwap > 0) {
                // refund to "spender" once all swaps done, to _msgSender() can be the address of a delegating payment system
                address recipientRefund = i == _buyParams.length - 1
                    ? buyParams.buyFor
                    : address(this);

                (, uint256 amountRefunded) = _swapNativeToERC20(
                    buyParams.currency,
                    buyParams.totalPrice,
                    remainingToSpendInSwap,
                    recipientRefund
                );
                remainingToSpendInSwap = amountRefunded;
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
    }

    /**
     * @dev Buy from a single listing, with the option to pay with native currency
     * (to allow payment with delegated payment systems, payment by credit card)
     */
    function buy(BuyParams calldata buyParams) external payable nonReentrant {
        if (msg.value > 0) {
            // Swap native currency to ERC20 if value is sent
            _swapNativeToERC20(
                buyParams.currency,
                buyParams.totalPrice,
                msg.value,
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

        // Check whether the settled total price and currency to use are correct.
        require(
            _currency == targetListing.currency &&
                _totalPrice ==
                (targetListing.buyoutPricePerToken * _quantityToBuy),
            "!PRICE"
        );

        require(targetListing.listingType == ListingType.Direct, "!DIRECT");

        // Check whether a valid quantity of listed tokens is being bought.
        require(
            targetListing.quantity > 0 &&
                _quantityToBuy > 0 &&
                _quantityToBuy <= targetListing.quantity,
            "invalid amount of tokens."
        );

        // Check if sale is made within the listing window.
        require(
            block.timestamp < targetListing.endTime &&
                block.timestamp > targetListing.startTime,
            "not within sale window."
        );

        // Check whether token owner owns and has approved `quantityToBuy` amount of listing tokens from the listing.
        _validateOwnershipAndApproval(
            targetListing.tokenOwner,
            targetListing.assetContract,
            targetListing.tokenId,
            _quantityToBuy,
            targetListing.tokenType
        );

        ReferralRevenue memory referral = ReferralRevenue({
            enabler: targetListing.tokenOwner,
            spender: _buyFor,
            additionalInformation: referralAdditionalInformation
        });

        targetListing.quantity -= _quantityToBuy;
        listings[_listingId] = targetListing;

        _payout(
            _msgSender(),
            targetListing.tokenOwner,
            _currency,
            _totalPrice,
            targetListing.assetContract,
            targetListing.tokenId,
            referral
        );

        _transferListingTokens(
            targetListing.tokenOwner,
            _buyFor,
            _quantityToBuy,
            targetListing
        );

        emit NewSale(
            _listingId,
            targetListing.assetContract,
            targetListing.tokenOwner,
            _buyFor,
            _quantityToBuy,
            _totalPrice
        );
    }

    /*///////////////////////////////////////////////////////////////
                        Bid logic
    //////////////////////////////////////////////////////////////*/

    /// @dev Lets an account make a bid in an auction.
    function bid(
        uint256 _listingId,
        uint256 _pricePerToken,
        string memory _referralAdditionalInformation
    ) external nonReentrant onlyExistingListing(_listingId) {
        require(_pricePerToken != 0, "bidding zero amount");

        Listing memory targetListing = listings[_listingId];
        address currency = targetListing.currency;

        require(
            targetListing.listingType == ListingType.Auction,
            "not an auction."
        );
        require(
            targetListing.endTime > block.timestamp &&
                targetListing.startTime < block.timestamp,
            "inactive listing."
        );

        // A bid must be made for all auction items.
        uint256 quantity = _getSafeQuantity(
            targetListing.tokenType,
            targetListing.quantity
        );
        uint256 incomingBidAmount = _pricePerToken * quantity;

        Bid memory currentWinningBid = winningBid[_listingId];
        uint256 currentBidAmount = currentWinningBid.pricePerToken * quantity;

        Bid memory newBid = Bid({
            listingId: _listingId,
            bidder: _msgSender(),
            pricePerToken: _pricePerToken,
            referralAdditionalInformation: _referralAdditionalInformation
        });

        // Close auction and execute sale if there's a buyout price and incoming bid amount is buyout price.
        if (
            targetListing.buyoutPricePerToken > 0 &&
            incomingBidAmount >= targetListing.buyoutPricePerToken * quantity
        ) {
            _closeAuctionForBidder(targetListing, newBid);
        } else {
            /**
             *      If there's an existing winning bid, incoming bid amount must be bid buffer % greater.
             *      Else, bid amount must be at least as great as reserve price
             */
            uint256 _reserveAmount = targetListing.reservePricePerToken *
                quantity;

            bool isValidNewBid;
            if (currentBidAmount == 0) {
                isValidNewBid = incomingBidAmount >= _reserveAmount;
            } else {
                isValidNewBid = (incomingBidAmount > currentBidAmount &&
                    ((incomingBidAmount - currentBidAmount) * MAX_BPS) /
                        currentBidAmount >=
                    bidBufferBps);
            }
            require(isValidNewBid, "not winning bid.");

            // Update the winning bid and listing's end time before external contract calls.
            winningBid[targetListing.listingId] = newBid;

            if (targetListing.endTime - block.timestamp <= timeBuffer) {
                targetListing.endTime += timeBuffer;
                listings[targetListing.listingId] = targetListing;
            }
        }

        // Payout previous highest bid.
        if (currentWinningBid.bidder != address(0) && currentBidAmount > 0) {
            _pay(
                address(this),
                currentWinningBid.bidder,
                targetListing.currency,
                currentBidAmount
            );
        }

        // Collect incoming bid
        _pay(newBid.bidder, address(this), currency, incomingBidAmount);

        emit NewBid(
            targetListing.listingId,
            newBid.bidder,
            quantity,
            incomingBidAmount,
            currency
        );
    }

    /*///////////////////////////////////////////////////////////////
                    Auction listings sales logic
    //////////////////////////////////////////////////////////////*/

    /// @dev Lets an account close an auction for either the (1) winning bidder, or (2) auction creator.
    function closeAuction(
        uint256 _listingId,
        address _closeFor
    ) external nonReentrant onlyExistingListing(_listingId) {
        Listing memory targetListing = listings[_listingId];

        require(
            targetListing.listingType == ListingType.Auction,
            "not an auction."
        );

        Bid memory targetBid = winningBid[_listingId];

        // Cancel auction if (1) auction hasn't started, or (2) auction doesn't have any bids.
        bool toCancel = targetListing.startTime > block.timestamp ||
            targetBid.bidder == address(0);

        if (toCancel) {
            // cancel auction listing owner check
            _cancelAuction(targetListing);
        } else {
            require(
                targetListing.endTime < block.timestamp,
                "cannot close auction before it has ended."
            );

            // No `else if` to let auction close in 1 tx when targetListing.tokenOwner == targetBid.bidder.
            if (_closeFor == targetListing.tokenOwner) {
                _closeAuctionForAuctionCreator(targetListing, targetBid);
            }

            if (_closeFor == targetBid.bidder) {
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

        _transferListingTokens(
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
        Bid memory _winningBid
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
            spender: _winningBid.bidder,
            additionalInformation: _winningBid.referralAdditionalInformation
        });

        _payout(
            address(this),
            _targetListing.tokenOwner,
            _targetListing.currency,
            payoutAmount,
            _targetListing.assetContract,
            _targetListing.tokenId,
            referral
        );

        emit AuctionClosed(
            _targetListing.listingId,
            _msgSender(),
            false,
            _targetListing.tokenOwner,
            _winningBid.bidder
        );
    }

    /// @dev Closes an auction for the winning bidder; distributes auction items to the winning bidder.
    function _closeAuctionForBidder(
        Listing memory _targetListing,
        Bid memory _winningBid
    ) internal {
        _targetListing.endTime = block.timestamp;
        winningBid[_targetListing.listingId] = _winningBid;
        listings[_targetListing.listingId] = _targetListing;

        _transferListingTokens(
            address(this),
            _winningBid.bidder,
            _targetListing.quantity,
            _targetListing
        );

        emit AuctionClosed(
            _targetListing.listingId,
            _msgSender(),
            false,
            _targetListing.tokenOwner,
            _winningBid.bidder
        );
    }

    /*///////////////////////////////////////////////////////////////
                    Offers logic
    //////////////////////////////////////////////////////////////*/

    function makeOffer(
        OfferParams memory _params
    ) external returns (uint256 _offerId) {
        _offerId = totalOffers;
        totalOffers += 1;
        address _offeror = _msgSender();
        TokenType _tokenType = _getTokenType(_params.assetContract);

        _validateNewOffer(_params, _tokenType);

        Offer memory _offer = Offer({
            offerId: _offerId,
            offeror: _offeror,
            assetContract: _params.assetContract,
            tokenId: _params.tokenId,
            tokenType: _tokenType,
            quantity: _params.quantity,
            currency: _params.currency,
            totalPrice: _params.totalPrice,
            expirationTimestamp: _params.expirationTimestamp,
            status: Status.CREATED,
            referralAdditionalInformation: _params.referralAdditionalInformation
        });

        offers[_offerId] = _offer;

        emit NewOffer(_offeror, _offerId, _params.assetContract, _offer);
    }

    function cancelOffer(
        uint256 _offerId
    ) external onlyExistingOffer(_offerId) onlyOfferor(_offerId) {
        offers[_offerId].status = Status.CANCELLED;

        emit CancelledOffer(_msgSender(), _offerId);
    }

    function acceptOffer(
        uint256 _offerId
    ) external nonReentrant onlyExistingOffer(_offerId) {
        Offer memory _targetOffer = offers[_offerId];

        require(_targetOffer.expirationTimestamp > block.timestamp, "EXPIRED");

        require(
            _validateERC20BalAndAllowance(
                _targetOffer.offeror,
                _targetOffer.currency,
                _targetOffer.totalPrice
            ),
            "Marketplace: insufficient currency balance."
        );

        _validateOwnershipAndApproval(
            _msgSender(),
            _targetOffer.assetContract,
            _targetOffer.tokenId,
            _targetOffer.quantity,
            _targetOffer.tokenType
        );

        offers[_offerId].status = Status.COMPLETED;

        ReferralRevenue memory referral = ReferralRevenue({
            enabler: _msgSender(),
            spender: _targetOffer.offeror,
            additionalInformation: _targetOffer.referralAdditionalInformation
        });

        _payout(
            _targetOffer.offeror,
            _msgSender(),
            _targetOffer.currency,
            _targetOffer.totalPrice,
            _targetOffer.assetContract,
            _targetOffer.tokenId,
            referral
        );
        _transferOfferTokens(
            _msgSender(),
            _targetOffer.offeror,
            _targetOffer.quantity,
            _targetOffer
        );

        emit AcceptedOffer(
            _targetOffer.offeror,
            _targetOffer.offerId,
            _targetOffer.assetContract,
            _targetOffer.tokenId,
            _msgSender(),
            _targetOffer.quantity,
            _targetOffer.totalPrice
        );
    }

    /// @dev Returns existing offer with the given uid.
    function getOffer(
        uint256 _offerId
    ) external view returns (Offer memory _offer) {
        _offer = offers[_offerId];
    }

    /// @dev Returns all existing offers within the specified range.
    function getAllOffers(
        uint256 _startId,
        uint256 _endId
    ) external view returns (Offer[] memory _allOffers) {
        require(_startId <= _endId && _endId < totalOffers, "invalid range");

        _allOffers = new Offer[](_endId - _startId + 1);

        for (uint256 i = _startId; i <= _endId; i += 1) {
            _allOffers[i - _startId] = offers[i];
        }
    }

    /// @dev Returns offers within the specified range, where offeror has sufficient balance.
    function getAllValidOffers(
        uint256 _startId,
        uint256 _endId
    ) external view returns (Offer[] memory _validOffers) {
        require(_startId <= _endId && _endId < totalOffers, "invalid range");

        Offer[] memory _offers = new Offer[](_endId - _startId + 1);
        uint256 _offerCount;

        for (uint256 i = _startId; i <= _endId; i += 1) {
            uint256 j = i - _startId;
            _offers[j] = offers[i];
            if (_validateExistingOffer(_offers[j])) {
                _offerCount += 1;
            }
        }

        _validOffers = new Offer[](_offerCount);
        uint256 index = 0;
        uint256 count = _offers.length;
        for (uint256 i = 0; i < count; i += 1) {
            if (_validateExistingOffer(_offers[i])) {
                _validOffers[index++] = _offers[i];
            }
        }
    }

    /// @dev Checks whether the auction creator owns and has approved marketplace to transfer auctioned tokens.
    function _validateNewOffer(
        OfferParams memory _params,
        TokenType _tokenType
    ) internal view {
        require(_params.totalPrice > 0, "zero price.");
        require(_params.quantity > 0, "Marketplace: wanted zero tokens.");
        require(
            _params.quantity == 1 || _tokenType == TokenType.ERC1155,
            "Marketplace: wanted invalid quantity."
        );
        require(
            _params.expirationTimestamp + 60 minutes > block.timestamp,
            "Marketplace: invalid expiration timestamp."
        );

        require(
            _validateERC20BalAndAllowance(
                _msgSender(),
                _params.currency,
                _params.totalPrice
            ),
            "Marketplace: insufficient currency balance."
        );
    }

    /// @dev Checks whether the offer exists, is active, and if the offeror has sufficient balance.
    function _validateExistingOffer(
        Offer memory _targetOffer
    ) internal view returns (bool isValid) {
        isValid =
            _targetOffer.expirationTimestamp > block.timestamp &&
            _targetOffer.status == Status.CREATED &&
            _validateERC20BalAndAllowance(
                _targetOffer.offeror,
                _targetOffer.currency,
                _targetOffer.totalPrice
            );
    }

    /*///////////////////////////////////////////////////////////////
            Shared internal functions
    //////////////////////////////////////////////////////////////*/

    /// @dev Transfers tokens listed for sale in a direct or auction listing.
    function _transferListingTokens(
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

    /// @dev Transfers tokens.
    function _transferOfferTokens(
        address _from,
        address _to,
        uint256 _quantity,
        Offer memory _offer
    ) internal {
        if (_offer.tokenType == TokenType.ERC1155) {
            IERC1155(_offer.assetContract).safeTransferFrom(
                _from,
                _to,
                _offer.tokenId,
                _quantity,
                ""
            );
        } else if (_offer.tokenType == TokenType.ERC721) {
            IERC721(_offer.assetContract).safeTransferFrom(
                _from,
                _to,
                _offer.tokenId,
                ""
            );
        }
    }

    /// @dev Pays out stakeholders in a sale.
    function _payout(
        address _payer,
        address _payee,
        address _currencyToUse,
        uint256 _totalPayoutAmount,
        address _assetContract,
        uint256 _tokenId,
        ReferralRevenue memory referral
    ) internal {
        // Pay protocol fee
        uint256 protocolCut = getFeeAmount(_totalPayoutAmount);
        _payFee(_payer, _currencyToUse, protocolCut, address(this), referral);

        // Distribute royalties
        uint256 royaltyCut;
        address royaltyRecipient;
        try
            IERC2981(_assetContract).royaltyInfo(_tokenId, _totalPayoutAmount)
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

    /// @dev Validates that `_tokenOwner` owns and has approved Markeplace to transfer the appropriate amount of currency
    function _validateERC20BalAndAllowance(
        address _tokenOwner,
        address _currency,
        uint256 _amount
    ) internal view returns (bool isValid) {
        isValid =
            IERC20(_currency).balanceOf(_tokenOwner) >= _amount &&
            IERC20(_currency).allowance(_tokenOwner, address(this)) >= _amount;
    }

    /// @dev Validates that `_tokenOwner` owns and has approved Market to transfer NFTs.
    function _validateOwnershipAndApproval(
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

    /*///////////////////////////////////////////////////////////////
                            Getter functions
    //////////////////////////////////////////////////////////////*/

    /// @dev Enforces quantity == 1 if tokenType is TokenType.ERC721.
    function _getSafeQuantity(
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
    function _getTokenType(
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
