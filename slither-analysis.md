**THIS CHECKLIST IS NOT COMPLETE**. Use `--show-ignored-findings` to show all the results.
Summary
 - [reentrancy-eth](#reentrancy-eth) (3 results) (High)
 - [divide-before-multiply](#divide-before-multiply) (8 results) (Medium)
 - [incorrect-equality](#incorrect-equality) (18 results) (Medium)
 - [uninitialized-local](#uninitialized-local) (8 results) (Medium)
 - [unused-return](#unused-return) (4 results) (Medium)
 - [shadowing-local](#shadowing-local) (4 results) (Low)
 - [calls-loop](#calls-loop) (14 results) (Low)
 - [reentrancy-benign](#reentrancy-benign) (2 results) (Low)
 - [reentrancy-events](#reentrancy-events) (6 results) (Low)
 - [timestamp](#timestamp) (16 results) (Low)
 - [assembly](#assembly) (28 results) (Informational)
 - [pragma](#pragma) (1 results) (Informational)
 - [costly-loop](#costly-loop) (2 results) (Informational)
 - [dead-code](#dead-code) (8 results) (Informational)
 - [solc-version](#solc-version) (67 results) (Informational)
 - [low-level-calls](#low-level-calls) (5 results) (Informational)
 - [missing-inheritance](#missing-inheritance) (1 results) (Informational)
 - [naming-convention](#naming-convention) (65 results) (Informational)
 - [similar-names](#similar-names) (2 results) (Informational)
 - [too-many-digits](#too-many-digits) (3 results) (Informational)
## reentrancy-eth
Impact: High
Confidence: Medium
 - [ ] ID-0
Reentrancy in [DSponsorMarketplace.closeAuction(uint256,address)](contracts/DSponsorMarketplace.sol#L574-L609):
	External calls:
	- [_closeAuctionForAuctionCreator(targetListing,targetBid)](contracts/DSponsorMarketplace.sol#L602)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L148)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L152)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L154)
	- [_closeAuctionForBidder(targetListing,targetBid)](contracts/DSponsorMarketplace.sol#L606)
		- [IERC1155(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,_quantity,)](contracts/DSponsorMarketplace.sol#L902-L908)
		- [IERC721(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,)](contracts/DSponsorMarketplace.sol#L910-L915)
	External calls sending eth:
	- [_closeAuctionForAuctionCreator(targetListing,targetBid)](contracts/DSponsorMarketplace.sol#L602)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
	State variables written after the call(s):
	- [_closeAuctionForBidder(targetListing,targetBid)](contracts/DSponsorMarketplace.sol#L606)
		- [listings[_targetListing.listingId] = _targetListing](contracts/DSponsorMarketplace.sol#L683)
	[DSponsorMarketplace.listings](contracts/DSponsorMarketplace.sol#L51) can be used in cross function reentrancies:
	- [DSponsorMarketplace.cancelDirectListing(uint256)](contracts/DSponsorMarketplace.sol#L311-L321)
	- [DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L150-L218)
	- [DSponsorMarketplace.listings](contracts/DSponsorMarketplace.sol#L51)
	- [DSponsorMarketplace.onlyListingCreator(uint256)](contracts/DSponsorMarketplace.sol#L63-L66)
	- [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)](contracts/DSponsorMarketplace.sol#L221-L308)
	- [_closeAuctionForBidder(targetListing,targetBid)](contracts/DSponsorMarketplace.sol#L606)
		- [winningBid[_targetListing.listingId] = _winningBid](contracts/DSponsorMarketplace.sol#L682)
	[DSponsorMarketplace.winningBid](contracts/DSponsorMarketplace.sol#L54) can be used in cross function reentrancies:
	- [DSponsorMarketplace.winningBid](contracts/DSponsorMarketplace.sol#L54)

contracts/DSponsorMarketplace.sol#L574-L609


 - [ ] ID-1
Reentrancy in [DSponsorAdmin.mintAndSubmit(DSponsorAdmin.MintAndSubmitAdParams)](contracts/DSponsorAdmin.sol#L79-L132):
	External calls:
	- [_externalCallWithProtocolFee(address(contractAddr),mintCallData,params.currency,mintPrice,referral)](contracts/DSponsorAdmin.sol#L115-L121)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [WETH(weth).deposit{value: amountInMaximum}()](contracts/lib/ProtocolFee.sol#L209)
		- [(success,returndata) = address(token).call(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L115)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L148)
		- [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L225-L227)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [swapRouter.refundETH()](contracts/lib/ProtocolFee.sol#L230)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L152)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L154)
		- [IERC20(currency).safeTransferFrom(_msgSender(),address(this),totalAmount)](contracts/lib/ProtocolFee.sol#L100-L104)
		- [IERC20(currency).forceApprove(address(target),baseAmount)](contracts/lib/ProtocolFee.sol#L108)
		- [Address.sendValue(address(recipientRefund),amountRefunded)](contracts/lib/ProtocolFee.sol#L237)
		- [retData = Address.functionCallWithValue(target,callData,value)](contracts/lib/ProtocolFee.sol#L120-L124)
	External calls sending eth:
	- [_externalCallWithProtocolFee(address(contractAddr),mintCallData,params.currency,mintPrice,referral)](contracts/DSponsorAdmin.sol#L115-L121)
		- [WETH(weth).deposit{value: amountInMaximum}()](contracts/lib/ProtocolFee.sol#L209)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L225-L227)
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


 - [ ] ID-2
Reentrancy in [DSponsorMarketplace.buy(IDSponsorMarketplace.BuyParams[])](contracts/DSponsorMarketplace.sol#L331-L364):
	External calls:
	- [(amountRefunded) = _swapNativeToERC20(buyParams.currency,buyParams.totalPrice,remainingToSpendInSwap,recipientRefund)](contracts/DSponsorMarketplace.sol#L346-L351)
		- [WETH(weth).deposit{value: amountInMaximum}()](contracts/lib/ProtocolFee.sol#L209)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L225-L227)
		- [swapRouter.refundETH()](contracts/lib/ProtocolFee.sol#L230)
		- [Address.sendValue(address(recipientRefund),amountRefunded)](contracts/lib/ProtocolFee.sol#L237)
	- [_buy(buyParams.listingId,buyParams.buyFor,buyParams.quantity,buyParams.currency,buyParams.totalPrice,buyParams.referralAdditionalInformation)](contracts/DSponsorMarketplace.sol#L355-L362)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [IERC1155(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,_quantity,)](contracts/DSponsorMarketplace.sol#L902-L908)
		- [IERC721(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,)](contracts/DSponsorMarketplace.sol#L910-L915)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L148)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L152)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L154)
	External calls sending eth:
	- [(amountRefunded) = _swapNativeToERC20(buyParams.currency,buyParams.totalPrice,remainingToSpendInSwap,recipientRefund)](contracts/DSponsorMarketplace.sol#L346-L351)
		- [WETH(weth).deposit{value: amountInMaximum}()](contracts/lib/ProtocolFee.sol#L209)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L225-L227)
	- [_buy(buyParams.listingId,buyParams.buyFor,buyParams.quantity,buyParams.currency,buyParams.totalPrice,buyParams.referralAdditionalInformation)](contracts/DSponsorMarketplace.sol#L355-L362)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
	State variables written after the call(s):
	- [_buy(buyParams.listingId,buyParams.buyFor,buyParams.quantity,buyParams.currency,buyParams.totalPrice,buyParams.referralAdditionalInformation)](contracts/DSponsorMarketplace.sol#L355-L362)
		- [listings[_listingId] = targetListing](contracts/DSponsorMarketplace.sol#L442)
	[DSponsorMarketplace.listings](contracts/DSponsorMarketplace.sol#L51) can be used in cross function reentrancies:
	- [DSponsorMarketplace.cancelDirectListing(uint256)](contracts/DSponsorMarketplace.sol#L311-L321)
	- [DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L150-L218)
	- [DSponsorMarketplace.listings](contracts/DSponsorMarketplace.sol#L51)
	- [DSponsorMarketplace.onlyListingCreator(uint256)](contracts/DSponsorMarketplace.sol#L63-L66)
	- [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)](contracts/DSponsorMarketplace.sol#L221-L308)

contracts/DSponsorMarketplace.sol#L331-L364


## divide-before-multiply
Impact: Medium
Confidence: Medium
 - [ ] ID-3
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L192)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-4
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L190)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-5
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse = (3 * denominator) ^ 2](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L184)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-6
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L191)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-7
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L188)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-8
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [prod0 = prod0 / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L172)
	- [result = prod0 * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L199)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-9
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L193)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-10
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L189)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


## incorrect-equality
Impact: Medium
Confidence: High
 - [ ] ID-11
[DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)](contracts/DSponsorMarketplace.sol#L221-L308) uses a dangerous strict equality:
	- [_startTime == 0](contracts/DSponsorMarketplace.sol#L255-L257)

contracts/DSponsorMarketplace.sol#L221-L308


 - [ ] ID-12
[DSponsorMarketplace.closeAuction(uint256,address)](contracts/DSponsorMarketplace.sol#L574-L609) uses a dangerous strict equality:
	- [require(bool,string)(targetListing.listingType == ListingType.Auction,not an auction.)](contracts/DSponsorMarketplace.sol#L580-L583)

contracts/DSponsorMarketplace.sol#L574-L609


 - [ ] ID-13
[DSponsorMarketplace._getSafeQuantity(IDSponsorMarketplace.TokenType,uint256)](contracts/DSponsorMarketplace.sol#L1025-L1036) uses a dangerous strict equality:
	- [_tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L1032-L1034)

contracts/DSponsorMarketplace.sol#L1025-L1036


 - [ ] ID-14
[DSponsorMarketplace._transferListingTokens(address,address,uint256,IDSponsorMarketplace.Listing)](contracts/DSponsorMarketplace.sol#L895-L917) uses a dangerous strict equality:
	- [_listing.tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L909)

contracts/DSponsorMarketplace.sol#L895-L917


 - [ ] ID-15
[DSponsorMarketplace.bid(uint256,uint256,string)](contracts/DSponsorMarketplace.sol#L476-L567) uses a dangerous strict equality:
	- [require(bool,string)(targetListing.listingType == ListingType.Auction,not an auction.)](contracts/DSponsorMarketplace.sol#L486-L489)

contracts/DSponsorMarketplace.sol#L476-L567


 - [ ] ID-16
[DSponsorMarketplace._getSafeQuantity(IDSponsorMarketplace.TokenType,uint256)](contracts/DSponsorMarketplace.sol#L1025-L1036) uses a dangerous strict equality:
	- [_quantityToCheck == 0](contracts/DSponsorMarketplace.sol#L1029)

contracts/DSponsorMarketplace.sol#L1025-L1036


 - [ ] ID-17
[DSponsorMarketplace._validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L992-L1018) uses a dangerous strict equality:
	- [_tokenType == TokenType.ERC1155](contracts/DSponsorMarketplace.sol#L1002)

contracts/DSponsorMarketplace.sol#L992-L1018


 - [ ] ID-18
[DSponsorMarketplace.closeAuction(uint256,address)](contracts/DSponsorMarketplace.sol#L574-L609) uses a dangerous strict equality:
	- [_closeFor == targetListing.tokenOwner](contracts/DSponsorMarketplace.sol#L601)

contracts/DSponsorMarketplace.sol#L574-L609


 - [ ] ID-19
[DSponsorMarketplace._cancelAuction(IDSponsorMarketplace.Listing)](contracts/DSponsorMarketplace.sol#L612-L634) uses a dangerous strict equality:
	- [require(bool,string)(listings[_targetListing.listingId].tokenOwner == _msgSender(),caller is not the listing creator.)](contracts/DSponsorMarketplace.sol#L613-L616)

contracts/DSponsorMarketplace.sol#L612-L634


 - [ ] ID-20
[DSponsorMarketplace._validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L992-L1018) uses a dangerous strict equality:
	- [isValid = IERC721(_assetContract).ownerOf(_tokenId) == _tokenOwner && (IERC721(_assetContract).getApproved(_tokenId) == market || IERC721(_assetContract).isApprovedForAll(_tokenOwner,market))](contracts/DSponsorMarketplace.sol#L1008-L1014)

contracts/DSponsorMarketplace.sol#L992-L1018


 - [ ] ID-21
[DSponsorMarketplace._buy(uint256,address,uint256,address,uint256,string)](contracts/DSponsorMarketplace.sol#L391-L469) uses a dangerous strict equality:
	- [require(bool,string)(_currency == targetListing.currency && _totalPrice == (targetListing.buyoutPricePerToken * _quantityToBuy),!PRICE)](contracts/DSponsorMarketplace.sol#L402-L407)

contracts/DSponsorMarketplace.sol#L391-L469


 - [ ] ID-22
[DSponsorMarketplace._validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L992-L1018) uses a dangerous strict equality:
	- [_tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L1007)

contracts/DSponsorMarketplace.sol#L992-L1018


 - [ ] ID-23
[DSponsorMarketplace._transferListingTokens(address,address,uint256,IDSponsorMarketplace.Listing)](contracts/DSponsorMarketplace.sol#L895-L917) uses a dangerous strict equality:
	- [_listing.tokenType == TokenType.ERC1155](contracts/DSponsorMarketplace.sol#L901)

contracts/DSponsorMarketplace.sol#L895-L917


 - [ ] ID-24
[DSponsorMarketplace._buy(uint256,address,uint256,address,uint256,string)](contracts/DSponsorMarketplace.sol#L391-L469) uses a dangerous strict equality:
	- [require(bool,string)(targetListing.listingType == ListingType.Direct,!DIRECT)](contracts/DSponsorMarketplace.sol#L409)

contracts/DSponsorMarketplace.sol#L391-L469


 - [ ] ID-25
[DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L150-L218) uses a dangerous strict equality:
	- [newListing.listingType == ListingType.Auction](contracts/DSponsorMarketplace.sol#L197)

contracts/DSponsorMarketplace.sol#L150-L218


 - [ ] ID-26
[ProtocolFee._pay(address,address,address,uint256)](contracts/lib/ProtocolFee.sol#L137-L158) uses a dangerous strict equality:
	- [currency == address(0)](contracts/lib/ProtocolFee.sol#L144)

contracts/lib/ProtocolFee.sol#L137-L158


 - [ ] ID-27
[DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L150-L218) uses a dangerous strict equality:
	- [require(bool,string)(newListing.buyoutPricePerToken == 0 || newListing.buyoutPricePerToken >= newListing.reservePricePerToken,RESERVE)](contracts/DSponsorMarketplace.sol#L198-L203)

contracts/DSponsorMarketplace.sol#L150-L218


 - [ ] ID-28
[DSponsorMarketplace.onlyListingCreator(uint256)](contracts/DSponsorMarketplace.sol#L63-L66) uses a dangerous strict equality:
	- [require(bool,string)(listings[_listingId].tokenOwner == _msgSender(),!OWNER)](contracts/DSponsorMarketplace.sol#L64)

contracts/DSponsorMarketplace.sol#L63-L66


## uninitialized-local
Impact: Medium
Confidence: Medium
 - [ ] ID-29
[DSponsorMarketplace._validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType).isValid](contracts/DSponsorMarketplace.sol#L1000) is a local variable never initialized

contracts/DSponsorMarketplace.sol#L1000


 - [ ] ID-30
[DSponsorMarketplace._payout(address,address,address,uint256,address,uint256,IProtocolFee.ReferralRevenue).royaltyCut](contracts/DSponsorMarketplace.sol#L959) is a local variable never initialized

contracts/DSponsorMarketplace.sol#L959


 - [ ] ID-31
[DSponsorMarketplace.getAllValidOffers(uint256,uint256)._offerCount](contracts/DSponsorMarketplace.sol#L830) is a local variable never initialized

contracts/DSponsorMarketplace.sol#L830


 - [ ] ID-32
[ERC2771Forwarder.executeBatch(ERC2771Forwarder.ForwardRequestData[],address).refundValue](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L169) is a local variable never initialized

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L169


 - [ ] ID-33
[DSponsorMarketplace._payout(address,address,address,uint256,address,uint256,IProtocolFee.ReferralRevenue).royaltyFeeAmount](contracts/DSponsorMarketplace.sol#L963) is a local variable never initialized

contracts/DSponsorMarketplace.sol#L963


 - [ ] ID-34
[DSponsorMarketplace._payout(address,address,address,uint256,address,uint256,IProtocolFee.ReferralRevenue).royaltyFeeRecipient](contracts/DSponsorMarketplace.sol#L963) is a local variable never initialized

contracts/DSponsorMarketplace.sol#L963


 - [ ] ID-35
[ERC2771Forwarder.executeBatch(ERC2771Forwarder.ForwardRequestData[],address).i](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L171) is a local variable never initialized

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L171


 - [ ] ID-36
[DSponsorMarketplace._payout(address,address,address,uint256,address,uint256,IProtocolFee.ReferralRevenue).royaltyRecipient](contracts/DSponsorMarketplace.sol#L960) is a local variable never initialized

contracts/DSponsorMarketplace.sol#L960


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
[DSponsorMarketplace._payout(address,address,address,uint256,address,uint256,IProtocolFee.ReferralRevenue)](contracts/DSponsorMarketplace.sol#L945-L978) ignores return value by [IERC2981(_assetContract).royaltyInfo(_tokenId,_totalPayoutAmount)](contracts/DSponsorMarketplace.sol#L961-L968)

contracts/DSponsorMarketplace.sol#L945-L978


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
[DSponsorMarketplace._transferListingTokens(address,address,uint256,IDSponsorMarketplace.Listing)](contracts/DSponsorMarketplace.sol#L895-L917) has external calls inside a loop: [IERC1155(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,_quantity,)](contracts/DSponsorMarketplace.sol#L902-L908)

contracts/DSponsorMarketplace.sol#L895-L917


 - [ ] ID-46
[Address.functionCallWithValue(address,bytes,uint256)](node_modules/@openzeppelin/contracts/utils/Address.sol#L83-L89) has external calls inside a loop: [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)

node_modules/@openzeppelin/contracts/utils/Address.sol#L83-L89


 - [ ] ID-47
[DSponsorMarketplace._validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L992-L1018) has external calls inside a loop: [isValid = IERC721(_assetContract).ownerOf(_tokenId) == _tokenOwner && (IERC721(_assetContract).getApproved(_tokenId) == market || IERC721(_assetContract).isApprovedForAll(_tokenOwner,market))](contracts/DSponsorMarketplace.sol#L1008-L1014)

contracts/DSponsorMarketplace.sol#L992-L1018


 - [ ] ID-48
[Address.sendValue(address,uint256)](node_modules/@openzeppelin/contracts/utils/Address.sol#L41-L50) has external calls inside a loop: [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)

node_modules/@openzeppelin/contracts/utils/Address.sol#L41-L50


 - [ ] ID-49
[DSponsorMarketplace._validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L992-L1018) has external calls inside a loop: [isValid = IERC1155(_assetContract).balanceOf(_tokenOwner,_tokenId) >= _quantity && IERC1155(_assetContract).isApprovedForAll(_tokenOwner,market)](contracts/DSponsorMarketplace.sol#L1003-L1006)

contracts/DSponsorMarketplace.sol#L992-L1018


 - [ ] ID-50
[ProtocolFee._swapNativeToERC20(address,uint256,uint256,address)](contracts/lib/ProtocolFee.sol#L201-L240) has external calls inside a loop: [WETH(weth).deposit{value: amountInMaximum}()](contracts/lib/ProtocolFee.sol#L209)

contracts/lib/ProtocolFee.sol#L201-L240


 - [ ] ID-51
[DSponsorMarketplace._payout(address,address,address,uint256,address,uint256,IProtocolFee.ReferralRevenue)](contracts/DSponsorMarketplace.sol#L945-L978) has external calls inside a loop: [IERC2981(_assetContract).royaltyInfo(_tokenId,_totalPayoutAmount)](contracts/DSponsorMarketplace.sol#L961-L968)

contracts/DSponsorMarketplace.sol#L945-L978


 - [ ] ID-52
[DSponsorMarketplace._transferListingTokens(address,address,uint256,IDSponsorMarketplace.Listing)](contracts/DSponsorMarketplace.sol#L895-L917) has external calls inside a loop: [IERC721(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,)](contracts/DSponsorMarketplace.sol#L910-L915)

contracts/DSponsorMarketplace.sol#L895-L917


 - [ ] ID-53
[DSponsorAgreements.onlySponsor(uint256,uint256)](contracts/DSponsorAgreements.sol#L50-L76) has external calls inside a loop: [isOwner = _sponsoringOffers[offerId].nftContract.ownerOf(tokenId) == _msgSender()](contracts/DSponsorAgreements.sol#L51-L53)

contracts/DSponsorAgreements.sol#L50-L76


 - [ ] ID-54
[DSponsorMarketplace._validateERC20BalAndAllowance(address,address,uint256)](contracts/DSponsorMarketplace.sol#L981-L989) has external calls inside a loop: [isValid = IERC20(_currency).balanceOf(_tokenOwner) >= _amount && IERC20(_currency).allowance(_tokenOwner,address(this)) >= _amount](contracts/DSponsorMarketplace.sol#L986-L988)

contracts/DSponsorMarketplace.sol#L981-L989


 - [ ] ID-55
[ProtocolFee._swapNativeToERC20(address,uint256,uint256,address)](contracts/lib/ProtocolFee.sol#L201-L240) has external calls inside a loop: [swapRouter.refundETH()](contracts/lib/ProtocolFee.sol#L230)

contracts/lib/ProtocolFee.sol#L201-L240


 - [ ] ID-56
[DSponsorAgreements.onlySponsor(uint256,uint256)](contracts/DSponsorAgreements.sol#L50-L76) has external calls inside a loop: [IERC4907(address(_sponsoringOffers[offerId].nftContract)).userOf(tokenId)](contracts/DSponsorAgreements.sol#L57-L64)

contracts/DSponsorAgreements.sol#L50-L76


 - [ ] ID-57
[ProtocolFee._swapNativeToERC20(address,uint256,uint256,address)](contracts/lib/ProtocolFee.sol#L201-L240) has external calls inside a loop: [weth = swapRouter.WETH9()](contracts/lib/ProtocolFee.sol#L207)

contracts/lib/ProtocolFee.sol#L201-L240


 - [ ] ID-58
[ProtocolFee._swapNativeToERC20(address,uint256,uint256,address)](contracts/lib/ProtocolFee.sol#L201-L240) has external calls inside a loop: [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L225-L227)

contracts/lib/ProtocolFee.sol#L201-L240


## reentrancy-benign
Impact: Low
Confidence: Medium
 - [ ] ID-59
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


 - [ ] ID-60
Reentrancy in [DSponsorAdmin.mintAndSubmit(DSponsorAdmin.MintAndSubmitAdParams)](contracts/DSponsorAdmin.sol#L79-L132):
	External calls:
	- [_externalCallWithProtocolFee(address(contractAddr),mintCallData,params.currency,mintPrice,referral)](contracts/DSponsorAdmin.sol#L115-L121)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [WETH(weth).deposit{value: amountInMaximum}()](contracts/lib/ProtocolFee.sol#L209)
		- [(success,returndata) = address(token).call(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L115)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L148)
		- [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L225-L227)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [swapRouter.refundETH()](contracts/lib/ProtocolFee.sol#L230)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L152)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L154)
		- [IERC20(currency).safeTransferFrom(_msgSender(),address(this),totalAmount)](contracts/lib/ProtocolFee.sol#L100-L104)
		- [IERC20(currency).forceApprove(address(target),baseAmount)](contracts/lib/ProtocolFee.sol#L108)
		- [Address.sendValue(address(recipientRefund),amountRefunded)](contracts/lib/ProtocolFee.sol#L237)
		- [retData = Address.functionCallWithValue(target,callData,value)](contracts/lib/ProtocolFee.sol#L120-L124)
	External calls sending eth:
	- [_externalCallWithProtocolFee(address(contractAddr),mintCallData,params.currency,mintPrice,referral)](contracts/DSponsorAdmin.sol#L115-L121)
		- [WETH(weth).deposit{value: amountInMaximum}()](contracts/lib/ProtocolFee.sol#L209)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L225-L227)
	State variables written after the call(s):
	- [_submitAdProposal(params.offerId,params.tokenId,params.adParameters[i],params.adDatas[i])](contracts/DSponsorAdmin.sol#L125-L130)
		- [_proposalCounterId ++](contracts/DSponsorAgreements.sol#L369)

contracts/DSponsorAdmin.sol#L79-L132


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-61
Reentrancy in [DSponsorNFTFactory.createDSponsorNFT(IDSponsorNFTBase.InitParams)](contracts/DSponsorNFTFactory.sol#L38-L60):
	External calls:
	- [DSponsorNFT(instance).initialize(params)](contracts/DSponsorNFTFactory.sol#L42)
	Event emitted after the call(s):
	- [NewDSponsorNFT(instance,params.initialOwner,params.name,params.symbol,params.baseURI,params.contractURI,params.minter,params.maxSupply,params.forwarder,params.royaltyBps,params.currencies,params.prices,params.allowedTokenIds)](contracts/DSponsorNFTFactory.sol#L44-L58)

contracts/DSponsorNFTFactory.sol#L38-L60


 - [ ] ID-62
Reentrancy in [ProtocolFee._payFee(address,address,uint256,address,IProtocolFee.ReferralRevenue)](contracts/lib/ProtocolFee.sol#L169-L186):
	External calls:
	- [_pay(from,feeRecipient,currency,feeAmount)](contracts/lib/ProtocolFee.sol#L176)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L148)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L152)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L154)
	External calls sending eth:
	- [_pay(from,feeRecipient,currency,feeAmount)](contracts/lib/ProtocolFee.sol#L176)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
	Event emitted after the call(s):
	- [CallWithProtocolFee(origin,currency,feeAmount,referral.enabler,referral.spender,referral.additionalInformation)](contracts/lib/ProtocolFee.sol#L178-L185)

contracts/lib/ProtocolFee.sol#L169-L186


 - [ ] ID-63
Reentrancy in [DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L150-L218):
	External calls:
	- [_transferListingTokens(tokenOwner,address(this),tokenAmountToList,newListing)](contracts/DSponsorMarketplace.sol#L204-L209)
		- [IERC1155(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,_quantity,)](contracts/DSponsorMarketplace.sol#L902-L908)
		- [IERC721(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,)](contracts/DSponsorMarketplace.sol#L910-L915)
	Event emitted after the call(s):
	- [ListingAdded(listingId,_params.assetContract,tokenOwner,newListing)](contracts/DSponsorMarketplace.sol#L212-L217)

contracts/DSponsorMarketplace.sol#L150-L218


 - [ ] ID-64
Reentrancy in [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)](contracts/DSponsorMarketplace.sol#L221-L308):
	External calls:
	- [_transferListingTokens(address(this),targetListing.tokenOwner,targetListing.quantity,targetListing)](contracts/DSponsorMarketplace.sol#L280-L285)
		- [IERC1155(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,_quantity,)](contracts/DSponsorMarketplace.sol#L902-L908)
		- [IERC721(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,)](contracts/DSponsorMarketplace.sol#L910-L915)
	- [_transferListingTokens(targetListing.tokenOwner,address(this),safeNewQuantity,targetListing)](contracts/DSponsorMarketplace.sol#L298-L303)
		- [IERC1155(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,_quantity,)](contracts/DSponsorMarketplace.sol#L902-L908)
		- [IERC721(_listing.assetContract).safeTransferFrom(_from,_to,_listing.tokenId,)](contracts/DSponsorMarketplace.sol#L910-L915)
	Event emitted after the call(s):
	- [ListingUpdated(_listingId,targetListing.tokenOwner)](contracts/DSponsorMarketplace.sol#L307)

contracts/DSponsorMarketplace.sol#L221-L308


 - [ ] ID-65
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


 - [ ] ID-66
Reentrancy in [ProtocolFee._externalCallWithProtocolFee(address,bytes,address,uint256,IProtocolFee.ReferralRevenue)](contracts/lib/ProtocolFee.sol#L74-L127):
	External calls:
	- [_swapNativeToERC20(currency,totalAmount,msg.value,referral.spender)](contracts/lib/ProtocolFee.sol#L93-L98)
		- [WETH(weth).deposit{value: amountInMaximum}()](contracts/lib/ProtocolFee.sol#L209)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L225-L227)
		- [swapRouter.refundETH()](contracts/lib/ProtocolFee.sol#L230)
		- [Address.sendValue(address(recipientRefund),amountRefunded)](contracts/lib/ProtocolFee.sol#L237)
	- [IERC20(currency).safeTransferFrom(_msgSender(),address(this),totalAmount)](contracts/lib/ProtocolFee.sol#L100-L104)
	- [IERC20(currency).forceApprove(address(target),baseAmount)](contracts/lib/ProtocolFee.sol#L108)
	- [_payFee(address(this),currency,feeAmount,target,referral)](contracts/lib/ProtocolFee.sol#L111)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L148)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L152)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L154)
	External calls sending eth:
	- [_swapNativeToERC20(currency,totalAmount,msg.value,referral.spender)](contracts/lib/ProtocolFee.sol#L93-L98)
		- [WETH(weth).deposit{value: amountInMaximum}()](contracts/lib/ProtocolFee.sol#L209)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L225-L227)
	- [_payFee(address(this),currency,feeAmount,target,referral)](contracts/lib/ProtocolFee.sol#L111)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
	Event emitted after the call(s):
	- [CallWithProtocolFee(origin,currency,feeAmount,referral.enabler,referral.spender,referral.additionalInformation)](contracts/lib/ProtocolFee.sol#L178-L185)
		- [_payFee(address(this),currency,feeAmount,target,referral)](contracts/lib/ProtocolFee.sol#L111)

contracts/lib/ProtocolFee.sol#L74-L127


## timestamp
Impact: Low
Confidence: Medium
 - [ ] ID-67
[DSponsorMarketplace._cancelAuction(IDSponsorMarketplace.Listing)](contracts/DSponsorMarketplace.sol#L612-L634) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(listings[_targetListing.listingId].tokenOwner == _msgSender(),caller is not the listing creator.)](contracts/DSponsorMarketplace.sol#L613-L616)

contracts/DSponsorMarketplace.sol#L612-L634


 - [ ] ID-68
[DSponsorMarketplace._validateExistingOffer(IDSponsorMarketplace.Offer)](contracts/DSponsorMarketplace.sol#L877-L888) uses timestamp for comparisons
	Dangerous comparisons:
	- [isValid = _targetOffer.expirationTimestamp > block.timestamp && _targetOffer.status == Status.CREATED && _validateERC20BalAndAllowance(_targetOffer.offeror,_targetOffer.currency,_targetOffer.totalPrice)](contracts/DSponsorMarketplace.sol#L880-L887)

contracts/DSponsorMarketplace.sol#L877-L888


 - [ ] ID-69
[ERC4907Upgradeable.userOf(uint256)](contracts/lib/ERC4907Upgradeable.sol#L50-L58) uses timestamp for comparisons
	Dangerous comparisons:
	- [_users[tokenId].expires >= block.timestamp](contracts/lib/ERC4907Upgradeable.sol#L53)

contracts/lib/ERC4907Upgradeable.sol#L50-L58


 - [ ] ID-70
[DSponsorMarketplace._validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L992-L1018) uses timestamp for comparisons
	Dangerous comparisons:
	- [_tokenType == TokenType.ERC1155](contracts/DSponsorMarketplace.sol#L1002)
	- [isValid = IERC1155(_assetContract).balanceOf(_tokenOwner,_tokenId) >= _quantity && IERC1155(_assetContract).isApprovedForAll(_tokenOwner,market)](contracts/DSponsorMarketplace.sol#L1003-L1006)
	- [_tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L1007)
	- [isValid = IERC721(_assetContract).ownerOf(_tokenId) == _tokenOwner && (IERC721(_assetContract).getApproved(_tokenId) == market || IERC721(_assetContract).isApprovedForAll(_tokenOwner,market))](contracts/DSponsorMarketplace.sol#L1008-L1014)
	- [require(bool,string)(isValid,!BALNFT)](contracts/DSponsorMarketplace.sol#L1017)

contracts/DSponsorMarketplace.sol#L992-L1018


 - [ ] ID-71
[DSponsorMarketplace._buy(uint256,address,uint256,address,uint256,string)](contracts/DSponsorMarketplace.sol#L391-L469) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(_currency == targetListing.currency && _totalPrice == (targetListing.buyoutPricePerToken * _quantityToBuy),!PRICE)](contracts/DSponsorMarketplace.sol#L402-L407)
	- [require(bool,string)(targetListing.listingType == ListingType.Direct,!DIRECT)](contracts/DSponsorMarketplace.sol#L409)
	- [require(bool,string)(targetListing.quantity > 0 && _quantityToBuy > 0 && _quantityToBuy <= targetListing.quantity,invalid amount of tokens.)](contracts/DSponsorMarketplace.sol#L412-L417)
	- [require(bool,string)(block.timestamp < targetListing.endTime && block.timestamp > targetListing.startTime,not within sale window.)](contracts/DSponsorMarketplace.sol#L420-L424)

contracts/DSponsorMarketplace.sol#L391-L469


 - [ ] ID-72
[DSponsorMarketplace._validateNewOffer(IDSponsorMarketplace.OfferParams,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L851-L874) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(_params.expirationTimestamp + 3600 > block.timestamp,Marketplace: invalid expiration timestamp.)](contracts/DSponsorMarketplace.sol#L861-L864)

contracts/DSponsorMarketplace.sol#L851-L874


 - [ ] ID-73
[DSponsorMarketplace.bid(uint256,uint256,string)](contracts/DSponsorMarketplace.sol#L476-L567) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(targetListing.listingType == ListingType.Auction,not an auction.)](contracts/DSponsorMarketplace.sol#L486-L489)
	- [require(bool,string)(targetListing.endTime > block.timestamp && targetListing.startTime < block.timestamp,inactive listing.)](contracts/DSponsorMarketplace.sol#L490-L494)
	- [targetListing.buyoutPricePerToken > 0 && incomingBidAmount >= targetListing.buyoutPricePerToken * quantity](contracts/DSponsorMarketplace.sol#L515-L516)
	- [isValidNewBid = incomingBidAmount >= _reserveAmount](contracts/DSponsorMarketplace.sol#L529)
	- [require(bool,string)(isValidNewBid,not winning bid.)](contracts/DSponsorMarketplace.sol#L536)
	- [targetListing.endTime - block.timestamp <= timeBuffer](contracts/DSponsorMarketplace.sol#L541)

contracts/DSponsorMarketplace.sol#L476-L567


 - [ ] ID-74
[ERC2771Forwarder._validate(ERC2771Forwarder.ForwardRequestData)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L199-L210) uses timestamp for comparisons
	Dangerous comparisons:
	- [(_isTrustedByTarget(request.to),request.deadline >= block.timestamp,isValid && recovered == request.from,recovered)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L204-L209)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L199-L210


 - [ ] ID-75
[DSponsorMarketplace._transferListingTokens(address,address,uint256,IDSponsorMarketplace.Listing)](contracts/DSponsorMarketplace.sol#L895-L917) uses timestamp for comparisons
	Dangerous comparisons:
	- [_listing.tokenType == TokenType.ERC1155](contracts/DSponsorMarketplace.sol#L901)
	- [_listing.tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L909)

contracts/DSponsorMarketplace.sol#L895-L917


 - [ ] ID-76
[DSponsorMarketplace.acceptOffer(uint256)](contracts/DSponsorMarketplace.sol#L742-L799) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(_targetOffer.expirationTimestamp > block.timestamp,EXPIRED)](contracts/DSponsorMarketplace.sol#L747)

contracts/DSponsorMarketplace.sol#L742-L799


 - [ ] ID-77
[DSponsorMarketplace._getSafeQuantity(IDSponsorMarketplace.TokenType,uint256)](contracts/DSponsorMarketplace.sol#L1025-L1036) uses timestamp for comparisons
	Dangerous comparisons:
	- [_quantityToCheck == 0](contracts/DSponsorMarketplace.sol#L1029)
	- [_tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L1032-L1034)

contracts/DSponsorMarketplace.sol#L1025-L1036


 - [ ] ID-78
[DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L150-L218) uses timestamp for comparisons
	Dangerous comparisons:
	- [startTime < block.timestamp](contracts/DSponsorMarketplace.sol#L165)
	- [require(bool,string)(block.timestamp - startTime < 3600,ST)](contracts/DSponsorMarketplace.sol#L167)
	- [newListing.listingType == ListingType.Auction](contracts/DSponsorMarketplace.sol#L197)
	- [require(bool,string)(newListing.buyoutPricePerToken == 0 || newListing.buyoutPricePerToken >= newListing.reservePricePerToken,RESERVE)](contracts/DSponsorMarketplace.sol#L198-L203)

contracts/DSponsorMarketplace.sol#L150-L218


 - [ ] ID-79
[DSponsorMarketplace.closeAuction(uint256,address)](contracts/DSponsorMarketplace.sol#L574-L609) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(targetListing.listingType == ListingType.Auction,not an auction.)](contracts/DSponsorMarketplace.sol#L580-L583)
	- [toCancel = targetListing.startTime > block.timestamp || targetBid.bidder == address(0)](contracts/DSponsorMarketplace.sol#L588-L589)
	- [require(bool,string)(targetListing.endTime < block.timestamp,cannot close auction before it has ended.)](contracts/DSponsorMarketplace.sol#L595-L598)
	- [_closeFor == targetListing.tokenOwner](contracts/DSponsorMarketplace.sol#L601)

contracts/DSponsorMarketplace.sol#L574-L609


 - [ ] ID-80
[ERC2771Forwarder._execute(ERC2771Forwarder.ForwardRequestData,bool)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L254-L297) uses timestamp for comparisons
	Dangerous comparisons:
	- [isTrustedForwarder && signerMatch && active](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L277)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L254-L297


 - [ ] ID-81
[ERC2771Forwarder.verify(ERC2771Forwarder.ForwardRequestData)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L111-L114) uses timestamp for comparisons
	Dangerous comparisons:
	- [isTrustedForwarder && active && signerMatch](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L113)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L111-L114


 - [ ] ID-82
[DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)](contracts/DSponsorMarketplace.sol#L221-L308) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(block.timestamp < targetListing.startTime,STARTED)](contracts/DSponsorMarketplace.sol#L241)
	- [_startTime < block.timestamp](contracts/DSponsorMarketplace.sol#L249)
	- [require(bool,string)(block.timestamp - _startTime < 3600,ST)](contracts/DSponsorMarketplace.sol#L251)
	- [_startTime == 0](contracts/DSponsorMarketplace.sol#L255-L257)

contracts/DSponsorMarketplace.sol#L221-L308


## assembly
Impact: Informational
Confidence: High
 - [ ] ID-83
[Initializable._getInitializableStorage()](node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L223-L227) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L224-L226)

node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L223-L227


 - [ ] ID-84
[StorageSlot.getUint256Slot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L89-L94) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L91-L93)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L89-L94


 - [ ] ID-85
[MessageHashUtils.toEthSignedMessageHash(bytes32)](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L30-L37) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L32-L36)

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L30-L37


 - [ ] ID-86
[StorageSlot.getAddressSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L59-L64) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L61-L63)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L59-L64


 - [ ] ID-87
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L130-L133)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L154-L161)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L167-L176)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-88
[MessageHashUtils.toTypedDataHash(bytes32,bytes32)](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L76-L85) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L78-L84)

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L76-L85


 - [ ] ID-89
[ERC2771Forwarder._execute(ERC2771Forwarder.ForwardRequestData,bool)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L254-L297) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L288-L291)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L254-L297


 - [ ] ID-90
[ERC2771Forwarder._isTrustedByTarget(address)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L305-L324) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L312-L321)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L305-L324


 - [ ] ID-91
[ReentrancyGuardUpgradeable._getReentrancyGuardStorage()](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L46-L50) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L47-L49)

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L46-L50


 - [ ] ID-92
[Strings.toString(uint256)](node_modules/@openzeppelin/contracts/utils/Strings.sol#L24-L44) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L30-L32)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L36-L38)

node_modules/@openzeppelin/contracts/utils/Strings.sol#L24-L44


 - [ ] ID-93
[StorageSlot.getBooleanSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L69-L74) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L71-L73)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L69-L74


 - [ ] ID-94
[ERC721Upgradeable._checkOnERC721Received(address,address,uint256,bytes)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L494-L511) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L505-L507)

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L494-L511


 - [ ] ID-95
[ERC721Upgradeable._getERC721Storage()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L44-L48) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L45-L47)

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L44-L48


 - [ ] ID-96
[Clones.clone(address)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L28-L41) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L30-L37)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L28-L41


 - [ ] ID-97
[StorageSlot.getBytesSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L119-L124) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L121-L123)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L119-L124


 - [ ] ID-98
[StorageSlot.getStringSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L99-L104) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L101-L103)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L99-L104


 - [ ] ID-99
[ERC2771Forwarder._checkForwardedGas(uint256,ERC2771Forwarder.ForwardRequestData)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L338-L369) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L365-L367)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L338-L369


 - [ ] ID-100
[OwnableUpgradeable._getOwnableStorage()](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L30-L34) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L31-L33)

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L30-L34


 - [ ] ID-101
[Clones.predictDeterministicAddress(address,bytes32,address)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L68-L84) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L74-L83)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L68-L84


 - [ ] ID-102
[Address._revert(bytes)](node_modules/@openzeppelin/contracts/utils/Address.sol#L146-L158) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Address.sol#L151-L154)

node_modules/@openzeppelin/contracts/utils/Address.sol#L146-L158


 - [ ] ID-103
[ERC2981Upgradeable._getERC2981Storage()](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L39-L43) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L40-L42)

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L39-L43


 - [ ] ID-104
[StorageSlot.getBytesSlot(bytes)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L129-L134) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L131-L133)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L129-L134


 - [ ] ID-105
[StorageSlot.getStringSlot(string)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L109-L114) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L111-L113)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L109-L114


 - [ ] ID-106
[ShortStrings.toString(ShortString)](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L63-L73) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L68-L71)

node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L63-L73


 - [ ] ID-107
[StorageSlot.getBytes32Slot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L79-L84) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L81-L83)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L79-L84


 - [ ] ID-108
[Clones.cloneDeterministic(address,bytes32)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L50-L63) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L52-L59)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L50-L63


 - [ ] ID-109
[ERC721._checkOnERC721Received(address,address,uint256,bytes)](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L465-L482) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L476-L478)

node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L465-L482


 - [ ] ID-110
[ECDSA.tryRecover(bytes32,bytes)](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L56-L73) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L64-L68)

node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L56-L73


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-111
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
 - [ ] ID-112
[DSponsorAgreements._submitAdProposal(uint256,uint256,string,string)](contracts/DSponsorAgreements.sol#L355-L382) has costly operations inside a loop:
	- [_proposalCounterId ++](contracts/DSponsorAgreements.sol#L369)

contracts/DSponsorAgreements.sol#L355-L382


 - [ ] ID-113
[DSponsorNFT._setDefaultMintPrice(address,bool,uint256)](contracts/DSponsorNFT.sol#L558-L573) has costly operations inside a loop:
	- [_defaultMintNativePrice = MintPriceSettings(enabled,amount)](contracts/DSponsorNFT.sol#L569)

contracts/DSponsorNFT.sol#L558-L573


## dead-code
Impact: Informational
Confidence: Medium
 - [ ] ID-114
[DSponsorMarketplace._msgData()](contracts/DSponsorMarketplace.sol#L1071-L1079) is never used and should be removed

contracts/DSponsorMarketplace.sol#L1071-L1079


 - [ ] ID-115
[DSponsorNFT._msgData()](contracts/DSponsorNFT.sol#L483-L491) is never used and should be removed

contracts/DSponsorNFT.sol#L483-L491


 - [ ] ID-116
[ERC2771ContextUpgradeable._msgData()](contracts/lib/ERC2771ContextUpgradeable.sol#L85-L102) is never used and should be removed

contracts/lib/ERC2771ContextUpgradeable.sol#L85-L102


 - [ ] ID-117
[ReentrantDSponsorAdmin._completeAttack()](contracts/mocks/ReentrantDSponsorAdmin.sol#L62) is never used and should be removed

contracts/mocks/ReentrantDSponsorAdmin.sol#L62


 - [ ] ID-118
[ReentrantDSponsorNFT._completeAttack()](contracts/mocks/ReentrantDSponsorNFT.sol#L23) is never used and should be removed

contracts/mocks/ReentrantDSponsorNFT.sol#L23


 - [ ] ID-119
[ERC2771ContextUpgradeable.__ERC2771Context_init(address,address)](contracts/lib/ERC2771ContextUpgradeable.sol#L20-L27) is never used and should be removed

contracts/lib/ERC2771ContextUpgradeable.sol#L20-L27


 - [ ] ID-120
[DSponsorAdmin._msgData()](contracts/DSponsorAdmin.sol#L151-L159) is never used and should be removed

contracts/DSponsorAdmin.sol#L151-L159


 - [ ] ID-121
[ERC2771ContextOwnable._msgData()](contracts/lib/ERC2771ContextOwnable.sol#L70-L87) is never used and should be removed

contracts/lib/ERC2771ContextOwnable.sol#L70-L87


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-122
Pragma version[^0.8.20](contracts/lib/Reentrant.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/Reentrant.sol#L2


 - [ ] ID-123
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L4


 - [ ] ID-124
Pragma version[^0.8.20](contracts/interfaces/IDSponsorAgreements.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IDSponsorAgreements.sol#L2


 - [ ] ID-125
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC2981.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/interfaces/IERC2981.sol#L4


 - [ ] ID-126
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4


 - [ ] ID-127
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155.sol#L4


 - [ ] ID-128
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol#L4


 - [ ] ID-129
Pragma version[^0.8.11](contracts/interfaces/IDSponsorMarketplace.sol#L2) allows old versions

contracts/interfaces/IDSponsorMarketplace.sol#L2


 - [ ] ID-130
Pragma version[>=0.7.5](node_modules/@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol#L2) allows old versions

node_modules/@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol#L2


 - [ ] ID-131
Pragma version[^0.8.20](contracts/interfaces/IDSponsorNFTFactory.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IDSponsorNFTFactory.sol#L2


 - [ ] ID-132
Pragma version[^0.8.20](contracts/DSponsorAdmin.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorAdmin.sol#L2


 - [ ] ID-133
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol#L3


 - [ ] ID-134
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L4


 - [ ] ID-135
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L4


 - [ ] ID-136
Pragma version[^0.8.20](contracts/mocks/ERC20Mock.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ERC20Mock.sol#L2


 - [ ] ID-137
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L4


 - [ ] ID-138
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/Strings.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/Strings.sol#L4


 - [ ] ID-139
Pragma version[^0.8.20](contracts/interfaces/IProtocolFee.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IProtocolFee.sol#L2


 - [ ] ID-140
Pragma version[^0.8.20](contracts/DSponsorNFT.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorNFT.sol#L2


 - [ ] ID-141
Pragma version[^0.8.0](contracts/lib/Tokens.sol#L2) allows old versions

contracts/lib/Tokens.sol#L2


 - [ ] ID-142
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L4


 - [ ] ID-143
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/Address.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/Address.sol#L4


 - [ ] ID-144
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/access/Ownable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/access/Ownable.sol#L4


 - [ ] ID-145
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC721.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/interfaces/IERC721.sol#L4


 - [ ] ID-146
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol#L4


 - [ ] ID-147
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L4


 - [ ] ID-148
solc-0.8.20 is not recommended for deployment

 - [ ] ID-149
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L4


 - [ ] ID-150
Pragma version[^0.8.20](contracts/interfaces/IDSponsorNFT.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IDSponsorNFT.sol#L2


 - [ ] ID-151
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/Nonces.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/Nonces.sol#L3


 - [ ] ID-152
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L5) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L5


 - [ ] ID-153
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L4


 - [ ] ID-154
Pragma version[^0.8.20](contracts/lib/ERC4907Upgradeable.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/ERC4907Upgradeable.sol#L2


 - [ ] ID-155
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L4


 - [ ] ID-156
Pragma version[^0.8.20](contracts/DSponsorNFTFactory.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorNFTFactory.sol#L2


 - [ ] ID-157
Pragma version[^0.8.20](contracts/mocks/ERC721Mock.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ERC721Mock.sol#L2


 - [ ] ID-158
Pragma version[^0.8.20](contracts/mocks/ERC2771ForwarderMock.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ERC2771ForwarderMock.sol#L2


 - [ ] ID-159
Pragma version[^0.8.20](contracts/DSponsorAgreements.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorAgreements.sol#L2


 - [ ] ID-160
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L4


 - [ ] ID-161
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L4


 - [ ] ID-162
Pragma version[>=0.7.5](node_modules/@uniswap/v3-periphery/contracts/interfaces/IPeripheryPayments.sol#L2) allows old versions

node_modules/@uniswap/v3-periphery/contracts/interfaces/IPeripheryPayments.sol#L2


 - [ ] ID-163
Pragma version[^0.8.20](contracts/DSponsorMarketplace.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorMarketplace.sol#L2


 - [ ] ID-164
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L4


 - [ ] ID-165
Pragma version[^0.8.20](contracts/mocks/ReentrantDSponsorAdmin.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ReentrantDSponsorAdmin.sol#L2


 - [ ] ID-166
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L4


 - [ ] ID-167
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol#L4


 - [ ] ID-168
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol#L4


 - [ ] ID-169
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4


 - [ ] ID-170
Pragma version[^0.8.20](contracts/lib/ERC2771ContextUpgradeable.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/ERC2771ContextUpgradeable.sol#L2


 - [ ] ID-171
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/math/SignedMath.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/math/SignedMath.sol#L4


 - [ ] ID-172
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/Context.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/Context.sol#L4


 - [ ] ID-173
Pragma version[^0.8.20](contracts/mocks/ReentrantDSponsorNFT.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ReentrantDSponsorNFT.sol#L2


 - [ ] ID-174
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L4


 - [ ] ID-175
Pragma version[>=0.5.0](node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L2) allows old versions

node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L2


 - [ ] ID-176
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L4


 - [ ] ID-177
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L4


 - [ ] ID-178
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L4


 - [ ] ID-179
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L4


 - [ ] ID-180
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC5267.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/interfaces/IERC5267.sol#L4


 - [ ] ID-181
Pragma version[^0.8.20](contracts/lib/ProtocolFee.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/ProtocolFee.sol#L2


 - [ ] ID-182
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#L4


 - [ ] ID-183
Pragma version[^0.8.20](contracts/lib/ERC2771ContextOwnable.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/ERC2771ContextOwnable.sol#L2


 - [ ] ID-184
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L4


 - [ ] ID-185
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L4


 - [ ] ID-186
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L4


 - [ ] ID-187
Pragma version[^0.8.20](contracts/interfaces/IERC4907.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IERC4907.sol#L3


 - [ ] ID-188
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L4


## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-189
Low level call in [SafeERC20._callOptionalReturnBool(IERC20,bytes)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L110-L117):
	- [(success,returndata) = address(token).call(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L115)

node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L110-L117


 - [ ] ID-190
Low level call in [Address.functionStaticCall(address,bytes)](node_modules/@openzeppelin/contracts/utils/Address.sol#L95-L98):
	- [(success,returndata) = target.staticcall(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L96)

node_modules/@openzeppelin/contracts/utils/Address.sol#L95-L98


 - [ ] ID-191
Low level call in [Address.functionDelegateCall(address,bytes)](node_modules/@openzeppelin/contracts/utils/Address.sol#L104-L107):
	- [(success,returndata) = target.delegatecall(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L105)

node_modules/@openzeppelin/contracts/utils/Address.sol#L104-L107


 - [ ] ID-192
Low level call in [Address.functionCallWithValue(address,bytes,uint256)](node_modules/@openzeppelin/contracts/utils/Address.sol#L83-L89):
	- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)

node_modules/@openzeppelin/contracts/utils/Address.sol#L83-L89


 - [ ] ID-193
Low level call in [Address.sendValue(address,uint256)](node_modules/@openzeppelin/contracts/utils/Address.sol#L41-L50):
	- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)

node_modules/@openzeppelin/contracts/utils/Address.sol#L41-L50


## missing-inheritance
Impact: Informational
Confidence: High
 - [ ] ID-194
[DSponsorNFT](contracts/DSponsorNFT.sol#L21-L605) should inherit from [IDSponsorNFT](contracts/interfaces/IDSponsorNFT.sol#L160)

contracts/DSponsorNFT.sol#L21-L605


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-195
Function [IDSponsorNFTBase.MAX_SUPPLY()](contracts/interfaces/IDSponsorNFT.sol#L100) is not in mixedCase

contracts/interfaces/IDSponsorNFT.sol#L100


 - [ ] ID-196
Parameter [DSponsorMarketplace.cancelDirectListing(uint256)._listingId](contracts/DSponsorMarketplace.sol#L312) is not in mixedCase

contracts/DSponsorMarketplace.sol#L312


 - [ ] ID-197
Constant [OwnableUpgradeable.OwnableStorageLocation](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L28) is not in UPPER_CASE_WITH_UNDERSCORES

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L28


 - [ ] ID-198
Function [ERC2771ContextUpgradeable.__ERC2771Context_init(address,address)](contracts/lib/ERC2771ContextUpgradeable.sol#L20-L27) is not in mixedCase

contracts/lib/ERC2771ContextUpgradeable.sol#L20-L27


 - [ ] ID-199
Function [UniV3SwapRouter.WETH9()](contracts/lib/ProtocolFee.sol#L19) is not in mixedCase

contracts/lib/ProtocolFee.sol#L19


 - [ ] ID-200
Parameter [DSponsorMarketplace.getAllValidOffers(uint256,uint256)._endId](contracts/DSponsorMarketplace.sol#L825) is not in mixedCase

contracts/DSponsorMarketplace.sol#L825


 - [ ] ID-201
Parameter [DSponsorMarketplace.getAllOffers(uint256,uint256)._endId](contracts/DSponsorMarketplace.sol#L811) is not in mixedCase

contracts/DSponsorMarketplace.sol#L811


 - [ ] ID-202
Function [ReentrancyGuardUpgradeable.__ReentrancyGuard_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L61-L64) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L61-L64


 - [ ] ID-203
Parameter [DSponsorMarketplace.makeOffer(IDSponsorMarketplace.OfferParams)._params](contracts/DSponsorMarketplace.sol#L706) is not in mixedCase

contracts/DSponsorMarketplace.sol#L706


 - [ ] ID-204
Parameter [DSponsorMarketplace.closeAuction(uint256,address)._listingId](contracts/DSponsorMarketplace.sol#L575) is not in mixedCase

contracts/DSponsorMarketplace.sol#L575


 - [ ] ID-205
Parameter [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)._startTime](contracts/DSponsorMarketplace.sol#L227) is not in mixedCase

contracts/DSponsorMarketplace.sol#L227


 - [ ] ID-206
Parameter [DSponsorMarketplace.getOffer(uint256)._offerId](contracts/DSponsorMarketplace.sol#L803) is not in mixedCase

contracts/DSponsorMarketplace.sol#L803


 - [ ] ID-207
Function [EIP712._EIP712Version()](node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L157-L159) is not in mixedCase

node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L157-L159


 - [ ] ID-208
Parameter [DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)._params](contracts/DSponsorMarketplace.sol#L150) is not in mixedCase

contracts/DSponsorMarketplace.sol#L150


 - [ ] ID-209
Function [OwnableUpgradeable.__Ownable_init(address)](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L51-L53) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L51-L53


 - [ ] ID-210
Function [ERC4907Upgradeable.__ERC4907_init_unchained()](contracts/lib/ERC4907Upgradeable.sol#L28) is not in mixedCase

contracts/lib/ERC4907Upgradeable.sol#L28


 - [ ] ID-211
Function [ERC2981Upgradeable.__ERC2981_init()](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L65-L66) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L65-L66


 - [ ] ID-212
Parameter [DSponsorAdmin.updateProtocolFee(address,uint96)._recipient](contracts/DSponsorAdmin.sol#L135) is not in mixedCase

contracts/DSponsorAdmin.sol#L135


 - [ ] ID-213
Parameter [DSponsorMarketplace.bid(uint256,uint256,string)._listingId](contracts/DSponsorMarketplace.sol#L477) is not in mixedCase

contracts/DSponsorMarketplace.sol#L477


 - [ ] ID-214
Function [ERC721Upgradeable.__ERC721_init_unchained(string,string)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L57-L61) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L57-L61


 - [ ] ID-215
Parameter [DSponsorNFT.setBaseURI(string)._baseURI](contracts/DSponsorNFT.sol#L244) is not in mixedCase

contracts/DSponsorNFT.sol#L244


 - [ ] ID-216
Function [OwnableUpgradeable.__Ownable_init_unchained(address)](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L55-L60) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L55-L60


 - [ ] ID-217
Parameter [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)._buyoutPricePerToken](contracts/DSponsorMarketplace.sol#L225) is not in mixedCase

contracts/DSponsorMarketplace.sol#L225


 - [ ] ID-218
Parameter [DSponsorMarketplace.closeAuction(uint256,address)._closeFor](contracts/DSponsorMarketplace.sol#L576) is not in mixedCase

contracts/DSponsorMarketplace.sol#L576


 - [ ] ID-219
Function [ERC721RoyaltyUpgradeable.__ERC721Royalty_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L25-L26) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L25-L26


 - [ ] ID-220
Function [ReentrancyGuardUpgradeable.__ReentrancyGuard_init()](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L57-L59) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L57-L59


 - [ ] ID-221
Parameter [DSponsorMarketplace.getAllOffers(uint256,uint256)._startId](contracts/DSponsorMarketplace.sol#L810) is not in mixedCase

contracts/DSponsorMarketplace.sol#L810


 - [ ] ID-222
Function [ERC165Upgradeable.__ERC165_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L25-L26) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L25-L26


 - [ ] ID-223
Function [ContextUpgradeable.__Context_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L21-L22) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L21-L22


 - [ ] ID-224
Parameter [DSponsorMarketplace.acceptOffer(uint256)._offerId](contracts/DSponsorMarketplace.sol#L743) is not in mixedCase

contracts/DSponsorMarketplace.sol#L743


 - [ ] ID-225
Parameter [DSponsorMarketplace.bid(uint256,uint256,string)._referralAdditionalInformation](contracts/DSponsorMarketplace.sol#L479) is not in mixedCase

contracts/DSponsorMarketplace.sol#L479


 - [ ] ID-226
Function [IERC20Permit.DOMAIN_SEPARATOR()](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L89) is not in mixedCase

node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L89


 - [ ] ID-227
Parameter [DSponsorNFT.setTokenURIs(uint256[],string[])._tokenURIs](contracts/DSponsorNFT.sol#L357) is not in mixedCase

contracts/DSponsorNFT.sol#L357


 - [ ] ID-228
Parameter [IDSponsorNFTBase.setBaseURI(string).URI](contracts/interfaces/IDSponsorNFT.sol#L115) is not in mixedCase

contracts/interfaces/IDSponsorNFT.sol#L115


 - [ ] ID-229
Parameter [DSponsorNFT.setTokenURIs(uint256[],string[])._tokenIds](contracts/DSponsorNFT.sol#L356) is not in mixedCase

contracts/DSponsorNFT.sol#L356


 - [ ] ID-230
Parameter [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)._currencyToAccept](contracts/DSponsorMarketplace.sol#L226) is not in mixedCase

contracts/DSponsorMarketplace.sol#L226


 - [ ] ID-231
Constant [ERC721Upgradeable.ERC721StorageLocation](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L42) is not in UPPER_CASE_WITH_UNDERSCORES

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L42


 - [ ] ID-232
Parameter [DSponsorMarketplace.buy(IDSponsorMarketplace.BuyParams[])._buyParams](contracts/DSponsorMarketplace.sol#L332) is not in mixedCase

contracts/DSponsorMarketplace.sol#L332


 - [ ] ID-233
Parameter [DSponsorNFT.setContractURI(string)._contractURI](contracts/DSponsorNFT.sol#L257) is not in mixedCase

contracts/DSponsorNFT.sol#L257


 - [ ] ID-234
Function [ERC4907Upgradeable.__ERC4907_init(string,string)](contracts/lib/ERC4907Upgradeable.sol#L20-L26) is not in mixedCase

contracts/lib/ERC4907Upgradeable.sol#L20-L26


 - [ ] ID-235
Parameter [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)._quantityToList](contracts/DSponsorMarketplace.sol#L223) is not in mixedCase

contracts/DSponsorMarketplace.sol#L223


 - [ ] ID-236
Parameter [DSponsorMarketplace.cancelOffer(uint256)._offerId](contracts/DSponsorMarketplace.sol#L735) is not in mixedCase

contracts/DSponsorMarketplace.sol#L735


 - [ ] ID-237
Parameter [DSponsorNFT.setTokenURI(uint256,string)._tokenId](contracts/DSponsorNFT.sol#L342) is not in mixedCase

contracts/DSponsorNFT.sol#L342


 - [ ] ID-238
Parameter [DSponsorMarketplace.getAllValidOffers(uint256,uint256)._startId](contracts/DSponsorMarketplace.sol#L824) is not in mixedCase

contracts/DSponsorMarketplace.sol#L824


 - [ ] ID-239
Parameter [DSponsorNFT.setTokensAllowlist(bool)._applyTokensAllowlist](contracts/DSponsorNFT.sol#L311) is not in mixedCase

contracts/DSponsorNFT.sol#L311


 - [ ] ID-240
Variable [DSponsorNFT.MAX_SUPPLY](contracts/DSponsorNFT.sol#L37) is not in mixedCase

contracts/DSponsorNFT.sol#L37


 - [ ] ID-241
Parameter [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)._reservePricePerToken](contracts/DSponsorMarketplace.sol#L224) is not in mixedCase

contracts/DSponsorMarketplace.sol#L224


 - [ ] ID-242
Parameter [DSponsorNFT.setTokenURI(uint256,string)._tokenURI](contracts/DSponsorNFT.sol#L343) is not in mixedCase

contracts/DSponsorNFT.sol#L343


 - [ ] ID-243
Variable [ERC4907Upgradeable._users](contracts/lib/ERC4907Upgradeable.sol#L18) is not in mixedCase

contracts/lib/ERC4907Upgradeable.sol#L18


 - [ ] ID-244
Constant [ReentrancyGuardUpgradeable.ReentrancyGuardStorageLocation](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L44) is not in UPPER_CASE_WITH_UNDERSCORES

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L44


 - [ ] ID-245
Function [EIP712._EIP712Name()](node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L146-L148) is not in mixedCase

node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L146-L148


 - [ ] ID-246
Parameter [DSponsorMarketplace.bid(uint256,uint256,string)._pricePerToken](contracts/DSponsorMarketplace.sol#L478) is not in mixedCase

contracts/DSponsorMarketplace.sol#L478


 - [ ] ID-247
Parameter [IDSponsorNFTBase.setTokenURI(uint256,string).URI](contracts/interfaces/IDSponsorNFT.sol#L141) is not in mixedCase

contracts/interfaces/IDSponsorNFT.sol#L141


 - [ ] ID-248
Constant [ERC2981Upgradeable.ERC2981StorageLocation](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L37) is not in UPPER_CASE_WITH_UNDERSCORES

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L37


 - [ ] ID-249
Parameter [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)._listingId](contracts/DSponsorMarketplace.sol#L222) is not in mixedCase

contracts/DSponsorMarketplace.sol#L222


 - [ ] ID-250
Variable [DSponsorNFT.MINTER](contracts/DSponsorNFT.sol#L46) is not in mixedCase

contracts/DSponsorNFT.sol#L46


 - [ ] ID-251
Function [ContextUpgradeable.__Context_init()](node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L18-L19) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L18-L19


 - [ ] ID-252
Parameter [DSponsorAdmin.updateProtocolFee(address,uint96)._bps](contracts/DSponsorAdmin.sol#L136) is not in mixedCase

contracts/DSponsorAdmin.sol#L136


 - [ ] ID-253
Function [ERC165Upgradeable.__ERC165_init()](node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L22-L23) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L22-L23


 - [ ] ID-254
Function [ERC2771ContextUpgradeable.__ERC2771Context_init_unchained(address)](contracts/lib/ERC2771ContextUpgradeable.sol#L29-L33) is not in mixedCase

contracts/lib/ERC2771ContextUpgradeable.sol#L29-L33


 - [ ] ID-255
Function [ERC721RoyaltyUpgradeable.__ERC721Royalty_init()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L22-L23) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L22-L23


 - [ ] ID-256
Function [ERC2981Upgradeable.__ERC2981_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L68-L69) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L68-L69


 - [ ] ID-257
Parameter [DSponsorMarketplace.updateListing(uint256,uint256,uint256,uint256,address,uint256,uint256)._secondsUntilEndTime](contracts/DSponsorMarketplace.sol#L228) is not in mixedCase

contracts/DSponsorMarketplace.sol#L228


 - [ ] ID-258
Parameter [IDSponsorNFTBase.setContractURI(string).URI](contracts/interfaces/IDSponsorNFT.sol#L117) is not in mixedCase

contracts/interfaces/IDSponsorNFT.sol#L117


 - [ ] ID-259
Function [ERC721Upgradeable.__ERC721_init(string,string)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L53-L55) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L53-L55


## similar-names
Impact: Informational
Confidence: Medium
 - [ ] ID-260
Variable [IUniswapV3SwapCallback.uniswapV3SwapCallback(int256,int256,bytes).amount0Delta](node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L17) is too similar to [IUniswapV3SwapCallback.uniswapV3SwapCallback(int256,int256,bytes).amount1Delta](node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L18)

node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L17


 - [ ] ID-261
Variable [ERC2771Context._trustedForwarder](node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L23) is too similar to [ERC2771Context.constructor(address).trustedForwarder_](node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L32)

node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L23


## too-many-digits
Impact: Informational
Confidence: Medium
 - [ ] ID-262
[Clones.clone(address)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L28-L41) uses literals with too many digits:
	- [mstore(uint256,uint256)(0x00,implementation << 0x60 >> 0xe8 | 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L33)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L28-L41


 - [ ] ID-263
[ShortStrings.slitherConstructorConstantVariables()](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L40-L123) uses literals with too many digits:
	- [FALLBACK_SENTINEL = 0x00000000000000000000000000000000000000000000000000000000000000FF](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L42)

node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L40-L123


 - [ ] ID-264
[Clones.cloneDeterministic(address,bytes32)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L50-L63) uses literals with too many digits:
	- [mstore(uint256,uint256)(0x00,implementation << 0x60 >> 0xe8 | 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L55)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L50-L63


