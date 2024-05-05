**THIS CHECKLIST IS NOT COMPLETE**. Use `--show-ignored-findings` to show all the results.
Summary
 - [reentrancy-eth](#reentrancy-eth) (4 results) (High)
 - [divide-before-multiply](#divide-before-multiply) (8 results) (Medium)
 - [incorrect-equality](#incorrect-equality) (15 results) (Medium)
 - [uninitialized-local](#uninitialized-local) (6 results) (Medium)
 - [unused-return](#unused-return) (4 results) (Medium)
 - [shadowing-local](#shadowing-local) (4 results) (Low)
 - [calls-loop](#calls-loop) (2 results) (Low)
 - [reentrancy-benign](#reentrancy-benign) (2 results) (Low)
 - [reentrancy-events](#reentrancy-events) (6 results) (Low)
 - [timestamp](#timestamp) (15 results) (Low)
 - [assembly](#assembly) (28 results) (Informational)
 - [boolean-equal](#boolean-equal) (1 results) (Informational)
 - [pragma](#pragma) (1 results) (Informational)
 - [costly-loop](#costly-loop) (2 results) (Informational)
 - [cyclomatic-complexity](#cyclomatic-complexity) (1 results) (Informational)
 - [dead-code](#dead-code) (8 results) (Informational)
 - [solc-version](#solc-version) (67 results) (Informational)
 - [low-level-calls](#low-level-calls) (5 results) (Informational)
 - [missing-inheritance](#missing-inheritance) (1 results) (Informational)
 - [naming-convention](#naming-convention) (53 results) (Informational)
 - [similar-names](#similar-names) (2 results) (Informational)
 - [too-many-digits](#too-many-digits) (3 results) (Informational)
## reentrancy-eth
Impact: High
Confidence: Medium
 - [ ] ID-0
Reentrancy in [DSponsorMarketplace.bid(uint256,uint256,string)](contracts/DSponsorMarketplace.sol#L497-L594):
	External calls:
	- [_pay(newBid.bidder,address(this),currency,incomingBidAmount)](contracts/DSponsorMarketplace.sol#L539)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L148)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L152)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L154)
	- [_closeAuction(targetListing,newBid)](contracts/DSponsorMarketplace.sol#L546)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [IERC1155(_assetContract).safeTransferFrom(_from,_to,_tokenId,_quantity,)](contracts/DSponsorMarketplace.sol#L894-L900)
		- [IERC4907(_assetContract).setUser(_tokenId,_to,_rentalExpirationTimestamp)](contracts/DSponsorMarketplace.sol#L903-L907)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L148)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [IERC721(_assetContract).safeTransferFrom(_from,_to,_tokenId,)](contracts/DSponsorMarketplace.sol#L909-L914)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L152)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L154)
	External calls sending eth:
	- [_pay(newBid.bidder,address(this),currency,incomingBidAmount)](contracts/DSponsorMarketplace.sol#L539)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
	- [_closeAuction(targetListing,newBid)](contracts/DSponsorMarketplace.sol#L546)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
	State variables written after the call(s):
	- [_closeAuction(targetListing,newBid)](contracts/DSponsorMarketplace.sol#L546)
		- [listings[_targetListing.listingId] = _targetListing](contracts/DSponsorMarketplace.sol#L660)
	[DSponsorMarketplace.listings](contracts/DSponsorMarketplace.sol#L54) can be used in cross function reentrancies:
	- [DSponsorMarketplace.cancelDirectListing(uint256)](contracts/DSponsorMarketplace.sol#L349-L361)
	- [DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L158-L242)
	- [DSponsorMarketplace.listings](contracts/DSponsorMarketplace.sol#L54)
	- [DSponsorMarketplace.onlyListingCreator(uint256)](contracts/DSponsorMarketplace.sol#L66-L71)
	- [DSponsorMarketplace.updateListing(uint256,IDSponsorMarketplace.ListingUpdateParameters)](contracts/DSponsorMarketplace.sol#L245-L346)
	- [_closeAuction(targetListing,newBid)](contracts/DSponsorMarketplace.sol#L546)
		- [winningBid[_targetListing.listingId] = _winningBid](contracts/DSponsorMarketplace.sol#L662)
	[DSponsorMarketplace.winningBid](contracts/DSponsorMarketplace.sol#L57) can be used in cross function reentrancies:
	- [DSponsorMarketplace.winningBid](contracts/DSponsorMarketplace.sol#L57)

contracts/DSponsorMarketplace.sol#L497-L594


 - [ ] ID-1
Reentrancy in [DSponsorMarketplace.bid(uint256,uint256,string)](contracts/DSponsorMarketplace.sol#L497-L594):
	External calls:
	- [_pay(newBid.bidder,address(this),currency,incomingBidAmount)](contracts/DSponsorMarketplace.sol#L539)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L148)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L152)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L154)
	External calls sending eth:
	- [_pay(newBid.bidder,address(this),currency,incomingBidAmount)](contracts/DSponsorMarketplace.sol#L539)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
	State variables written after the call(s):
	- [listings[targetListing.listingId] = targetListing](contracts/DSponsorMarketplace.sol#L573)
	[DSponsorMarketplace.listings](contracts/DSponsorMarketplace.sol#L54) can be used in cross function reentrancies:
	- [DSponsorMarketplace.cancelDirectListing(uint256)](contracts/DSponsorMarketplace.sol#L349-L361)
	- [DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L158-L242)
	- [DSponsorMarketplace.listings](contracts/DSponsorMarketplace.sol#L54)
	- [DSponsorMarketplace.onlyListingCreator(uint256)](contracts/DSponsorMarketplace.sol#L66-L71)
	- [DSponsorMarketplace.updateListing(uint256,IDSponsorMarketplace.ListingUpdateParameters)](contracts/DSponsorMarketplace.sol#L245-L346)
	- [winningBid[targetListing.listingId] = newBid](contracts/DSponsorMarketplace.sol#L569)
	[DSponsorMarketplace.winningBid](contracts/DSponsorMarketplace.sol#L57) can be used in cross function reentrancies:
	- [DSponsorMarketplace.winningBid](contracts/DSponsorMarketplace.sol#L57)

contracts/DSponsorMarketplace.sol#L497-L594


 - [ ] ID-2
Reentrancy in [DSponsorAdmin.mintAndSubmit(DSponsorAdmin.MintAndSubmitAdParams)](contracts/DSponsorAdmin.sol#L79-L132):
	External calls:
	- [_externalCallWithProtocolFee(address(contractAddr),mintCallData,params.currency,mintPrice,referral)](contracts/DSponsorAdmin.sol#L115-L121)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [(success,returndata) = address(token).call(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L115)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L148)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [WETH(weth).deposit{value: amountOut}()](contracts/lib/ProtocolFee.sol#L216)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L152)
		- [IERC20(currency).safeTransferFrom(_msgSender(),address(this),totalAmount)](contracts/lib/ProtocolFee.sol#L100-L104)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L154)
		- [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L229-L231)
		- [IERC20(currency).forceApprove(address(target),baseAmount)](contracts/lib/ProtocolFee.sol#L108)
		- [swapRouter.refundETH()](contracts/lib/ProtocolFee.sol#L234)
		- [retData = Address.functionCallWithValue(target,callData,value)](contracts/lib/ProtocolFee.sol#L120-L124)
		- [Address.sendValue(address(addrRefund),amountRefunded)](contracts/lib/ProtocolFee.sol#L245)
	External calls sending eth:
	- [_externalCallWithProtocolFee(address(contractAddr),mintCallData,params.currency,mintPrice,referral)](contracts/DSponsorAdmin.sol#L115-L121)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [WETH(weth).deposit{value: amountOut}()](contracts/lib/ProtocolFee.sol#L216)
		- [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L229-L231)
	State variables written after the call(s):
	- [_submitAdProposal(params.offerId,params.tokenId,params.adParameters[i],params.adDatas[i])](contracts/DSponsorAdmin.sol#L125-L130)
		- [_sponsoringOffers[offerId].proposals[tokenId][_hashString(adParameter)].lastSubmitted = _proposalCounterId](contracts/DSponsorAgreements.sol#L378-L380)
	[DSponsorAgreements._sponsoringOffers](contracts/DSponsorAgreements.sol#L24) can be used in cross function reentrancies:
	- [DSponsorAgreements._submitAdProposal(uint256,uint256,string,string)](contracts/DSponsorAgreements.sol#L362-L389)
	- [DSponsorAgreements._updateOffer(uint256,bool,string,string)](contracts/DSponsorAgreements.sol#L391-L408)
	- [DSponsorAgreements._updateOfferAdParameters(uint256,bool,string[])](contracts/DSponsorAgreements.sol#L410-L425)
	- [DSponsorAgreements._updateOfferAdmins(uint256,bool,address[])](contracts/DSponsorAgreements.sol#L427-L439)
	- [DSponsorAgreements._updateOfferValidators(uint256,bool,address[])](contracts/DSponsorAgreements.sol#L441-L450)
	- [DSponsorAgreements.createOffer(IERC721,IDSponsorAgreements.OfferInitParams)](contracts/DSponsorAgreements.sol#L117-L154)
	- [DSponsorAgreements.getOfferContract(uint256)](contracts/DSponsorAgreements.sol#L300-L302)
	- [DSponsorAgreements.getOfferProposals(uint256,uint256,string)](contracts/DSponsorAgreements.sol#L304-L323)
	- [DSponsorAgreements.isAllowedAdParameter(uint256,string)](contracts/DSponsorAgreements.sol#L325-L331)
	- [DSponsorAgreements.isOfferAdmin(uint256,address)](contracts/DSponsorAgreements.sol#L333-L338)
	- [DSponsorAgreements.isOfferDisabled(uint256)](contracts/DSponsorAgreements.sol#L340-L342)
	- [DSponsorAgreements.isOfferValidator(uint256,address)](contracts/DSponsorAgreements.sol#L344-L349)
	- [DSponsorAgreements.onlyAdmin(uint256)](contracts/DSponsorAgreements.sol#L30-L35)
	- [DSponsorAgreements.onlyAllowedAdParameter(uint256,string)](contracts/DSponsorAgreements.sol#L37-L47)
	- [DSponsorAgreements.onlySponsor(uint256,uint256)](contracts/DSponsorAgreements.sol#L50-L83)
	- [DSponsorAgreements.onlyValidator(uint256)](contracts/DSponsorAgreements.sol#L85-L93)
	- [DSponsorAgreements.reviewAdProposal(uint256,uint256,uint256,string,bool,string)](contracts/DSponsorAgreements.sol#L210-L248)

contracts/DSponsorAdmin.sol#L79-L132


 - [ ] ID-3
Reentrancy in [DSponsorMarketplace.buy(IDSponsorMarketplace.BuyParams)](contracts/DSponsorMarketplace.sol#L371-L403):
	External calls:
	- [_swapNativeToERC20(buyParams.currency,totalPrice,sentValue,recipientRefund)](contracts/DSponsorMarketplace.sol#L384-L389)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [WETH(weth).deposit{value: amountOut}()](contracts/lib/ProtocolFee.sol#L216)
		- [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L229-L231)
		- [swapRouter.refundETH()](contracts/lib/ProtocolFee.sol#L234)
		- [Address.sendValue(address(addrRefund),amountRefunded)](contracts/lib/ProtocolFee.sol#L245)
	- [_buy(buyParams.listingId,payer,buyParams.buyFor,buyParams.quantity,buyParams.currency,totalPrice,buyParams.referralAdditionalInformation)](contracts/DSponsorMarketplace.sol#L394-L402)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [IERC1155(_assetContract).safeTransferFrom(_from,_to,_tokenId,_quantity,)](contracts/DSponsorMarketplace.sol#L894-L900)
		- [IERC4907(_assetContract).setUser(_tokenId,_to,_rentalExpirationTimestamp)](contracts/DSponsorMarketplace.sol#L903-L907)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L148)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [IERC721(_assetContract).safeTransferFrom(_from,_to,_tokenId,)](contracts/DSponsorMarketplace.sol#L909-L914)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L152)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L154)
	External calls sending eth:
	- [_swapNativeToERC20(buyParams.currency,totalPrice,sentValue,recipientRefund)](contracts/DSponsorMarketplace.sol#L384-L389)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [WETH(weth).deposit{value: amountOut}()](contracts/lib/ProtocolFee.sol#L216)
		- [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L229-L231)
	- [_buy(buyParams.listingId,payer,buyParams.buyFor,buyParams.quantity,buyParams.currency,totalPrice,buyParams.referralAdditionalInformation)](contracts/DSponsorMarketplace.sol#L394-L402)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
	State variables written after the call(s):
	- [_buy(buyParams.listingId,payer,buyParams.buyFor,buyParams.quantity,buyParams.currency,totalPrice,buyParams.referralAdditionalInformation)](contracts/DSponsorMarketplace.sol#L394-L402)
		- [listings[_listingId] = targetListing](contracts/DSponsorMarketplace.sol#L463)
	[DSponsorMarketplace.listings](contracts/DSponsorMarketplace.sol#L54) can be used in cross function reentrancies:
	- [DSponsorMarketplace.cancelDirectListing(uint256)](contracts/DSponsorMarketplace.sol#L349-L361)
	- [DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L158-L242)
	- [DSponsorMarketplace.listings](contracts/DSponsorMarketplace.sol#L54)
	- [DSponsorMarketplace.onlyListingCreator(uint256)](contracts/DSponsorMarketplace.sol#L66-L71)
	- [DSponsorMarketplace.updateListing(uint256,IDSponsorMarketplace.ListingUpdateParameters)](contracts/DSponsorMarketplace.sol#L245-L346)

contracts/DSponsorMarketplace.sol#L371-L403


## divide-before-multiply
Impact: Medium
Confidence: Medium
 - [ ] ID-4
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L192)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-5
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L190)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-6
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse = (3 * denominator) ^ 2](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L184)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-7
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L191)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-8
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L188)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-9
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [prod0 = prod0 / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L172)
	- [result = prod0 * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L199)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-10
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L193)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-11
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L189)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


## incorrect-equality
Impact: Medium
Confidence: High
 - [ ] ID-12
[DSponsorMarketplace._getSafeQuantity(IDSponsorMarketplace.TokenType,uint256)](contracts/DSponsorMarketplace.sol#L1037-L1048) uses a dangerous strict equality:
	- [_tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L1044-L1046)

contracts/DSponsorMarketplace.sol#L1037-L1048


 - [ ] ID-13
[DSponsorMarketplace._transferTokens(IDSponsorMarketplace.TransferType,address,address,address,uint256,uint64,uint256,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L883-L917) uses a dangerous strict equality:
	- [_tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L901)

contracts/DSponsorMarketplace.sol#L883-L917


 - [ ] ID-14
[DSponsorMarketplace.onlyExistingListing(uint256)](contracts/DSponsorMarketplace.sol#L74-L79) uses a dangerous strict equality:
	- [listings[_listingId].assetContract == address(0)](contracts/DSponsorMarketplace.sol#L75)

contracts/DSponsorMarketplace.sol#L74-L79


 - [ ] ID-15
[DSponsorMarketplace._validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType,IDSponsorMarketplace.TransferType,uint64)](contracts/DSponsorMarketplace.sol#L967-L1016) uses a dangerous strict equality:
	- [isValid = IERC4907(_assetContract).userOf(_tokenId) == _tokenOwner && IERC721(_assetContract).isApprovedForAll(_tokenOwner,market) && IERC4907(_assetContract).userExpires(_tokenId) >= _rentalExpirationTimestamp](contracts/DSponsorMarketplace.sol#L1002-L1009)

contracts/DSponsorMarketplace.sol#L967-L1016


 - [ ] ID-16
[DSponsorMarketplace._validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType,IDSponsorMarketplace.TransferType,uint64)](contracts/DSponsorMarketplace.sol#L967-L1016) uses a dangerous strict equality:
	- [isValid = IERC721(_assetContract).ownerOf(_tokenId) == _tokenOwner && (IERC721(_assetContract).getApproved(_tokenId) == market || IERC721(_assetContract).isApprovedForAll(_tokenOwner,market))](contracts/DSponsorMarketplace.sol#L988-L994)

contracts/DSponsorMarketplace.sol#L967-L1016


 - [ ] ID-17
[DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L158-L242) uses a dangerous strict equality:
	- [newListing.listingType == ListingType.Auction](contracts/DSponsorMarketplace.sol#L220)

contracts/DSponsorMarketplace.sol#L158-L242


 - [ ] ID-18
[DSponsorMarketplace._validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType,IDSponsorMarketplace.TransferType,uint64)](contracts/DSponsorMarketplace.sol#L967-L1016) uses a dangerous strict equality:
	- [_tokenType == TokenType.ERC1155 && _transferType != TransferType.Rent](contracts/DSponsorMarketplace.sol#L980-L981)

contracts/DSponsorMarketplace.sol#L967-L1016


 - [ ] ID-19
[DSponsorMarketplace._transferTokens(IDSponsorMarketplace.TransferType,address,address,address,uint256,uint64,uint256,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L883-L917) uses a dangerous strict equality:
	- [_tokenType == TokenType.ERC1155](contracts/DSponsorMarketplace.sol#L893)

contracts/DSponsorMarketplace.sol#L883-L917


 - [ ] ID-20
[DSponsorMarketplace.updateListing(uint256,IDSponsorMarketplace.ListingUpdateParameters)](contracts/DSponsorMarketplace.sol#L245-L346) uses a dangerous strict equality:
	- [_params.startTime == 0](contracts/DSponsorMarketplace.sol#L279-L281)

contracts/DSponsorMarketplace.sol#L245-L346


 - [ ] ID-21
[ProtocolFee._pay(address,address,address,uint256)](contracts/lib/ProtocolFee.sol#L137-L158) uses a dangerous strict equality:
	- [currency == address(0)](contracts/lib/ProtocolFee.sol#L144)

contracts/lib/ProtocolFee.sol#L137-L158


 - [ ] ID-22
[DSponsorMarketplace.updateListing(uint256,IDSponsorMarketplace.ListingUpdateParameters)](contracts/DSponsorMarketplace.sol#L245-L346) uses a dangerous strict equality:
	- [_params.secondsUntilEndTime == 0](contracts/DSponsorMarketplace.sol#L283-L285)

contracts/DSponsorMarketplace.sol#L245-L346


 - [ ] ID-23
[DSponsorMarketplace._transferTokens(IDSponsorMarketplace.TransferType,address,address,address,uint256,uint64,uint256,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L883-L917) uses a dangerous strict equality:
	- [_transferType == TransferType.Rent](contracts/DSponsorMarketplace.sol#L902)

contracts/DSponsorMarketplace.sol#L883-L917


 - [ ] ID-24
[DSponsorMarketplace._validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType,IDSponsorMarketplace.TransferType,uint64)](contracts/DSponsorMarketplace.sol#L967-L1016) uses a dangerous strict equality:
	- [_tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L987)

contracts/DSponsorMarketplace.sol#L967-L1016


 - [ ] ID-25
[DSponsorMarketplace._getSafeQuantity(IDSponsorMarketplace.TokenType,uint256)](contracts/DSponsorMarketplace.sol#L1037-L1048) uses a dangerous strict equality:
	- [_quantityToCheck == 0](contracts/DSponsorMarketplace.sol#L1041)

contracts/DSponsorMarketplace.sol#L1037-L1048


 - [ ] ID-26
[DSponsorMarketplace._validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType,IDSponsorMarketplace.TransferType,uint64)](contracts/DSponsorMarketplace.sol#L967-L1016) uses a dangerous strict equality:
	- [_transferType == TransferType.Rent && IERC4907(_assetContract).userOf(_tokenId) != address(0) && IERC4907(_assetContract).userOf(_tokenId) != IERC721(_assetContract).ownerOf(_tokenId)](contracts/DSponsorMarketplace.sol#L997-L1000)

contracts/DSponsorMarketplace.sol#L967-L1016


## uninitialized-local
Impact: Medium
Confidence: Medium
 - [ ] ID-27
[DSponsorMarketplace._payout(address,address,address,uint256,address,uint256,IProtocolFee.ReferralRevenue).royaltyCut](contracts/DSponsorMarketplace.sol#L934) is a local variable never initialized

contracts/DSponsorMarketplace.sol#L934


 - [ ] ID-28
[ERC2771Forwarder.executeBatch(ERC2771Forwarder.ForwardRequestData[],address).refundValue](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L169) is a local variable never initialized

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L169


 - [ ] ID-29
[DSponsorMarketplace._payout(address,address,address,uint256,address,uint256,IProtocolFee.ReferralRevenue).royaltyFeeAmount](contracts/DSponsorMarketplace.sol#L938) is a local variable never initialized

contracts/DSponsorMarketplace.sol#L938


 - [ ] ID-30
[DSponsorMarketplace._payout(address,address,address,uint256,address,uint256,IProtocolFee.ReferralRevenue).royaltyFeeRecipient](contracts/DSponsorMarketplace.sol#L938) is a local variable never initialized

contracts/DSponsorMarketplace.sol#L938


 - [ ] ID-31
[ERC2771Forwarder.executeBatch(ERC2771Forwarder.ForwardRequestData[],address).i](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L171) is a local variable never initialized

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L171


 - [ ] ID-32
[DSponsorMarketplace._payout(address,address,address,uint256,address,uint256,IProtocolFee.ReferralRevenue).royaltyRecipient](contracts/DSponsorMarketplace.sol#L935) is a local variable never initialized

contracts/DSponsorMarketplace.sol#L935


## unused-return
Impact: Medium
Confidence: Medium
 - [ ] ID-33
[DSponsorAgreements.onlySponsor(uint256,uint256)](contracts/DSponsorAgreements.sol#L50-L83) ignores return value by [IERC4907(address(_sponsoringOffers[offerId].nftContract)).userOf(tokenId)](contracts/DSponsorAgreements.sol#L54-L63)

contracts/DSponsorAgreements.sol#L50-L83


 - [ ] ID-34
[ERC721Upgradeable._checkOnERC721Received(address,address,uint256,bytes)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L494-L511) ignores return value by [IERC721Receiver(to).onERC721Received(_msgSender(),from,tokenId,data)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L496-L509)

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L494-L511


 - [ ] ID-35
[ERC721._checkOnERC721Received(address,address,uint256,bytes)](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L465-L482) ignores return value by [IERC721Receiver(to).onERC721Received(_msgSender(),from,tokenId,data)](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L467-L480)

node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L465-L482


 - [ ] ID-36
[DSponsorMarketplace._payout(address,address,address,uint256,address,uint256,IProtocolFee.ReferralRevenue)](contracts/DSponsorMarketplace.sol#L920-L953) ignores return value by [IERC2981(_assetContract).royaltyInfo(_tokenId,_totalPayoutAmount)](contracts/DSponsorMarketplace.sol#L936-L943)

contracts/DSponsorMarketplace.sol#L920-L953


## shadowing-local
Impact: Low
Confidence: High
 - [ ] ID-37
[ERC4907Upgradeable.__ERC4907_init(string,string).symbol](contracts/lib/ERC4907Upgradeable.sol#L24) shadows:
	- [ERC721Upgradeable.symbol()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L102-L105) (function)
	- [IERC721Metadata.symbol()](node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L21) (function)

contracts/lib/ERC4907Upgradeable.sol#L24


 - [ ] ID-38
[DSponsorNFT.setBaseURI(string)._baseURI](contracts/DSponsorNFT.sol#L244) shadows:
	- [ERC721Upgradeable._baseURI()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L122-L124) (function)

contracts/DSponsorNFT.sol#L244


 - [ ] ID-39
[ERC4907Upgradeable.__ERC4907_init(string,string).name](contracts/lib/ERC4907Upgradeable.sol#L23) shadows:
	- [ERC721Upgradeable.name()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L94-L97) (function)
	- [IERC721Metadata.name()](node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L16) (function)

contracts/lib/ERC4907Upgradeable.sol#L23


 - [ ] ID-40
[DSponsorNFT._setBaseURI(string)._baseURI](contracts/DSponsorNFT.sol#L549) shadows:
	- [ERC721Upgradeable._baseURI()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L122-L124) (function)

contracts/DSponsorNFT.sol#L549


## calls-loop
Impact: Low
Confidence: Medium
 - [ ] ID-41
[DSponsorAgreements.onlySponsor(uint256,uint256)](contracts/DSponsorAgreements.sol#L50-L83) has external calls inside a loop: [IERC4907(address(_sponsoringOffers[offerId].nftContract)).userOf(tokenId)](contracts/DSponsorAgreements.sol#L54-L63)

contracts/DSponsorAgreements.sol#L50-L83


 - [ ] ID-42
[DSponsorAgreements.onlySponsor(uint256,uint256)](contracts/DSponsorAgreements.sol#L50-L83) has external calls inside a loop: [isOwner = _sponsoringOffers[offerId].nftContract.ownerOf(tokenId) == _msgSender()](contracts/DSponsorAgreements.sol#L69-L71)

contracts/DSponsorAgreements.sol#L50-L83


## reentrancy-benign
Impact: Low
Confidence: Medium
 - [ ] ID-43
Reentrancy in [DSponsorAdmin.mintAndSubmit(DSponsorAdmin.MintAndSubmitAdParams)](contracts/DSponsorAdmin.sol#L79-L132):
	External calls:
	- [_externalCallWithProtocolFee(address(contractAddr),mintCallData,params.currency,mintPrice,referral)](contracts/DSponsorAdmin.sol#L115-L121)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [(success,returndata) = address(token).call(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L115)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L148)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [WETH(weth).deposit{value: amountOut}()](contracts/lib/ProtocolFee.sol#L216)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L152)
		- [IERC20(currency).safeTransferFrom(_msgSender(),address(this),totalAmount)](contracts/lib/ProtocolFee.sol#L100-L104)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L154)
		- [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L229-L231)
		- [IERC20(currency).forceApprove(address(target),baseAmount)](contracts/lib/ProtocolFee.sol#L108)
		- [swapRouter.refundETH()](contracts/lib/ProtocolFee.sol#L234)
		- [retData = Address.functionCallWithValue(target,callData,value)](contracts/lib/ProtocolFee.sol#L120-L124)
		- [Address.sendValue(address(addrRefund),amountRefunded)](contracts/lib/ProtocolFee.sol#L245)
	External calls sending eth:
	- [_externalCallWithProtocolFee(address(contractAddr),mintCallData,params.currency,mintPrice,referral)](contracts/DSponsorAdmin.sol#L115-L121)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [WETH(weth).deposit{value: amountOut}()](contracts/lib/ProtocolFee.sol#L216)
		- [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L229-L231)
	State variables written after the call(s):
	- [_submitAdProposal(params.offerId,params.tokenId,params.adParameters[i],params.adDatas[i])](contracts/DSponsorAdmin.sol#L125-L130)
		- [_proposalCounterId ++](contracts/DSponsorAgreements.sol#L376)

contracts/DSponsorAdmin.sol#L79-L132


 - [ ] ID-44
Reentrancy in [DSponsorAdmin.createDSponsorNFTAndOffer(IDSponsorNFTBase.InitParams,IDSponsorAgreements.OfferInitParams)](contracts/DSponsorAdmin.sol#L56-L64):
	External calls:
	- [newDSponsorNFT = nftFactory.createDSponsorNFT(nftParams)](contracts/DSponsorAdmin.sol#L62)
	State variables written after the call(s):
	- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L63)
		- [_offerCountId ++](contracts/DSponsorAgreements.sol#L133)
	- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L63)
		- [_sponsoringOffers[offerId].disabled = disable](contracts/DSponsorAgreements.sol#L397)
		- [_sponsoringOffers[offerId].validators[validators[i]] = enable](contracts/DSponsorAgreements.sol#L447)
		- [_sponsoringOffers[offerId].adParameters[adParameterHash] = enable](contracts/DSponsorAgreements.sol#L417)
		- [_sponsoringOffers[offerId].admins[admins[i]] = enable](contracts/DSponsorAgreements.sol#L436)
		- [_sponsoringOffers[_offerCountId].nftContract = nftContract](contracts/DSponsorAgreements.sol#L135)

contracts/DSponsorAdmin.sol#L56-L64


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-45
Reentrancy in [DSponsorNFTFactory.createDSponsorNFT(IDSponsorNFTBase.InitParams)](contracts/DSponsorNFTFactory.sol#L38-L60):
	External calls:
	- [DSponsorNFT(instance).initialize(params)](contracts/DSponsorNFTFactory.sol#L42)
	Event emitted after the call(s):
	- [NewDSponsorNFT(instance,params.initialOwner,params.name,params.symbol,params.baseURI,params.contractURI,params.minter,params.maxSupply,params.forwarder,params.royaltyBps,params.currencies,params.prices,params.allowedTokenIds)](contracts/DSponsorNFTFactory.sol#L44-L58)

contracts/DSponsorNFTFactory.sol#L38-L60


 - [ ] ID-46
Reentrancy in [DSponsorMarketplace.updateListing(uint256,IDSponsorMarketplace.ListingUpdateParameters)](contracts/DSponsorMarketplace.sol#L245-L346):
	External calls:
	- [_transferListingTokens(address(this),targetListing.tokenOwner,targetListing.quantity,targetListing)](contracts/DSponsorMarketplace.sol#L316-L321)
		- [IERC1155(_assetContract).safeTransferFrom(_from,_to,_tokenId,_quantity,)](contracts/DSponsorMarketplace.sol#L894-L900)
		- [IERC4907(_assetContract).setUser(_tokenId,_to,_rentalExpirationTimestamp)](contracts/DSponsorMarketplace.sol#L903-L907)
		- [IERC721(_assetContract).safeTransferFrom(_from,_to,_tokenId,)](contracts/DSponsorMarketplace.sol#L909-L914)
	- [_transferListingTokens(targetListing.tokenOwner,address(this),safeNewQuantity,targetListing)](contracts/DSponsorMarketplace.sol#L336-L341)
		- [IERC1155(_assetContract).safeTransferFrom(_from,_to,_tokenId,_quantity,)](contracts/DSponsorMarketplace.sol#L894-L900)
		- [IERC4907(_assetContract).setUser(_tokenId,_to,_rentalExpirationTimestamp)](contracts/DSponsorMarketplace.sol#L903-L907)
		- [IERC721(_assetContract).safeTransferFrom(_from,_to,_tokenId,)](contracts/DSponsorMarketplace.sol#L909-L914)
	Event emitted after the call(s):
	- [ListingUpdated(_listingId,targetListing.tokenOwner,_params)](contracts/DSponsorMarketplace.sol#L345)

contracts/DSponsorMarketplace.sol#L245-L346


 - [ ] ID-47
Reentrancy in [ProtocolFee._payFee(address,address,uint256,address,IProtocolFee.ReferralRevenue)](contracts/lib/ProtocolFee.sol#L169-L186):
	External calls:
	- [_pay(from,feeRecipient,currency,feeAmount)](contracts/lib/ProtocolFee.sol#L176)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L148)
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


 - [ ] ID-48
Reentrancy in [DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L158-L242):
	External calls:
	- [_transferListingTokens(tokenOwner,address(this),tokenAmountToList,newListing)](contracts/DSponsorMarketplace.sol#L228-L233)
		- [IERC1155(_assetContract).safeTransferFrom(_from,_to,_tokenId,_quantity,)](contracts/DSponsorMarketplace.sol#L894-L900)
		- [IERC4907(_assetContract).setUser(_tokenId,_to,_rentalExpirationTimestamp)](contracts/DSponsorMarketplace.sol#L903-L907)
		- [IERC721(_assetContract).safeTransferFrom(_from,_to,_tokenId,)](contracts/DSponsorMarketplace.sol#L909-L914)
	Event emitted after the call(s):
	- [ListingAdded(listingId,_params.assetContract,tokenOwner,newListing)](contracts/DSponsorMarketplace.sol#L236-L241)

contracts/DSponsorMarketplace.sol#L158-L242


 - [ ] ID-49
Reentrancy in [ProtocolFee._externalCallWithProtocolFee(address,bytes,address,uint256,IProtocolFee.ReferralRevenue)](contracts/lib/ProtocolFee.sol#L74-L127):
	External calls:
	- [_swapNativeToERC20(currency,totalAmount,msg.value,referral.spender)](contracts/lib/ProtocolFee.sol#L93-L98)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [WETH(weth).deposit{value: amountOut}()](contracts/lib/ProtocolFee.sol#L216)
		- [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L229-L231)
		- [swapRouter.refundETH()](contracts/lib/ProtocolFee.sol#L234)
		- [Address.sendValue(address(addrRefund),amountRefunded)](contracts/lib/ProtocolFee.sol#L245)
	- [IERC20(currency).safeTransferFrom(_msgSender(),address(this),totalAmount)](contracts/lib/ProtocolFee.sol#L100-L104)
	- [IERC20(currency).forceApprove(address(target),baseAmount)](contracts/lib/ProtocolFee.sol#L108)
	- [_payFee(address(this),currency,feeAmount,target,referral)](contracts/lib/ProtocolFee.sol#L111)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [Address.sendValue(address(to),feeAmount)](contracts/lib/ProtocolFee.sol#L148)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [IERC20(currency).safeTransfer(to,feeAmount)](contracts/lib/ProtocolFee.sol#L152)
		- [IERC20(currency).safeTransferFrom(from,to,feeAmount)](contracts/lib/ProtocolFee.sol#L154)
	External calls sending eth:
	- [_swapNativeToERC20(currency,totalAmount,msg.value,referral.spender)](contracts/lib/ProtocolFee.sol#L93-L98)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [WETH(weth).deposit{value: amountOut}()](contracts/lib/ProtocolFee.sol#L216)
		- [amountOut = swapRouter.exactOutputSingle{value: amountInMaximum}(params)](contracts/lib/ProtocolFee.sol#L229-L231)
	- [_payFee(address(this),currency,feeAmount,target,referral)](contracts/lib/ProtocolFee.sol#L111)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
	Event emitted after the call(s):
	- [CallWithProtocolFee(origin,currency,feeAmount,referral.enabler,referral.spender,referral.additionalInformation)](contracts/lib/ProtocolFee.sol#L178-L185)
		- [_payFee(address(this),currency,feeAmount,target,referral)](contracts/lib/ProtocolFee.sol#L111)

contracts/lib/ProtocolFee.sol#L74-L127


 - [ ] ID-50
Reentrancy in [DSponsorAdmin.createDSponsorNFTAndOffer(IDSponsorNFTBase.InitParams,IDSponsorAgreements.OfferInitParams)](contracts/DSponsorAdmin.sol#L56-L64):
	External calls:
	- [newDSponsorNFT = nftFactory.createDSponsorNFT(nftParams)](contracts/DSponsorAdmin.sol#L62)
	Event emitted after the call(s):
	- [UpdateOffer(offerId,disable,name,offerMetadata,_sponsoringOffers[offerId].nftContract,_msgSender())](contracts/DSponsorAgreements.sol#L400-L407)
		- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L63)
	- [UpdateOfferAdParameter(offerId,adParameterHash,enable,adParameters[i])](contracts/DSponsorAgreements.sol#L418-L423)
		- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L63)
	- [UpdateOfferAdmin(offerId,admins[i],enable)](contracts/DSponsorAgreements.sol#L437)
		- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L63)
	- [UpdateOfferValidator(offerId,validators[i],enable)](contracts/DSponsorAgreements.sol#L448)
		- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L63)

contracts/DSponsorAdmin.sol#L56-L64


## timestamp
Impact: Low
Confidence: Medium
 - [ ] ID-51
[DSponsorMarketplace._transferTokens(IDSponsorMarketplace.TransferType,address,address,address,uint256,uint64,uint256,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L883-L917) uses timestamp for comparisons
	Dangerous comparisons:
	- [_tokenType == TokenType.ERC1155](contracts/DSponsorMarketplace.sol#L893)
	- [_tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L901)
	- [_transferType == TransferType.Rent](contracts/DSponsorMarketplace.sol#L902)

contracts/DSponsorMarketplace.sol#L883-L917


 - [ ] ID-52
[ERC4907Upgradeable.userOf(uint256)](contracts/lib/ERC4907Upgradeable.sol#L72-L80) uses timestamp for comparisons
	Dangerous comparisons:
	- [_users[tokenId].expires >= block.timestamp](contracts/lib/ERC4907Upgradeable.sol#L75)

contracts/lib/ERC4907Upgradeable.sol#L72-L80


 - [ ] ID-53
[DSponsorMarketplace._buy(uint256,address,address,uint256,address,uint256,string)](contracts/DSponsorMarketplace.sol#L406-L490) uses timestamp for comparisons
	Dangerous comparisons:
	- [targetListing.listingType != ListingType.Direct](contracts/DSponsorMarketplace.sol#L417)
	- [_currency != targetListing.currency](contracts/DSponsorMarketplace.sol#L422)
	- [_totalPrice != targetListing.buyoutPricePerToken * _quantityToBuy](contracts/DSponsorMarketplace.sol#L425)
	- [_quantityToBuy > targetListing.quantity](contracts/DSponsorMarketplace.sol#L433)
	- [block.timestamp > targetListing.endTime || block.timestamp < targetListing.startTime](contracts/DSponsorMarketplace.sol#L439-L440)

contracts/DSponsorMarketplace.sol#L406-L490


 - [ ] ID-54
[DSponsorMarketplace.updateListing(uint256,IDSponsorMarketplace.ListingUpdateParameters)](contracts/DSponsorMarketplace.sol#L245-L346) uses timestamp for comparisons
	Dangerous comparisons:
	- [block.timestamp > targetListing.startTime](contracts/DSponsorMarketplace.sol#L262)
	- [_params.startTime > 0 && _params.startTime < block.timestamp](contracts/DSponsorMarketplace.sol#L274)
	- [targetListing.transferType == TransferType.Rent && _params.rentalExpirationTimestamp < endTime](contracts/DSponsorMarketplace.sol#L288-L289)
	- [_params.startTime == 0](contracts/DSponsorMarketplace.sol#L279-L281)
	- [_params.secondsUntilEndTime == 0](contracts/DSponsorMarketplace.sol#L283-L285)

contracts/DSponsorMarketplace.sol#L245-L346


 - [ ] ID-55
[DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)](contracts/DSponsorMarketplace.sol#L158-L242) uses timestamp for comparisons
	Dangerous comparisons:
	- [startTime < block.timestamp](contracts/DSponsorMarketplace.sol#L185)
	- [newListing.listingType == ListingType.Auction](contracts/DSponsorMarketplace.sol#L220)
	- [newListing.buyoutPricePerToken > 0 && newListing.buyoutPricePerToken < newListing.reservePricePerToken](contracts/DSponsorMarketplace.sol#L222-L223)

contracts/DSponsorMarketplace.sol#L158-L242


 - [ ] ID-56
[DSponsorMarketplace._validateOwnershipAndApproval(address,address,uint256,uint256,IDSponsorMarketplace.TokenType,IDSponsorMarketplace.TransferType,uint64)](contracts/DSponsorMarketplace.sol#L967-L1016) uses timestamp for comparisons
	Dangerous comparisons:
	- [_tokenType == TokenType.ERC1155 && _transferType != TransferType.Rent](contracts/DSponsorMarketplace.sol#L980-L981)
	- [isValid = IERC1155(_assetContract).balanceOf(_tokenOwner,_tokenId) >= _quantity && IERC1155(_assetContract).isApprovedForAll(_tokenOwner,market)](contracts/DSponsorMarketplace.sol#L983-L986)
	- [_tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L987)
	- [isValid = IERC721(_assetContract).ownerOf(_tokenId) == _tokenOwner && (IERC721(_assetContract).getApproved(_tokenId) == market || IERC721(_assetContract).isApprovedForAll(_tokenOwner,market))](contracts/DSponsorMarketplace.sol#L988-L994)
	- [_transferType == TransferType.Rent && IERC4907(_assetContract).userOf(_tokenId) != address(0) && IERC4907(_assetContract).userOf(_tokenId) != IERC721(_assetContract).ownerOf(_tokenId)](contracts/DSponsorMarketplace.sol#L997-L1000)
	- [isValid = IERC4907(_assetContract).userOf(_tokenId) == _tokenOwner && IERC721(_assetContract).isApprovedForAll(_tokenOwner,market) && IERC4907(_assetContract).userExpires(_tokenId) >= _rentalExpirationTimestamp](contracts/DSponsorMarketplace.sol#L1002-L1009)

contracts/DSponsorMarketplace.sol#L967-L1016


 - [ ] ID-57
[DSponsorMarketplace._cancelAuction(IDSponsorMarketplace.Listing)](contracts/DSponsorMarketplace.sol#L628-L649) uses timestamp for comparisons
	Dangerous comparisons:
	- [listings[_targetListing.listingId].tokenOwner != _msgSender()](contracts/DSponsorMarketplace.sol#L629)

contracts/DSponsorMarketplace.sol#L628-L649


 - [ ] ID-58
[DSponsorMarketplace._getSafeQuantity(IDSponsorMarketplace.TokenType,uint256)](contracts/DSponsorMarketplace.sol#L1037-L1048) uses timestamp for comparisons
	Dangerous comparisons:
	- [_quantityToCheck == 0](contracts/DSponsorMarketplace.sol#L1041)
	- [_tokenType == TokenType.ERC721](contracts/DSponsorMarketplace.sol#L1044-L1046)

contracts/DSponsorMarketplace.sol#L1037-L1048


 - [ ] ID-59
[ERC2771Forwarder._validate(ERC2771Forwarder.ForwardRequestData)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L199-L210) uses timestamp for comparisons
	Dangerous comparisons:
	- [(_isTrustedByTarget(request.to),request.deadline >= block.timestamp,isValid && recovered == request.from,recovered)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L204-L209)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L199-L210


 - [ ] ID-60
[DSponsorMarketplace.bid(uint256,uint256,string)](contracts/DSponsorMarketplace.sol#L497-L594) uses timestamp for comparisons
	Dangerous comparisons:
	- [targetListing.listingType != ListingType.Auction](contracts/DSponsorMarketplace.sol#L509)
	- [block.timestamp > targetListing.endTime || block.timestamp < targetListing.startTime](contracts/DSponsorMarketplace.sol#L515-L516)
	- [targetListing.buyoutPricePerToken > 0 && incomingBidAmount >= targetListing.buyoutPricePerToken * quantity](contracts/DSponsorMarketplace.sol#L543-L544)
	- [isValidNewBid = incomingBidAmount >= _reserveAmount](contracts/DSponsorMarketplace.sol#L557)
	- [targetListing.endTime - block.timestamp <= timeBuffer](contracts/DSponsorMarketplace.sol#L571)

contracts/DSponsorMarketplace.sol#L497-L594


 - [ ] ID-61
[DSponsorMarketplace._validateNewOffer(IDSponsorMarketplace.OfferParams,IDSponsorMarketplace.TokenType)](contracts/DSponsorMarketplace.sol#L805-L841) uses timestamp for comparisons
	Dangerous comparisons:
	- [_params.expirationTimestamp < block.timestamp](contracts/DSponsorMarketplace.sol#L821)

contracts/DSponsorMarketplace.sol#L805-L841


 - [ ] ID-62
[ERC2771Forwarder._execute(ERC2771Forwarder.ForwardRequestData,bool)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L254-L297) uses timestamp for comparisons
	Dangerous comparisons:
	- [isTrustedForwarder && signerMatch && active](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L277)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L254-L297


 - [ ] ID-63
[DSponsorMarketplace.closeAuction(uint256)](contracts/DSponsorMarketplace.sol#L600-L625) uses timestamp for comparisons
	Dangerous comparisons:
	- [targetListing.listingType != ListingType.Auction](contracts/DSponsorMarketplace.sol#L605)
	- [toCancel = targetListing.startTime > block.timestamp || targetBid.bidder == address(0)](contracts/DSponsorMarketplace.sol#L612-L613)
	- [targetListing.endTime > block.timestamp](contracts/DSponsorMarketplace.sol#L619)

contracts/DSponsorMarketplace.sol#L600-L625


 - [ ] ID-64
[ERC2771Forwarder.verify(ERC2771Forwarder.ForwardRequestData)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L111-L114) uses timestamp for comparisons
	Dangerous comparisons:
	- [isTrustedForwarder && active && signerMatch](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L113)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L111-L114


 - [ ] ID-65
[DSponsorMarketplace.acceptOffer(uint256)](contracts/DSponsorMarketplace.sol#L740-L802) uses timestamp for comparisons
	Dangerous comparisons:
	- [_targetOffer.expirationTimestamp < block.timestamp](contracts/DSponsorMarketplace.sol#L745)

contracts/DSponsorMarketplace.sol#L740-L802


## assembly
Impact: Informational
Confidence: High
 - [ ] ID-66
[Initializable._getInitializableStorage()](node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L223-L227) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L224-L226)

node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L223-L227


 - [ ] ID-67
[StorageSlot.getUint256Slot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L89-L94) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L91-L93)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L89-L94


 - [ ] ID-68
[MessageHashUtils.toEthSignedMessageHash(bytes32)](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L30-L37) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L32-L36)

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L30-L37


 - [ ] ID-69
[StorageSlot.getAddressSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L59-L64) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L61-L63)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L59-L64


 - [ ] ID-70
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L130-L133)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L154-L161)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L167-L176)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-71
[MessageHashUtils.toTypedDataHash(bytes32,bytes32)](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L76-L85) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L78-L84)

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L76-L85


 - [ ] ID-72
[ERC2771Forwarder._execute(ERC2771Forwarder.ForwardRequestData,bool)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L254-L297) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L288-L291)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L254-L297


 - [ ] ID-73
[ERC2771Forwarder._isTrustedByTarget(address)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L305-L324) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L312-L321)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L305-L324


 - [ ] ID-74
[ReentrancyGuardUpgradeable._getReentrancyGuardStorage()](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L46-L50) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L47-L49)

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L46-L50


 - [ ] ID-75
[Strings.toString(uint256)](node_modules/@openzeppelin/contracts/utils/Strings.sol#L24-L44) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L30-L32)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L36-L38)

node_modules/@openzeppelin/contracts/utils/Strings.sol#L24-L44


 - [ ] ID-76
[StorageSlot.getBooleanSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L69-L74) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L71-L73)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L69-L74


 - [ ] ID-77
[ERC721Upgradeable._checkOnERC721Received(address,address,uint256,bytes)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L494-L511) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L505-L507)

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L494-L511


 - [ ] ID-78
[ERC721Upgradeable._getERC721Storage()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L44-L48) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L45-L47)

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L44-L48


 - [ ] ID-79
[Clones.clone(address)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L28-L41) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L30-L37)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L28-L41


 - [ ] ID-80
[StorageSlot.getBytesSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L119-L124) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L121-L123)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L119-L124


 - [ ] ID-81
[StorageSlot.getStringSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L99-L104) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L101-L103)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L99-L104


 - [ ] ID-82
[ERC2771Forwarder._checkForwardedGas(uint256,ERC2771Forwarder.ForwardRequestData)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L338-L369) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L365-L367)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L338-L369


 - [ ] ID-83
[OwnableUpgradeable._getOwnableStorage()](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L30-L34) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L31-L33)

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L30-L34


 - [ ] ID-84
[Clones.predictDeterministicAddress(address,bytes32,address)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L68-L84) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L74-L83)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L68-L84


 - [ ] ID-85
[Address._revert(bytes)](node_modules/@openzeppelin/contracts/utils/Address.sol#L146-L158) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Address.sol#L151-L154)

node_modules/@openzeppelin/contracts/utils/Address.sol#L146-L158


 - [ ] ID-86
[ERC2981Upgradeable._getERC2981Storage()](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L39-L43) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L40-L42)

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L39-L43


 - [ ] ID-87
[StorageSlot.getBytesSlot(bytes)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L129-L134) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L131-L133)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L129-L134


 - [ ] ID-88
[StorageSlot.getStringSlot(string)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L109-L114) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L111-L113)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L109-L114


 - [ ] ID-89
[ShortStrings.toString(ShortString)](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L63-L73) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L68-L71)

node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L63-L73


 - [ ] ID-90
[StorageSlot.getBytes32Slot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L79-L84) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L81-L83)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L79-L84


 - [ ] ID-91
[Clones.cloneDeterministic(address,bytes32)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L50-L63) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L52-L59)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L50-L63


 - [ ] ID-92
[ERC721._checkOnERC721Received(address,address,uint256,bytes)](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L465-L482) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L476-L478)

node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L465-L482


 - [ ] ID-93
[ECDSA.tryRecover(bytes32,bytes)](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L56-L73) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L64-L68)

node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L56-L73


## boolean-equal
Impact: Informational
Confidence: High
 - [ ] ID-94
[ERC4907Upgradeable.setUser(uint256,address,uint64)](contracts/lib/ERC4907Upgradeable.sol#L42-L66) compares to a boolean constant:
	-[(currentUser != _msgSender() && isApprovedForAll(currentUser,_msgSender()) == false) || (userExpires(tokenId) < expires)](contracts/lib/ERC4907Upgradeable.sol#L54-L56)

contracts/lib/ERC4907Upgradeable.sol#L42-L66


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-95
Different versions of Solidity are used:
	- Version used: ['>=0.5.0', '>=0.7.5', '^0.8.0', '^0.8.11', '^0.8.20']
	- [>=0.5.0](node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L2)
	- [>=0.7.5](node_modules/@uniswap/swap-router-contracts/contracts/interfaces/IV3SwapRouter.sol#L2)
	- [>=0.7.5](node_modules/@uniswap/v3-periphery/contracts/interfaces/IPeripheryPayments.sol#L2)
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
	- [v2](node_modules/@uniswap/swap-router-contracts/contracts/interfaces/IV3SwapRouter.sol#L3)

node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L2


## costly-loop
Impact: Informational
Confidence: Medium
 - [ ] ID-96
[DSponsorAgreements._submitAdProposal(uint256,uint256,string,string)](contracts/DSponsorAgreements.sol#L362-L389) has costly operations inside a loop:
	- [_proposalCounterId ++](contracts/DSponsorAgreements.sol#L376)

contracts/DSponsorAgreements.sol#L362-L389


 - [ ] ID-97
[DSponsorNFT._setDefaultMintPrice(address,bool,uint256)](contracts/DSponsorNFT.sol#L563-L578) has costly operations inside a loop:
	- [_defaultMintNativePrice = MintPriceSettings(enabled,amount)](contracts/DSponsorNFT.sol#L574)

contracts/DSponsorNFT.sol#L563-L578


## cyclomatic-complexity
Impact: Informational
Confidence: High
 - [ ] ID-98
[DSponsorMarketplace.updateListing(uint256,IDSponsorMarketplace.ListingUpdateParameters)](contracts/DSponsorMarketplace.sol#L245-L346) has a high cyclomatic complexity (12).

contracts/DSponsorMarketplace.sol#L245-L346


## dead-code
Impact: Informational
Confidence: Medium
 - [ ] ID-99
[DSponsorMarketplace._msgData()](contracts/DSponsorMarketplace.sol#L1083-L1091) is never used and should be removed

contracts/DSponsorMarketplace.sol#L1083-L1091


 - [ ] ID-100
[DSponsorNFT._msgData()](contracts/DSponsorNFT.sol#L483-L491) is never used and should be removed

contracts/DSponsorNFT.sol#L483-L491


 - [ ] ID-101
[ERC2771ContextUpgradeable._msgData()](contracts/lib/ERC2771ContextUpgradeable.sol#L85-L102) is never used and should be removed

contracts/lib/ERC2771ContextUpgradeable.sol#L85-L102


 - [ ] ID-102
[ReentrantDSponsorAdmin._completeAttack()](contracts/mocks/ReentrantDSponsorAdmin.sol#L62) is never used and should be removed

contracts/mocks/ReentrantDSponsorAdmin.sol#L62


 - [ ] ID-103
[ReentrantDSponsorNFT._completeAttack()](contracts/mocks/ReentrantDSponsorNFT.sol#L23) is never used and should be removed

contracts/mocks/ReentrantDSponsorNFT.sol#L23


 - [ ] ID-104
[ERC2771ContextUpgradeable.__ERC2771Context_init(address,address)](contracts/lib/ERC2771ContextUpgradeable.sol#L20-L27) is never used and should be removed

contracts/lib/ERC2771ContextUpgradeable.sol#L20-L27


 - [ ] ID-105
[DSponsorAdmin._msgData()](contracts/DSponsorAdmin.sol#L151-L159) is never used and should be removed

contracts/DSponsorAdmin.sol#L151-L159


 - [ ] ID-106
[ERC2771ContextOwnable._msgData()](contracts/lib/ERC2771ContextOwnable.sol#L70-L87) is never used and should be removed

contracts/lib/ERC2771ContextOwnable.sol#L70-L87


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-107
Pragma version[^0.8.20](contracts/lib/Reentrant.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/Reentrant.sol#L2


 - [ ] ID-108
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L4


 - [ ] ID-109
Pragma version[^0.8.20](contracts/interfaces/IDSponsorAgreements.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IDSponsorAgreements.sol#L2


 - [ ] ID-110
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC2981.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/interfaces/IERC2981.sol#L4


 - [ ] ID-111
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4


 - [ ] ID-112
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155.sol#L4


 - [ ] ID-113
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol#L4


 - [ ] ID-114
Pragma version[^0.8.11](contracts/interfaces/IDSponsorMarketplace.sol#L2) allows old versions

contracts/interfaces/IDSponsorMarketplace.sol#L2


 - [ ] ID-115
Pragma version[^0.8.20](contracts/interfaces/IDSponsorNFTFactory.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IDSponsorNFTFactory.sol#L2


 - [ ] ID-116
Pragma version[^0.8.20](contracts/DSponsorAdmin.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorAdmin.sol#L2


 - [ ] ID-117
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol#L3


 - [ ] ID-118
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L4


 - [ ] ID-119
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L4


 - [ ] ID-120
Pragma version[^0.8.20](contracts/mocks/ERC20Mock.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ERC20Mock.sol#L2


 - [ ] ID-121
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L4


 - [ ] ID-122
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/Strings.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/Strings.sol#L4


 - [ ] ID-123
Pragma version[^0.8.20](contracts/interfaces/IProtocolFee.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IProtocolFee.sol#L2


 - [ ] ID-124
Pragma version[^0.8.20](contracts/DSponsorNFT.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorNFT.sol#L2


 - [ ] ID-125
Pragma version[^0.8.0](contracts/lib/Tokens.sol#L2) allows old versions

contracts/lib/Tokens.sol#L2


 - [ ] ID-126
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L4


 - [ ] ID-127
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/Address.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/Address.sol#L4


 - [ ] ID-128
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/access/Ownable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/access/Ownable.sol#L4


 - [ ] ID-129
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC721.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/interfaces/IERC721.sol#L4


 - [ ] ID-130
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol#L4


 - [ ] ID-131
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L4


 - [ ] ID-132
Pragma version[>=0.7.5](node_modules/@uniswap/swap-router-contracts/contracts/interfaces/IV3SwapRouter.sol#L2) allows old versions

node_modules/@uniswap/swap-router-contracts/contracts/interfaces/IV3SwapRouter.sol#L2


 - [ ] ID-133
solc-0.8.20 is not recommended for deployment

 - [ ] ID-134
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L4


 - [ ] ID-135
Pragma version[^0.8.20](contracts/interfaces/IDSponsorNFT.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IDSponsorNFT.sol#L2


 - [ ] ID-136
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/Nonces.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/Nonces.sol#L3


 - [ ] ID-137
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L5) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L5


 - [ ] ID-138
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L4


 - [ ] ID-139
Pragma version[^0.8.20](contracts/lib/ERC4907Upgradeable.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/ERC4907Upgradeable.sol#L2


 - [ ] ID-140
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L4


 - [ ] ID-141
Pragma version[^0.8.20](contracts/DSponsorNFTFactory.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorNFTFactory.sol#L2


 - [ ] ID-142
Pragma version[^0.8.20](contracts/mocks/ERC721Mock.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ERC721Mock.sol#L2


 - [ ] ID-143
Pragma version[^0.8.20](contracts/mocks/ERC2771ForwarderMock.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ERC2771ForwarderMock.sol#L2


 - [ ] ID-144
Pragma version[^0.8.20](contracts/DSponsorAgreements.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorAgreements.sol#L2


 - [ ] ID-145
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L4


 - [ ] ID-146
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L4


 - [ ] ID-147
Pragma version[>=0.7.5](node_modules/@uniswap/v3-periphery/contracts/interfaces/IPeripheryPayments.sol#L2) allows old versions

node_modules/@uniswap/v3-periphery/contracts/interfaces/IPeripheryPayments.sol#L2


 - [ ] ID-148
Pragma version[^0.8.20](contracts/DSponsorMarketplace.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorMarketplace.sol#L2


 - [ ] ID-149
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L4


 - [ ] ID-150
Pragma version[^0.8.20](contracts/mocks/ReentrantDSponsorAdmin.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ReentrantDSponsorAdmin.sol#L2


 - [ ] ID-151
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L4


 - [ ] ID-152
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol#L4


 - [ ] ID-153
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol#L4


 - [ ] ID-154
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4


 - [ ] ID-155
Pragma version[^0.8.20](contracts/lib/ERC2771ContextUpgradeable.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/ERC2771ContextUpgradeable.sol#L2


 - [ ] ID-156
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/math/SignedMath.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/math/SignedMath.sol#L4


 - [ ] ID-157
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/Context.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/Context.sol#L4


 - [ ] ID-158
Pragma version[^0.8.20](contracts/mocks/ReentrantDSponsorNFT.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ReentrantDSponsorNFT.sol#L2


 - [ ] ID-159
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L4


 - [ ] ID-160
Pragma version[>=0.5.0](node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L2) allows old versions

node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L2


 - [ ] ID-161
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L4


 - [ ] ID-162
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L4


 - [ ] ID-163
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L4


 - [ ] ID-164
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L4


 - [ ] ID-165
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC5267.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/interfaces/IERC5267.sol#L4


 - [ ] ID-166
Pragma version[^0.8.20](contracts/lib/ProtocolFee.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/ProtocolFee.sol#L2


 - [ ] ID-167
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#L4


 - [ ] ID-168
Pragma version[^0.8.20](contracts/lib/ERC2771ContextOwnable.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/ERC2771ContextOwnable.sol#L2


 - [ ] ID-169
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L4


 - [ ] ID-170
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L4


 - [ ] ID-171
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L4


 - [ ] ID-172
Pragma version[^0.8.20](contracts/interfaces/IERC4907.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IERC4907.sol#L3


 - [ ] ID-173
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L4


## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-174
Low level call in [SafeERC20._callOptionalReturnBool(IERC20,bytes)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L110-L117):
	- [(success,returndata) = address(token).call(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L115)

node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L110-L117


 - [ ] ID-175
Low level call in [Address.functionStaticCall(address,bytes)](node_modules/@openzeppelin/contracts/utils/Address.sol#L95-L98):
	- [(success,returndata) = target.staticcall(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L96)

node_modules/@openzeppelin/contracts/utils/Address.sol#L95-L98


 - [ ] ID-176
Low level call in [Address.functionDelegateCall(address,bytes)](node_modules/@openzeppelin/contracts/utils/Address.sol#L104-L107):
	- [(success,returndata) = target.delegatecall(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L105)

node_modules/@openzeppelin/contracts/utils/Address.sol#L104-L107


 - [ ] ID-177
Low level call in [Address.functionCallWithValue(address,bytes,uint256)](node_modules/@openzeppelin/contracts/utils/Address.sol#L83-L89):
	- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)

node_modules/@openzeppelin/contracts/utils/Address.sol#L83-L89


 - [ ] ID-178
Low level call in [Address.sendValue(address,uint256)](node_modules/@openzeppelin/contracts/utils/Address.sol#L41-L50):
	- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)

node_modules/@openzeppelin/contracts/utils/Address.sol#L41-L50


## missing-inheritance
Impact: Informational
Confidence: High
 - [ ] ID-179
[DSponsorNFT](contracts/DSponsorNFT.sol#L21-L615) should inherit from [IDSponsorNFT](contracts/interfaces/IDSponsorNFT.sol#L167)

contracts/DSponsorNFT.sol#L21-L615


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-180
Function [IDSponsorNFTBase.MAX_SUPPLY()](contracts/interfaces/IDSponsorNFT.sol#L107) is not in mixedCase

contracts/interfaces/IDSponsorNFT.sol#L107


 - [ ] ID-181
Parameter [DSponsorMarketplace.closeAuction(uint256)._listingId](contracts/DSponsorMarketplace.sol#L601) is not in mixedCase

contracts/DSponsorMarketplace.sol#L601


 - [ ] ID-182
Parameter [DSponsorMarketplace.cancelDirectListing(uint256)._listingId](contracts/DSponsorMarketplace.sol#L350) is not in mixedCase

contracts/DSponsorMarketplace.sol#L350


 - [ ] ID-183
Constant [OwnableUpgradeable.OwnableStorageLocation](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L28) is not in UPPER_CASE_WITH_UNDERSCORES

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L28


 - [ ] ID-184
Function [ERC2771ContextUpgradeable.__ERC2771Context_init(address,address)](contracts/lib/ERC2771ContextUpgradeable.sol#L20-L27) is not in mixedCase

contracts/lib/ERC2771ContextUpgradeable.sol#L20-L27


 - [ ] ID-185
Function [UniV3SwapRouter.WETH9()](contracts/lib/ProtocolFee.sol#L19) is not in mixedCase

contracts/lib/ProtocolFee.sol#L19


 - [ ] ID-186
Function [ReentrancyGuardUpgradeable.__ReentrancyGuard_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L61-L64) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L61-L64


 - [ ] ID-187
Parameter [DSponsorMarketplace.makeOffer(IDSponsorMarketplace.OfferParams)._params](contracts/DSponsorMarketplace.sol#L701) is not in mixedCase

contracts/DSponsorMarketplace.sol#L701


 - [ ] ID-188
Parameter [DSponsorMarketplace.updateListing(uint256,IDSponsorMarketplace.ListingUpdateParameters)._params](contracts/DSponsorMarketplace.sol#L247) is not in mixedCase

contracts/DSponsorMarketplace.sol#L247


 - [ ] ID-189
Function [EIP712._EIP712Version()](node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L157-L159) is not in mixedCase

node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L157-L159


 - [ ] ID-190
Parameter [DSponsorMarketplace.createListing(IDSponsorMarketplace.ListingParameters)._params](contracts/DSponsorMarketplace.sol#L158) is not in mixedCase

contracts/DSponsorMarketplace.sol#L158


 - [ ] ID-191
Function [OwnableUpgradeable.__Ownable_init(address)](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L51-L53) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L51-L53


 - [ ] ID-192
Function [ERC4907Upgradeable.__ERC4907_init_unchained()](contracts/lib/ERC4907Upgradeable.sol#L30) is not in mixedCase

contracts/lib/ERC4907Upgradeable.sol#L30


 - [ ] ID-193
Function [ERC2981Upgradeable.__ERC2981_init()](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L65-L66) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L65-L66


 - [ ] ID-194
Parameter [DSponsorAdmin.updateProtocolFee(address,uint96)._recipient](contracts/DSponsorAdmin.sol#L135) is not in mixedCase

contracts/DSponsorAdmin.sol#L135


 - [ ] ID-195
Parameter [DSponsorMarketplace.bid(uint256,uint256,string)._listingId](contracts/DSponsorMarketplace.sol#L498) is not in mixedCase

contracts/DSponsorMarketplace.sol#L498


 - [ ] ID-196
Function [ERC721Upgradeable.__ERC721_init_unchained(string,string)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L57-L61) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L57-L61


 - [ ] ID-197
Parameter [DSponsorNFT.setBaseURI(string)._baseURI](contracts/DSponsorNFT.sol#L244) is not in mixedCase

contracts/DSponsorNFT.sol#L244


 - [ ] ID-198
Function [OwnableUpgradeable.__Ownable_init_unchained(address)](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L55-L60) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L55-L60


 - [ ] ID-199
Function [ERC721RoyaltyUpgradeable.__ERC721Royalty_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L25-L26) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L25-L26


 - [ ] ID-200
Function [ReentrancyGuardUpgradeable.__ReentrancyGuard_init()](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L57-L59) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L57-L59


 - [ ] ID-201
Function [ERC165Upgradeable.__ERC165_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L25-L26) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L25-L26


 - [ ] ID-202
Function [ContextUpgradeable.__Context_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L21-L22) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L21-L22


 - [ ] ID-203
Parameter [DSponsorMarketplace.acceptOffer(uint256)._offerId](contracts/DSponsorMarketplace.sol#L741) is not in mixedCase

contracts/DSponsorMarketplace.sol#L741


 - [ ] ID-204
Parameter [DSponsorMarketplace.bid(uint256,uint256,string)._referralAdditionalInformation](contracts/DSponsorMarketplace.sol#L500) is not in mixedCase

contracts/DSponsorMarketplace.sol#L500


 - [ ] ID-205
Function [IERC20Permit.DOMAIN_SEPARATOR()](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L89) is not in mixedCase

node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L89


 - [ ] ID-206
Parameter [DSponsorNFT.setTokenURIs(uint256[],string[])._tokenURIs](contracts/DSponsorNFT.sol#L358) is not in mixedCase

contracts/DSponsorNFT.sol#L358


 - [ ] ID-207
Parameter [IDSponsorNFTBase.setBaseURI(string).URI](contracts/interfaces/IDSponsorNFT.sol#L122) is not in mixedCase

contracts/interfaces/IDSponsorNFT.sol#L122


 - [ ] ID-208
Parameter [DSponsorNFT.setTokenURIs(uint256[],string[])._tokenIds](contracts/DSponsorNFT.sol#L357) is not in mixedCase

contracts/DSponsorNFT.sol#L357


 - [ ] ID-209
Constant [ERC721Upgradeable.ERC721StorageLocation](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L42) is not in UPPER_CASE_WITH_UNDERSCORES

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L42


 - [ ] ID-210
Parameter [DSponsorNFT.setContractURI(string)._contractURI](contracts/DSponsorNFT.sol#L257) is not in mixedCase

contracts/DSponsorNFT.sol#L257


 - [ ] ID-211
Function [ERC4907Upgradeable.__ERC4907_init(string,string)](contracts/lib/ERC4907Upgradeable.sol#L22-L28) is not in mixedCase

contracts/lib/ERC4907Upgradeable.sol#L22-L28


 - [ ] ID-212
Parameter [DSponsorMarketplace.cancelOffer(uint256)._offerId](contracts/DSponsorMarketplace.sol#L733) is not in mixedCase

contracts/DSponsorMarketplace.sol#L733


 - [ ] ID-213
Parameter [DSponsorNFT.setTokenURI(uint256,string)._tokenId](contracts/DSponsorNFT.sol#L342) is not in mixedCase

contracts/DSponsorNFT.sol#L342


 - [ ] ID-214
Parameter [DSponsorNFT.setTokensAllowlist(bool)._applyTokensAllowlist](contracts/DSponsorNFT.sol#L311) is not in mixedCase

contracts/DSponsorNFT.sol#L311


 - [ ] ID-215
Variable [DSponsorNFT.MAX_SUPPLY](contracts/DSponsorNFT.sol#L37) is not in mixedCase

contracts/DSponsorNFT.sol#L37


 - [ ] ID-216
Parameter [DSponsorNFT.setTokenURI(uint256,string)._tokenURI](contracts/DSponsorNFT.sol#L343) is not in mixedCase

contracts/DSponsorNFT.sol#L343


 - [ ] ID-217
Variable [ERC4907Upgradeable._users](contracts/lib/ERC4907Upgradeable.sol#L20) is not in mixedCase

contracts/lib/ERC4907Upgradeable.sol#L20


 - [ ] ID-218
Constant [ReentrancyGuardUpgradeable.ReentrancyGuardStorageLocation](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L44) is not in UPPER_CASE_WITH_UNDERSCORES

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L44


 - [ ] ID-219
Function [EIP712._EIP712Name()](node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L146-L148) is not in mixedCase

node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L146-L148


 - [ ] ID-220
Parameter [DSponsorMarketplace.bid(uint256,uint256,string)._pricePerToken](contracts/DSponsorMarketplace.sol#L499) is not in mixedCase

contracts/DSponsorMarketplace.sol#L499


 - [ ] ID-221
Parameter [IDSponsorNFTBase.setTokenURI(uint256,string).URI](contracts/interfaces/IDSponsorNFT.sol#L148) is not in mixedCase

contracts/interfaces/IDSponsorNFT.sol#L148


 - [ ] ID-222
Constant [ERC2981Upgradeable.ERC2981StorageLocation](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L37) is not in UPPER_CASE_WITH_UNDERSCORES

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L37


 - [ ] ID-223
Variable [DSponsorNFT.MINTER](contracts/DSponsorNFT.sol#L46) is not in mixedCase

contracts/DSponsorNFT.sol#L46


 - [ ] ID-224
Function [ContextUpgradeable.__Context_init()](node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L18-L19) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L18-L19


 - [ ] ID-225
Parameter [DSponsorAdmin.updateProtocolFee(address,uint96)._bps](contracts/DSponsorAdmin.sol#L136) is not in mixedCase

contracts/DSponsorAdmin.sol#L136


 - [ ] ID-226
Function [ERC165Upgradeable.__ERC165_init()](node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L22-L23) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L22-L23


 - [ ] ID-227
Function [ERC2771ContextUpgradeable.__ERC2771Context_init_unchained(address)](contracts/lib/ERC2771ContextUpgradeable.sol#L29-L33) is not in mixedCase

contracts/lib/ERC2771ContextUpgradeable.sol#L29-L33


 - [ ] ID-228
Parameter [DSponsorMarketplace.updateListing(uint256,IDSponsorMarketplace.ListingUpdateParameters)._listingId](contracts/DSponsorMarketplace.sol#L246) is not in mixedCase

contracts/DSponsorMarketplace.sol#L246


 - [ ] ID-229
Function [ERC721RoyaltyUpgradeable.__ERC721Royalty_init()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L22-L23) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L22-L23


 - [ ] ID-230
Function [ERC2981Upgradeable.__ERC2981_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L68-L69) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L68-L69


 - [ ] ID-231
Parameter [IDSponsorNFTBase.setContractURI(string).URI](contracts/interfaces/IDSponsorNFT.sol#L124) is not in mixedCase

contracts/interfaces/IDSponsorNFT.sol#L124


 - [ ] ID-232
Function [ERC721Upgradeable.__ERC721_init(string,string)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L53-L55) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L53-L55


## similar-names
Impact: Informational
Confidence: Medium
 - [ ] ID-233
Variable [IUniswapV3SwapCallback.uniswapV3SwapCallback(int256,int256,bytes).amount0Delta](node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L17) is too similar to [IUniswapV3SwapCallback.uniswapV3SwapCallback(int256,int256,bytes).amount1Delta](node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L18)

node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L17


 - [ ] ID-234
Variable [ERC2771Context._trustedForwarder](node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L23) is too similar to [ERC2771Context.constructor(address).trustedForwarder_](node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L32)

node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L23


## too-many-digits
Impact: Informational
Confidence: Medium
 - [ ] ID-235
[Clones.clone(address)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L28-L41) uses literals with too many digits:
	- [mstore(uint256,uint256)(0x00,implementation << 0x60 >> 0xe8 | 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L33)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L28-L41


 - [ ] ID-236
[ShortStrings.slitherConstructorConstantVariables()](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L40-L123) uses literals with too many digits:
	- [FALLBACK_SENTINEL = 0x00000000000000000000000000000000000000000000000000000000000000FF](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L42)

node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L40-L123


 - [ ] ID-237
[Clones.cloneDeterministic(address,bytes32)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L50-L63) uses literals with too many digits:
	- [mstore(uint256,uint256)(0x00,implementation << 0x60 >> 0xe8 | 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L55)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L50-L63


