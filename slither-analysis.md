**THIS CHECKLIST IS NOT COMPLETE**. Use `--show-ignored-findings` to show all the results.
Summary
 - [reentrancy-eth](#reentrancy-eth) (2 results) (High)
 - [divide-before-multiply](#divide-before-multiply) (8 results) (Medium)
 - [incorrect-equality](#incorrect-equality) (20 results) (Medium)
 - [uninitialized-local](#uninitialized-local) (7 results) (Medium)
 - [unused-return](#unused-return) (4 results) (Medium)
 - [shadowing-local](#shadowing-local) (4 results) (Low)
 - [calls-loop](#calls-loop) (9 results) (Low)
 - [reentrancy-benign](#reentrancy-benign) (2 results) (Low)
 - [reentrancy-events](#reentrancy-events) (6 results) (Low)
 - [timestamp](#timestamp) (18 results) (Low)
 - [assembly](#assembly) (28 results) (Informational)
 - [pragma](#pragma) (1 results) (Informational)
 - [costly-loop](#costly-loop) (2 results) (Informational)
 - [dead-code](#dead-code) (8 results) (Informational)
 - [solc-version](#solc-version) (67 results) (Informational)
 - [low-level-calls](#low-level-calls) (5 results) (Informational)
 - [missing-inheritance](#missing-inheritance) (1 results) (Informational)
 - [naming-convention](#naming-convention) (96 results) (Informational)
 - [similar-names](#similar-names) (2 results) (Informational)
 - [too-many-digits](#too-many-digits) (3 results) (Informational)
 - [constable-states](#constable-states) (1 results) (Optimization)
## reentrancy-eth
Impact: High
Confidence: Medium
 - [ ] ID-0
Reentrancy in [DSponsorMarketplace.closeAuction(uint256,address)](contracts/DSponsorMarketplace.sol#L648-L683):
	External calls:
	- [_closeAuctionForAuctionCreator(targetListing,targetBid)](contracts/DSponsorMarketplace.sol#L676)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L137)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L141)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L143)
	- [_closeAuctionForBidder(targetListing,targetBid)](contracts/DSponsorMarketplace.sol#L680)
		- [IERC1155(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,_quantity,)](contracts/DSponsorMarketplace.sol#L790-L796)
		- [IERC721(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,)](contracts/DSponsorMarketplace.sol#L798-L803)
	External calls sending eth:
	- [_closeAuctionForAuctionCreator(targetListing,targetBid)](contracts/DSponsorMarketplace.sol#L676)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
	State variables written after the call(s):
	- [_closeAuctionForBidder(targetListing,targetBid)](contracts/DSponsorMarketplace.sol#L680)
		- [listings[_targetListing.listingId] = _targetListing](contracts/DSponsorMarketplace.sol#L760)
	[DSponsorMarketplace.listings](contracts/DSponsorMarketplace.sol#L48) can be used in cross function reentrancies:
	- [DSponsorMarketplace.cancelDirectListing(uint256)](contracts/DSponsorMarketplace.sol#L294-L304)
	- [DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L133-L201)
	- [DSponsorMarketplace.listings](contracts/DSponsorMarketplace.sol#L48)
	- [DSponsorMarketplace.onlyListingCreator(uint256)](contracts/DSponsorMarketplace.sol#L61-L64)
	- [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)](contracts/DSponsorMarketplace.sol#L204-L291)
	- [_closeAuctionForBidder(targetListing,targetBid)](contracts/DSponsorMarketplace.sol#L680)
		- [winningBid[_targetListing.listingId] = _winningBid](contracts/DSponsorMarketplace.sol#L759)
	[DSponsorMarketplace.winningBid](contracts/DSponsorMarketplace.sol#L54) can be used in cross function reentrancies:
	- [DSponsorMarketplace.winningBid](contracts/DSponsorMarketplace.sol#L54)

contracts/DSponsorMarketplace.sol#L648-L683


 - [ ] ID-1
Reentrancy in [DSponsorAdmin.mintAndSubmit(DSponsorAdmin.MintAndSubmitAdParams)](contracts/DSponsorAdmin.sol#L79-L132):
	External calls:
	- [_externalCallWithProtocolFee(address(contractAddr),mintCallData,params.currency,mintPrice,referral)](contracts/DSponsorAdmin.sol#L115-L121)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [(success,returndata) = address(token).call(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L115)
		- [amountOut = swapRouter.exactOutputSingle{value: msg.value}(params)](contracts/lib/ProtocolFee.sol#L205)
		- [swapRouter.refundETH()](contracts/lib/ProtocolFee.sol#L208)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L137)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [Address.sendValue(address(recipientRefund),balanceAfterSwap - balanceBeforeSwap)](contracts/lib/ProtocolFee.sol#L211-L214)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L141)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L143)
		- [IERC20(currency).safeTransferFrom(_msgSender(),address(this),totalAmount)](contracts/lib/ProtocolFee.sol#L89-L93)
		- [IERC20(currency).forceApprove(address(target),baseAmount)](contracts/lib/ProtocolFee.sol#L97)
		- [retData = Address.functionCallWithValue(target,callData,value)](contracts/lib/ProtocolFee.sol#L109-L113)
	External calls sending eth:
	- [_externalCallWithProtocolFee(address(contractAddr),mintCallData,params.currency,mintPrice,referral)](contracts/DSponsorAdmin.sol#L115-L121)
		- [amountOut = swapRouter.exactOutputSingle{value: msg.value}(params)](contracts/lib/ProtocolFee.sol#L205)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
	State variables written after the call(s):
	- [_submitAdProposal(params.offerId,params.tokenId,params.adParameters[i],params.adDatas[i])](contracts/DSponsorAdmin.sol#L125-L130)
		- [_sponsoringOffers[offerId].proposals[tokenId][_hashString(adParameter)].lastSubmitted = _proposalCounterId](contracts/DSponsorAgreements.sol#L371-L373)
	[DSponsorAgreements._sponsoringOffers](contracts/DSponsorAgreements.sol#L24) can be used in cross function reentrancies:
	- [DSponsorAgreements._submitAdProposal(uint256,uint256,string,string)](contracts/DSponsorAgreements.sol#L355-L382)
	- [DSponsorAgreements._updateOffer(uint256,bool,string,string)](contracts/DSponsorAgreements.sol#L384-L400)
	- [DSponsorAgreements._updateOfferAdParameters(uint256,bool,string[])](contracts/DSponsorAgreements.sol#L402-L413)
	- [DSponsorAgreements._updateOfferAdmins(uint256,bool,address[])](contracts/DSponsorAgreements.sol#L415-L427)
	- [DSponsorAgreements._updateOfferValidators(uint256,bool,address[])](contracts/DSponsorAgreements.sol#L429-L438)
	- [DSponsorAgreements.createOffer(IERC721,IDSponsorAgreements.OfferInitParams)](contracts/DSponsorAgreements.sol#L110-L147)
	- [DSponsorAgreements.getOfferContract(uint256)](contracts/DSponsorAgreements.sol#L293-L295)
	- [DSponsorAgreements.getOfferProposals(uint256,uint256,string)](contracts/DSponsorAgreements.sol#L297-L316)
	- [DSponsorAgreements.isAllowedAdParameter(uint256,string)](contracts/DSponsorAgreements.sol#L318-L324)
	- [DSponsorAgreements.isOfferAdmin(uint256,address)](contracts/DSponsorAgreements.sol#L326-L331)
	- [DSponsorAgreements.isOfferDisabled(uint256)](contracts/DSponsorAgreements.sol#L333-L335)
	- [DSponsorAgreements.isOfferValidator(uint256,address)](contracts/DSponsorAgreements.sol#L337-L342)
	- [DSponsorAgreements.onlyAdmin(uint256)](contracts/DSponsorAgreements.sol#L30-L35)
	- [DSponsorAgreements.onlyAllowedAdParameter(uint256,string)](contracts/DSponsorAgreements.sol#L37-L47)
	- [DSponsorAgreements.onlySponsor(uint256,uint256)](contracts/DSponsorAgreements.sol#L50-L76)
	- [DSponsorAgreements.onlyValidator(uint256)](contracts/DSponsorAgreements.sol#L78-L86)
	- [DSponsorAgreements.reviewAdProposal(uint256,uint256,uint256,string,bool,string)](contracts/DSponsorAgreements.sol#L203-L241)

contracts/DSponsorAdmin.sol#L79-L132


## divide-before-multiply
Impact: Medium
Confidence: Medium
 - [ ] ID-2
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L192)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-3
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L190)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-4
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse = (3 * denominator) ^ 2](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L184)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-5
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L191)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-6
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L188)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-7
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [prod0 = prod0 / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L172)
	- [result = prod0 * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L199)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-8
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L193)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-9
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L189)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


## incorrect-equality
Impact: Medium
Confidence: High
 - [ ] ID-10
[DSponsorMarketplace.getSafeQuantity(IDSponsorMarketplace.TokenType,uint256)](contracts/DSponsorMarketplace.sol#L914-L925) uses a dangerous strict equality:
	- [_quantityToCheck == 0](contracts/DSponsorMarketplace.sol#L918)

contracts/DSponsorMarketplace.sol#L914-L925


 - [ ] ID-11
[DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L133-L201) uses a dangerous strict equality:
	- [require(bool,string)(newListing.buyoutPricePerToken == 0 || newListing.buyoutPricePerToken >= newListing.reservePricePerToken,RESERVE)](contracts/DSponsorMarketplace.sol#L181-L186)

contracts/DSponsorMarketplace.sol#L133-L201


 - [ ] ID-12
[ProtocolFee._pay(address,address,address,uint256)](contracts/lib/ProtocolFee.sol#L126-L147) uses a dangerous strict equality:
	- [currency == address(0)](contracts/lib/ProtocolFee.sol#L133)

contracts/lib/ProtocolFee.sol#L126-L147


 - [ ] ID-13
[DSponsorMarketplace.transferListingTokens(address,address,uint256,IDSponsorMarketplace.Listing)](contracts/DSponsorMarketplace.sol#L783-L805) uses a dangerous strict equality:
	- [_listing.tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L797)

contracts/DSponsorMarketplace.sol#L783-L805


 - [ ] ID-14
[DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L133-L201) uses a dangerous strict equality:
	- [newListing.listingType == ListingType.Auction](contracts/DSponsorMarketplace.sol#L180)

contracts/DSponsorMarketplace.sol#L133-L201


 - [ ] ID-15
[DSponsorMarketplace.transferListingTokens(address,address,uint256,IDSponsorMarketplace.Listing)](contracts/DSponsorMarketplace.sol#L783-L805) uses a dangerous strict equality:
	- [_listing.tokenType == TokenType.ERC1155](contracts/DSponsorMarketplace.sol#L789)

contracts/DSponsorMarketplace.sol#L783-L805


 - [ ] ID-16
[DSponsorMarketplace.closeAuction(uint256,address)](contracts/DSponsorMarketplace.sol#L648-L683) uses a dangerous strict equality:
	- [require(bool,string)(targetListing.listingType == ListingType.Auction,not an auction.)](contracts/DSponsorMarketplace.sol#L654-L657)

contracts/DSponsorMarketplace.sol#L648-L683


 - [ ] ID-17
[DSponsorMarketplace.offer(uint256,uint256,address,uint256,uint256,string)](contracts/DSponsorMarketplace.sol#L482-L533) uses a dangerous strict equality:
	- [require(bool,string)(newOffer.currency == targetListing.currency,must use approved currency to bid)](contracts/DSponsorMarketplace.sol#L511-L514)

contracts/DSponsorMarketplace.sol#L482-L533


 - [ ] ID-18
[DSponsorMarketplace.validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L846-L872) uses a dangerous strict equality:
	- [isValid = IERC721(_assetContract).ownerOf(_tokenId) == _tokenOwner && (IERC721(_assetContract).getApproved(_tokenId) == market || IERC721(_assetContract).isApprovedForAll(_tokenOwner,market))](contracts/DSponsorMarketplace.sol#L862-L868)

contracts/DSponsorMarketplace.sol#L846-L872


 - [ ] ID-19
[DSponsorMarketplace.getSafeQuantity(IDSponsorMarketplace.TokenType,uint256)](contracts/DSponsorMarketplace.sol#L914-L925) uses a dangerous strict equality:
	- [_tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L921-L923)

contracts/DSponsorMarketplace.sol#L914-L925


 - [ ] ID-20
[DSponsorMarketplace.offer(uint256,uint256,address,uint256,uint256,string)](contracts/DSponsorMarketplace.sol#L482-L533) uses a dangerous strict equality:
	- [targetListing.listingType == ListingType.Auction](contracts/DSponsorMarketplace.sol#L509)

contracts/DSponsorMarketplace.sol#L482-L533


 - [ ] ID-21
[DSponsorMarketplace.offer(uint256,uint256,address,uint256,uint256,string)](contracts/DSponsorMarketplace.sol#L482-L533) uses a dangerous strict equality:
	- [targetListing.listingType == ListingType.Direct](contracts/DSponsorMarketplace.sol#L524)

contracts/DSponsorMarketplace.sol#L482-L533


 - [ ] ID-22
[DSponsorMarketplace.validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L846-L872) uses a dangerous strict equality:
	- [_tokenType == TokenType.ERC1155](contracts/DSponsorMarketplace.sol#L856)

contracts/DSponsorMarketplace.sol#L846-L872


 - [ ] ID-23
[DSponsorMarketplace.validateDirectListingSale(IDSponsorMarketplace.Listing,uint256)](contracts/DSponsorMarketplace.sol#L875-L907) uses a dangerous strict equality:
	- [require(bool,string)(_listing.listingType == ListingType.Direct,cannot buy from listing.)](contracts/DSponsorMarketplace.sol#L879-L882)

contracts/DSponsorMarketplace.sol#L875-L907


 - [ ] ID-24
[DSponsorMarketplace._buy(uint256,address,uint256,address,uint256,string)](contracts/DSponsorMarketplace.sol#L353-L390) uses a dangerous strict equality:
	- [require(bool,string)(_currency == targetListing.currency && _totalPrice == (targetListing.buyoutPricePerToken * _quantityToBuy),!PRICE)](contracts/DSponsorMarketplace.sol#L365-L370)

contracts/DSponsorMarketplace.sol#L353-L390


 - [ ] ID-25
[DSponsorMarketplace.closeAuction(uint256,address)](contracts/DSponsorMarketplace.sol#L648-L683) uses a dangerous strict equality:
	- [_closeFor == targetListing.tokenOwner](contracts/DSponsorMarketplace.sol#L675)

contracts/DSponsorMarketplace.sol#L648-L683


 - [ ] ID-26
[DSponsorMarketplace._cancelAuction(IDSponsorMarketplace.Listing)](contracts/DSponsorMarketplace.sol#L686-L708) uses a dangerous strict equality:
	- [require(bool,string)(listings[_targetListing.listingId].tokenOwner == _msgSender(),caller is not the listing creator.)](contracts/DSponsorMarketplace.sol#L687-L690)

contracts/DSponsorMarketplace.sol#L686-L708


 - [ ] ID-27
[DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)](contracts/DSponsorMarketplace.sol#L204-L291) uses a dangerous strict equality:
	- [_startTime == 0](contracts/DSponsorMarketplace.sol#L238-L240)

contracts/DSponsorMarketplace.sol#L204-L291


 - [ ] ID-28
[DSponsorMarketplace.validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L846-L872) uses a dangerous strict equality:
	- [_tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L861)

contracts/DSponsorMarketplace.sol#L846-L872


 - [ ] ID-29
[DSponsorMarketplace.onlyListingCreator(uint256)](contracts/DSponsorMarketplace.sol#L61-L64) uses a dangerous strict equality:
	- [require(bool,string)(listings[_listingId].tokenOwner == _msgSender(),!OWNER)](contracts/DSponsorMarketplace.sol#L62)

contracts/DSponsorMarketplace.sol#L61-L64


## uninitialized-local
Impact: Medium
Confidence: Medium
 - [ ] ID-30
[DSponsorMarketplace.payout(address,address,address,uint256,IDSponsorMarketplace.Listing,IProtocolFee.ReferralRevenue).royaltyFeeRecipient](contracts/DSponsorMarketplace.sol#L828) is a local variable never initialized

contracts/DSponsorMarketplace.sol#L828


 - [ ] ID-31
[DSponsorMarketplace.payout(address,address,address,uint256,IDSponsorMarketplace.Listing,IProtocolFee.ReferralRevenue).royaltyRecipient](contracts/DSponsorMarketplace.sol#L822) is a local variable never initialized

contracts/DSponsorMarketplace.sol#L822


 - [ ] ID-32
[DSponsorMarketplace.payout(address,address,address,uint256,IDSponsorMarketplace.Listing,IProtocolFee.ReferralRevenue).royaltyFeeAmount](contracts/DSponsorMarketplace.sol#L828) is a local variable never initialized

contracts/DSponsorMarketplace.sol#L828


 - [ ] ID-33
[ERC2771Forwarder.executeBatch(ERC2771Forwarder.ForwardRequestData[],address).refundValue](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L169) is a local variable never initialized

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L169


 - [ ] ID-34
[DSponsorMarketplace.validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType).isValid](contracts/DSponsorMarketplace.sol#L854) is a local variable never initialized

contracts/DSponsorMarketplace.sol#L854


 - [ ] ID-35
[DSponsorMarketplace.payout(address,address,address,uint256,IDSponsorMarketplace.Listing,IProtocolFee.ReferralRevenue).royaltyCut](contracts/DSponsorMarketplace.sol#L821) is a local variable never initialized

contracts/DSponsorMarketplace.sol#L821


 - [ ] ID-36
[ERC2771Forwarder.executeBatch(ERC2771Forwarder.ForwardRequestData[],address).i](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L171) is a local variable never initialized

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L171


## unused-return
Impact: Medium
Confidence: Medium
 - [ ] ID-37
[ERC721Upgradeable._checkOnERC721Received(address,address,uint256,bytes)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L494-L511) ignores return value by [IERC721Receiver(to).onERC721Received(_msgSender(),from,tokenId,data)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L496-L509)

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L494-L511


 - [ ] ID-38
[ERC721._checkOnERC721Received(address,address,uint256,bytes)](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L465-L482) ignores return value by [IERC721Receiver(to).onERC721Received(_msgSender(),from,tokenId,data)](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L467-L480)

node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L465-L482


 - [ ] ID-39
[DSponsorMarketplace.payout(address,address,address,uint256,IDSponsorMarketplace.Listing,IProtocolFee.ReferralRevenue)](contracts/DSponsorMarketplace.sol#L808-L843) ignores return value by [IERC2981(_listing.assetContract).royaltyInfo(_listing.tokenId,_totalPayoutAmount)](contracts/DSponsorMarketplace.sol#L823-L833)

contracts/DSponsorMarketplace.sol#L808-L843


 - [ ] ID-40
[DSponsorAgreements.onlySponsor(uint256,uint256)](contracts/DSponsorAgreements.sol#L50-L76) ignores return value by [IERC4907(address(_sponsoringOffers[offerId].nftContract)).userOf(tokenId)](contracts/DSponsorAgreements.sol#L57-L64)

contracts/DSponsorAgreements.sol#L50-L76


## shadowing-local
Impact: Low
Confidence: High
 - [ ] ID-41
[ERC4907Upgradeable.__ERC4907_init(string,string).symbol](contracts/lib/ERC4907Upgradeable.sol#L22) shadows:
	- [ERC721Upgradeable.symbol()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L102-L105) (function)
	- [IERC721Metadata.symbol()](node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L21) (function)

contracts/lib/ERC4907Upgradeable.sol#L22


 - [ ] ID-42
[DSponsorNFT.setBaseURI(string)._baseURI](contracts/DSponsorNFT.sol#L244) shadows:
	- [ERC721Upgradeable._baseURI()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L122-L124) (function)

contracts/DSponsorNFT.sol#L244


 - [ ] ID-43
[ERC4907Upgradeable.__ERC4907_init(string,string).name](contracts/lib/ERC4907Upgradeable.sol#L21) shadows:
	- [ERC721Upgradeable.name()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L94-L97) (function)
	- [IERC721Metadata.name()](node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L16) (function)

contracts/lib/ERC4907Upgradeable.sol#L21


 - [ ] ID-44
[DSponsorNFT._setBaseURI(string)._baseURI](contracts/DSponsorNFT.sol#L549) shadows:
	- [ERC721Upgradeable._baseURI()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L122-L124) (function)

contracts/DSponsorNFT.sol#L549


## calls-loop
Impact: Low
Confidence: Medium
 - [ ] ID-45
[Address.functionCallWithValue(address,bytes,uint256)](node_modules/@openzeppelin/contracts/utils/Address.sol#L83-L89) has external calls inside a loop: [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)

node_modules/@openzeppelin/contracts/utils/Address.sol#L83-L89


 - [ ] ID-46
[Address.sendValue(address,uint256)](node_modules/@openzeppelin/contracts/utils/Address.sol#L41-L50) has external calls inside a loop: [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)

node_modules/@openzeppelin/contracts/utils/Address.sol#L41-L50


 - [ ] ID-47
[DSponsorMarketplace.transferListingTokens(address,address,uint256,IDSponsorMarketplace.Listing)](contracts/DSponsorMarketplace.sol#L783-L805) has external calls inside a loop: [IERC1155(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,_quantity,)](contracts/DSponsorMarketplace.sol#L790-L796)

contracts/DSponsorMarketplace.sol#L783-L805


 - [ ] ID-48
[DSponsorMarketplace.validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L846-L872) has external calls inside a loop: [isValid = IERC1155(_assetContract).balanceOf(_tokenOwner,_tokenId) >= _quantity && IERC1155(_assetContract).isApprovedForAll(_tokenOwner,market)](contracts/DSponsorMarketplace.sol#L857-L860)

contracts/DSponsorMarketplace.sol#L846-L872


 - [ ] ID-49
[DSponsorMarketplace.validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L846-L872) has external calls inside a loop: [isValid = IERC721(_assetContract).ownerOf(_tokenId) == _tokenOwner && (IERC721(_assetContract).getApproved(_tokenId) == market || IERC721(_assetContract).isApprovedForAll(_tokenOwner,market))](contracts/DSponsorMarketplace.sol#L862-L868)

contracts/DSponsorMarketplace.sol#L846-L872


 - [ ] ID-50
[DSponsorMarketplace.transferListingTokens(address,address,uint256,IDSponsorMarketplace.Listing)](contracts/DSponsorMarketplace.sol#L783-L805) has external calls inside a loop: [IERC721(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,)](contracts/DSponsorMarketplace.sol#L798-L803)

contracts/DSponsorMarketplace.sol#L783-L805


 - [ ] ID-51
[DSponsorAgreements.onlySponsor(uint256,uint256)](contracts/DSponsorAgreements.sol#L50-L76) has external calls inside a loop: [isOwner = _sponsoringOffers[offerId].nftContract.ownerOf(tokenId) == _msgSender()](contracts/DSponsorAgreements.sol#L51-L53)

contracts/DSponsorAgreements.sol#L50-L76


 - [ ] ID-52
[DSponsorMarketplace.payout(address,address,address,uint256,IDSponsorMarketplace.Listing,IProtocolFee.ReferralRevenue)](contracts/DSponsorMarketplace.sol#L808-L843) has external calls inside a loop: [IERC2981(_listing.assetContract).royaltyInfo(_listing.tokenId,_totalPayoutAmount)](contracts/DSponsorMarketplace.sol#L823-L833)

contracts/DSponsorMarketplace.sol#L808-L843


 - [ ] ID-53
[DSponsorAgreements.onlySponsor(uint256,uint256)](contracts/DSponsorAgreements.sol#L50-L76) has external calls inside a loop: [IERC4907(address(_sponsoringOffers[offerId].nftContract)).userOf(tokenId)](contracts/DSponsorAgreements.sol#L57-L64)

contracts/DSponsorAgreements.sol#L50-L76


## reentrancy-benign
Impact: Low
Confidence: Medium
 - [ ] ID-54
Reentrancy in [DSponsorAdmin.createDSponsorNFTAndOffer(IDSponsorNFTBase.InitParams,IDSponsorAgreements.OfferInitParams)](contracts/DSponsorAdmin.sol#L56-L64):
	External calls:
	- [newDSponsorNFT = nftFactory.createDSponsorNFT(nftParams)](contracts/DSponsorAdmin.sol#L62)
	State variables written after the call(s):
	- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L63)
		- [_offerCountId ++](contracts/DSponsorAgreements.sol#L126)
	- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L63)
		- [_sponsoringOffers[offerId].disabled = disable](contracts/DSponsorAgreements.sol#L390)
		- [_sponsoringOffers[offerId].adParameters[_hashString(adParameters[i])] = enable](contracts/DSponsorAgreements.sol#L408-L410)
		- [_sponsoringOffers[offerId].validators[validators[i]] = enable](contracts/DSponsorAgreements.sol#L435)
		- [_sponsoringOffers[offerId].admins[admins[i]] = enable](contracts/DSponsorAgreements.sol#L424)
		- [_sponsoringOffers[_offerCountId].nftContract = nftContract](contracts/DSponsorAgreements.sol#L128)

contracts/DSponsorAdmin.sol#L56-L64


 - [ ] ID-55
Reentrancy in [DSponsorAdmin.mintAndSubmit(DSponsorAdmin.MintAndSubmitAdParams)](contracts/DSponsorAdmin.sol#L79-L132):
	External calls:
	- [_externalCallWithProtocolFee(address(contractAddr),mintCallData,params.currency,mintPrice,referral)](contracts/DSponsorAdmin.sol#L115-L121)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [(success,returndata) = address(token).call(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L115)
		- [amountOut = swapRouter.exactOutputSingle{value: msg.value}(params)](contracts/lib/ProtocolFee.sol#L205)
		- [swapRouter.refundETH()](contracts/lib/ProtocolFee.sol#L208)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L137)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [Address.sendValue(address(recipientRefund),balanceAfterSwap - balanceBeforeSwap)](contracts/lib/ProtocolFee.sol#L211-L214)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L141)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L143)
		- [IERC20(currency).safeTransferFrom(_msgSender(),address(this),totalAmount)](contracts/lib/ProtocolFee.sol#L89-L93)
		- [IERC20(currency).forceApprove(address(target),baseAmount)](contracts/lib/ProtocolFee.sol#L97)
		- [retData = Address.functionCallWithValue(target,callData,value)](contracts/lib/ProtocolFee.sol#L109-L113)
	External calls sending eth:
	- [_externalCallWithProtocolFee(address(contractAddr),mintCallData,params.currency,mintPrice,referral)](contracts/DSponsorAdmin.sol#L115-L121)
		- [amountOut = swapRouter.exactOutputSingle{value: msg.value}(params)](contracts/lib/ProtocolFee.sol#L205)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
	State variables written after the call(s):
	- [_submitAdProposal(params.offerId,params.tokenId,params.adParameters[i],params.adDatas[i])](contracts/DSponsorAdmin.sol#L125-L130)
		- [_proposalCounterId ++](contracts/DSponsorAgreements.sol#L369)

contracts/DSponsorAdmin.sol#L79-L132


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-56
Reentrancy in [DSponsorNFTFactory.createDSponsorNFT(IDSponsorNFTBase.InitParams)](contracts/DSponsorNFTFactory.sol#L38-L60):
	External calls:
	- [DSponsorNFT(instance).initialize(params)](contracts/DSponsorNFTFactory.sol#L42)
	Event emitted after the call(s):
	- [NewDSponsorNFT(instance,params.initialOwner,params.name,params.symbol,params.baseURI,params.contractURI,params.minter,params.maxSupply,params.forwarder,params.royaltyBps,params.currencies,params.prices,params.allowedTokenIds)](contracts/DSponsorNFTFactory.sol#L44-L58)

contracts/DSponsorNFTFactory.sol#L38-L60


 - [ ] ID-57
Reentrancy in [ProtocolFee._payFee(address,address,uint256,address,IProtocolFee.ReferralRevenue)](contracts/lib/ProtocolFee.sol#L158-L175):
	External calls:
	- [_pay(from,feeRecipient,currency,feeAmount)](contracts/lib/ProtocolFee.sol#L165)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L137)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L141)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L143)
	External calls sending eth:
	- [_pay(from,feeRecipient,currency,feeAmount)](contracts/lib/ProtocolFee.sol#L165)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
	Event emitted after the call(s):
	- [CallWithProtocolFee(origin,currency,feeAmount,referral.enabler,referral.spender,referral.additionalInformation)](contracts/lib/ProtocolFee.sol#L167-L174)

contracts/lib/ProtocolFee.sol#L158-L175


 - [ ] ID-58
Reentrancy in [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)](contracts/DSponsorMarketplace.sol#L204-L291):
	External calls:
	- [transferListingTokens(address(this),targetListing.tokenOwner,targetListing.quantity,targetListing)](contracts/DSponsorMarketplace.sol#L263-L268)
		- [IERC1155(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,_quantity,)](contracts/DSponsorMarketplace.sol#L790-L796)
		- [IERC721(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,)](contracts/DSponsorMarketplace.sol#L798-L803)
	- [transferListingTokens(targetListing.tokenOwner,address(this),safeNewQuantity,targetListing)](contracts/DSponsorMarketplace.sol#L281-L286)
		- [IERC1155(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,_quantity,)](contracts/DSponsorMarketplace.sol#L790-L796)
		- [IERC721(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,)](contracts/DSponsorMarketplace.sol#L798-L803)
	Event emitted after the call(s):
	- [ListingUpdated(_listingId,targetListing.tokenOwner)](contracts/DSponsorMarketplace.sol#L290)

contracts/DSponsorMarketplace.sol#L204-L291


 - [ ] ID-59
Reentrancy in [ProtocolFee._externalCallWithProtocolFee(address,bytes,address,uint256,IProtocolFee.ReferralRevenue)](contracts/lib/ProtocolFee.sol#L68-L116):
	External calls:
	- [_swapNativeToERC20(currency,totalAmount,referral.spender)](contracts/lib/ProtocolFee.sol#L87)
		- [amountOut = swapRouter.exactOutputSingle{value: msg.value}(params)](contracts/lib/ProtocolFee.sol#L205)
		- [swapRouter.refundETH()](contracts/lib/ProtocolFee.sol#L208)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [Address.sendValue(address(recipientRefund),balanceAfterSwap - balanceBeforeSwap)](contracts/lib/ProtocolFee.sol#L211-L214)
	- [IERC20(currency).safeTransferFrom(_msgSender(),address(this),totalAmount)](contracts/lib/ProtocolFee.sol#L89-L93)
	- [IERC20(currency).forceApprove(address(target),baseAmount)](contracts/lib/ProtocolFee.sol#L97)
	- [_payFee(address(this),currency,feeAmount,target,referral)](contracts/lib/ProtocolFee.sol#L100)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L137)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L141)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L143)
	External calls sending eth:
	- [_swapNativeToERC20(currency,totalAmount,referral.spender)](contracts/lib/ProtocolFee.sol#L87)
		- [amountOut = swapRouter.exactOutputSingle{value: msg.value}(params)](contracts/lib/ProtocolFee.sol#L205)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
	- [_payFee(address(this),currency,feeAmount,target,referral)](contracts/lib/ProtocolFee.sol#L100)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
	Event emitted after the call(s):
	- [CallWithProtocolFee(origin,currency,feeAmount,referral.enabler,referral.spender,referral.additionalInformation)](contracts/lib/ProtocolFee.sol#L167-L174)
		- [_payFee(address(this),currency,feeAmount,target,referral)](contracts/lib/ProtocolFee.sol#L100)

contracts/lib/ProtocolFee.sol#L68-L116


 - [ ] ID-60
Reentrancy in [DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L133-L201):
	External calls:
	- [transferListingTokens(tokenOwner,address(this),tokenAmountToList,newListing)](contracts/DSponsorMarketplace.sol#L187-L192)
		- [IERC1155(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,_quantity,)](contracts/DSponsorMarketplace.sol#L790-L796)
		- [IERC721(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,)](contracts/DSponsorMarketplace.sol#L798-L803)
	Event emitted after the call(s):
	- [ListingAdded(listingId,_params.assetContract,tokenOwner,newListing)](contracts/DSponsorMarketplace.sol#L195-L200)

contracts/DSponsorMarketplace.sol#L133-L201


 - [ ] ID-61
Reentrancy in [DSponsorAdmin.createDSponsorNFTAndOffer(IDSponsorNFTBase.InitParams,IDSponsorAgreements.OfferInitParams)](contracts/DSponsorAdmin.sol#L56-L64):
	External calls:
	- [newDSponsorNFT = nftFactory.createDSponsorNFT(nftParams)](contracts/DSponsorAdmin.sol#L62)
	Event emitted after the call(s):
	- [UpdateOffer(offerId,disable,name,rulesURI,_sponsoringOffers[offerId].nftContract)](contracts/DSponsorAgreements.sol#L393-L399)
		- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L63)
	- [UpdateOfferAdParameter(offerId,adParameters[i],enable)](contracts/DSponsorAgreements.sol#L411)
		- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L63)
	- [UpdateOfferAdmin(offerId,admins[i],enable)](contracts/DSponsorAgreements.sol#L425)
		- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L63)
	- [UpdateOfferValidator(offerId,validators[i],enable)](contracts/DSponsorAgreements.sol#L436)
		- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L63)

contracts/DSponsorAdmin.sol#L56-L64


## timestamp
Impact: Low
Confidence: Medium
 - [ ] ID-62
[DSponsorMarketplace.validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L846-L872) uses timestamp for comparisons
	Dangerous comparisons:
	- [_tokenType == TokenType.ERC1155](contracts/DSponsorMarketplace.sol#L856)
	- [isValid = IERC1155(_assetContract).balanceOf(_tokenOwner,_tokenId) >= _quantity && IERC1155(_assetContract).isApprovedForAll(_tokenOwner,market)](contracts/DSponsorMarketplace.sol#L857-L860)
	- [_tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L861)
	- [isValid = IERC721(_assetContract).ownerOf(_tokenId) == _tokenOwner && (IERC721(_assetContract).getApproved(_tokenId) == market || IERC721(_assetContract).isApprovedForAll(_tokenOwner,market))](contracts/DSponsorMarketplace.sol#L862-L868)
	- [require(bool,string)(isValid,!BALNFT)](contracts/DSponsorMarketplace.sol#L871)

contracts/DSponsorMarketplace.sol#L846-L872


 - [ ] ID-63
[ERC4907Upgradeable.userOf(uint256)](contracts/lib/ERC4907Upgradeable.sol#L50-L58) uses timestamp for comparisons
	Dangerous comparisons:
	- [_users[tokenId].expires >= block.timestamp](contracts/lib/ERC4907Upgradeable.sol#L53)

contracts/lib/ERC4907Upgradeable.sol#L50-L58


 - [ ] ID-64
[DSponsorMarketplace.handleBid(IDSponsorMarketplace.Listing,IDSponsorMarketplace.Offer)](contracts/DSponsorMarketplace.sol#L559-L625) uses timestamp for comparisons
	Dangerous comparisons:
	- [_targetListing.buyoutPricePerToken > 0 && incomingOfferAmount >= _targetListing.buyoutPricePerToken * _targetListing.quantity](contracts/DSponsorMarketplace.sol#L571-L573)
	- [require(bool,string)(isNewWinningBid(_targetListing.reservePricePerToken * _targetListing.quantity,currentOfferAmount,incomingOfferAmount),not winning bid.)](contracts/DSponsorMarketplace.sol#L581-L589)
	- [_targetListing.endTime - block.timestamp <= timeBuffer](contracts/DSponsorMarketplace.sol#L594)

contracts/DSponsorMarketplace.sol#L559-L625


 - [ ] ID-65
[DSponsorMarketplace.acceptOffer(uint256,address,address,uint256)](contracts/DSponsorMarketplace.sol#L393-L432) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(targetOffer.expirationTimestamp > block.timestamp,EXPIRED)](contracts/DSponsorMarketplace.sol#L413)

contracts/DSponsorMarketplace.sol#L393-L432


 - [ ] ID-66
[DSponsorMarketplace.closeAuction(uint256,address)](contracts/DSponsorMarketplace.sol#L648-L683) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(targetListing.listingType == ListingType.Auction,not an auction.)](contracts/DSponsorMarketplace.sol#L654-L657)
	- [toCancel = targetListing.startTime > block.timestamp || targetBid.offeror == address(0)](contracts/DSponsorMarketplace.sol#L662-L663)
	- [require(bool,string)(targetListing.endTime < block.timestamp,cannot close auction before it has ended.)](contracts/DSponsorMarketplace.sol#L669-L672)
	- [_closeFor == targetListing.tokenOwner](contracts/DSponsorMarketplace.sol#L675)

contracts/DSponsorMarketplace.sol#L648-L683


 - [ ] ID-67
[DSponsorMarketplace.transferListingTokens(address,address,uint256,IDSponsorMarketplace.Listing)](contracts/DSponsorMarketplace.sol#L783-L805) uses timestamp for comparisons
	Dangerous comparisons:
	- [_listing.tokenType == TokenType.ERC1155](contracts/DSponsorMarketplace.sol#L789)
	- [_listing.tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L797)

contracts/DSponsorMarketplace.sol#L783-L805


 - [ ] ID-68
[DSponsorMarketplace.offer(uint256,uint256,address,uint256,uint256,string)](contracts/DSponsorMarketplace.sol#L482-L533) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(targetListing.endTime > block.timestamp && targetListing.startTime < block.timestamp,inactive listing.)](contracts/DSponsorMarketplace.sol#L492-L496)
	- [targetListing.listingType == ListingType.Auction](contracts/DSponsorMarketplace.sol#L509)
	- [require(bool,string)(newOffer.currency == targetListing.currency,must use approved currency to bid)](contracts/DSponsorMarketplace.sol#L511-L514)
	- [targetListing.listingType == ListingType.Direct](contracts/DSponsorMarketplace.sol#L524)

contracts/DSponsorMarketplace.sol#L482-L533


 - [ ] ID-69
[DSponsorMarketplace.validateDirectListingSale(IDSponsorMarketplace.Listing,uint256)](contracts/DSponsorMarketplace.sol#L875-L907) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(_listing.listingType == ListingType.Direct,cannot buy from listing.)](contracts/DSponsorMarketplace.sol#L879-L882)
	- [require(bool,string)(_listing.quantity > 0 && _quantityToBuy > 0 && _quantityToBuy <= _listing.quantity,invalid amount of tokens.)](contracts/DSponsorMarketplace.sol#L885-L890)
	- [require(bool,string)(block.timestamp < _listing.endTime && block.timestamp > _listing.startTime,not within sale window.)](contracts/DSponsorMarketplace.sol#L893-L897)

contracts/DSponsorMarketplace.sol#L875-L907


 - [ ] ID-70
[DSponsorMarketplace.isNewWinningBid(uint256,uint256,uint256)](contracts/DSponsorMarketplace.sol#L628-L641) uses timestamp for comparisons
	Dangerous comparisons:
	- [isValidNewBid = _incomingBidAmount >= _reserveAmount](contracts/DSponsorMarketplace.sol#L634)

contracts/DSponsorMarketplace.sol#L628-L641


 - [ ] ID-71
[DSponsorMarketplace.getSafeQuantity(IDSponsorMarketplace.TokenType,uint256)](contracts/DSponsorMarketplace.sol#L914-L925) uses timestamp for comparisons
	Dangerous comparisons:
	- [_quantityToCheck == 0](contracts/DSponsorMarketplace.sol#L918)
	- [_tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L921-L923)

contracts/DSponsorMarketplace.sol#L914-L925


 - [ ] ID-72
[ERC2771Forwarder._validate(ERC2771Forwarder.ForwardRequestData)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L199-L210) uses timestamp for comparisons
	Dangerous comparisons:
	- [(_isTrustedByTarget(request.to),request.deadline >= block.timestamp,isValid && recovered == request.from,recovered)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L204-L209)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L199-L210


 - [ ] ID-73
[DSponsorMarketplace._cancelAuction(IDSponsorMarketplace.Listing)](contracts/DSponsorMarketplace.sol#L686-L708) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(listings[_targetListing.listingId].tokenOwner == _msgSender(),caller is not the listing creator.)](contracts/DSponsorMarketplace.sol#L687-L690)

contracts/DSponsorMarketplace.sol#L686-L708


 - [ ] ID-74
[ERC2771Forwarder._execute(ERC2771Forwarder.ForwardRequestData,bool)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L254-L297) uses timestamp for comparisons
	Dangerous comparisons:
	- [isTrustedForwarder && signerMatch && active](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L277)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L254-L297


 - [ ] ID-75
[DSponsorMarketplace.handleOffer(IDSponsorMarketplace.Listing,IDSponsorMarketplace.Offer)](contracts/DSponsorMarketplace.sol#L536-L556) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(_newOffer.quantityWanted <= _targetListing.quantity && _targetListing.quantity > 0,insufficient tokens in listing.)](contracts/DSponsorMarketplace.sol#L540-L544)

contracts/DSponsorMarketplace.sol#L536-L556


 - [ ] ID-76
[DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L133-L201) uses timestamp for comparisons
	Dangerous comparisons:
	- [startTime < block.timestamp](contracts/DSponsorMarketplace.sol#L148)
	- [require(bool,string)(block.timestamp - startTime < 3600,ST)](contracts/DSponsorMarketplace.sol#L150)
	- [newListing.listingType == ListingType.Auction](contracts/DSponsorMarketplace.sol#L180)
	- [require(bool,string)(newListing.buyoutPricePerToken == 0 || newListing.buyoutPricePerToken >= newListing.reservePricePerToken,RESERVE)](contracts/DSponsorMarketplace.sol#L181-L186)

contracts/DSponsorMarketplace.sol#L133-L201


 - [ ] ID-77
[DSponsorMarketplace._buy(uint256,address,uint256,address,uint256,string)](contracts/DSponsorMarketplace.sol#L353-L390) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(_currency == targetListing.currency && _totalPrice == (targetListing.buyoutPricePerToken * _quantityToBuy),!PRICE)](contracts/DSponsorMarketplace.sol#L365-L370)

contracts/DSponsorMarketplace.sol#L353-L390


 - [ ] ID-78
[ERC2771Forwarder.verify(ERC2771Forwarder.ForwardRequestData)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L111-L114) uses timestamp for comparisons
	Dangerous comparisons:
	- [isTrustedForwarder && active && signerMatch](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L113)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L111-L114


 - [ ] ID-79
[DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)](contracts/DSponsorMarketplace.sol#L204-L291) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(block.timestamp < targetListing.startTime,STARTED)](contracts/DSponsorMarketplace.sol#L224)
	- [_startTime < block.timestamp](contracts/DSponsorMarketplace.sol#L232)
	- [require(bool,string)(block.timestamp - _startTime < 3600,ST)](contracts/DSponsorMarketplace.sol#L234)
	- [_startTime == 0](contracts/DSponsorMarketplace.sol#L238-L240)

contracts/DSponsorMarketplace.sol#L204-L291


## assembly
Impact: Informational
Confidence: High
 - [ ] ID-80
[Initializable._getInitializableStorage()](node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L223-L227) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L224-L226)

node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L223-L227


 - [ ] ID-81
[StorageSlot.getUint256Slot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L89-L94) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L91-L93)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L89-L94


 - [ ] ID-82
[MessageHashUtils.toEthSignedMessageHash(bytes32)](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L30-L37) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L32-L36)

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L30-L37


 - [ ] ID-83
[StorageSlot.getAddressSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L59-L64) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L61-L63)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L59-L64


 - [ ] ID-84
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L130-L133)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L154-L161)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L167-L176)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-85
[MessageHashUtils.toTypedDataHash(bytes32,bytes32)](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L76-L85) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L78-L84)

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L76-L85


 - [ ] ID-86
[ERC2771Forwarder._execute(ERC2771Forwarder.ForwardRequestData,bool)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L254-L297) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L288-L291)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L254-L297


 - [ ] ID-87
[ERC2771Forwarder._isTrustedByTarget(address)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L305-L324) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L312-L321)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L305-L324


 - [ ] ID-88
[ReentrancyGuardUpgradeable._getReentrancyGuardStorage()](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L46-L50) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L47-L49)

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L46-L50


 - [ ] ID-89
[Strings.toString(uint256)](node_modules/@openzeppelin/contracts/utils/Strings.sol#L24-L44) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L30-L32)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L36-L38)

node_modules/@openzeppelin/contracts/utils/Strings.sol#L24-L44


 - [ ] ID-90
[StorageSlot.getBooleanSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L69-L74) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L71-L73)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L69-L74


 - [ ] ID-91
[ERC721Upgradeable._checkOnERC721Received(address,address,uint256,bytes)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L494-L511) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L505-L507)

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L494-L511


 - [ ] ID-92
[ERC721Upgradeable._getERC721Storage()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L44-L48) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L45-L47)

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L44-L48


 - [ ] ID-93
[Clones.clone(address)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L28-L41) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L30-L37)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L28-L41


 - [ ] ID-94
[StorageSlot.getBytesSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L119-L124) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L121-L123)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L119-L124


 - [ ] ID-95
[StorageSlot.getStringSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L99-L104) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L101-L103)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L99-L104


 - [ ] ID-96
[ERC2771Forwarder._checkForwardedGas(uint256,ERC2771Forwarder.ForwardRequestData)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L338-L369) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L365-L367)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L338-L369


 - [ ] ID-97
[OwnableUpgradeable._getOwnableStorage()](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L30-L34) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L31-L33)

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L30-L34


 - [ ] ID-98
[Clones.predictDeterministicAddress(address,bytes32,address)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L68-L84) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L74-L83)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L68-L84


 - [ ] ID-99
[Address._revert(bytes)](node_modules/@openzeppelin/contracts/utils/Address.sol#L146-L158) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Address.sol#L151-L154)

node_modules/@openzeppelin/contracts/utils/Address.sol#L146-L158


 - [ ] ID-100
[ERC2981Upgradeable._getERC2981Storage()](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L39-L43) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L40-L42)

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L39-L43


 - [ ] ID-101
[StorageSlot.getBytesSlot(bytes)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L129-L134) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L131-L133)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L129-L134


 - [ ] ID-102
[StorageSlot.getStringSlot(string)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L109-L114) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L111-L113)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L109-L114


 - [ ] ID-103
[ShortStrings.toString(ShortString)](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L63-L73) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L68-L71)

node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L63-L73


 - [ ] ID-104
[StorageSlot.getBytes32Slot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L79-L84) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L81-L83)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L79-L84


 - [ ] ID-105
[Clones.cloneDeterministic(address,bytes32)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L50-L63) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L52-L59)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L50-L63


 - [ ] ID-106
[ERC721._checkOnERC721Received(address,address,uint256,bytes)](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L465-L482) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L476-L478)

node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L465-L482


 - [ ] ID-107
[ECDSA.tryRecover(bytes32,bytes)](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L56-L73) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L64-L68)

node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L56-L73


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-108
Different versions of Solidity are used:
	- Version used: ['>=0.5.0', '>=0.7.5', '^0.8.0', '^0.8.11', '^0.8.20']
	- [>=0.5.0](node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L2)
	- [>=0.7.5](node_modules/@uniswap/v3-periphery/contracts/interfaces/IPeripheryPayments.sol#L2)
	- [>=0.7.5](node_modules/@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol#L2)
	- [^0.8.0](contracts/lib/Tokens.sol#L2)
	- [^0.8.11](contracts/interfaces/IDSponsorMarketplace.sol#L2)
	- [^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/access/Ownable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC2981.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC5267.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol#L3)
	- [^0.8.20](node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/Address.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/Context.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/Nonces.sol#L3)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L5)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/Strings.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/math/SignedMath.sol#L4)
	- [^0.8.20](contracts/DSponsorAdmin.sol#L2)
	- [^0.8.20](contracts/DSponsorAgreements.sol#L2)
	- [^0.8.20](contracts/DSponsorMarketplace.sol#L2)
	- [^0.8.20](contracts/DSponsorNFT.sol#L2)
	- [^0.8.20](contracts/DSponsorNFTFactory.sol#L2)
	- [^0.8.20](contracts/interfaces/IDSponsorAgreements.sol#L2)
	- [^0.8.20](contracts/interfaces/IDSponsorNFT.sol#L2)
	- [^0.8.20](contracts/interfaces/IDSponsorNFTFactory.sol#L2)
	- [^0.8.20](contracts/interfaces/IERC4907.sol#L3)
	- [^0.8.20](contracts/interfaces/IProtocolFee.sol#L2)
	- [^0.8.20](contracts/lib/ERC2771ContextOwnable.sol#L2)
	- [^0.8.20](contracts/lib/ERC2771ContextUpgradeable.sol#L2)
	- [^0.8.20](contracts/lib/ERC4907Upgradeable.sol#L2)
	- [^0.8.20](contracts/lib/ProtocolFee.sol#L2)
	- [^0.8.20](contracts/lib/Reentrant.sol#L2)
	- [^0.8.20](contracts/mocks/ERC20Mock.sol#L2)
	- [^0.8.20](contracts/mocks/ERC2771ForwarderMock.sol#L2)
	- [^0.8.20](contracts/mocks/ERC721Mock.sol#L2)
	- [^0.8.20](contracts/mocks/ReentrantDSponsorAdmin.sol#L2)
	- [^0.8.20](contracts/mocks/ReentrantDSponsorNFT.sol#L2)
	- [^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC721.sol#L4)
	- [v2](node_modules/@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol#L3)

node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L2


## costly-loop
Impact: Informational
Confidence: Medium
 - [ ] ID-109
[DSponsorAgreements._submitAdProposal(uint256,uint256,string,string)](contracts/DSponsorAgreements.sol#L355-L382) has costly operations inside a loop:
	- [_proposalCounterId ++](contracts/DSponsorAgreements.sol#L369)

contracts/DSponsorAgreements.sol#L355-L382


 - [ ] ID-110
[DSponsorNFT._setDefaultMintPrice(address,bool,uint256)](contracts/DSponsorNFT.sol#L558-L573) has costly operations inside a loop:
	- [_defaultMintNativePrice = MintPriceSettings(enabled,amount)](contracts/DSponsorNFT.sol#L569)

contracts/DSponsorNFT.sol#L558-L573


## dead-code
Impact: Informational
Confidence: Medium
 - [ ] ID-111
[DSponsorMarketplace._msgData()](contracts/DSponsorMarketplace.sol#L960-L968) is never used and should be removed

contracts/DSponsorMarketplace.sol#L960-L968


 - [ ] ID-112
[DSponsorNFT._msgData()](contracts/DSponsorNFT.sol#L483-L491) is never used and should be removed

contracts/DSponsorNFT.sol#L483-L491


 - [ ] ID-113
[ERC2771ContextUpgradeable._msgData()](contracts/lib/ERC2771ContextUpgradeable.sol#L85-L102) is never used and should be removed

contracts/lib/ERC2771ContextUpgradeable.sol#L85-L102


 - [ ] ID-114
[ReentrantDSponsorAdmin._completeAttack()](contracts/mocks/ReentrantDSponsorAdmin.sol#L62) is never used and should be removed

contracts/mocks/ReentrantDSponsorAdmin.sol#L62


 - [ ] ID-115
[ReentrantDSponsorNFT._completeAttack()](contracts/mocks/ReentrantDSponsorNFT.sol#L23) is never used and should be removed

contracts/mocks/ReentrantDSponsorNFT.sol#L23


 - [ ] ID-116
[ERC2771ContextUpgradeable.__ERC2771Context_init(address,address)](contracts/lib/ERC2771ContextUpgradeable.sol#L20-L27) is never used and should be removed

contracts/lib/ERC2771ContextUpgradeable.sol#L20-L27


 - [ ] ID-117
[DSponsorAdmin._msgData()](contracts/DSponsorAdmin.sol#L151-L159) is never used and should be removed

contracts/DSponsorAdmin.sol#L151-L159


 - [ ] ID-118
[ERC2771ContextOwnable._msgData()](contracts/lib/ERC2771ContextOwnable.sol#L70-L87) is never used and should be removed

contracts/lib/ERC2771ContextOwnable.sol#L70-L87


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-119
Pragma version[^0.8.20](contracts/lib/Reentrant.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/Reentrant.sol#L2


 - [ ] ID-120
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L4


 - [ ] ID-121
Pragma version[^0.8.20](contracts/interfaces/IDSponsorAgreements.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IDSponsorAgreements.sol#L2


 - [ ] ID-122
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC2981.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/interfaces/IERC2981.sol#L4


 - [ ] ID-123
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4


 - [ ] ID-124
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155.sol#L4


 - [ ] ID-125
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol#L4


 - [ ] ID-126
Pragma version[^0.8.11](contracts/interfaces/IDSponsorMarketplace.sol#L2) allows old versions

contracts/interfaces/IDSponsorMarketplace.sol#L2


 - [ ] ID-127
Pragma version[>=0.7.5](node_modules/@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol#L2) allows old versions

node_modules/@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol#L2


 - [ ] ID-128
Pragma version[^0.8.20](contracts/interfaces/IDSponsorNFTFactory.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IDSponsorNFTFactory.sol#L2


 - [ ] ID-129
Pragma version[^0.8.20](contracts/DSponsorAdmin.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorAdmin.sol#L2


 - [ ] ID-130
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol#L3


 - [ ] ID-131
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L4


 - [ ] ID-132
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L4


 - [ ] ID-133
Pragma version[^0.8.20](contracts/mocks/ERC20Mock.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ERC20Mock.sol#L2


 - [ ] ID-134
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L4


 - [ ] ID-135
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/Strings.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/Strings.sol#L4


 - [ ] ID-136
Pragma version[^0.8.20](contracts/interfaces/IProtocolFee.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IProtocolFee.sol#L2


 - [ ] ID-137
Pragma version[^0.8.20](contracts/DSponsorNFT.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorNFT.sol#L2


 - [ ] ID-138
Pragma version[^0.8.0](contracts/lib/Tokens.sol#L2) allows old versions

contracts/lib/Tokens.sol#L2


 - [ ] ID-139
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L4


 - [ ] ID-140
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/Address.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/Address.sol#L4


 - [ ] ID-141
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/access/Ownable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/access/Ownable.sol#L4


 - [ ] ID-142
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC721.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/interfaces/IERC721.sol#L4


 - [ ] ID-143
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol#L4


 - [ ] ID-144
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L4


 - [ ] ID-145
solc-0.8.20 is not recommended for deployment

 - [ ] ID-146
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L4


 - [ ] ID-147
Pragma version[^0.8.20](contracts/interfaces/IDSponsorNFT.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IDSponsorNFT.sol#L2


 - [ ] ID-148
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/Nonces.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/Nonces.sol#L3


 - [ ] ID-149
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L5) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L5


 - [ ] ID-150
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L4


 - [ ] ID-151
Pragma version[^0.8.20](contracts/lib/ERC4907Upgradeable.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/ERC4907Upgradeable.sol#L2


 - [ ] ID-152
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L4


 - [ ] ID-153
Pragma version[^0.8.20](contracts/DSponsorNFTFactory.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorNFTFactory.sol#L2


 - [ ] ID-154
Pragma version[^0.8.20](contracts/mocks/ERC721Mock.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ERC721Mock.sol#L2


 - [ ] ID-155
Pragma version[^0.8.20](contracts/mocks/ERC2771ForwarderMock.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ERC2771ForwarderMock.sol#L2


 - [ ] ID-156
Pragma version[^0.8.20](contracts/DSponsorAgreements.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorAgreements.sol#L2


 - [ ] ID-157
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L4


 - [ ] ID-158
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L4


 - [ ] ID-159
Pragma version[>=0.7.5](node_modules/@uniswap/v3-periphery/contracts/interfaces/IPeripheryPayments.sol#L2) allows old versions

node_modules/@uniswap/v3-periphery/contracts/interfaces/IPeripheryPayments.sol#L2


 - [ ] ID-160
Pragma version[^0.8.20](contracts/DSponsorMarketplace.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorMarketplace.sol#L2


 - [ ] ID-161
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L4


 - [ ] ID-162
Pragma version[^0.8.20](contracts/mocks/ReentrantDSponsorAdmin.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ReentrantDSponsorAdmin.sol#L2


 - [ ] ID-163
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L4


 - [ ] ID-164
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol#L4


 - [ ] ID-165
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol#L4


 - [ ] ID-166
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4


 - [ ] ID-167
Pragma version[^0.8.20](contracts/lib/ERC2771ContextUpgradeable.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/ERC2771ContextUpgradeable.sol#L2


 - [ ] ID-168
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/math/SignedMath.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/math/SignedMath.sol#L4


 - [ ] ID-169
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/Context.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/Context.sol#L4


 - [ ] ID-170
Pragma version[^0.8.20](contracts/mocks/ReentrantDSponsorNFT.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ReentrantDSponsorNFT.sol#L2


 - [ ] ID-171
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L4


 - [ ] ID-172
Pragma version[>=0.5.0](node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L2) allows old versions

node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L2


 - [ ] ID-173
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L4


 - [ ] ID-174
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L4


 - [ ] ID-175
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L4


 - [ ] ID-176
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L4


 - [ ] ID-177
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC5267.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/interfaces/IERC5267.sol#L4


 - [ ] ID-178
Pragma version[^0.8.20](contracts/lib/ProtocolFee.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/ProtocolFee.sol#L2


 - [ ] ID-179
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#L4


 - [ ] ID-180
Pragma version[^0.8.20](contracts/lib/ERC2771ContextOwnable.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/ERC2771ContextOwnable.sol#L2


 - [ ] ID-181
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L4


 - [ ] ID-182
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L4


 - [ ] ID-183
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L4


 - [ ] ID-184
Pragma version[^0.8.20](contracts/interfaces/IERC4907.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IERC4907.sol#L3


 - [ ] ID-185
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L4


## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-186
Low level call in [SafeERC20._callOptionalReturnBool(IERC20,bytes)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L110-L117):
	- [(success,returndata) = address(token).call(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L115)

node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L110-L117


 - [ ] ID-187
Low level call in [Address.functionStaticCall(address,bytes)](node_modules/@openzeppelin/contracts/utils/Address.sol#L95-L98):
	- [(success,returndata) = target.staticcall(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L96)

node_modules/@openzeppelin/contracts/utils/Address.sol#L95-L98


 - [ ] ID-188
Low level call in [Address.functionDelegateCall(address,bytes)](node_modules/@openzeppelin/contracts/utils/Address.sol#L104-L107):
	- [(success,returndata) = target.delegatecall(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L105)

node_modules/@openzeppelin/contracts/utils/Address.sol#L104-L107


 - [ ] ID-189
Low level call in [Address.functionCallWithValue(address,bytes,uint256)](node_modules/@openzeppelin/contracts/utils/Address.sol#L83-L89):
	- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)

node_modules/@openzeppelin/contracts/utils/Address.sol#L83-L89


 - [ ] ID-190
Low level call in [Address.sendValue(address,uint256)](node_modules/@openzeppelin/contracts/utils/Address.sol#L41-L50):
	- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)

node_modules/@openzeppelin/contracts/utils/Address.sol#L41-L50


## missing-inheritance
Impact: Informational
Confidence: High
 - [ ] ID-191
[DSponsorNFT](contracts/DSponsorNFT.sol#L21-L605) should inherit from [IDSponsorNFT](contracts/interfaces/IDSponsorNFT.sol#L160)

contracts/DSponsorNFT.sol#L21-L605


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-192
Parameter [DSponsorMarketplace.transferListingTokens(address,address,uint256,IDSponsorMarketplace.Listing)._quantity](contracts/DSponsorMarketplace.sol#L786) is not in mixedCase

contracts/DSponsorMarketplace.sol#L786


 - [ ] ID-193
Function [IDSponsorNFTBase.MAX_SUPPLY()](contracts/interfaces/IDSponsorNFT.sol#L100) is not in mixedCase

contracts/interfaces/IDSponsorNFT.sol#L100


 - [ ] ID-194
Parameter [DSponsorMarketplace.validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)._quantity](contracts/DSponsorMarketplace.sol#L850) is not in mixedCase

contracts/DSponsorMarketplace.sol#L850


 - [ ] ID-195
Parameter [DSponsorMarketplace.executeSale(IDSponsorMarketplace.Listing,address,address,address,uint256,uint256,IProtocolFee.ReferralRevenue)._receiver](contracts/DSponsorMarketplace.sol#L438) is not in mixedCase

contracts/DSponsorMarketplace.sol#L438


 - [ ] ID-196
Parameter [DSponsorMarketplace.getTokenType(address)._assetContract](contracts/DSponsorMarketplace.sol#L929) is not in mixedCase

contracts/DSponsorMarketplace.sol#L929


 - [ ] ID-197
Parameter [DSponsorMarketplace.validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)._assetContract](contracts/DSponsorMarketplace.sol#L848) is not in mixedCase

contracts/DSponsorMarketplace.sol#L848


 - [ ] ID-198
Parameter [DSponsorMarketplace.executeSale(IDSponsorMarketplace.Listing,address,address,address,uint256,uint256,IProtocolFee.ReferralRevenue)._targetListing](contracts/DSponsorMarketplace.sol#L436) is not in mixedCase

contracts/DSponsorMarketplace.sol#L436


 - [ ] ID-199
Parameter [DSponsorMarketplace.payout(address,address,address,uint256,IDSponsorMarketplace.Listing,IProtocolFee.ReferralRevenue)._totalPayoutAmount](contracts/DSponsorMarketplace.sol#L812) is not in mixedCase

contracts/DSponsorMarketplace.sol#L812


 - [ ] ID-200
Parameter [DSponsorMarketplace.cancelDirectListing(uint256)._listingId](contracts/DSponsorMarketplace.sol#L295) is not in mixedCase

contracts/DSponsorMarketplace.sol#L295


 - [ ] ID-201
Constant [OwnableUpgradeable.OwnableStorageLocation](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L28) is not in UPPER_CASE_WITH_UNDERSCORES

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L28


 - [ ] ID-202
Parameter [DSponsorMarketplace.executeSale(IDSponsorMarketplace.Listing,address,address,address,uint256,uint256,IProtocolFee.ReferralRevenue)._payer](contracts/DSponsorMarketplace.sol#L437) is not in mixedCase

contracts/DSponsorMarketplace.sol#L437


 - [ ] ID-203
Function [ERC2771ContextUpgradeable.__ERC2771Context_init(address,address)](contracts/lib/ERC2771ContextUpgradeable.sol#L20-L27) is not in mixedCase

contracts/lib/ERC2771ContextUpgradeable.sol#L20-L27


 - [ ] ID-204
Function [UniV3SwapRouter.WETH9()](contracts/lib/ProtocolFee.sol#L13) is not in mixedCase

contracts/lib/ProtocolFee.sol#L13


 - [ ] ID-205
Parameter [DSponsorMarketplace.isNewWinningBid(uint256,uint256,uint256)._incomingBidAmount](contracts/DSponsorMarketplace.sol#L631) is not in mixedCase

contracts/DSponsorMarketplace.sol#L631


 - [ ] ID-206
Parameter [DSponsorMarketplace.transferListingTokens(address,address,uint256,IDSponsorMarketplace.Listing)._from](contracts/DSponsorMarketplace.sol#L784) is not in mixedCase

contracts/DSponsorMarketplace.sol#L784


 - [ ] ID-207
Parameter [DSponsorMarketplace.executeSale(IDSponsorMarketplace.Listing,address,address,address,uint256,uint256,IProtocolFee.ReferralRevenue)._listingTokenAmountToTransfer](contracts/DSponsorMarketplace.sol#L441) is not in mixedCase

contracts/DSponsorMarketplace.sol#L441


 - [ ] ID-208
Function [ReentrancyGuardUpgradeable.__ReentrancyGuard_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L61-L64) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L61-L64


 - [ ] ID-209
Parameter [DSponsorMarketplace.transferListingTokens(address,address,uint256,IDSponsorMarketplace.Listing)._listing](contracts/DSponsorMarketplace.sol#L787) is not in mixedCase

contracts/DSponsorMarketplace.sol#L787


 - [ ] ID-210
Parameter [DSponsorMarketplace.closeAuction(uint256,address)._listingId](contracts/DSponsorMarketplace.sol#L649) is not in mixedCase

contracts/DSponsorMarketplace.sol#L649


 - [ ] ID-211
Parameter [DSponsorMarketplace.isNewWinningBid(uint256,uint256,uint256)._reserveAmount](contracts/DSponsorMarketplace.sol#L629) is not in mixedCase

contracts/DSponsorMarketplace.sol#L629


 - [ ] ID-212
Parameter [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)._startTime](contracts/DSponsorMarketplace.sol#L210) is not in mixedCase

contracts/DSponsorMarketplace.sol#L210


 - [ ] ID-213
Function [EIP712._EIP712Version()](node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L157-L159) is not in mixedCase

node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L157-L159


 - [ ] ID-214
Parameter [DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)._params](contracts/DSponsorMarketplace.sol#L133) is not in mixedCase

contracts/DSponsorMarketplace.sol#L133


 - [ ] ID-215
Function [OwnableUpgradeable.__Ownable_init(address)](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L51-L53) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L51-L53


 - [ ] ID-216
Function [ERC4907Upgradeable.__ERC4907_init_unchained()](contracts/lib/ERC4907Upgradeable.sol#L28) is not in mixedCase

contracts/lib/ERC4907Upgradeable.sol#L28


 - [ ] ID-217
Parameter [DSponsorMarketplace.getSafeQuantity(IDSponsorMarketplace.TokenType,uint256)._tokenType](contracts/DSponsorMarketplace.sol#L915) is not in mixedCase

contracts/DSponsorMarketplace.sol#L915


 - [ ] ID-218
Function [ERC2981Upgradeable.__ERC2981_init()](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L65-L66) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L65-L66


 - [ ] ID-219
Parameter [DSponsorAdmin.updateProtocolFee(address,uint96)._recipient](contracts/DSponsorAdmin.sol#L135) is not in mixedCase

contracts/DSponsorAdmin.sol#L135


 - [ ] ID-220
Function [ERC721Upgradeable.__ERC721_init_unchained(string,string)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L57-L61) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L57-L61


 - [ ] ID-221
Parameter [DSponsorMarketplace.offer(uint256,uint256,address,uint256,uint256,string)._expirationTimestamp](contracts/DSponsorMarketplace.sol#L487) is not in mixedCase

contracts/DSponsorMarketplace.sol#L487


 - [ ] ID-222
Parameter [DSponsorMarketplace.executeSale(IDSponsorMarketplace.Listing,address,address,address,uint256,uint256,IProtocolFee.ReferralRevenue)._currency](contracts/DSponsorMarketplace.sol#L439) is not in mixedCase

contracts/DSponsorMarketplace.sol#L439


 - [ ] ID-223
Parameter [DSponsorMarketplace.isNewWinningBid(uint256,uint256,uint256)._currentWinningBidAmount](contracts/DSponsorMarketplace.sol#L630) is not in mixedCase

contracts/DSponsorMarketplace.sol#L630


 - [ ] ID-224
Parameter [DSponsorMarketplace.validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)._tokenId](contracts/DSponsorMarketplace.sol#L849) is not in mixedCase

contracts/DSponsorMarketplace.sol#L849


 - [ ] ID-225
Parameter [DSponsorMarketplace.acceptOffer(uint256,address,address,uint256)._currency](contracts/DSponsorMarketplace.sol#L396) is not in mixedCase

contracts/DSponsorMarketplace.sol#L396


 - [ ] ID-226
Parameter [DSponsorNFT.setBaseURI(string)._baseURI](contracts/DSponsorNFT.sol#L244) is not in mixedCase

contracts/DSponsorNFT.sol#L244


 - [ ] ID-227
Parameter [DSponsorMarketplace.payout(address,address,address,uint256,IDSponsorMarketplace.Listing,IProtocolFee.ReferralRevenue)._payee](contracts/DSponsorMarketplace.sol#L810) is not in mixedCase

contracts/DSponsorMarketplace.sol#L810


 - [ ] ID-228
Function [OwnableUpgradeable.__Ownable_init_unchained(address)](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L55-L60) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L55-L60


 - [ ] ID-229
Parameter [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)._buyoutPricePerToken](contracts/DSponsorMarketplace.sol#L208) is not in mixedCase

contracts/DSponsorMarketplace.sol#L208


 - [ ] ID-230
Parameter [DSponsorMarketplace.acceptOffer(uint256,address,address,uint256)._offeror](contracts/DSponsorMarketplace.sol#L395) is not in mixedCase

contracts/DSponsorMarketplace.sol#L395


 - [ ] ID-231
Parameter [DSponsorMarketplace.validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)._tokenType](contracts/DSponsorMarketplace.sol#L851) is not in mixedCase

contracts/DSponsorMarketplace.sol#L851


 - [ ] ID-232
Parameter [DSponsorMarketplace.offer(uint256,uint256,address,uint256,uint256,string)._pricePerToken](contracts/DSponsorMarketplace.sol#L486) is not in mixedCase

contracts/DSponsorMarketplace.sol#L486


 - [ ] ID-233
Parameter [DSponsorMarketplace.closeAuction(uint256,address)._closeFor](contracts/DSponsorMarketplace.sol#L650) is not in mixedCase

contracts/DSponsorMarketplace.sol#L650


 - [ ] ID-234
Function [ERC721RoyaltyUpgradeable.__ERC721Royalty_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L25-L26) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L25-L26


 - [ ] ID-235
Parameter [DSponsorMarketplace.validateDirectListingSale(IDSponsorMarketplace.Listing,uint256)._quantityToBuy](contracts/DSponsorMarketplace.sol#L877) is not in mixedCase

contracts/DSponsorMarketplace.sol#L877


 - [ ] ID-236
Function [ReentrancyGuardUpgradeable.__ReentrancyGuard_init()](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L57-L59) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L57-L59


 - [ ] ID-237
Function [ERC165Upgradeable.__ERC165_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L25-L26) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L25-L26


 - [ ] ID-238
Function [ContextUpgradeable.__Context_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L21-L22) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L21-L22


 - [ ] ID-239
Parameter [DSponsorMarketplace.payout(address,address,address,uint256,IDSponsorMarketplace.Listing,IProtocolFee.ReferralRevenue)._currencyToUse](contracts/DSponsorMarketplace.sol#L811) is not in mixedCase

contracts/DSponsorMarketplace.sol#L811


 - [ ] ID-240
Parameter [DSponsorMarketplace.handleBid(IDSponsorMarketplace.Listing,IDSponsorMarketplace.Offer)._incomingBid](contracts/DSponsorMarketplace.sol#L561) is not in mixedCase

contracts/DSponsorMarketplace.sol#L561


 - [ ] ID-241
Parameter [DSponsorMarketplace.executeSale(IDSponsorMarketplace.Listing,address,address,address,uint256,uint256,IProtocolFee.ReferralRevenue)._currencyAmountToTransfer](contracts/DSponsorMarketplace.sol#L440) is not in mixedCase

contracts/DSponsorMarketplace.sol#L440


 - [ ] ID-242
Parameter [DSponsorMarketplace.payout(address,address,address,uint256,IDSponsorMarketplace.Listing,IProtocolFee.ReferralRevenue)._payer](contracts/DSponsorMarketplace.sol#L809) is not in mixedCase

contracts/DSponsorMarketplace.sol#L809


 - [ ] ID-243
Function [IERC20Permit.DOMAIN_SEPARATOR()](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L89) is not in mixedCase

node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L89


 - [ ] ID-244
Parameter [DSponsorNFT.setTokenURIs(uint256[],string[])._tokenURIs](contracts/DSponsorNFT.sol#L357) is not in mixedCase

contracts/DSponsorNFT.sol#L357


 - [ ] ID-245
Parameter [DSponsorMarketplace.offer(uint256,uint256,address,uint256,uint256,string)._quantityWanted](contracts/DSponsorMarketplace.sol#L484) is not in mixedCase

contracts/DSponsorMarketplace.sol#L484


 - [ ] ID-246
Parameter [IDSponsorNFTBase.setBaseURI(string).URI](contracts/interfaces/IDSponsorNFT.sol#L115) is not in mixedCase

contracts/interfaces/IDSponsorNFT.sol#L115


 - [ ] ID-247
Parameter [DSponsorMarketplace.handleOffer(IDSponsorMarketplace.Listing,IDSponsorMarketplace.Offer)._targetListing](contracts/DSponsorMarketplace.sol#L537) is not in mixedCase

contracts/DSponsorMarketplace.sol#L537


 - [ ] ID-248
Parameter [DSponsorMarketplace.acceptOffer(uint256,address,address,uint256)._pricePerToken](contracts/DSponsorMarketplace.sol#L397) is not in mixedCase

contracts/DSponsorMarketplace.sol#L397


 - [ ] ID-249
Parameter [DSponsorMarketplace.validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)._tokenOwner](contracts/DSponsorMarketplace.sol#L847) is not in mixedCase

contracts/DSponsorMarketplace.sol#L847


 - [ ] ID-250
Parameter [DSponsorNFT.setTokenURIs(uint256[],string[])._tokenIds](contracts/DSponsorNFT.sol#L356) is not in mixedCase

contracts/DSponsorNFT.sol#L356


 - [ ] ID-251
Parameter [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)._currencyToAccept](contracts/DSponsorMarketplace.sol#L209) is not in mixedCase

contracts/DSponsorMarketplace.sol#L209


 - [ ] ID-252
Parameter [DSponsorMarketplace.transferListingTokens(address,address,uint256,IDSponsorMarketplace.Listing)._to](contracts/DSponsorMarketplace.sol#L785) is not in mixedCase

contracts/DSponsorMarketplace.sol#L785


 - [ ] ID-253
Constant [ERC721Upgradeable.ERC721StorageLocation](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L42) is not in UPPER_CASE_WITH_UNDERSCORES

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L42


 - [ ] ID-254
Parameter [DSponsorMarketplace.buy(IDSponsorMarketplace.BuyParams[])._buyParams](contracts/DSponsorMarketplace.sol#L312) is not in mixedCase

contracts/DSponsorMarketplace.sol#L312


 - [ ] ID-255
Parameter [DSponsorNFT.setContractURI(string)._contractURI](contracts/DSponsorNFT.sol#L257) is not in mixedCase

contracts/DSponsorNFT.sol#L257


 - [ ] ID-256
Parameter [DSponsorMarketplace.payout(address,address,address,uint256,IDSponsorMarketplace.Listing,IProtocolFee.ReferralRevenue)._listing](contracts/DSponsorMarketplace.sol#L813) is not in mixedCase

contracts/DSponsorMarketplace.sol#L813


 - [ ] ID-257
Function [ERC4907Upgradeable.__ERC4907_init(string,string)](contracts/lib/ERC4907Upgradeable.sol#L20-L26) is not in mixedCase

contracts/lib/ERC4907Upgradeable.sol#L20-L26


 - [ ] ID-258
Parameter [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)._quantityToList](contracts/DSponsorMarketplace.sol#L206) is not in mixedCase

contracts/DSponsorMarketplace.sol#L206


 - [ ] ID-259
Parameter [DSponsorMarketplace.validateDirectListingSale(IDSponsorMarketplace.Listing,uint256)._listing](contracts/DSponsorMarketplace.sol#L876) is not in mixedCase

contracts/DSponsorMarketplace.sol#L876


 - [ ] ID-260
Parameter [DSponsorMarketplace.offer(uint256,uint256,address,uint256,uint256,string)._referralAdditionalInformation](contracts/DSponsorMarketplace.sol#L488) is not in mixedCase

contracts/DSponsorMarketplace.sol#L488


 - [ ] ID-261
Parameter [DSponsorMarketplace.handleBid(IDSponsorMarketplace.Listing,IDSponsorMarketplace.Offer)._targetListing](contracts/DSponsorMarketplace.sol#L560) is not in mixedCase

contracts/DSponsorMarketplace.sol#L560


 - [ ] ID-262
Parameter [DSponsorMarketplace.acceptOffer(uint256,address,address,uint256)._listingId](contracts/DSponsorMarketplace.sol#L394) is not in mixedCase

contracts/DSponsorMarketplace.sol#L394


 - [ ] ID-263
Parameter [DSponsorNFT.setTokenURI(uint256,string)._tokenId](contracts/DSponsorNFT.sol#L342) is not in mixedCase

contracts/DSponsorNFT.sol#L342


 - [ ] ID-264
Parameter [DSponsorNFT.setTokensAllowlist(bool)._applyTokensAllowlist](contracts/DSponsorNFT.sol#L311) is not in mixedCase

contracts/DSponsorNFT.sol#L311


 - [ ] ID-265
Variable [DSponsorNFT.MAX_SUPPLY](contracts/DSponsorNFT.sol#L37) is not in mixedCase

contracts/DSponsorNFT.sol#L37


 - [ ] ID-266
Parameter [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)._reservePricePerToken](contracts/DSponsorMarketplace.sol#L207) is not in mixedCase

contracts/DSponsorMarketplace.sol#L207


 - [ ] ID-267
Parameter [DSponsorNFT.setTokenURI(uint256,string)._tokenURI](contracts/DSponsorNFT.sol#L343) is not in mixedCase

contracts/DSponsorNFT.sol#L343


 - [ ] ID-268
Parameter [DSponsorMarketplace.offer(uint256,uint256,address,uint256,uint256,string)._listingId](contracts/DSponsorMarketplace.sol#L483) is not in mixedCase

contracts/DSponsorMarketplace.sol#L483


 - [ ] ID-269
Variable [ERC4907Upgradeable._users](contracts/lib/ERC4907Upgradeable.sol#L18) is not in mixedCase

contracts/lib/ERC4907Upgradeable.sol#L18


 - [ ] ID-270
Constant [ReentrancyGuardUpgradeable.ReentrancyGuardStorageLocation](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L44) is not in UPPER_CASE_WITH_UNDERSCORES

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L44


 - [ ] ID-271
Function [EIP712._EIP712Name()](node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L146-L148) is not in mixedCase

node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L146-L148


 - [ ] ID-272
Parameter [IDSponsorNFTBase.setTokenURI(uint256,string).URI](contracts/interfaces/IDSponsorNFT.sol#L141) is not in mixedCase

contracts/interfaces/IDSponsorNFT.sol#L141


 - [ ] ID-273
Constant [ERC2981Upgradeable.ERC2981StorageLocation](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L37) is not in UPPER_CASE_WITH_UNDERSCORES

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L37


 - [ ] ID-274
Parameter [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)._listingId](contracts/DSponsorMarketplace.sol#L205) is not in mixedCase

contracts/DSponsorMarketplace.sol#L205


 - [ ] ID-275
Variable [DSponsorNFT.MINTER](contracts/DSponsorNFT.sol#L46) is not in mixedCase

contracts/DSponsorNFT.sol#L46


 - [ ] ID-276
Function [ContextUpgradeable.__Context_init()](node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L18-L19) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L18-L19


 - [ ] ID-277
Parameter [DSponsorMarketplace.handleOffer(IDSponsorMarketplace.Listing,IDSponsorMarketplace.Offer)._newOffer](contracts/DSponsorMarketplace.sol#L538) is not in mixedCase

contracts/DSponsorMarketplace.sol#L538


 - [ ] ID-278
Parameter [DSponsorMarketplace.getSafeQuantity(IDSponsorMarketplace.TokenType,uint256)._quantityToCheck](contracts/DSponsorMarketplace.sol#L916) is not in mixedCase

contracts/DSponsorMarketplace.sol#L916


 - [ ] ID-279
Parameter [DSponsorAdmin.updateProtocolFee(address,uint96)._bps](contracts/DSponsorAdmin.sol#L136) is not in mixedCase

contracts/DSponsorAdmin.sol#L136


 - [ ] ID-280
Function [ERC165Upgradeable.__ERC165_init()](node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L22-L23) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L22-L23


 - [ ] ID-281
Function [ERC2771ContextUpgradeable.__ERC2771Context_init_unchained(address)](contracts/lib/ERC2771ContextUpgradeable.sol#L29-L33) is not in mixedCase

contracts/lib/ERC2771ContextUpgradeable.sol#L29-L33


 - [ ] ID-282
Function [ERC721RoyaltyUpgradeable.__ERC721Royalty_init()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L22-L23) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L22-L23


 - [ ] ID-283
Function [ERC2981Upgradeable.__ERC2981_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L68-L69) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L68-L69


 - [ ] ID-284
Parameter [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)._secondsUntilEndTime](contracts/DSponsorMarketplace.sol#L211) is not in mixedCase

contracts/DSponsorMarketplace.sol#L211


 - [ ] ID-285
Parameter [IDSponsorNFTBase.setContractURI(string).URI](contracts/interfaces/IDSponsorNFT.sol#L117) is not in mixedCase

contracts/interfaces/IDSponsorNFT.sol#L117


 - [ ] ID-286
Parameter [DSponsorMarketplace.offer(uint256,uint256,address,uint256,uint256,string)._currency](contracts/DSponsorMarketplace.sol#L485) is not in mixedCase

contracts/DSponsorMarketplace.sol#L485


 - [ ] ID-287
Function [ERC721Upgradeable.__ERC721_init(string,string)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L53-L55) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L53-L55


## similar-names
Impact: Informational
Confidence: Medium
 - [ ] ID-288
Variable [IUniswapV3SwapCallback.uniswapV3SwapCallback(int256,int256,bytes).amount0Delta](node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L17) is too similar to [IUniswapV3SwapCallback.uniswapV3SwapCallback(int256,int256,bytes).amount1Delta](node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L18)

node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L17


 - [ ] ID-289
Variable [ERC2771Context._trustedForwarder](node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L23) is too similar to [ERC2771Context.constructor(address).trustedForwarder_](node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L32)

node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L23


## too-many-digits
Impact: Informational
Confidence: Medium
 - [ ] ID-290
[Clones.clone(address)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L28-L41) uses literals with too many digits:
	- [mstore(uint256,uint256)(0x00,implementation << 0x60 >> 0xe8 | 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L33)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L28-L41


 - [ ] ID-291
[ShortStrings.slitherConstructorConstantVariables()](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L40-L123) uses literals with too many digits:
	- [FALLBACK_SENTINEL = 0x00000000000000000000000000000000000000000000000000000000000000FF](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L42)

node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L40-L123


 - [ ] ID-292
[Clones.cloneDeterministic(address,bytes32)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L50-L63) uses literals with too many digits:
	- [mstore(uint256,uint256)(0x00,implementation << 0x60 >> 0xe8 | 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L55)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L50-L63


## constable-states
Impact: Optimization
Confidence: High
 - [ ] ID-293
[DSponsorMarketplace.bidBufferBps](contracts/DSponsorMarketplace.sol#L41) should be constant 

contracts/DSponsorMarketplace.sol#L41


