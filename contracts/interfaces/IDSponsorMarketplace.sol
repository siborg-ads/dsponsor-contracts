// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;

interface IDSponsorMarketplace {
    /// @notice Type of the tokens that can be listed for sale.
    enum TokenType {
        ERC1155,
        ERC721
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

    /**
     *  @notice The information related to a direct listing buy.
     *
     *  @param listingId The uid of the direct listing to buy from.
     *  @param buyFor The receiver of the NFT being bought.
     *  @param quantity The amount of NFTs to buy from the direct listing.
     *  @param currency The currency to pay the price in.
     *  @param totalPrice The total price to pay for the tokens being bought.
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
        uint256 totalPrice;
        string referralAdditionalInformation;
    }

    /**
     *  @notice The information related to a bid in an auction.
     *
     *  @param listingId      The uid of the listing the bid is made to.
     *  @param offeror        The account making the bid.
     *  @param quantityWanted The entire listing quantity
     *  @param currency       The currency in which the bid is made.
     *  @param pricePerToken  The price per token bidded to the lister.
     *  @param referralAdditionalInformation Additional information for facilitating transactions, such as business referrer IDs or tracking codes.
     */
    struct Bid {
        uint256 listingId;
        address offeror;
        uint256 pricePerToken;
        string referralAdditionalInformation;
    }

    /**
     *  @dev For use in `createListing` as a parameter type.
     *
     *  @param assetContract         The contract address of the NFT to list for sale.

     *  @param tokenId               The tokenId on `assetContract` of the NFT to list for sale.

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
     *  @param listingType           The type of listing to create - a direct listing or an auction.
    **/
    struct ListingParameters {
        address assetContract;
        uint256 tokenId;
        uint256 startTime;
        uint256 secondsUntilEndTime;
        uint256 quantityToList;
        address currencyToAccept;
        uint256 reservePricePerToken;
        uint256 buyoutPricePerToken;
        ListingType listingType;
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
        ListingType listingType;
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
        address indexed listingCreator
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
        address indexed offeror,
        uint256 quantityWanted,
        uint256 totalOfferAmount,
        address currency
    );

    /// @dev Emitted when an auction is closed.
    event AuctionClosed(
        uint256 indexed listingId,
        address indexed closer,
        bool indexed cancelled,
        address auctionCreator,
        address winningBidder
    );

    /// @dev Emitted when auction buffers are updated.
    event AuctionBuffersUpdated(uint256 timeBuffer, uint256 bidBufferBps);

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
     *  @param _listingId            The uid of the listing to edit.
     *
     *  @param _quantityToList       The amount of NFTs to list for sale in the listing. For direct listings, the contract
     *                               only checks whether the listing creator owns and has approved Marketplace to transfer
     *                               `_quantityToList` amount of NFTs to list for sale. For auction listings, the contract
     *                               ensures that exactly `_quantityToList` amount of NFTs to list are escrowed.
     *
     *  @param _reservePricePerToken For direct listings: this value is ignored. For auctions: the minimum bid amount of
     *                               the auction is `reservePricePerToken * quantityToList`
     *
     *  @param _buyoutPricePerToken  For direct listings: interpreted as 'price per token' listed. For auctions: if
     *                               `buyoutPricePerToken` is greater than 0, and a bidder's bid is at least as great as
     *                               `buyoutPricePerToken * quantityToList`, the bidder wins the auction, and the auction
     *                               is closed.
     *
     *  @param _currencyToAccept     For direct listings: the currency in which a buyer must pay the listing's fixed price
     *                               to buy the NFT(s). For auctions: the currency in which the bidders must make bids.
     *
     *  @param _startTime            The unix timestamp after which listing is active. For direct listings:
     *                               'active' means NFTs can be bought from the listing. For auctions,
     *                               'active' means bids can be made in the auction.
     *
     *  @param _secondsUntilEndTime  No. of seconds after the provided `_startTime`, after which the listing is inactive.
     *                               For direct listings: 'inactive' means NFTs cannot be bought from the listing.
     *                               For auctions: 'inactive' means bids can no longer be made in the auction.
     */
    function updateListing(
        uint256 _listingId,
        uint256 _quantityToList,
        uint256 _reservePricePerToken,
        uint256 _buyoutPricePerToken,
        address _currencyToAccept,
        uint256 _startTime,
        uint256 _secondsUntilEndTime
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
    function buy(BuyParams[] calldata params) external;

    /**
     *  @notice Lets someone from a direct listing (fixed prices)
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
     *  @param _pricePerToken    The bid amount per token.
     *                           The total bid amount is `listings[_listingId].quantity * _pricePerToken`.
     *  @param _referralAdditionalInformation Additional information for facilitating transactions, such as business referrer IDs or tracking codes.
     */
    function bid(
        uint256 _listingId,
        uint256 _pricePerToken,
        string memory _referralAdditionalInformation
    ) external;

    /**
     *  @notice Lets any account close an auction on behalf of either the (1) auction's creator, or (2) winning bidder.
     *              For (1): The auction creator is sent the winning bid amount.
     *              For (2): The winning bidder is sent the auctioned NFTs.
     *
     *  @param _listingId The uid of the listing (the auction to close).
     *  @param _closeFor For whom the auction is being closed - the auction creator or winning bidder.
     */
    function closeAuction(uint256 _listingId, address _closeFor) external;
}
