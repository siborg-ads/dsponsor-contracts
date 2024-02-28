**THIS CHECKLIST IS NOT COMPLETE**. Use `--show-ignored-findings` to show all the results.
Summary
 - [reentrancy-eth](#reentrancy-eth) (1 results) (High)
 - [divide-before-multiply](#divide-before-multiply) (8 results) (Medium)
 - [uninitialized-local](#uninitialized-local) (2 results) (Medium)
 - [unused-return](#unused-return) (3 results) (Medium)
 - [shadowing-local](#shadowing-local) (4 results) (Low)
 - [reentrancy-benign](#reentrancy-benign) (2 results) (Low)
 - [reentrancy-events](#reentrancy-events) (3 results) (Low)
 - [timestamp](#timestamp) (4 results) (Low)
 - [assembly](#assembly) (28 results) (Informational)
 - [pragma](#pragma) (1 results) (Informational)
 - [costly-loop](#costly-loop) (2 results) (Informational)
 - [dead-code](#dead-code) (7 results) (Informational)
 - [solc-version](#solc-version) (62 results) (Informational)
 - [low-level-calls](#low-level-calls) (5 results) (Informational)
 - [missing-inheritance](#missing-inheritance) (1 results) (Informational)
 - [naming-convention](#naming-convention) (38 results) (Informational)
 - [similar-names](#similar-names) (2 results) (Informational)
 - [too-many-digits](#too-many-digits) (3 results) (Informational)
## reentrancy-eth
Impact: High
Confidence: Medium
 - [ ] ID-0
Reentrancy in [DSponsorAdmin.mintAndSubmit(DSponsorAdmin.MintAndSubmitAdParams)](contracts/DSponsorAdmin.sol#L77-L130):
	External calls:
	- [_callWithProtocolFee(address(contractAddr),mintCallData,params.currency,mintPrice,referral)](contracts/DSponsorAdmin.sol#L113-L119)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [amountOut = swapRouter.exactOutputSingle{value: msg.value}(params)](contracts/lib/ProtocolFee.sol#L143)
		- [(success,returndata) = address(token).call(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L115)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [Address.sendValue(address(recipient),fee)](contracts/lib/ProtocolFee.sol#L72)
		- [IERC20(currency).safeTransfer(recipient,fee)](contracts/lib/ProtocolFee.sol#L79)
		- [IERC20(currency).safeTransferFrom(_msgSender(),recipient,fee)](contracts/lib/ProtocolFee.sol#L82)
		- [IERC20(currency).safeTransferFrom(_msgSender(),address(this),baseAmount)](contracts/lib/ProtocolFee.sol#L83-L87)
		- [IERC20(currency).forceApprove(address(target),baseAmount)](contracts/lib/ProtocolFee.sol#L91)
		- [retData = Address.functionCallWithValue(target,callData,value)](contracts/lib/ProtocolFee.sol#L101-L105)
	External calls sending eth:
	- [_callWithProtocolFee(address(contractAddr),mintCallData,params.currency,mintPrice,referral)](contracts/DSponsorAdmin.sol#L113-L119)
		- [amountOut = swapRouter.exactOutputSingle{value: msg.value}(params)](contracts/lib/ProtocolFee.sol#L143)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
	State variables written after the call(s):
	- [_submitAdProposal(params.offerId,params.tokenId,params.adParameters[i],params.adDatas[i])](contracts/DSponsorAdmin.sol#L123-L128)
		- [_sponsoringOffers[offerId].proposals[tokenId][_hashString(adParameter)].lastSubmitted = _proposalCounterId](contracts/DSponsorAgreements.sol#L332-L334)
	[DSponsorAgreements._sponsoringOffers](contracts/DSponsorAgreements.sol#L24) can be used in cross function reentrancies:
	- [DSponsorAgreements._submitAdProposal(uint256,uint256,string,string)](contracts/DSponsorAgreements.sol#L316-L343)
	- [DSponsorAgreements._updateOffer(uint256,bool,string,string)](contracts/DSponsorAgreements.sol#L345-L361)
	- [DSponsorAgreements._updateOfferAdParameters(uint256,bool,string[])](contracts/DSponsorAgreements.sol#L363-L374)
	- [DSponsorAgreements._updateOfferAdmins(uint256,bool,address[])](contracts/DSponsorAgreements.sol#L376-L388)
	- [DSponsorAgreements._updateOfferValidators(uint256,bool,address[])](contracts/DSponsorAgreements.sol#L390-L399)
	- [DSponsorAgreements.createOffer(IERC721,IDSponsorAgreements.OfferInitParams)](contracts/DSponsorAgreements.sol#L110-L147)
	- [DSponsorAgreements.getOfferContract(uint256)](contracts/DSponsorAgreements.sol#L254-L256)
	- [DSponsorAgreements.getOfferProposals(uint256,uint256,string)](contracts/DSponsorAgreements.sol#L258-L277)
	- [DSponsorAgreements.isAllowedAdParameter(uint256,string)](contracts/DSponsorAgreements.sol#L279-L285)
	- [DSponsorAgreements.isOfferAdmin(uint256,address)](contracts/DSponsorAgreements.sol#L287-L292)
	- [DSponsorAgreements.isOfferDisabled(uint256)](contracts/DSponsorAgreements.sol#L294-L296)
	- [DSponsorAgreements.isOfferValidator(uint256,address)](contracts/DSponsorAgreements.sol#L298-L303)
	- [DSponsorAgreements.onlyAdmin(uint256)](contracts/DSponsorAgreements.sol#L30-L35)
	- [DSponsorAgreements.onlyAllowedAdParameter(uint256,string)](contracts/DSponsorAgreements.sol#L37-L47)
	- [DSponsorAgreements.onlySponsor(uint256,uint256)](contracts/DSponsorAgreements.sol#L50-L76)
	- [DSponsorAgreements.onlyValidator(uint256)](contracts/DSponsorAgreements.sol#L78-L86)
	- [DSponsorAgreements.reviewAdProposal(uint256,uint256,uint256,string,bool,string)](contracts/DSponsorAgreements.sol#L210-L248)

contracts/DSponsorAdmin.sol#L77-L130


## divide-before-multiply
Impact: Medium
Confidence: Medium
 - [ ] ID-1
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L192)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-2
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L190)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-3
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse = (3 * denominator) ^ 2](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L184)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-4
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L191)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-5
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L188)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-6
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [prod0 = prod0 / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L172)
	- [result = prod0 * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L199)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-7
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L193)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-8
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L169)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L189)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


## uninitialized-local
Impact: Medium
Confidence: Medium
 - [ ] ID-9
[ERC2771Forwarder.executeBatch(ERC2771Forwarder.ForwardRequestData[],address).refundValue](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L169) is a local variable never initialized

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L169


 - [ ] ID-10
[ERC2771Forwarder.executeBatch(ERC2771Forwarder.ForwardRequestData[],address).i](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L171) is a local variable never initialized

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L171


## unused-return
Impact: Medium
Confidence: Medium
 - [ ] ID-11
[ERC721Upgradeable._checkOnERC721Received(address,address,uint256,bytes)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L494-L511) ignores return value by [IERC721Receiver(to).onERC721Received(_msgSender(),from,tokenId,data)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L496-L509)

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L494-L511


 - [ ] ID-12
[ERC721._checkOnERC721Received(address,address,uint256,bytes)](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L465-L482) ignores return value by [IERC721Receiver(to).onERC721Received(_msgSender(),from,tokenId,data)](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L467-L480)

node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L465-L482


 - [ ] ID-13
[DSponsorAgreements.onlySponsor(uint256,uint256)](contracts/DSponsorAgreements.sol#L50-L76) ignores return value by [IERC4907(address(_sponsoringOffers[offerId].nftContract)).userOf(tokenId)](contracts/DSponsorAgreements.sol#L57-L64)

contracts/DSponsorAgreements.sol#L50-L76


## shadowing-local
Impact: Low
Confidence: High
 - [ ] ID-14
[ERC4907Upgradeable.__ERC4907_init(string,string).symbol](contracts/lib/ERC4907Upgradeable.sol#L22) shadows:
	- [ERC721Upgradeable.symbol()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L102-L105) (function)
	- [IERC721Metadata.symbol()](node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L21) (function)

contracts/lib/ERC4907Upgradeable.sol#L22


 - [ ] ID-15
[DSponsorNFT.setBaseURI(string)._baseURI](contracts/DSponsorNFT.sol#L231) shadows:
	- [ERC721Upgradeable._baseURI()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L122-L124) (function)

contracts/DSponsorNFT.sol#L231


 - [ ] ID-16
[ERC4907Upgradeable.__ERC4907_init(string,string).name](contracts/lib/ERC4907Upgradeable.sol#L21) shadows:
	- [ERC721Upgradeable.name()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L94-L97) (function)
	- [IERC721Metadata.name()](node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L16) (function)

contracts/lib/ERC4907Upgradeable.sol#L21


 - [ ] ID-17
[DSponsorNFT._setBaseURI(string)._baseURI](contracts/DSponsorNFT.sol#L506) shadows:
	- [ERC721Upgradeable._baseURI()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L122-L124) (function)

contracts/DSponsorNFT.sol#L506


## reentrancy-benign
Impact: Low
Confidence: Medium
 - [ ] ID-18
Reentrancy in [DSponsorAdmin.mintAndSubmit(DSponsorAdmin.MintAndSubmitAdParams)](contracts/DSponsorAdmin.sol#L77-L130):
	External calls:
	- [_callWithProtocolFee(address(contractAddr),mintCallData,params.currency,mintPrice,referral)](contracts/DSponsorAdmin.sol#L113-L119)
		- [returndata = address(token).functionCall(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L96)
		- [amountOut = swapRouter.exactOutputSingle{value: msg.value}(params)](contracts/lib/ProtocolFee.sol#L143)
		- [(success,returndata) = address(token).call(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L115)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
		- [Address.sendValue(address(recipient),fee)](contracts/lib/ProtocolFee.sol#L72)
		- [IERC20(currency).safeTransfer(recipient,fee)](contracts/lib/ProtocolFee.sol#L79)
		- [IERC20(currency).safeTransferFrom(_msgSender(),recipient,fee)](contracts/lib/ProtocolFee.sol#L82)
		- [IERC20(currency).safeTransferFrom(_msgSender(),address(this),baseAmount)](contracts/lib/ProtocolFee.sol#L83-L87)
		- [IERC20(currency).forceApprove(address(target),baseAmount)](contracts/lib/ProtocolFee.sol#L91)
		- [retData = Address.functionCallWithValue(target,callData,value)](contracts/lib/ProtocolFee.sol#L101-L105)
	External calls sending eth:
	- [_callWithProtocolFee(address(contractAddr),mintCallData,params.currency,mintPrice,referral)](contracts/DSponsorAdmin.sol#L113-L119)
		- [amountOut = swapRouter.exactOutputSingle{value: msg.value}(params)](contracts/lib/ProtocolFee.sol#L143)
		- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)
		- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)
	State variables written after the call(s):
	- [_submitAdProposal(params.offerId,params.tokenId,params.adParameters[i],params.adDatas[i])](contracts/DSponsorAdmin.sol#L123-L128)
		- [_proposalCounterId ++](contracts/DSponsorAgreements.sol#L330)

contracts/DSponsorAdmin.sol#L77-L130


 - [ ] ID-19
Reentrancy in [DSponsorAdmin.createDSponsorNFTAndOffer(IDSponsorNFTBase.InitParams,IDSponsorAgreements.OfferInitParams)](contracts/DSponsorAdmin.sol#L56-L62):
	External calls:
	- [newDSponsorNFT = nftFactory.createDSponsorNFT(nftParams)](contracts/DSponsorAdmin.sol#L60)
	State variables written after the call(s):
	- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L61)
		- [_offerCountId ++](contracts/DSponsorAgreements.sol#L126)
	- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L61)
		- [_sponsoringOffers[offerId].disabled = disable](contracts/DSponsorAgreements.sol#L351)
		- [_sponsoringOffers[offerId].adParameters[_hashString(adParameters[i])] = enable](contracts/DSponsorAgreements.sol#L369-L371)
		- [_sponsoringOffers[offerId].validators[validators[i]] = enable](contracts/DSponsorAgreements.sol#L396)
		- [_sponsoringOffers[offerId].admins[admins[i]] = enable](contracts/DSponsorAgreements.sol#L385)
		- [_sponsoringOffers[_offerCountId].nftContract = nftContract](contracts/DSponsorAgreements.sol#L128)

contracts/DSponsorAdmin.sol#L56-L62


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-20
Reentrancy in [DSponsorNFTFactory.createDSponsorNFT(IDSponsorNFTBase.InitParams)](contracts/DSponsorNFTFactory.sol#L37-L58):
	External calls:
	- [DSponsorNFT(instance).initialize(params)](contracts/DSponsorNFTFactory.sol#L41)
	Event emitted after the call(s):
	- [NewDSponsorNFT(instance,params.initialOwner,params.name,params.symbol,params.baseURI,params.contractURI,params.maxSupply,params.forwarder,params.royaltyBps,params.currencies,params.prices,params.allowedTokenIds)](contracts/DSponsorNFTFactory.sol#L43-L56)

contracts/DSponsorNFTFactory.sol#L37-L58


 - [ ] ID-21
Reentrancy in [ProtocolFee._callWithProtocolFee(address,bytes,address,uint256,IProtocolFee.ReferralRevenue)](contracts/lib/ProtocolFee.sol#L56-L117):
	External calls:
	- [Address.sendValue(address(recipient),fee)](contracts/lib/ProtocolFee.sol#L72)
	- [_swapNativeToERC20(currency,totalAmount)](contracts/lib/ProtocolFee.sol#L78)
		- [amountOut = swapRouter.exactOutputSingle{value: msg.value}(params)](contracts/lib/ProtocolFee.sol#L143)
	- [IERC20(currency).safeTransfer(recipient,fee)](contracts/lib/ProtocolFee.sol#L79)
	- [IERC20(currency).safeTransferFrom(_msgSender(),recipient,fee)](contracts/lib/ProtocolFee.sol#L82)
	- [IERC20(currency).safeTransferFrom(_msgSender(),address(this),baseAmount)](contracts/lib/ProtocolFee.sol#L83-L87)
	- [IERC20(currency).forceApprove(address(target),baseAmount)](contracts/lib/ProtocolFee.sol#L91)
	- [retData = Address.functionCallWithValue(target,callData,value)](contracts/lib/ProtocolFee.sol#L101-L105)
	External calls sending eth:
	- [_swapNativeToERC20(currency,totalAmount)](contracts/lib/ProtocolFee.sol#L78)
		- [amountOut = swapRouter.exactOutputSingle{value: msg.value}(params)](contracts/lib/ProtocolFee.sol#L143)
	Event emitted after the call(s):
	- [CallWithProtocolFee(target,currency,fee,referral.enabler,referral.spender,referral.additionalInformation)](contracts/lib/ProtocolFee.sol#L107-L114)

contracts/lib/ProtocolFee.sol#L56-L117


 - [ ] ID-22
Reentrancy in [DSponsorAdmin.createDSponsorNFTAndOffer(IDSponsorNFTBase.InitParams,IDSponsorAgreements.OfferInitParams)](contracts/DSponsorAdmin.sol#L56-L62):
	External calls:
	- [newDSponsorNFT = nftFactory.createDSponsorNFT(nftParams)](contracts/DSponsorAdmin.sol#L60)
	Event emitted after the call(s):
	- [UpdateOffer(offerId,disable,name,rulesURI,_sponsoringOffers[offerId].nftContract)](contracts/DSponsorAgreements.sol#L354-L360)
		- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L61)
	- [UpdateOfferAdParameter(offerId,adParameters[i],enable)](contracts/DSponsorAgreements.sol#L372)
		- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L61)
	- [UpdateOfferAdmin(offerId,admins[i],enable)](contracts/DSponsorAgreements.sol#L386)
		- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L61)
	- [UpdateOfferValidator(offerId,validators[i],enable)](contracts/DSponsorAgreements.sol#L397)
		- [createOffer(IERC721(newDSponsorNFT),offerParams)](contracts/DSponsorAdmin.sol#L61)

contracts/DSponsorAdmin.sol#L56-L62


## timestamp
Impact: Low
Confidence: Medium
 - [ ] ID-23
[ERC4907Upgradeable.userOf(uint256)](contracts/lib/ERC4907Upgradeable.sol#L50-L58) uses timestamp for comparisons
	Dangerous comparisons:
	- [_users[tokenId].expires >= block.timestamp](contracts/lib/ERC4907Upgradeable.sol#L53)

contracts/lib/ERC4907Upgradeable.sol#L50-L58


 - [ ] ID-24
[ERC2771Forwarder._validate(ERC2771Forwarder.ForwardRequestData)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L199-L210) uses timestamp for comparisons
	Dangerous comparisons:
	- [(_isTrustedByTarget(request.to),request.deadline >= block.timestamp,isValid && recovered == request.from,recovered)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L204-L209)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L199-L210


 - [ ] ID-25
[ERC2771Forwarder._execute(ERC2771Forwarder.ForwardRequestData,bool)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L254-L297) uses timestamp for comparisons
	Dangerous comparisons:
	- [isTrustedForwarder && signerMatch && active](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L277)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L254-L297


 - [ ] ID-26
[ERC2771Forwarder.verify(ERC2771Forwarder.ForwardRequestData)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L111-L114) uses timestamp for comparisons
	Dangerous comparisons:
	- [isTrustedForwarder && active && signerMatch](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L113)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L111-L114


## assembly
Impact: Informational
Confidence: High
 - [ ] ID-27
[Initializable._getInitializableStorage()](node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L223-L227) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L224-L226)

node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L223-L227


 - [ ] ID-28
[StorageSlot.getUint256Slot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L89-L94) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L91-L93)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L89-L94


 - [ ] ID-29
[MessageHashUtils.toEthSignedMessageHash(bytes32)](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L30-L37) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L32-L36)

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L30-L37


 - [ ] ID-30
[StorageSlot.getAddressSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L59-L64) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L61-L63)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L59-L64


 - [ ] ID-31
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L130-L133)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L154-L161)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L167-L176)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L123-L202


 - [ ] ID-32
[MessageHashUtils.toTypedDataHash(bytes32,bytes32)](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L76-L85) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L78-L84)

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L76-L85


 - [ ] ID-33
[ERC2771Forwarder._execute(ERC2771Forwarder.ForwardRequestData,bool)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L254-L297) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L288-L291)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L254-L297


 - [ ] ID-34
[ERC2771Forwarder._isTrustedByTarget(address)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L305-L324) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L312-L321)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L305-L324


 - [ ] ID-35
[ReentrancyGuardUpgradeable._getReentrancyGuardStorage()](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L46-L50) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L47-L49)

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L46-L50


 - [ ] ID-36
[Strings.toString(uint256)](node_modules/@openzeppelin/contracts/utils/Strings.sol#L24-L44) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L30-L32)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L36-L38)

node_modules/@openzeppelin/contracts/utils/Strings.sol#L24-L44


 - [ ] ID-37
[StorageSlot.getBooleanSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L69-L74) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L71-L73)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L69-L74


 - [ ] ID-38
[ERC721Upgradeable._checkOnERC721Received(address,address,uint256,bytes)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L494-L511) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L505-L507)

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L494-L511


 - [ ] ID-39
[ERC721Upgradeable._getERC721Storage()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L44-L48) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L45-L47)

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L44-L48


 - [ ] ID-40
[Clones.clone(address)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L28-L41) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L30-L37)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L28-L41


 - [ ] ID-41
[StorageSlot.getBytesSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L119-L124) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L121-L123)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L119-L124


 - [ ] ID-42
[StorageSlot.getStringSlot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L99-L104) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L101-L103)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L99-L104


 - [ ] ID-43
[ERC2771Forwarder._checkForwardedGas(uint256,ERC2771Forwarder.ForwardRequestData)](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L338-L369) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L365-L367)

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L338-L369


 - [ ] ID-44
[OwnableUpgradeable._getOwnableStorage()](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L30-L34) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L31-L33)

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L30-L34


 - [ ] ID-45
[Clones.predictDeterministicAddress(address,bytes32,address)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L68-L84) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L74-L83)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L68-L84


 - [ ] ID-46
[Address._revert(bytes)](node_modules/@openzeppelin/contracts/utils/Address.sol#L146-L158) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Address.sol#L151-L154)

node_modules/@openzeppelin/contracts/utils/Address.sol#L146-L158


 - [ ] ID-47
[ERC2981Upgradeable._getERC2981Storage()](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L39-L43) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L40-L42)

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L39-L43


 - [ ] ID-48
[StorageSlot.getBytesSlot(bytes)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L129-L134) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L131-L133)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L129-L134


 - [ ] ID-49
[StorageSlot.getStringSlot(string)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L109-L114) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L111-L113)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L109-L114


 - [ ] ID-50
[ShortStrings.toString(ShortString)](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L63-L73) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L68-L71)

node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L63-L73


 - [ ] ID-51
[StorageSlot.getBytes32Slot(bytes32)](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L79-L84) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L81-L83)

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L79-L84


 - [ ] ID-52
[Clones.cloneDeterministic(address,bytes32)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L50-L63) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L52-L59)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L50-L63


 - [ ] ID-53
[ERC721._checkOnERC721Received(address,address,uint256,bytes)](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L465-L482) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L476-L478)

node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L465-L482


 - [ ] ID-54
[ECDSA.tryRecover(bytes32,bytes)](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L56-L73) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L64-L68)

node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L56-L73


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-55
Different versions of Solidity are used:
	- Version used: ['>=0.5.0', '>=0.7.5', '^0.8.0', '^0.8.20']
	- [>=0.5.0](node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L2)
	- [>=0.7.5](node_modules/@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol#L2)
	- [^0.8.0](contracts/lib/Tokens.sol#L2)
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
 - [ ] ID-56
[DSponsorAgreements._submitAdProposal(uint256,uint256,string,string)](contracts/DSponsorAgreements.sol#L316-L343) has costly operations inside a loop:
	- [_proposalCounterId ++](contracts/DSponsorAgreements.sol#L330)

contracts/DSponsorAgreements.sol#L316-L343


 - [ ] ID-57
[DSponsorNFT._setDefaultMintPrice(address,bool,uint256)](contracts/DSponsorNFT.sol#L515-L530) has costly operations inside a loop:
	- [_defaultMintNativePrice = MintPriceSettings(enabled,amount)](contracts/DSponsorNFT.sol#L526)

contracts/DSponsorNFT.sol#L515-L530


## dead-code
Impact: Informational
Confidence: Medium
 - [ ] ID-58
[DSponsorNFT._msgData()](contracts/DSponsorNFT.sol#L440-L448) is never used and should be removed

contracts/DSponsorNFT.sol#L440-L448


 - [ ] ID-59
[ERC2771ContextUpgradeable._msgData()](contracts/lib/ERC2771ContextUpgradeable.sol#L85-L102) is never used and should be removed

contracts/lib/ERC2771ContextUpgradeable.sol#L85-L102


 - [ ] ID-60
[ReentrantDSponsorAdmin._completeAttack()](contracts/mocks/ReentrantDSponsorAdmin.sol#L60) is never used and should be removed

contracts/mocks/ReentrantDSponsorAdmin.sol#L60


 - [ ] ID-61
[ReentrantDSponsorNFT._completeAttack()](contracts/mocks/ReentrantDSponsorNFT.sol#L23) is never used and should be removed

contracts/mocks/ReentrantDSponsorNFT.sol#L23


 - [ ] ID-62
[ERC2771ContextUpgradeable.__ERC2771Context_init(address,address)](contracts/lib/ERC2771ContextUpgradeable.sol#L20-L27) is never used and should be removed

contracts/lib/ERC2771ContextUpgradeable.sol#L20-L27


 - [ ] ID-63
[DSponsorAdmin._msgData()](contracts/DSponsorAdmin.sol#L149-L157) is never used and should be removed

contracts/DSponsorAdmin.sol#L149-L157


 - [ ] ID-64
[ERC2771ContextOwnable._msgData()](contracts/lib/ERC2771ContextOwnable.sol#L70-L87) is never used and should be removed

contracts/lib/ERC2771ContextOwnable.sol#L70-L87


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-65
Pragma version[^0.8.20](contracts/lib/Reentrant.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/Reentrant.sol#L2


 - [ ] ID-66
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L4


 - [ ] ID-67
Pragma version[^0.8.20](contracts/interfaces/IDSponsorAgreements.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IDSponsorAgreements.sol#L2


 - [ ] ID-68
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC2981.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/interfaces/IERC2981.sol#L4


 - [ ] ID-69
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4


 - [ ] ID-70
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol#L4


 - [ ] ID-71
Pragma version[>=0.7.5](node_modules/@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol#L2) allows old versions

node_modules/@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol#L2


 - [ ] ID-72
Pragma version[^0.8.20](contracts/interfaces/IDSponsorNFTFactory.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IDSponsorNFTFactory.sol#L2


 - [ ] ID-73
Pragma version[^0.8.20](contracts/DSponsorAdmin.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorAdmin.sol#L2


 - [ ] ID-74
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol#L3


 - [ ] ID-75
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L4


 - [ ] ID-76
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L4


 - [ ] ID-77
Pragma version[^0.8.20](contracts/mocks/ERC20Mock.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ERC20Mock.sol#L2


 - [ ] ID-78
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L4


 - [ ] ID-79
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/Strings.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/Strings.sol#L4


 - [ ] ID-80
Pragma version[^0.8.20](contracts/interfaces/IProtocolFee.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IProtocolFee.sol#L2


 - [ ] ID-81
Pragma version[^0.8.20](contracts/DSponsorNFT.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorNFT.sol#L2


 - [ ] ID-82
Pragma version[^0.8.0](contracts/lib/Tokens.sol#L2) allows old versions

contracts/lib/Tokens.sol#L2


 - [ ] ID-83
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L4


 - [ ] ID-84
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/Address.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/Address.sol#L4


 - [ ] ID-85
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/access/Ownable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/access/Ownable.sol#L4


 - [ ] ID-86
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC721.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/interfaces/IERC721.sol#L4


 - [ ] ID-87
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol#L4


 - [ ] ID-88
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L4


 - [ ] ID-89
solc-0.8.20 is not recommended for deployment

 - [ ] ID-90
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L4


 - [ ] ID-91
Pragma version[^0.8.20](contracts/interfaces/IDSponsorNFT.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IDSponsorNFT.sol#L2


 - [ ] ID-92
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/Nonces.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/Nonces.sol#L3


 - [ ] ID-93
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L5) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/StorageSlot.sol#L5


 - [ ] ID-94
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/metatx/ERC2771Forwarder.sol#L4


 - [ ] ID-95
Pragma version[^0.8.20](contracts/lib/ERC4907Upgradeable.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/ERC4907Upgradeable.sol#L2


 - [ ] ID-96
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L4


 - [ ] ID-97
Pragma version[^0.8.20](contracts/DSponsorNFTFactory.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorNFTFactory.sol#L2


 - [ ] ID-98
Pragma version[^0.8.20](contracts/mocks/ERC721Mock.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ERC721Mock.sol#L2


 - [ ] ID-99
Pragma version[^0.8.20](contracts/mocks/ERC2771ForwarderMock.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ERC2771ForwarderMock.sol#L2


 - [ ] ID-100
Pragma version[^0.8.20](contracts/DSponsorAgreements.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/DSponsorAgreements.sol#L2


 - [ ] ID-101
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L4


 - [ ] ID-102
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#L4


 - [ ] ID-103
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L4


 - [ ] ID-104
Pragma version[^0.8.20](contracts/mocks/ReentrantDSponsorAdmin.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ReentrantDSponsorAdmin.sol#L2


 - [ ] ID-105
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L4


 - [ ] ID-106
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol#L4


 - [ ] ID-107
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4


 - [ ] ID-108
Pragma version[^0.8.20](contracts/lib/ERC2771ContextUpgradeable.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/ERC2771ContextUpgradeable.sol#L2


 - [ ] ID-109
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/math/SignedMath.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/math/SignedMath.sol#L4


 - [ ] ID-110
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/Context.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/Context.sol#L4


 - [ ] ID-111
Pragma version[^0.8.20](contracts/mocks/ReentrantDSponsorNFT.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/mocks/ReentrantDSponsorNFT.sol#L2


 - [ ] ID-112
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L4


 - [ ] ID-113
Pragma version[>=0.5.0](node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L2) allows old versions

node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L2


 - [ ] ID-114
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L4


 - [ ] ID-115
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L4


 - [ ] ID-116
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L4


 - [ ] ID-117
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol#L4


 - [ ] ID-118
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC5267.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/interfaces/IERC5267.sol#L4


 - [ ] ID-119
Pragma version[^0.8.20](contracts/lib/ProtocolFee.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/ProtocolFee.sol#L2


 - [ ] ID-120
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#L4


 - [ ] ID-121
Pragma version[^0.8.20](contracts/lib/ERC2771ContextOwnable.sol#L2) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/lib/ERC2771ContextOwnable.sol#L2


 - [ ] ID-122
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L4


 - [ ] ID-123
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L4


 - [ ] ID-124
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L4


 - [ ] ID-125
Pragma version[^0.8.20](contracts/interfaces/IERC4907.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

contracts/interfaces/IERC4907.sol#L3


 - [ ] ID-126
Pragma version[^0.8.20](node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L4) necessitates a version too recent to be trusted. Consider deploying with 0.8.18.

node_modules/@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol#L4


## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-127
Low level call in [SafeERC20._callOptionalReturnBool(IERC20,bytes)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L110-L117):
	- [(success,returndata) = address(token).call(data)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L115)

node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L110-L117


 - [ ] ID-128
Low level call in [Address.functionStaticCall(address,bytes)](node_modules/@openzeppelin/contracts/utils/Address.sol#L95-L98):
	- [(success,returndata) = target.staticcall(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L96)

node_modules/@openzeppelin/contracts/utils/Address.sol#L95-L98


 - [ ] ID-129
Low level call in [Address.functionDelegateCall(address,bytes)](node_modules/@openzeppelin/contracts/utils/Address.sol#L104-L107):
	- [(success,returndata) = target.delegatecall(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L105)

node_modules/@openzeppelin/contracts/utils/Address.sol#L104-L107


 - [ ] ID-130
Low level call in [Address.functionCallWithValue(address,bytes,uint256)](node_modules/@openzeppelin/contracts/utils/Address.sol#L83-L89):
	- [(success,returndata) = target.call{value: value}(data)](node_modules/@openzeppelin/contracts/utils/Address.sol#L87)

node_modules/@openzeppelin/contracts/utils/Address.sol#L83-L89


 - [ ] ID-131
Low level call in [Address.sendValue(address,uint256)](node_modules/@openzeppelin/contracts/utils/Address.sol#L41-L50):
	- [(success) = recipient.call{value: amount}()](node_modules/@openzeppelin/contracts/utils/Address.sol#L46)

node_modules/@openzeppelin/contracts/utils/Address.sol#L41-L50


## missing-inheritance
Impact: Informational
Confidence: High
 - [ ] ID-132
[DSponsorNFT](contracts/DSponsorNFT.sol#L21-L562) should inherit from [IDSponsorNFT](contracts/interfaces/IDSponsorNFT.sol#L158)

contracts/DSponsorNFT.sol#L21-L562


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-133
Function [IDSponsorNFTBase.MAX_SUPPLY()](contracts/interfaces/IDSponsorNFT.sol#L97) is not in mixedCase

contracts/interfaces/IDSponsorNFT.sol#L97


 - [ ] ID-134
Constant [OwnableUpgradeable.OwnableStorageLocation](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L28) is not in UPPER_CASE_WITH_UNDERSCORES

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L28


 - [ ] ID-135
Function [ERC2771ContextUpgradeable.__ERC2771Context_init(address,address)](contracts/lib/ERC2771ContextUpgradeable.sol#L20-L27) is not in mixedCase

contracts/lib/ERC2771ContextUpgradeable.sol#L20-L27


 - [ ] ID-136
Function [UniV3SwapRouter.WETH9()](contracts/lib/ProtocolFee.sol#L12) is not in mixedCase

contracts/lib/ProtocolFee.sol#L12


 - [ ] ID-137
Function [ReentrancyGuardUpgradeable.__ReentrancyGuard_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L61-L64) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L61-L64


 - [ ] ID-138
Function [EIP712._EIP712Version()](node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L157-L159) is not in mixedCase

node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L157-L159


 - [ ] ID-139
Function [OwnableUpgradeable.__Ownable_init(address)](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L51-L53) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L51-L53


 - [ ] ID-140
Function [ERC4907Upgradeable.__ERC4907_init_unchained()](contracts/lib/ERC4907Upgradeable.sol#L28) is not in mixedCase

contracts/lib/ERC4907Upgradeable.sol#L28


 - [ ] ID-141
Function [ERC2981Upgradeable.__ERC2981_init()](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L65-L66) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L65-L66


 - [ ] ID-142
Parameter [DSponsorAdmin.updateProtocolFee(address,uint96)._recipient](contracts/DSponsorAdmin.sol#L133) is not in mixedCase

contracts/DSponsorAdmin.sol#L133


 - [ ] ID-143
Function [ERC721Upgradeable.__ERC721_init_unchained(string,string)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L57-L61) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L57-L61


 - [ ] ID-144
Parameter [DSponsorNFT.setBaseURI(string)._baseURI](contracts/DSponsorNFT.sol#L231) is not in mixedCase

contracts/DSponsorNFT.sol#L231


 - [ ] ID-145
Function [OwnableUpgradeable.__Ownable_init_unchained(address)](node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L55-L60) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L55-L60


 - [ ] ID-146
Function [ERC721RoyaltyUpgradeable.__ERC721Royalty_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L25-L26) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L25-L26


 - [ ] ID-147
Function [ReentrancyGuardUpgradeable.__ReentrancyGuard_init()](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L57-L59) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L57-L59


 - [ ] ID-148
Function [ERC165Upgradeable.__ERC165_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L25-L26) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L25-L26


 - [ ] ID-149
Function [ContextUpgradeable.__Context_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L21-L22) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L21-L22


 - [ ] ID-150
Function [IERC20Permit.DOMAIN_SEPARATOR()](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L89) is not in mixedCase

node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol#L89


 - [ ] ID-151
Parameter [IDSponsorNFTBase.setBaseURI(string).URI](contracts/interfaces/IDSponsorNFT.sol#L118) is not in mixedCase

contracts/interfaces/IDSponsorNFT.sol#L118


 - [ ] ID-152
Constant [ERC721Upgradeable.ERC721StorageLocation](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L42) is not in UPPER_CASE_WITH_UNDERSCORES

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L42


 - [ ] ID-153
Parameter [DSponsorNFT.setContractURI(string)._contractURI](contracts/DSponsorNFT.sol#L244) is not in mixedCase

contracts/DSponsorNFT.sol#L244


 - [ ] ID-154
Function [ERC4907Upgradeable.__ERC4907_init(string,string)](contracts/lib/ERC4907Upgradeable.sol#L20-L26) is not in mixedCase

contracts/lib/ERC4907Upgradeable.sol#L20-L26


 - [ ] ID-155
Parameter [DSponsorNFT.setTokensAllowlist(bool)._applyTokensAllowlist](contracts/DSponsorNFT.sol#L298) is not in mixedCase

contracts/DSponsorNFT.sol#L298


 - [ ] ID-156
Variable [DSponsorNFT.MAX_SUPPLY](contracts/DSponsorNFT.sol#L33) is not in mixedCase

contracts/DSponsorNFT.sol#L33


 - [ ] ID-157
Parameter [DSponsorNFT.setTokenURI(uint256,string)._tokenURI](contracts/DSponsorNFT.sol#L330) is not in mixedCase

contracts/DSponsorNFT.sol#L330


 - [ ] ID-158
Variable [ERC4907Upgradeable._users](contracts/lib/ERC4907Upgradeable.sol#L18) is not in mixedCase

contracts/lib/ERC4907Upgradeable.sol#L18


 - [ ] ID-159
Constant [ReentrancyGuardUpgradeable.ReentrancyGuardStorageLocation](node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L44) is not in UPPER_CASE_WITH_UNDERSCORES

node_modules/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L44


 - [ ] ID-160
Function [EIP712._EIP712Name()](node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L146-L148) is not in mixedCase

node_modules/@openzeppelin/contracts/utils/cryptography/EIP712.sol#L146-L148


 - [ ] ID-161
Parameter [IDSponsorNFTBase.setTokenURI(uint256,string).URI](contracts/interfaces/IDSponsorNFT.sol#L144) is not in mixedCase

contracts/interfaces/IDSponsorNFT.sol#L144


 - [ ] ID-162
Constant [ERC2981Upgradeable.ERC2981StorageLocation](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L37) is not in UPPER_CASE_WITH_UNDERSCORES

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L37


 - [ ] ID-163
Function [ContextUpgradeable.__Context_init()](node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L18-L19) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L18-L19


 - [ ] ID-164
Parameter [DSponsorAdmin.updateProtocolFee(address,uint96)._bps](contracts/DSponsorAdmin.sol#L134) is not in mixedCase

contracts/DSponsorAdmin.sol#L134


 - [ ] ID-165
Function [ERC165Upgradeable.__ERC165_init()](node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L22-L23) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol#L22-L23


 - [ ] ID-166
Function [ERC2771ContextUpgradeable.__ERC2771Context_init_unchained(address)](contracts/lib/ERC2771ContextUpgradeable.sol#L29-L33) is not in mixedCase

contracts/lib/ERC2771ContextUpgradeable.sol#L29-L33


 - [ ] ID-167
Function [ERC721RoyaltyUpgradeable.__ERC721Royalty_init()](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L22-L23) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol#L22-L23


 - [ ] ID-168
Function [ERC2981Upgradeable.__ERC2981_init_unchained()](node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L68-L69) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol#L68-L69


 - [ ] ID-169
Parameter [IDSponsorNFTBase.setContractURI(string).URI](contracts/interfaces/IDSponsorNFT.sol#L120) is not in mixedCase

contracts/interfaces/IDSponsorNFT.sol#L120


 - [ ] ID-170
Function [ERC721Upgradeable.__ERC721_init(string,string)](node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L53-L55) is not in mixedCase

node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol#L53-L55


## similar-names
Impact: Informational
Confidence: Medium
 - [ ] ID-171
Variable [IUniswapV3SwapCallback.uniswapV3SwapCallback(int256,int256,bytes).amount0Delta](node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L17) is too similar to [IUniswapV3SwapCallback.uniswapV3SwapCallback(int256,int256,bytes).amount1Delta](node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L18)

node_modules/@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol#L17


 - [ ] ID-172
Variable [ERC2771Context._trustedForwarder](node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L23) is too similar to [ERC2771Context.constructor(address).trustedForwarder_](node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L32)

node_modules/@openzeppelin/contracts/metatx/ERC2771Context.sol#L23


## too-many-digits
Impact: Informational
Confidence: Medium
 - [ ] ID-173
[Clones.clone(address)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L28-L41) uses literals with too many digits:
	- [mstore(uint256,uint256)(0x00,implementation << 0x60 >> 0xe8 | 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L33)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L28-L41


 - [ ] ID-174
[ShortStrings.slitherConstructorConstantVariables()](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L40-L123) uses literals with too many digits:
	- [FALLBACK_SENTINEL = 0x00000000000000000000000000000000000000000000000000000000000000FF](node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L42)

node_modules/@openzeppelin/contracts/utils/ShortStrings.sol#L40-L123


 - [ ] ID-175
[Clones.cloneDeterministic(address,bytes32)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L50-L63) uses literals with too many digits:
	- [mstore(uint256,uint256)(0x00,implementation << 0x60 >> 0xe8 | 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000)](node_modules/@openzeppelin/contracts/proxy/Clones.sol#L55)

node_modules/@openzeppelin/contracts/proxy/Clones.sol#L50-L63


