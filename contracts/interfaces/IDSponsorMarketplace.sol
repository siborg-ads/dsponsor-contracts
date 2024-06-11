// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;

interface IDSponsorMarketplace {
    enum TokenType {
        ERC1155,
        ERC721,
        ERC20
    }

    enum TransferType {
        Rent,
        Sale
    }

    enum Status {
        UNSET,
        CREATED,
        COMPLETED,
        CANCELLED
    }

    /**
     *  @notice The two types of listings.
     *          `Direct`: NFTs listed for sale at a fixed price.
     *          `Auction`: NFTs listed for sale in an auction.
     */
    enum ListingType {
        Direct,
        Auction
    }

    error AuctionAlreadyStarted();
    error AuctionStillActive();
    error CannotBeZeroAddress();
    error InsufficientAllowanceOrBalance(address assetContract);
    error InvalidCurrency();
    error InvalidPricingParameters();
    error InvalidRentalExpiration();
    error InvalidTotalPrice();
    error InvalidQuantity();
    error IsNotAuctionListing();
    error IsNotDirectListing();
    error isNotWinningBid();
    error ListingDoesNotExist(uint256 listingId);
    error NotERC4907Compliant();
    error NotERC721OrERC1155();
    error OfferIsNotActive(uint256 offerId);
    error OutOfStock();
    error OutOfValidityPeriod();
    error RefundExceedsBid();
    error SenderIsNotOfferor();
    error SenderIsNotTokenOwner();
    error ZeroQuantity();

    /**
     *  @notice The information related to a direct listing buy.
     *
     *  @param listingId The uid of the direct listing to buy from.
     *  @param buyFor The receiver of the NFT being bought.
     *  @param quantity The amount of NFTs to buy from the direct listing.
     *  @param currency The currency to pay the price in.
     *  @param referralAdditionalInformation Additional information for facilitating transactions, such as business referrer IDs or tracking codes.
     *
     *  @dev A sale will fail to execute if either:
     *          (1) buyer does not own or has not approved Marketplace to transfer the appropriate
     *              amount of currency (or hasn't sent the appropriate amount of native tokens)
     *
     *          (2) the lister does not own or has removed Marketplace's
     *              approval to transfer the tokens listed for sale.
     */
    struct BuyParams {
        uint256 listingId;
        address buyFor;
        uint256 quantity;
        address currency;
        string referralAdditionalInformation;
    }

    /**
     *  @notice The information related to a bid in an auction.
     *
     *  @param listingId      The uid of the listing the bid is made to.
     *  @param bidder        The account making the bid.
     *  @param quantityWanted The entire listing quantity
     *  @param currency       The currency in which the bid is made.
     *  @param pricePerToken  The price per token bidded to the lister.
     *  @param referralAdditionalInformation Additional information for facilitating transactions, such as business referrer IDs or tracking codes.
     */
    struct Bid {
        uint256 listingId;
        address bidder;
        uint256 pricePerToken;
        string referralAdditionalInformation;
    }

    /**
     *  @dev For use in `createListing` as a parameter type.
     *
     *  @param assetContract         The contract address of the NFT to list for sale.
     *
     *  @param tokenId               The tokenId on `assetContract` of the NFT to list for sale.
     *
     *  @param startTime             The unix timestamp after which the listing is active. For direct listings:
     *                               'active' means NFTs can be bought from the listing. For auctions,
     *                               'active' means bids can be made in the auction.
     *
     *  @param secondsUntilEndTime   No. of seconds after `startTime`, after which the listing is inactive.
     *                               For direct listings: 'inactive' means NFTs cannot be bought from the listing.
     *                               For auctions: 'inactive' means bids can no longer be made in the auction.
     *
     *  @param quantityToList        The quantity of NFT of ID `tokenId` on the given `assetContract` to list. For
     *                               ERC 721 tokens to list for sale, the contract strictly defaults this to `1`,
     *                               Regardless of the value of `quantityToList` passed.
     *
     *  @param currencyToAccept      For direct listings: the currency in which a buyer must pay the listing's fixed price
     *                               to buy the NFT(s). For auctions: the currency in which the bidders must make bids.
     *
     *  @param reservePricePerToken  For direct listings: this value is ignored. For auctions: the minimum bid amount of
     *                               the auction is `reservePricePerToken * quantityToList`
     *
     *  @param buyoutPricePerToken   For direct listings: interpreted as 'price per token' listed. For auctions: if
     *                               `buyoutPricePerToken` is greater than 0, and a bidder's bid is at least as great as
     *                               `buyoutPricePerToken * quantityToList`, the bidder wins the auction, and the auction
     *                               is closed.
     *
     *  @param transferType          The type of transfer to be made : rent or sale. Rent is only possible if `assetContract` is ERC4907.
     *
     * @param rentalExpirationTimestamp       The date after which the rental is expired. This is only applicable if `transferType` is `Rent`.
     *
     *  @param listingType           The type of listing to create - a direct listing or an auction.
     */
    struct ListingParameters {
        address assetContract;
        uint256 tokenId;
        uint256 startTime;
        uint256 secondsUntilEndTime;
        uint256 quantityToList;
        address currencyToAccept;
        uint256 reservePricePerToken;
        uint256 buyoutPricePerToken;
        TransferType transferType;
        uint64 rentalExpirationTimestamp;
        ListingType listingType;
    }

    /**
     *  @dev For use in `updateListing` as a parameter type.
     *  @param quantityToList       The amount of NFTs to list for sale in the listing. For direct listings, the contract
     *                               only checks whether the listing creator owns and has approved Marketplace to transfer
     *                               `quantityToList` amount of NFTs to list for sale. For auction listings, the contract
     *                               ensures that exactly `quantityToList` amount of NFTs to list are escrowed.
     *
     *  @param reservePricePerToken For direct listings: this value is ignored. For auctions: the minimum bid amount of
     *                               the auction is `reservePricePerToken * quantityToList`
     *
     *  @param buyoutPricePerToken  For direct listings: interpreted as 'price per token' listed. For auctions: if
     *                               `buyoutPricePerToken` is greater than 0, and a bidder's bid is at least as great as
     *                               `buyoutPricePerToken * quantityToList`, the bidder wins the auction, and the auction
     *                               is closed.
     *
     *  @param currencyToAccept     For direct listings: the currency in which a buyer must pay the listing's fixed price
     *                               to buy the NFT(s). For auctions: the currency in which the bidders must make bids.
     *
     *  @param startTime            The unix timestamp after which listing is active. For direct listings:
     *                               'active' means NFTs can be bought from the listing. For auctions,
     *                               'active' means bids can be made in the auction.
     *
     *  @param secondsUntilEndTime  No. of seconds after the provided `startTime`, after which the listing is inactive.
     *                               For direct listings: 'inactive' means NFTs cannot be bought from the listing.
     *                               For auctions: 'inactive' means bids can no longer be made in the auction.
     *
     *  @param rentalExpirationTimestamp The date after which the rental is expired. This is only applicable if `transferType` is `Rent`.
     */
    struct ListingUpdateParameters {
        uint256 quantityToList;
        uint256 reservePricePerToken;
        uint256 buyoutPricePerToken;
        address currencyToAccept;
        uint256 startTime;
        uint256 secondsUntilEndTime;
        uint64 rentalExpirationTimestamp;
    }

    /**
     *  @notice The information related to a listing; either (1) a direct listing, or (2) an auction listing.
     *
     *  @dev For direct listings:
     *          (1) `reservePricePerToken` is ignored.
     *          (2) `buyoutPricePerToken` is simply interpreted as 'price per token'.
     *
     *  @param listingId             The uid for the listing.
     *
     *  @param tokenOwner            The owner of the tokens listed for sale.  
     *
     *  @param assetContract         The contract address of the NFT to list for sale.

     *  @param tokenId               The tokenId on `assetContract` of the NFT to list for sale.

     *  @param startTime             The unix timestamp after which the listing is active. For direct listings:
     *                               'active' means NFTs can be bought from the listing. For auctions,
     *                               'active' means bids can be made in the auction.
     *
     *  @param endTime               The timestamp after which the listing is inactive.
     *                               For direct listings: 'inactive' means NFTs cannot be bought from the listing.
     *                               For auctions: 'inactive' means bids can no longer be made in the auction.
     *
     *  @param quantity              The quantity of NFT of ID `tokenId` on the given `assetContract` listed. For
     *                               ERC 721 tokens to list for sale, the contract strictly defaults this to `1`,
     *                               Regardless of the value of `quantityToList` passed.
     *
     *  @param currency              For direct listings: the currency in which a buyer must pay the listing's fixed price
     *                               to buy the NFT(s). For auctions: the currency in which the bidders must make bids.
     *
     *  @param reservePricePerToken  For direct listings: this value is ignored. For auctions: the minimum bid amount of
     *                               the auction is `reservePricePerToken * quantityToList`
     *
     *  @param buyoutPricePerToken   For direct listings: interpreted as 'price per token' listed. For auctions: if
     *                               `buyoutPricePerToken` is greater than 0, and a bidder's bid is at least as great as
     *                               `buyoutPricePerToken * quantityToList`, the bidder wins the auction, and the auction
     *                               is closed.
     *
     *  @param tokenType             The type of the token(s) listed for for sale -- ERC721 or ERC1155 
     *     
     *  @param transferType          The type of transfer to be made : rent or sale. Rent is only possible if `assetContract` is ERC4907.
     * 
     *  @param rentalExpirationTimestamp      The date after which the rental is expired. This is only applicable if `transferType` is `Rent`.
     *
     * @param listingType            The type of listing to create - a direct listing or an auction.
     **/
    struct Listing {
        uint256 listingId;
        address tokenOwner;
        address assetContract;
        uint256 tokenId;
        uint256 startTime;
        uint256 endTime;
        uint256 quantity;
        address currency;
        uint256 reservePricePerToken;
        uint256 buyoutPricePerToken;
        TokenType tokenType;
        TransferType transferType;
        uint64 rentalExpirationTimestamp;
        ListingType listingType;
    }

    /**
     *  @notice The parameters an offeror sets when making an offer for NFTs.
     *
     *  @param assetContract The contract of the NFTs for which the offer is being made.
     *  @param tokenId The tokenId of the NFT for which the offer is being made.
     *  @param quantity The quantity of NFTs wanted.
     *  @param currency The currency offered for the NFTs.
     *  @param totalPrice The total offer amount for the NFTs.
     *  @param expirationTimestamp The timestamp at and after which the offer cannot be accepted.
     *  @param transferType The type of transfer to be made : rent or sale. Rent is only possible if `assetContract` is ERC4907.
     *  @param rentalExpirationTimestamp The date after which the rental is expired. This is only applicable if `transferType` is `Rent`.
     *  @param referralAdditionalInformation Additional information for facilitating transactions, such as business referrer IDs or tracking codes.
     */
    struct OfferParams {
        address assetContract;
        uint256 tokenId;
        uint256 quantity;
        address currency;
        uint256 totalPrice;
        uint256 expirationTimestamp;
        TransferType transferType;
        uint64 rentalExpirationTimestamp;
        string referralAdditionalInformation;
    }

    /**
     *  @notice The information stored for the offer made.
     *
     *  @param offerId The ID of the offer.
     *  @param tokenId The tokenId of the NFT for which the offer is being made.
     *  @param quantity The quantity of NFTs wanted.
     *  @param totalPrice The total offer amount for the NFTs.
     *  @param expirationTimestamp The timestamp at and after which the offer cannot be accepted.
     *  @param offeror The address of the offeror.
     *  @param assetContract The contract of the NFTs for which the offer is being made.
     *  @param currency The currency offered for the NFTs.
     *  @param tokenType The type of token (ERC-721 or ERC-1155) the offer is made for.
     *  @param transferType The type of transfer to be made : rent or sale. Rent is only possible if `assetContract` is ERC4907.
     *  @param rentalExpirationTimestamp The date after which the rental is expired. This is only applicable if `transferType` is `Rent`.
     *  @param status The status of the offer (created, completed, or cancelled).
     * @param referralAdditionalInformation Additional information for facilitating transactions, such as business referrer IDs or tracking codes.
     */
    struct Offer {
        uint256 offerId;
        uint256 tokenId;
        uint256 quantity;
        uint256 totalPrice;
        uint256 expirationTimestamp;
        address offeror;
        address assetContract;
        address currency;
        TokenType tokenType;
        TransferType transferType;
        uint64 rentalExpirationTimestamp;
        Status status;
        string referralAdditionalInformation;
    }

    /// @dev Emitted when a new listing is created.
    event ListingAdded(
        uint256 indexed listingId,
        address indexed assetContract,
        address indexed lister,
        Listing listing
    );

    /// @dev Emitted when the parameters of a listing are updated.
    event ListingUpdated(
        uint256 indexed listingId,
        address indexed listingCreator,
        ListingUpdateParameters params
    );

    /// @dev Emitted when a listing is cancelled.
    event ListingRemoved(
        uint256 indexed listingId,
        address indexed listingCreator
    );

    /**
     * @dev Emitted when a buyer buys from a direct listing
     */
    event NewSale(
        uint256 indexed listingId,
        address indexed assetContract,
        address indexed lister,
        address buyer,
        uint256 quantityBought,
        uint256 totalPricePaid
    );

    /// @dev Emitted when a new bid is made in an auction.
    event NewBid(
        uint256 indexed listingId,
        uint256 quantityWanted,
        address indexed newBidder,
        uint256 newPricePerToken,
        address previousBidder,
        uint256 refundBonus,
        address currency,
        uint256 newEndTime
    );

    /// @dev Emitted when an auction is closed.
    event AuctionClosed(
        uint256 indexed listingId,
        address indexed closer,
        bool indexed cancelled,
        address auctionCreator,
        address winningBidder
    );

    /// @dev Emitted when a new offer is created.
    event NewOffer(
        address indexed offeror,
        uint256 indexed offerId,
        address indexed assetContract,
        Offer offer
    );

    /// @dev Emitted when an offer is cancelled.
    event CancelledOffer(address indexed offeror, uint256 indexed offerId);

    /// @dev Emitted when an offer is accepted.
    event AcceptedOffer(
        address indexed offeror,
        uint256 indexed offerId,
        address indexed assetContract,
        uint256 tokenId,
        address seller,
        uint256 quantityBought,
        uint256 totalPricePaid
    );

    /**
     *  @notice Lets a token owner list tokens (ERC 721 or ERC 1155) for sale in a direct listing, or an auction.
     *
     *  @dev NFTs to list for sale in an auction are escrowed in Marketplace. For direct listings, the contract
     *       only checks whether the listing's creator owns and has approved Marketplace to transfer the NFTs to list.
     *
     *  @param _params The parameters that govern the listing to be created.
     */
    function createListing(ListingParameters memory _params) external;

    /**
     *  @notice Lets a listing's creator edit the listing's parameters. A direct listing can be edited whenever.
     *          An auction listing cannot be edited after the auction has started.
     *
     *  @param _listingId The uid of the listing to edit.
     *  @param _params The parameters that govern the listing to be updated
     */
    function updateListing(
        uint256 _listingId,
        ListingUpdateParameters memory _params
    ) external;

    /**
     *  @notice Lets a direct listing creator cancel their listing.
     *
     *  @param _listingId The unique Id of the listing to cancel.
     */
    function cancelDirectListing(uint256 _listingId) external;

    /**
     *  @notice Lets someone from multiple items from direct listings (fixed prices)
     */
    function buy(BuyParams calldata params) external payable;

    /**
     *  @notice Lets someone make an bid in an auction.
     *
     *  @dev Each (address, listing ID) pair maps to a single unique bid. So e.g. if a buyer makes
     *       makes two bids to the same direct listing, the last bid is counted as the buyer's
     *       bid to that listing.
     *
     *  @param _listingId        The unique ID of the listing to make an bid to.
     *  @param _pricePerToken    The bid amount per token - includes fee for the previous bidder
     *  @param _bidder           The account for whom the bid is made.
     *  @param _referralAdditionalInformation Additional information for facilitating transactions, such as business referrer IDs or tracking codes.
     */
    function bid(
        uint256 _listingId,
        uint256 _pricePerToken,
        address _bidder,
        string memory _referralAdditionalInformation
    ) external payable;

    /**
     *  @notice Lets any account close an auction.
     *          - The auction creator is sent the winning bid amount.
     *          - The winning bidder is sent the auctioned NFTs.
     *
     *  @param _listingId The uid of the listing (the auction to close).
     */
    function closeAuction(uint256 _listingId) external;

    /**
     *  @notice Make an offer for NFTs (ERC-721 or ERC-1155)
     *
     *  @param _params The parameters of an offer.
     *
     *  @return offerId The unique integer ID assigned to the offer.
     */
    function makeOffer(
        OfferParams memory _params
    ) external returns (uint256 offerId);

    /**
     *  @notice Cancel an offer.
     *
     *  @param _offerId The ID of the offer to cancel.
     */
    function cancelOffer(uint256 _offerId) external;

    /**
     *  @notice Accept an offer.
     *
     *  @param _offerId The ID of the offer to accept.
     */
    function acceptOffer(uint256 _offerId) external;
}
