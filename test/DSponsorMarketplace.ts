import 'dotenv/config'
import { expect } from 'chai'
import { BaseContract, parseEther, Signer } from 'ethers'
import { ethers } from 'hardhat'
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers'
import { executeByForwarder } from '../utils/eip712'
import {
  DSponsorMarketplace,
  DSponsorNFT,
  DSponsorNFTFactory,
  ERC20,
  ERC20Mock,
  ERC2771Forwarder
} from '../typechain-types'
import { IDSponsorNFTBase } from '../typechain-types/contracts/DSponsorNFT'

import {
  SWAP_ROUTER_ADDR,
  USDC_ADDR,
  WETH_ADDR,
  ZERO_ADDRESS
} from '../utils/constants'
import { IDSponsorMarketplace } from '../typechain-types/contracts/DSponsorMarketplace'
import { getEthQuote } from '../utils/uniswapQuote'
import {
  computeBidAmounts,
  getMinimalBidPerToken,
  getMinimalBuyoutPricePerToken
} from '../utils/bid'

const listingTypeDirect = 0
const listingTypeAuction = 1
const transferTypeRent = 0
const transferTypeSale = 1

describe('DSponsorMarketplace', function () {
  const provider = ethers.provider

  let DSponsorMarketplace: DSponsorMarketplace
  let DSponsorMarketplaceAddress: string
  let DSponsorNFTFactory: DSponsorNFTFactory
  let DSponsorNFTImplementation: DSponsorNFT
  let DSponsorNFTImplementationAddress: string
  let DSponsorNFT: DSponsorNFT
  let DSponsorNFTAddress: string
  let ERC20Mock: ERC20Mock
  let ERC20MockAddress: string
  let forwarder: ERC2771Forwarder
  let forwarderAddress: string

  let signers: Signer[]
  let deployer: Signer
  let deployerAddr: string
  let owner: Signer
  let ownerAddr: string
  let user: Signer
  let userAddr: string
  let user2: Signer
  let user2Addr: string
  let user3: Signer
  let user3Addr: string
  let user4: Signer
  let user4Addr: string
  let treasury: Signer
  let treasuryAddr: string

  let chainId: string
  let swapRouter

  let WethAddr: string
  let WethContract: ERC20
  let USDCAddr: string
  let USDCContract: ERC20

  const ERC20Amount: bigint = parseEther('15')
  const valuePrice: bigint = parseEther('1')
  const USDCPrice = BigInt((2 * 10 ** 6).toString()) // 2 USDC
  const reserveToBuyMul = BigInt('4')

  const protocolBps = 400 // 4%
  const royaltyBps = 100 // 1%

  let initDSponsorNFTParams: IDSponsorNFTBase.InitParamsStruct
  let listingParams: IDSponsorMarketplace.ListingParametersStruct
  let offerParams: IDSponsorMarketplace.OfferParamsStruct
  let listingId = 0
  let offerId = 0
  let tokenId = 1

  const referralAdditionalInformation = 'referralAdditionalInformation'

  // returns [ sellerAmount, ownerFee, treasuryFee ]
  const computeFee = (amount: bigint) => {
    const ownerFee = (amount * BigInt(royaltyBps.toString())) / BigInt('10000')
    const treasuryFee =
      (amount * BigInt(protocolBps.toString())) / BigInt('10000')
    const sellerAmount = amount - ownerFee - treasuryFee
    return [sellerAmount, ownerFee, treasuryFee]
  }

  const now = async (): Promise<bigint> => {
    const lastBlock = await provider.getBlock('latest')
    if (!lastBlock?.timestamp) throw new Error('No timestamp fetched')
    return BigInt(lastBlock.timestamp.toString())
  }

  async function deployFixture() {
    const network = await provider.getNetwork()
    const { chainId: chainIdBigInt } = network
    chainId = chainIdBigInt.toString()

    swapRouter = SWAP_ROUTER_ADDR[chainId]
    WethAddr = WETH_ADDR[chainId]
    USDCAddr = USDC_ADDR[chainId]

    signers = await ethers.getSigners()
    ;[deployer, owner, user, user2, user3, user4, treasury] = signers

    deployerAddr = await deployer.getAddress()
    ownerAddr = await owner.getAddress()
    userAddr = await user.getAddress()
    user2Addr = await user2.getAddress()
    user3Addr = await user3.getAddress()
    user4Addr = await user4.getAddress()
    treasuryAddr = await treasury.getAddress()

    USDCContract = await ethers.getContractAt('ERC20', USDCAddr)
    WethContract = await ethers.getContractAt('ERC20', WethAddr)

    const forwarderFactory = await ethers.getContractFactory('ERC2771Forwarder')
    forwarder = await forwarderFactory.deploy('ERC2771Forwarder')
    await forwarder.waitForDeployment()
    forwarderAddress = await forwarder.getAddress()

    ERC20Mock = await ethers.deployContract('ERC20Mock', [])
    await ERC20Mock.waitForDeployment()
    ERC20MockAddress = await ERC20Mock.getAddress()
    await ERC20Mock.mint(userAddr, ERC20Amount * BigInt('10'))
    await ERC20Mock.mint(user2Addr, ERC20Amount * BigInt('10'))
    await ERC20Mock.mint(user3Addr, ERC20Amount * BigInt('10'))
    await ERC20Mock.mint(user4Addr, ERC20Amount * BigInt('10'))

    DSponsorNFTImplementation = await ethers.deployContract(
      'DSponsorNFTExtended',
      []
    )
    DSponsorNFTImplementationAddress =
      await DSponsorNFTImplementation.getAddress()

    DSponsorNFTFactory = await ethers.deployContract('DSponsorNFTFactory', [
      DSponsorNFTImplementationAddress
    ])

    initDSponsorNFTParams = {
      name: 'DSponsorNFTExtended',
      symbol: 'DSNFT',
      baseURI: 'baseURI',
      contractURI: 'contractURI',
      minter: deployerAddr,
      maxSupply: BigInt('5'),
      forwarder: forwarderAddress,
      initialOwner: ownerAddr,
      royaltyBps: 100, // 1%
      currencies: [ERC20MockAddress, ZERO_ADDRESS, USDCAddr, WethAddr],
      prices: [ERC20Amount, valuePrice, USDCPrice, valuePrice],
      allowedTokenIds: []
    }

    const tx = await DSponsorNFTFactory.createDSponsorNFT(initDSponsorNFTParams)
    if (!tx.hash) throw new Error('No tx hash')
    const receipt = await provider.getTransactionReceipt(tx.hash || '')
    const event = receipt?.logs
      .map((log: any) => DSponsorNFTFactory.interface.parseLog(log))
      .find((e) => e?.name === 'NewDSponsorNFT')
    if (!event) throw new Error('No event')

    DSponsorNFTAddress = event.args[0]
    DSponsorNFT = await ethers.getContractAt(
      'DSponsorNFTExtended',
      DSponsorNFTAddress
    )

    await DSponsorNFT.connect(owner).mint(0, ownerAddr, ZERO_ADDRESS, '')
    await DSponsorNFT.connect(owner).mint(1, userAddr, ZERO_ADDRESS, '')
    await DSponsorNFT.connect(owner).mint(10, userAddr, ZERO_ADDRESS, '')
    await DSponsorNFT.connect(owner).mint(2, user2Addr, ZERO_ADDRESS, '')

    DSponsorMarketplace = await ethers.deployContract('DSponsorMarketplace', [
      forwarderAddress,
      deployerAddr,
      swapRouter,
      treasuryAddr,
      protocolBps
    ])

    DSponsorMarketplaceAddress = await DSponsorMarketplace.getAddress()
  }

  async function directListingSaleFixture() {
    await loadFixture(deployFixture)

    await DSponsorNFT.connect(user).approve(DSponsorMarketplaceAddress, tokenId)

    const startTime = (await now()) + BigInt('1') // 1 second in the future to anticipate the next block timestamp
    const rentalExpirationTimestamp =
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingParams = {
        assetContract: DSponsorNFTAddress,
        tokenId,
        startTime,
        secondsUntilEndTime: BigInt('3600'),
        quantityToList: 1,
        currencyToAccept: ERC20MockAddress,
        reservePricePerToken: ERC20Amount,
        buyoutPricePerToken: ERC20Amount * reserveToBuyMul,
        transferType: transferTypeSale,
        rentalExpirationTimestamp,
        listingType: listingTypeDirect
      }

    await expect(DSponsorMarketplace.connect(user).createListing(listingParams))
      .to.emit(DSponsorMarketplace, 'ListingAdded')
      .withArgs(listingId, DSponsorNFTAddress, userAddr, [
        listingId,
        userAddr,
        listingParams.assetContract,
        listingParams.tokenId,
        startTime,
        startTime + BigInt(listingParams.secondsUntilEndTime),
        1,
        listingParams.currencyToAccept,
        listingParams.reservePricePerToken,
        listingParams.buyoutPricePerToken,
        1, // ERC721
        listingParams.transferType,
        listingParams.rentalExpirationTimestamp,
        listingParams.listingType
      ])
  }

  async function multipleDirectSalesFixture() {
    await loadFixture(deployFixture)

    await DSponsorNFT.connect(user).setApprovalForAll(
      DSponsorMarketplaceAddress,
      true
    )

    // list tokens 1 & 10 (USDCe & WETH pricing)
    const WETHTotalPrice = BigInt('1000000000000000000') // 1 WETH
    const USDCeTotalPrice = BigInt('2000000') // 2 USDCe

    const startTime = await now()
    listingParams = {
      assetContract: DSponsorNFTAddress,
      tokenId: 1,
      startTime,
      secondsUntilEndTime: BigInt('3600'),
      quantityToList: 1,
      currencyToAccept: USDCAddr,
      reservePricePerToken: USDCPrice,
      buyoutPricePerToken: USDCeTotalPrice,
      transferType: transferTypeSale,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: listingTypeDirect
    }
    await DSponsorMarketplace.connect(user).createListing(listingParams)
    listingParams = {
      assetContract: DSponsorNFTAddress,
      tokenId: 10,
      startTime,
      secondsUntilEndTime: BigInt('3600'),
      quantityToList: 1,
      currencyToAccept: WethAddr,
      reservePricePerToken: valuePrice,
      buyoutPricePerToken: WETHTotalPrice,
      transferType: transferTypeSale,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: listingTypeDirect
    }
    await DSponsorMarketplace.connect(user).createListing(listingParams)

    return { WETHTotalPrice, USDCeTotalPrice }
  }

  async function buyDirectListingSaleFixture() {
    await loadFixture(directListingSaleFixture)

    const totalPrice = ERC20Amount * reserveToBuyMul

    await ERC20Mock.connect(user2).approve(
      DSponsorMarketplaceAddress,
      totalPrice
    )

    const buyParams: IDSponsorMarketplace.BuyParamsStruct = {
      listingId,
      buyFor: user2Addr,
      quantity: 1,
      currency: ERC20MockAddress,
      referralAdditionalInformation
    }

    const tx = DSponsorMarketplace.connect(user2).buy(buyParams)

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'NewSale')
      .withArgs(
        listingId,
        DSponsorNFTAddress,
        userAddr,
        user2Addr,
        1,
        totalPrice
      )

    await expect(tx).to.changeTokenBalances(
      ERC20Mock,
      [user2, user, owner, treasury, DSponsorMarketplace],
      [totalPrice * BigInt(-1), ...computeFee(totalPrice), 0]
    )

    await expect(tx).to.changeTokenBalances(DSponsorNFT, [user2, user], [1, -1])

    expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(user2Addr)
  }

  async function directListingRentFixture() {
    await loadFixture(deployFixture)

    await DSponsorNFT.connect(user).approve(DSponsorMarketplaceAddress, tokenId)

    const startTime = (await now()) + BigInt('1') // 1 second in the future to anticipate the next block timestamp
    listingParams = {
      assetContract: DSponsorNFTAddress,
      tokenId,
      startTime,
      secondsUntilEndTime: BigInt('3600'),
      quantityToList: 1,
      currencyToAccept: ERC20MockAddress,
      reservePricePerToken: ERC20Amount,
      buyoutPricePerToken: ERC20Amount * reserveToBuyMul,
      transferType: transferTypeRent,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: listingTypeDirect
    }

    await expect(DSponsorMarketplace.connect(user).createListing(listingParams))
      .to.emit(DSponsorMarketplace, 'ListingAdded')
      .withArgs(listingId, DSponsorNFTAddress, userAddr, [
        listingId,
        userAddr,
        listingParams.assetContract,
        listingParams.tokenId,
        startTime,
        startTime + BigInt(listingParams.secondsUntilEndTime),
        1,
        listingParams.currencyToAccept,
        listingParams.reservePricePerToken,
        listingParams.buyoutPricePerToken,
        1, // ERC721
        listingParams.transferType,
        listingParams.rentalExpirationTimestamp,
        listingParams.listingType
      ])
  }

  async function buyDirectListingRentFixture() {
    await loadFixture(directListingRentFixture)

    const totalPrice = ERC20Amount * reserveToBuyMul

    expect(await DSponsorNFT.userOf(tokenId)).to.equal(ZERO_ADDRESS)

    await ERC20Mock.connect(user2).approve(
      DSponsorMarketplaceAddress,
      totalPrice
    )

    const buyParams: IDSponsorMarketplace.BuyParamsStruct = {
      listingId,
      buyFor: user2Addr,
      quantity: 1,
      currency: ERC20MockAddress,
      referralAdditionalInformation
    }

    const tx = DSponsorMarketplace.connect(user2).buy(buyParams)

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'NewSale')
      .withArgs(
        listingId,
        DSponsorNFTAddress,
        userAddr,
        user2Addr,
        1,
        totalPrice
      )

    await expect(tx).to.changeTokenBalances(
      ERC20Mock,
      [user2, user, owner, treasury, DSponsorMarketplace],
      [totalPrice * BigInt(-1), ...computeFee(totalPrice), 0]
    )

    await expect(tx).to.changeTokenBalances(DSponsorNFT, [user2, user], [0, 0])

    expect(await DSponsorNFT.userOf(tokenId)).to.equal(user2Addr)
    expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(userAddr)
  }

  async function auctionListingSaleFixture() {
    await loadFixture(deployFixture)

    await DSponsorNFT.connect(user).approve(DSponsorMarketplaceAddress, tokenId)

    const startTime = (await now()) + BigInt('1') // 1 second in the future to anticipate the next block timestamp
    listingParams = {
      assetContract: DSponsorNFTAddress,
      tokenId,
      startTime,
      secondsUntilEndTime: BigInt('3600'),
      quantityToList: 1,
      currencyToAccept: ERC20MockAddress,
      reservePricePerToken: ERC20Amount,
      buyoutPricePerToken: ERC20Amount * reserveToBuyMul,
      transferType: transferTypeSale,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: listingTypeAuction
    }

    const tx = DSponsorMarketplace.connect(user).createListing(listingParams)

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'ListingAdded')
      .withArgs(listingId, DSponsorNFTAddress, userAddr, [
        listingId,
        userAddr,
        listingParams.assetContract,
        listingParams.tokenId,
        startTime,
        startTime + BigInt(listingParams.secondsUntilEndTime),
        1,
        listingParams.currencyToAccept,
        listingParams.reservePricePerToken,
        listingParams.buyoutPricePerToken,
        1, // ERC721
        listingParams.transferType,
        listingParams.rentalExpirationTimestamp,
        listingParams.listingType
      ])

    await expect(tx).to.changeTokenBalances(
      DSponsorNFT,
      [user2, user, DSponsorMarketplaceAddress],
      [0, -1, 1]
    )

    expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(
      DSponsorMarketplaceAddress
    )
  }

  async function buyAuctionListingSaleFixture() {
    await loadFixture(auctionListingSaleFixture)

    const minimalAuctionBps =
      await DSponsorMarketplace.MIN_AUCTION_INCREASE_BPS()
    const bonusRefundBps =
      await DSponsorMarketplace.ADDITIONNAL_REFUND_PREVIOUS_BIDDER_BPS()

    const [
      ,
      _tokenOwner,
      _assetContract,
      _tokenId,
      _startTime,
      _endTime,
      _quantity,
      _currency,
      _reservePricePerToken,
      _buyoutPricePerToken
    ] = await DSponsorMarketplace.listings(listingId)

    const [__listingId, previousBidder, previousPricePerToken] =
      await DSponsorMarketplace.winningBid(listingId)

    const {
      minimalBuyoutPerToken: bidPrice,
      refundBonusAmount,
      newPricePerToken,
      protocolFeeAmount,
      royaltyAmount,
      listerAmount
    } = computeBidAmounts(
      getMinimalBuyoutPricePerToken(
        previousPricePerToken.toString(),
        _buyoutPricePerToken.toString(),
        minimalAuctionBps.toString(),
        bonusRefundBps.toString()
      ), //  newBidPerToken: string,
      _quantity.toString(), // quantity: string,
      _reservePricePerToken.toString(), // reservePricePerToken: string,
      _buyoutPricePerToken.toString(), // buyoutPricePerToken: string,
      previousPricePerToken.toString(), // previousPricePerToken: string | undefined,
      minimalAuctionBps.toString(), // minimalAuctionBps: string,
      bonusRefundBps.toString(), // bonusRefundBps: string,
      royaltyBps.toString(), // royaltyBps: string,
      protocolBps.toString() // protocolFeeBps: string
    )
    await ERC20Mock.connect(user2).approve(DSponsorMarketplaceAddress, bidPrice)

    const tx = DSponsorMarketplace.connect(user2).bid(
      listingId,
      bidPrice,
      user2Addr,
      referralAdditionalInformation
    )

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(
        listingId,
        _quantity,
        user2Addr,
        newPricePerToken,
        previousBidder,
        refundBonusAmount,
        _currency,
        _endTime
      )

    await expect(tx).to.changeTokenBalances(
      ERC20Mock,
      [user2, user, owner, treasury, DSponsorMarketplace],
      [-BigInt(bidPrice), listerAmount, royaltyAmount, protocolFeeAmount, 0]
    )

    await expect(tx).to.changeTokenBalances(
      DSponsorNFT,
      [user2, user, DSponsorMarketplaceAddress],
      [1, 0, -1]
    )

    expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(user2Addr)
  }

  async function bidAuctionListingSaleFixture() {
    await loadFixture(auctionListingSaleFixture)

    const bidPrice = (ERC20Amount * BigInt('117')) / BigInt('100')
    await ERC20Mock.connect(user2).approve(DSponsorMarketplaceAddress, bidPrice)

    const minimalAuctionBps =
      await DSponsorMarketplace.MIN_AUCTION_INCREASE_BPS()
    const bonusRefundBps =
      await DSponsorMarketplace.ADDITIONNAL_REFUND_PREVIOUS_BIDDER_BPS()

    const [
      ,
      ,
      ,
      ,
      ,
      _endTime,
      _quantity,
      _currency,
      _reservePricePerToken,
      _buyoutPricePerToken
    ] = await DSponsorMarketplace.listings(listingId)

    const [__listingId, previousBidder, previousPricePerToken] =
      await DSponsorMarketplace.winningBid(listingId)

    const { refundBonusAmount, newPricePerToken } = computeBidAmounts(
      bidPrice.toString(), //  newBidPerToken: string,
      _quantity.toString(), // quantity: string,
      _reservePricePerToken.toString(), // reservePricePerToken: string,
      _buyoutPricePerToken.toString(), // buyoutPricePerToken: string,
      previousPricePerToken.toString(), // previousPricePerToken: string | undefined,
      minimalAuctionBps.toString(), // minimalAuctionBps: string,
      bonusRefundBps.toString(), // bonusRefundBps: string,
      royaltyBps.toString(), // royaltyBps: string,
      protocolBps.toString() // protocolFeeBps: string
    )

    const tx = DSponsorMarketplace.connect(user2).bid(
      listingId,
      bidPrice,
      user2Addr,
      referralAdditionalInformation
    )

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(
        listingId,
        _quantity,
        user2Addr,
        newPricePerToken,
        previousBidder,
        refundBonusAmount,
        _currency,
        _endTime
      )

    await expect(tx).to.changeTokenBalances(
      ERC20Mock,
      [user2, user, owner, treasury, DSponsorMarketplace],
      [bidPrice * BigInt(-1), 0, 0, 0, bidPrice]
    )

    await expect(tx).to.changeTokenBalances(
      DSponsorNFT,
      [user2, user, DSponsorMarketplaceAddress],
      [0, 0, 0]
    )

    expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(
      DSponsorMarketplaceAddress
    )
  }

  async function higherBidAuctionListingSaleFixture() {
    await loadFixture(bidAuctionListingSaleFixture)

    const minimalAuctionBps =
      await DSponsorMarketplace.MIN_AUCTION_INCREASE_BPS()
    const bonusRefundBps =
      await DSponsorMarketplace.ADDITIONNAL_REFUND_PREVIOUS_BIDDER_BPS()

    const [
      ,
      _tokenOwner,
      _assetContract,
      _tokenId,
      _startTime,
      _endTime,
      _quantity,
      _currency,
      _reservePricePerToken,
      _buyoutPricePerToken
    ] = await DSponsorMarketplace.listings(listingId)

    const [__listingId, previousBidder, previousPricePerToken] =
      await DSponsorMarketplace.winningBid(listingId)

    ///// BID 1 /////////////////////

    const bidPrice1 = ERC20Amount * BigInt('2')
    await ERC20Mock.connect(user3).approve(
      DSponsorMarketplaceAddress,
      bidPrice1
    )

    const balanceUser3BeforeBid = await ERC20Mock.balanceOf(user3Addr)

    const {
      refundBonusAmount: refundBonusAmount1,
      refundAmountToPreviousBidder: refundAmountToPreviousBidder1,
      newPricePerToken: newPricePerToken1,
      newRefundAmount: newRefundAmount1,
      newProfitAmount: newProfitAmount1
    } = computeBidAmounts(
      bidPrice1.toString(), //  newBidPerToken: string,
      _quantity.toString(), // quantity: string,
      _reservePricePerToken.toString(), // reservePricePerToken: string,
      _buyoutPricePerToken.toString(), // buyoutPricePerToken: string,
      previousPricePerToken.toString(), // previousPricePerToken: string | undefined,
      minimalAuctionBps.toString(), // minimalAuctionBps: string,
      bonusRefundBps.toString(), // bonusRefundBps: string,
      royaltyBps.toString(), // royaltyBps: string,
      protocolBps.toString() // protocolFeeBps: string
    )

    const tx1 = await DSponsorMarketplace.connect(user3).bid(
      listingId,
      bidPrice1,
      user3Addr,
      referralAdditionalInformation
    )

    await expect(tx1)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(
        listingId,
        _quantity,
        user3Addr,
        newPricePerToken1,
        previousBidder,
        refundBonusAmount1,
        _currency,
        _endTime
      )

    await expect(tx1).to.changeTokenBalances(
      ERC20Mock,
      [user3, user2, user, owner, treasury, DSponsorMarketplace],
      [
        bidPrice1 * BigInt(-1),
        refundAmountToPreviousBidder1,
        0,
        0,
        0,
        bidPrice1 - BigInt(refundAmountToPreviousBidder1)
      ]
    )

    await expect(tx1).to.changeTokenBalances(
      DSponsorNFT,
      [user3, user2, user, DSponsorMarketplaceAddress],
      [0, 0, 0, 0]
    )

    expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(
      DSponsorMarketplaceAddress
    )

    ///// BID 2 /////////////////////

    const balanceUser4BeforeBid = await ERC20Mock.balanceOf(user4Addr)

    const {
      minimalBidPerToken: minimalBidPerToken2,
      refundBonusAmount: refundBonusAmount2,
      refundAmountToPreviousBidder: refundAmountToPreviousBidder2,
      newPricePerToken: newPricePerToken2,
      newAmount: newAmount2,
      newRefundAmount: newRefundAmount2,
      newProfitAmount: newProfitAmount2
    } = computeBidAmounts(
      getMinimalBidPerToken(
        newPricePerToken1.toString(),
        _reservePricePerToken.toString(),
        minimalAuctionBps.toString()
      ), //  newBidPerToken: string,
      _quantity.toString(), // quantity: string,
      _reservePricePerToken.toString(), // reservePricePerToken: string,
      _buyoutPricePerToken.toString(), // buyoutPricePerToken: string,
      newPricePerToken1.toString(), // previousPricePerToken: string | undefined,
      minimalAuctionBps.toString(), // minimalAuctionBps: string,
      bonusRefundBps.toString(), // bonusRefundBps: string,
      royaltyBps.toString(), // royaltyBps: string,
      protocolBps.toString() // protocolFeeBps: string
    )

    await ERC20Mock.connect(user4).approve(
      DSponsorMarketplaceAddress,
      minimalBidPerToken2
    )

    const tx2 = await DSponsorMarketplace.connect(user4).bid(
      listingId,
      minimalBidPerToken2,
      user4Addr,
      referralAdditionalInformation
    )

    await expect(tx2)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(
        listingId,
        _quantity,
        user4Addr,
        newPricePerToken2,
        user3Addr,
        refundBonusAmount2,
        _currency,
        _endTime
      )

    expect(refundAmountToPreviousBidder2).to.equal(newRefundAmount1)

    const balanceUser3AfterBid = await ERC20Mock.balanceOf(user3Addr)
    const profitUser3 = balanceUser3AfterBid - balanceUser3BeforeBid
    expect(profitUser3).to.equal(BigInt(newProfitAmount1))

    await expect(tx2).to.changeTokenBalances(
      ERC20Mock,
      [user4, user3, user2, user, owner, treasury, DSponsorMarketplace],
      [
        -BigInt(minimalBidPerToken2),
        refundAmountToPreviousBidder2,
        0,
        0,
        0,
        0,
        BigInt(minimalBidPerToken2) - BigInt(refundAmountToPreviousBidder2)
      ]
    )

    await expect(tx2).to.changeTokenBalances(
      DSponsorNFT,
      [user4, user3, user2, user, DSponsorMarketplaceAddress],
      [0, 0, 0, 0, 0]
    )

    expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(
      DSponsorMarketplaceAddress
    )

    ///// BID FINAL /////////////////////

    const {
      minimalBidPerToken: minimalBidPerTokenFinal,
      minimalBuyoutPerToken: finalBidPrice,

      refundBonusAmount: refundBonusAmountFinal,
      refundAmountToPreviousBidder: refundAmountToPreviousBidderFinal,

      newPricePerToken: newPricePerTokenFinal,

      protocolFeeAmount,
      royaltyAmount,
      listerAmount
    } = computeBidAmounts(
      getMinimalBuyoutPricePerToken(
        newPricePerToken2,
        _buyoutPricePerToken.toString(),
        minimalAuctionBps.toString(),
        bonusRefundBps.toString()
      ), //  newBidPerToken: string,
      _quantity.toString(), // quantity: string,
      _reservePricePerToken.toString(), // reservePricePerToken: string,
      _buyoutPricePerToken.toString(), // buyoutPricePerToken: string,
      newPricePerToken2.toString(), // previousPricePerToken: string | undefined,
      minimalAuctionBps.toString(), // minimalAuctionBps: string,
      bonusRefundBps.toString(), // bonusRefundBps: string,
      royaltyBps.toString(), // royaltyBps: string,
      protocolBps.toString() // protocolFeeBps: string
    )

    await ERC20Mock.connect(user2).approve(
      DSponsorMarketplaceAddress,
      finalBidPrice
    )

    const finalTx = await DSponsorMarketplace.connect(user2).bid(
      listingId,
      finalBidPrice,
      user3Addr,
      referralAdditionalInformation
    )

    await expect(finalTx)
      .to.emit(DSponsorMarketplace, 'AuctionClosed')
      .withArgs(listingId, user2Addr, false, userAddr, user3Addr)

    await expect(finalTx)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(
        listingId,
        _quantity,
        user3Addr,
        newPricePerTokenFinal,
        user4Addr,
        refundBonusAmountFinal,
        _currency,
        _endTime
      )

    expect(refundAmountToPreviousBidderFinal).to.equal(newRefundAmount2)

    const balanceUser4AfterBid = await ERC20Mock.balanceOf(user4Addr)
    const profitUser4 = balanceUser4AfterBid - balanceUser4BeforeBid
    expect(profitUser4).to.equal(BigInt(newProfitAmount2))

    await expect(finalTx).to.changeTokenBalances(
      ERC20Mock,
      [user4, user3, user2, user, owner, treasury, DSponsorMarketplace],
      [
        refundAmountToPreviousBidderFinal,
        0,
        -BigInt(finalBidPrice),
        listerAmount,
        royaltyAmount,
        protocolFeeAmount,
        -BigInt(newAmount2)
      ]
    )

    await expect(finalTx).to.changeTokenBalances(
      DSponsorNFT,
      [user4, user3, user2, user, DSponsorMarketplaceAddress],
      [0, 1, 0, 0, -1]
    )

    expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(user3Addr)

    expect(await ERC20Mock.balanceOf(DSponsorMarketplace)).to.equal(0)
  }

  async function closingBidAuctionListingSaleFixture() {
    await loadFixture(bidAuctionListingSaleFixture)

    const minimalAuctionBps =
      await DSponsorMarketplace.MIN_AUCTION_INCREASE_BPS()
    const bonusRefundBps =
      await DSponsorMarketplace.ADDITIONNAL_REFUND_PREVIOUS_BIDDER_BPS()

    const [
      ,
      _tokenOwner,
      _assetContract,
      _tokenId,
      _startTime,
      _endTime,
      _quantity,
      _currency,
      _reservePricePerToken,
      _buyoutPricePerToken
    ] = await DSponsorMarketplace.listings(listingId)

    const [__listingId, previousBidder, previousPricePerToken] =
      await DSponsorMarketplace.winningBid(listingId)

    const {
      minimalBidPerToken,
      newAmount,
      protocolFeeAmount,
      royaltyAmount,
      listerAmount
    } = computeBidAmounts(
      getMinimalBidPerToken(
        previousPricePerToken.toString(),
        _reservePricePerToken.toString(),
        minimalAuctionBps.toString()
      ), //  newBidPerToken: string,
      _quantity.toString(), // quantity: string,
      _reservePricePerToken.toString(), // reservePricePerToken: string,
      _buyoutPricePerToken.toString(), // buyoutPricePerToken: string,
      previousPricePerToken.toString(), // previousPricePerToken: string | undefined,
      minimalAuctionBps.toString(), // minimalAuctionBps: string,
      bonusRefundBps.toString(), // bonusRefundBps: string,
      royaltyBps.toString(), // royaltyBps: string,
      protocolBps.toString() // protocolFeeBps: string
    )

    await ERC20Mock.connect(user4).approve(
      DSponsorMarketplaceAddress,
      minimalBidPerToken
    )

    await DSponsorMarketplace.connect(user4).bid(
      listingId,
      minimalBidPerToken,
      user2Addr,
      referralAdditionalInformation
    )

    expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(
      DSponsorMarketplaceAddress
    )

    await expect(
      DSponsorMarketplace.connect(deployer).closeAuction(listingId)
    ).to.be.revertedWithCustomError(DSponsorMarketplace, 'AuctionStillActive')

    time.increaseTo(_endTime)

    const finalTx =
      DSponsorMarketplace.connect(deployer).closeAuction(listingId)

    await expect(finalTx)
      .to.emit(DSponsorMarketplace, 'AuctionClosed')
      .withArgs(listingId, deployerAddr, false, userAddr, user2Addr)

    await expect(finalTx).to.changeTokenBalances(
      ERC20Mock,
      [user4, user3, user2, user, owner, treasury, DSponsorMarketplace],
      [
        0,
        0,
        0,
        listerAmount,
        royaltyAmount,
        protocolFeeAmount,
        -BigInt(newAmount)
      ]
    )

    await expect(finalTx).to.changeTokenBalances(
      DSponsorNFT,
      [user4, user3, user2, user, DSponsorMarketplaceAddress],
      [0, 0, 1, 0, -1]
    )

    expect(await ERC20Mock.balanceOf(DSponsorMarketplace)).to.equal(0)

    expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(user2Addr)
  }

  async function auctionListingRentFixture() {
    await loadFixture(deployFixture)

    await DSponsorNFT.connect(user).approve(DSponsorMarketplaceAddress, tokenId)

    const startTime = (await now()) + BigInt('1') // 1 second in the future to anticipate the next block timestamp
    listingParams = {
      assetContract: DSponsorNFTAddress,
      tokenId,
      startTime,
      secondsUntilEndTime: BigInt('3600'),
      quantityToList: 1,
      currencyToAccept: ERC20MockAddress,
      reservePricePerToken: ERC20Amount,
      buyoutPricePerToken: ERC20Amount * reserveToBuyMul,
      transferType: transferTypeRent,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: listingTypeAuction
    }

    const tx = DSponsorMarketplace.connect(user).createListing(listingParams)

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'ListingAdded')
      .withArgs(listingId, DSponsorNFTAddress, userAddr, [
        listingId,
        userAddr,
        listingParams.assetContract,
        listingParams.tokenId,
        startTime,
        startTime + BigInt(listingParams.secondsUntilEndTime),
        1,
        listingParams.currencyToAccept,
        listingParams.reservePricePerToken,
        listingParams.buyoutPricePerToken,
        1, // ERC721
        listingParams.transferType,
        listingParams.rentalExpirationTimestamp,
        listingParams.listingType
      ])

    await expect(tx).to.changeTokenBalances(
      DSponsorNFT,
      [user2, user, DSponsorMarketplaceAddress],
      [0, 0, 0]
    )

    expect(await DSponsorNFT.userOf(tokenId)).to.equal(
      DSponsorMarketplaceAddress
    )
  }

  async function buyAuctionListingRentFixture() {
    await loadFixture(auctionListingRentFixture)

    const minimalAuctionBps =
      await DSponsorMarketplace.MIN_AUCTION_INCREASE_BPS()
    const bonusRefundBps =
      await DSponsorMarketplace.ADDITIONNAL_REFUND_PREVIOUS_BIDDER_BPS()

    const [
      ,
      _tokenOwner,
      _assetContract,
      _tokenId,
      _startTime,
      _endTime,
      _quantity,
      _currency,
      _reservePricePerToken,
      _buyoutPricePerToken
    ] = await DSponsorMarketplace.listings(listingId)

    const [__listingId, previousBidder, previousPricePerToken] =
      await DSponsorMarketplace.winningBid(listingId)

    const {
      minimalBuyoutPerToken: bidPrice,
      refundBonusAmount,
      newPricePerToken,
      protocolFeeAmount,
      royaltyAmount,
      listerAmount
    } = computeBidAmounts(
      getMinimalBuyoutPricePerToken(
        previousPricePerToken.toString(),
        _buyoutPricePerToken.toString(),
        minimalAuctionBps.toString(),
        bonusRefundBps.toString()
      ), //  newBidPerToken: string,
      _quantity.toString(), // quantity: string,
      _reservePricePerToken.toString(), // reservePricePerToken: string,
      _buyoutPricePerToken.toString(), // buyoutPricePerToken: string,
      previousPricePerToken.toString(), // previousPricePerToken: string | undefined,
      minimalAuctionBps.toString(), // minimalAuctionBps: string,
      bonusRefundBps.toString(), // bonusRefundBps: string,
      royaltyBps.toString(), // royaltyBps: string,
      protocolBps.toString() // protocolFeeBps: string
    )

    expect(_buyoutPricePerToken).to.equal(bidPrice)

    await ERC20Mock.connect(user2).approve(DSponsorMarketplaceAddress, bidPrice)

    const tx = DSponsorMarketplace.connect(user2).bid(
      listingId,
      bidPrice,
      user2Addr,
      referralAdditionalInformation
    )

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(
        listingId,
        _quantity,
        user2Addr,
        newPricePerToken,
        previousBidder,
        refundBonusAmount,
        _currency,
        _endTime
      )

    await expect(tx).to.changeTokenBalances(
      ERC20Mock,
      [user2, user, owner, treasury, DSponsorMarketplace],
      [
        _buyoutPricePerToken * BigInt(-1),
        listerAmount,
        royaltyAmount,
        protocolFeeAmount,
        0
      ]
    )

    await expect(tx).to.changeTokenBalances(
      DSponsorNFT,
      [user2, user, DSponsorMarketplaceAddress],
      [0, 0, 0]
    )

    expect(await DSponsorNFT.userOf(tokenId)).to.equal(user2Addr)
    expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(userAddr)
  }

  async function bidAuctionListingRentFixture() {
    await loadFixture(auctionListingRentFixture)

    const bidPrice = (ERC20Amount * BigInt('110')) / BigInt('100')

    await ERC20Mock.connect(user2).approve(DSponsorMarketplaceAddress, bidPrice)

    const minimalAuctionBps =
      await DSponsorMarketplace.MIN_AUCTION_INCREASE_BPS()
    const bonusRefundBps =
      await DSponsorMarketplace.ADDITIONNAL_REFUND_PREVIOUS_BIDDER_BPS()

    const [
      ,
      _tokenOwner,
      _assetContract,
      _tokenId,
      _startTime,
      _endTime,
      _quantity,
      _currency,
      _reservePricePerToken,
      _buyoutPricePerToken
    ] = await DSponsorMarketplace.listings(listingId)

    const [__listingId, previousBidder, previousPricePerToken] =
      await DSponsorMarketplace.winningBid(listingId)

    const { refundBonusAmount, newPricePerToken } = computeBidAmounts(
      bidPrice.toString(), //  newBidPerToken: string,
      _quantity.toString(), // quantity: string,
      _reservePricePerToken.toString(), // reservePricePerToken: string,
      _buyoutPricePerToken.toString(), // buyoutPricePerToken: string,
      previousPricePerToken.toString(), // previousPricePerToken: string | undefined,
      minimalAuctionBps.toString(), // minimalAuctionBps: string,
      bonusRefundBps.toString(), // bonusRefundBps: string,
      royaltyBps.toString(), // royaltyBps: string,
      protocolBps.toString() // protocolFeeBps: string
    )

    const tx = DSponsorMarketplace.connect(user2).bid(
      listingId,
      bidPrice,
      user2Addr,
      referralAdditionalInformation
    )

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(
        listingId,
        _quantity,
        user2Addr,
        newPricePerToken,
        previousBidder,
        refundBonusAmount,
        _currency,
        _endTime
      )

    await expect(tx).to.changeTokenBalances(
      ERC20Mock,
      [user2, user, owner, treasury, DSponsorMarketplace],
      [bidPrice * BigInt(-1), 0, 0, 0, bidPrice]
    )

    await expect(tx).to.changeTokenBalances(
      DSponsorNFT,
      [user2, user, DSponsorMarketplaceAddress],
      [0, 0, 0]
    )

    expect(await DSponsorNFT.userOf(tokenId)).to.equal(
      DSponsorMarketplaceAddress
    )
  }

  async function higherBidAuctionListingRentFixture() {
    await loadFixture(bidAuctionListingRentFixture)

    const minimalAuctionBps =
      await DSponsorMarketplace.MIN_AUCTION_INCREASE_BPS()
    const bonusRefundBps =
      await DSponsorMarketplace.ADDITIONNAL_REFUND_PREVIOUS_BIDDER_BPS()

    const [
      ,
      _tokenOwner,
      _assetContract,
      _tokenId,
      _startTime,
      _endTime,
      _quantity,
      _currency,
      _reservePricePerToken,
      _buyoutPricePerToken
    ] = await DSponsorMarketplace.listings(listingId)

    const [__listingId, previousBidder, previousPricePerToken] =
      await DSponsorMarketplace.winningBid(listingId)

    const {
      minimalBidPerToken,

      refundBonusAmount,
      refundAmountToPreviousBidder,

      newPricePerToken,
      newAmount
    } = computeBidAmounts(
      getMinimalBidPerToken(
        previousPricePerToken.toString(),
        _reservePricePerToken.toString(),
        minimalAuctionBps.toString()
      ), //  newBidPerToken: string,
      _quantity.toString(), // quantity: string,
      _reservePricePerToken.toString(), // reservePricePerToken: string,
      _buyoutPricePerToken.toString(), // buyoutPricePerToken: string,
      previousPricePerToken.toString(), // previousPricePerToken: string | undefined,
      minimalAuctionBps.toString(), // minimalAuctionBps: string,
      bonusRefundBps.toString(), // bonusRefundBps: string,
      royaltyBps.toString(), // royaltyBps: string,
      protocolBps.toString() // protocolFeeBps: string
    )

    const bidPrice = BigInt(minimalBidPerToken)
    await ERC20Mock.connect(user3).approve(DSponsorMarketplaceAddress, bidPrice)

    const tx = DSponsorMarketplace.connect(user3).bid(
      listingId,
      bidPrice,
      user4Addr,
      referralAdditionalInformation
    )

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(
        listingId,
        _quantity,
        user4Addr,
        newPricePerToken,
        previousBidder,
        refundBonusAmount,
        _currency,
        _endTime
      )

    await expect(tx).to.changeTokenBalances(
      ERC20Mock,
      [user4, user3, user2, user, owner, treasury, DSponsorMarketplace],
      [
        0,
        bidPrice * BigInt(-1),
        refundAmountToPreviousBidder,
        0,
        0,
        0,
        bidPrice - BigInt(refundAmountToPreviousBidder)
      ]
    )

    await expect(tx).to.changeTokenBalances(
      DSponsorNFT,
      [user3, user2, user, DSponsorMarketplaceAddress],
      [0, 0, 0, 0]
    )

    expect(await DSponsorNFT.userOf(tokenId)).to.equal(
      DSponsorMarketplaceAddress
    )

    const {
      minimalBuyoutPerToken,
      refundBonusAmount: refundBonusAmountFinal,
      refundAmountToPreviousBidder: refundAmountToPreviousBidderFinal,
      newPricePerToken: newPricePerTokenFinal,
      protocolFeeAmount,
      royaltyAmount,
      listerAmount
    } = computeBidAmounts(
      getMinimalBuyoutPricePerToken(
        newPricePerToken,
        _buyoutPricePerToken.toString(),
        minimalAuctionBps.toString(),
        bonusRefundBps.toString()
      ), //  newBidPerToken: string,
      _quantity.toString(), // quantity: string,
      _reservePricePerToken.toString(), // reservePricePerToken: string,
      _buyoutPricePerToken.toString(), // buyoutPricePerToken: string,
      newPricePerToken.toString(), // previousPricePerToken: string | undefined,
      minimalAuctionBps.toString(), // minimalAuctionBps: string,
      bonusRefundBps.toString(), // bonusRefundBps: string,
      royaltyBps.toString(), // royaltyBps: string,
      protocolBps.toString() // protocolFeeBps: string
    )

    const finalBidPrice = minimalBuyoutPerToken

    await ERC20Mock.connect(user2).approve(
      DSponsorMarketplaceAddress,
      finalBidPrice
    )

    const finalTx = DSponsorMarketplace.connect(user2).bid(
      listingId,
      finalBidPrice,
      user2Addr,
      referralAdditionalInformation
    )

    await expect(finalTx)
      .to.emit(DSponsorMarketplace, 'AuctionClosed')
      .withArgs(listingId, user2Addr, false, userAddr, user2Addr)

    await expect(finalTx)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(
        listingId,
        _quantity,
        user2Addr,
        newPricePerTokenFinal,
        user4Addr,
        refundBonusAmountFinal,
        _currency,
        _endTime
      )

    await expect(finalTx).to.changeTokenBalances(
      ERC20Mock,
      [user4, user3, user2, user, owner, treasury, DSponsorMarketplace],
      [
        refundAmountToPreviousBidderFinal,
        0,
        -BigInt(finalBidPrice),
        listerAmount,
        royaltyAmount,
        protocolFeeAmount,
        -BigInt(newAmount)
      ]
    )

    await expect(finalTx).to.changeTokenBalances(
      DSponsorNFT,
      [user4, user3, user2, user, DSponsorMarketplaceAddress],
      [0, 0, 0, 0, 0]
    )

    expect(await DSponsorNFT.userOf(tokenId)).to.equal(user2Addr)
  }

  async function closingBidAuctionListingRentFixture() {
    await loadFixture(bidAuctionListingRentFixture)

    const lastBidPrice = (ERC20Amount * BigInt('110')) / BigInt('100')
    const endTime =
      BigInt(listingParams.startTime) +
      BigInt(listingParams.secondsUntilEndTime)

    expect(await DSponsorNFT.userOf(tokenId)).to.equal(
      DSponsorMarketplaceAddress
    )

    await expect(
      DSponsorMarketplace.connect(deployer).closeAuction(listingId)
    ).to.be.revertedWithCustomError(DSponsorMarketplace, 'AuctionStillActive')

    time.increaseTo(endTime)

    const finalTx =
      DSponsorMarketplace.connect(deployer).closeAuction(listingId)

    await expect(finalTx)
      .to.emit(DSponsorMarketplace, 'AuctionClosed')
      .withArgs(listingId, deployerAddr, false, userAddr, user2Addr)

    await expect(finalTx).to.changeTokenBalances(
      ERC20Mock,
      [user3, user2, user, owner, treasury, DSponsorMarketplace],
      [0, 0, ...computeFee(lastBidPrice), -lastBidPrice]
    )

    await expect(finalTx).to.changeTokenBalances(
      DSponsorNFT,
      [user3, user2, user, DSponsorMarketplaceAddress],
      [0, 0, 0, 0]
    )

    expect(await DSponsorNFT.userOf(tokenId)).to.equal(user2Addr)
  }

  async function makeSaleOfferFixture() {
    await loadFixture(deployFixture)

    const startTime = await now()
    const rentalExpirationTimestamp =
      startTime + BigInt(Number(3600 * 24 * 31).toString()) // 31 days
    const expirationTimestamp = startTime + BigInt('3600') // 1 hour

    offerParams = {
      assetContract: DSponsorNFTAddress,
      tokenId,
      quantity: 1,
      currency: ERC20MockAddress,
      totalPrice: ERC20Amount,
      expirationTimestamp,
      transferType: transferTypeSale,
      rentalExpirationTimestamp,
      referralAdditionalInformation
    }

    await expect(
      ERC20Mock.connect(user2).approve(DSponsorMarketplaceAddress, ERC20Amount)
    )

    await expect(DSponsorMarketplace.connect(user2).makeOffer(offerParams))
      .to.emit(DSponsorMarketplace, 'NewOffer')
      .withArgs(user2Addr, offerId, offerParams.assetContract, [
        offerId,
        offerParams.tokenId,
        offerParams.quantity,
        offerParams.totalPrice,
        offerParams.expirationTimestamp,
        user2Addr,
        offerParams.assetContract,
        offerParams.currency,
        1, // ERC721
        offerParams.transferType,
        offerParams.rentalExpirationTimestamp,
        1, // Status.Created
        referralAdditionalInformation
      ])
  }

  async function acceptSaleOfferFixture() {
    await loadFixture(makeSaleOfferFixture)

    await DSponsorNFT.connect(user).approve(DSponsorMarketplaceAddress, tokenId)

    const tx = DSponsorMarketplace.connect(user).acceptOffer(offerId)

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'AcceptedOffer')
      .withArgs(
        user2Addr,
        offerId,
        DSponsorNFTAddress,
        tokenId,
        user,
        1,
        ERC20Amount
      )

    await expect(tx).to.changeTokenBalances(
      ERC20Mock,
      [user2, user, owner, treasury, DSponsorMarketplace],
      [-ERC20Amount, ...computeFee(ERC20Amount), 0]
    )

    await expect(tx).to.changeTokenBalances(DSponsorNFT, [user2, user], [1, -1])

    expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(user2Addr)
  }

  async function makeRentOfferFixture() {
    await loadFixture(closingBidAuctionListingRentFixture)

    const startTime = await now()
    const rentalExpirationTimestamp = listingParams.rentalExpirationTimestamp
    const expirationTimestamp = startTime + BigInt('3600') // 1 hour

    offerParams = {
      assetContract: DSponsorNFTAddress,
      tokenId,
      quantity: 1,
      currency: ERC20MockAddress,
      totalPrice: ERC20Amount,
      expirationTimestamp,
      transferType: transferTypeRent,
      rentalExpirationTimestamp,
      referralAdditionalInformation
    }

    await expect(
      ERC20Mock.connect(user3).approve(DSponsorMarketplaceAddress, ERC20Amount)
    )

    await expect(DSponsorMarketplace.connect(user3).makeOffer(offerParams))
      .to.emit(DSponsorMarketplace, 'NewOffer')
      .withArgs(user3Addr, offerId, offerParams.assetContract, [
        offerId,
        offerParams.tokenId,
        offerParams.quantity,
        offerParams.totalPrice,
        offerParams.expirationTimestamp,
        user3Addr,
        offerParams.assetContract,
        offerParams.currency,
        1, // ERC721
        offerParams.transferType,
        offerParams.rentalExpirationTimestamp,
        1, // Status.Created
        referralAdditionalInformation
      ])
  }

  async function acceptRentOfferFixture() {
    await loadFixture(makeRentOfferFixture)

    await DSponsorNFT.connect(user2).setApprovalForAll(
      DSponsorMarketplaceAddress,
      true
    )

    const tx = DSponsorMarketplace.connect(user2).acceptOffer(offerId)

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'AcceptedOffer')
      .withArgs(
        user3Addr,
        offerId,
        DSponsorNFTAddress,
        tokenId,
        user2Addr,
        1,
        ERC20Amount
      )

    await expect(tx).to.changeTokenBalances(
      ERC20Mock,
      [user, user3, user2, owner, treasury, DSponsorMarketplace],
      [0, -ERC20Amount, ...computeFee(ERC20Amount), 0]
    )

    await expect(tx).to.changeTokenBalances(
      DSponsorNFT,
      [user3, user2, user],
      [0, 0, 0]
    )

    expect(await DSponsorNFT.userOf(tokenId)).to.equal(user3Addr)
  }

  describe('Deployment', function () {
    it('Should be set with the constructor arguments', async function () {
      await loadFixture(deployFixture)
      expect(await DSponsorMarketplace.trustedForwarder()).to.equal(
        forwarderAddress
      )
      expect(await DSponsorMarketplace.owner()).to.equal(deployerAddr)
      expect(await DSponsorMarketplace.feeRecipient()).to.equal(treasuryAddr)
      expect(await DSponsorMarketplace.feeBps()).to.equal(protocolBps)
    })
  })

  describe('Direct Listings', function () {
    it('Should create a direct listing to sell an ERC721 token', async function () {
      await loadFixture(directListingSaleFixture)
    })

    it('Should create a direct listing to rent an ERC721 token', async function () {
      await loadFixture(directListingRentFixture)
    })

    it('Should fail to create a direct listing for ERC20', async function () {
      await loadFixture(deployFixture)

      await ERC20Mock.connect(user).approve(DSponsorMarketplaceAddress, 2)

      const startTime = (await now()) + BigInt('1') // 1 second in the future to anticipate the next block timestamp
      listingParams = {
        assetContract: ERC20Mock,
        tokenId,
        startTime,
        secondsUntilEndTime: BigInt('3600'),
        quantityToList: 1,
        currencyToAccept: ERC20MockAddress,
        reservePricePerToken: ERC20Amount,
        buyoutPricePerToken: ERC20Amount * reserveToBuyMul,
        transferType: transferTypeSale,
        rentalExpirationTimestamp:
          (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
        listingType: listingTypeDirect
      }

      await expect(
        DSponsorMarketplace.connect(user).createListing(listingParams)
      ).to.be.reverted
    })

    it('Should fail to create a rent direct listing for non-ERC4907', async function () {
      await loadFixture(deployFixture)

      const ERC721Mock = await ethers.deployContract('ERC721Mock')
      const ERC721MockAddress = await ERC721Mock.getAddress()

      const startTime = (await now()) + BigInt('1') // 1 second in the future to anticipate the next block timestamp
      listingParams = {
        assetContract: ERC721MockAddress,
        tokenId,
        startTime,
        secondsUntilEndTime: BigInt('3600'),
        quantityToList: 1,
        currencyToAccept: ERC20MockAddress,
        reservePricePerToken: ERC20Amount,
        buyoutPricePerToken: ERC20Amount * reserveToBuyMul,
        transferType: transferTypeRent,
        rentalExpirationTimestamp:
          (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
        listingType: listingTypeDirect
      }

      await expect(
        DSponsorMarketplace.connect(user).createListing(listingParams)
      ).to.be.revertedWithCustomError(
        DSponsorMarketplace,
        'NotERC4907Compliant'
      )
    })

    it('Should update direct sale listing', async function () {
      await loadFixture(directListingRentFixture)

      const startTime = (await now()) + BigInt('10')
      const updateParams: IDSponsorMarketplace.ListingUpdateParametersStruct = {
        quantityToList: 1,
        reservePricePerToken: ERC20Amount * BigInt('2'),
        buyoutPricePerToken: ERC20Amount * BigInt('3'),
        currencyToAccept: USDCAddr,
        startTime,
        secondsUntilEndTime: BigInt('3600'),
        rentalExpirationTimestamp: listingParams.rentalExpirationTimestamp
      }

      await expect(
        DSponsorMarketplace.connect(user).updateListing(listingId, updateParams)
      )
        .to.emit(DSponsorMarketplace, 'ListingUpdated')
        .withArgs(listingId, userAddr, [
          updateParams.quantityToList,
          updateParams.reservePricePerToken,
          updateParams.buyoutPricePerToken,
          updateParams.currencyToAccept,
          updateParams.startTime,
          updateParams.secondsUntilEndTime,
          updateParams.rentalExpirationTimestamp
        ])
    })

    it('Should buy a token from a direct listing', async function () {
      await loadFixture(buyDirectListingSaleFixture)
    })

    it('Should buy token from direct listings - thanks to swap', async function () {
      const { WETHTotalPrice, USDCeTotalPrice } = await loadFixture(
        multipleDirectSalesFixture
      )

      const balanceUser2 = await provider.getBalance(user2Addr)

      let tx = await DSponsorMarketplace.connect(deployer).buy(
        {
          listingId: 1,
          buyFor: user2Addr,
          quantity: 1,
          currency: WethAddr,
          referralAdditionalInformation
        },
        { value: WETHTotalPrice }
      )

      await expect(tx).to.changeTokenBalances(
        DSponsorNFT,
        [user2, user],
        [1, -1]
      )

      await expect(tx).to.changeTokenBalances(
        WethContract,
        [deployer, user2, user, owner, treasury, DSponsorMarketplace],
        [0, 0, ...computeFee(WETHTotalPrice), 0]
      )

      const { amountInEthWithSlippage } = await getEthQuote(
        USDCAddr,
        USDCeTotalPrice.toString()
      )

      const value = amountInEthWithSlippage // 0.3% slippage

      tx = await DSponsorMarketplace.connect(deployer).buy(
        {
          listingId: 0,
          buyFor: user2Addr,
          quantity: 1,
          currency: USDCAddr,
          referralAdditionalInformation
        },
        { value }
      )

      await expect(tx).to.changeTokenBalances(
        DSponsorNFT,
        [user2, user],
        [1, -1]
      )

      await expect(tx).to.changeTokenBalances(
        USDCContract,
        [deployer, user2, user, owner, treasury, DSponsorMarketplace],
        [0, 0, ...computeFee(USDCeTotalPrice), 0]
      )
      await expect(tx).to.changeEtherBalances([deployer], [-value])

      expect(await DSponsorNFT.ownerOf(1)).to.equal(user2Addr)
      expect(await DSponsorNFT.ownerOf(10)).to.equal(user2Addr)

      // the final user get the refund
      expect(await provider.getBalance(user2Addr)).to.be.gt(balanceUser2)
    })

    it('Should fail if not enough value to buy token ', async function () {
      const { WETHTotalPrice, USDCeTotalPrice } = await loadFixture(
        multipleDirectSalesFixture
      )

      const value = parseEther('0.00000000000099')

      await expect(
        DSponsorMarketplace.connect(deployer).buy(
          {
            listingId: 0,
            buyFor: user2Addr,
            quantity: 1,
            currency: USDCAddr,
            referralAdditionalInformation
          },
          { value }
        )
      ).to.be.revertedWith('STF')

      await expect(
        DSponsorMarketplace.connect(deployer).buy(
          {
            listingId: 1,
            buyFor: user2Addr,
            quantity: 1,
            currency: WethAddr,
            referralAdditionalInformation
          },
          { value }
        )
      ).to.be.revertedWithCustomError(DSponsorMarketplace, 'InsufficientFunds')
    })

    it('Should rent a token from a direct listing', async function () {
      await loadFixture(buyDirectListingRentFixture)
    })

    it('Should allow to cancel a direct listing', async function () {
      await loadFixture(directListingRentFixture)

      await expect(
        DSponsorMarketplace.connect(user).cancelDirectListing(2)
      ).to.be.revertedWithCustomError(
        DSponsorMarketplace,
        'SenderIsNotTokenOwner'
      )
      await expect(
        DSponsorMarketplace.connect(user2).cancelDirectListing(listingId)
      ).to.be.revertedWithCustomError(
        DSponsorMarketplace,
        'SenderIsNotTokenOwner'
      )

      await expect(
        DSponsorMarketplace.connect(user).cancelDirectListing(listingId)
      )
        .to.emit(DSponsorMarketplace, 'ListingRemoved')
        .withArgs(listingId, userAddr)

      const totalPrice = ERC20Amount * reserveToBuyMul

      const buyParams: IDSponsorMarketplace.BuyParamsStruct = {
        listingId,
        buyFor: user2Addr,
        quantity: 1,
        currency: ERC20MockAddress,
        referralAdditionalInformation
      }

      await expect(
        DSponsorMarketplace.connect(user2).buy(buyParams)
      ).to.be.revertedWithCustomError(
        DSponsorMarketplace,
        'ListingDoesNotExist'
      )
    })
  })

  describe('Auctions', function () {
    it('Should create a auction listing to rent an ERC721 token', async function () {
      await loadFixture(auctionListingRentFixture)
    })

    it('Should buy a token from an auction listing', async function () {
      await loadFixture(buyAuctionListingSaleFixture)
    })

    it('Should bid on a token from an auction sale listing', async function () {
      await loadFixture(bidAuctionListingSaleFixture)
    })

    it('Should bid on a token from an auction sale listing with a higher bid', async function () {
      await loadFixture(higherBidAuctionListingSaleFixture)
    })

    it('Should reject if refund exceeds incoming bid', async function () {
      await loadFixture(deployFixture)

      await DSponsorNFT.connect(user).approve(
        DSponsorMarketplaceAddress,
        tokenId
      )

      const startTime = (await now()) + BigInt('1') // 1 second in the future to anticipate the next block timestamp

      const _reservePricePerToken = '4'
      const _buyoutPricePerToken = '200'
      const _quantity = '1'
      listingParams = {
        assetContract: DSponsorNFTAddress,
        tokenId,
        startTime,
        secondsUntilEndTime: BigInt('3600'),
        quantityToList: _quantity,
        currencyToAccept: ERC20MockAddress,
        reservePricePerToken: _reservePricePerToken,
        buyoutPricePerToken: _buyoutPricePerToken,
        transferType: transferTypeSale,
        rentalExpirationTimestamp:
          (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
        listingType: listingTypeAuction
      }

      await DSponsorMarketplace.connect(user).createListing(listingParams)

      const listingId = 0

      const minimalAuctionBps =
        await DSponsorMarketplace.MIN_AUCTION_INCREASE_BPS()
      const bonusRefundBps =
        await DSponsorMarketplace.ADDITIONNAL_REFUND_PREVIOUS_BIDDER_BPS()

      await ERC20Mock.connect(user2).approve(
        DSponsorMarketplaceAddress,
        _reservePricePerToken
      )

      await DSponsorMarketplace.connect(user2).bid(
        listingId,
        _reservePricePerToken,
        user2Addr,
        referralAdditionalInformation
      )

      const {
        minimalBidPerToken: minimalBidPerToken1,
        refundBonusAmount: refundBonusAmount1,
        refundAmountToPreviousBidder: refundAmountToPreviousBidder1,
        newPricePerToken: newPricePerToken1,
        newAmount: newAmount1
      } = computeBidAmounts(
        getMinimalBidPerToken(
          _reservePricePerToken.toString(),
          _reservePricePerToken.toString(),
          minimalAuctionBps.toString()
        ), //  newBidPerToken: string,
        _quantity.toString(), // quantity: string,
        _reservePricePerToken.toString(), // reservePricePerToken: string,
        _buyoutPricePerToken.toString(), // buyoutPricePerToken: string,
        _reservePricePerToken, // previousPricePerToken: string | undefined,
        minimalAuctionBps.toString(), // minimalAuctionBps: string,
        bonusRefundBps.toString(), // bonusRefundBps: string,
        royaltyBps.toString(), // royaltyBps: string,
        protocolBps.toString() // protocolFeeBps: string
      )

      await ERC20Mock.connect(user3).approve(
        DSponsorMarketplaceAddress,
        minimalBidPerToken1
      )

      await expect(
        DSponsorMarketplace.connect(user3).bid(
          listingId,
          minimalBidPerToken1,
          user3Addr,
          referralAdditionalInformation
        )
      ).to.be.revertedWithCustomError(DSponsorMarketplace, 'RefundExceedsBid')
    })

    it('Should allow bids with swaps', async function () {
      await loadFixture(deployFixture)

      await DSponsorNFT.connect(user).approve(
        DSponsorMarketplaceAddress,
        tokenId
      )

      const startTime = (await now()) + BigInt('1') // 1 second in the future to anticipate the next block timestamp

      const _reservePricePerToken = USDCPrice
      const _buyoutPricePerToken = USDCPrice * reserveToBuyMul
      const _quantity = '1'
      const _endTime = startTime + BigInt('3600')
      listingParams = {
        assetContract: DSponsorNFTAddress,
        tokenId,
        startTime,
        secondsUntilEndTime: BigInt('3600'),
        quantityToList: _quantity,
        currencyToAccept: USDCContract,
        reservePricePerToken: _reservePricePerToken,
        buyoutPricePerToken: _buyoutPricePerToken,
        transferType: transferTypeSale,
        rentalExpirationTimestamp:
          (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
        listingType: listingTypeAuction
      }

      await DSponsorMarketplace.connect(user).createListing(listingParams)

      const listingId = 0

      const minimalAuctionBps =
        await DSponsorMarketplace.MIN_AUCTION_INCREASE_BPS()
      const bonusRefundBps =
        await DSponsorMarketplace.ADDITIONNAL_REFUND_PREVIOUS_BIDDER_BPS()

      ///// BID 1 /////////////////////

      const {
        refundBonusAmount: refundBonusAmount1,
        newPricePerToken: newPricePerToken1
        // newAmount: newAmount1
      } = computeBidAmounts(
        _reservePricePerToken.toString(), //  newBidPerToken: string,
        _quantity.toString(), // quantity: string,
        _reservePricePerToken.toString(), // reservePricePerToken: string,
        _buyoutPricePerToken.toString(), // buyoutPricePerToken: string,
        '0', // previousPricePerToken: string | undefined,
        minimalAuctionBps.toString(), // minimalAuctionBps: string,
        bonusRefundBps.toString(), // bonusRefundBps: string,
        royaltyBps.toString(), // royaltyBps: string,
        protocolBps.toString() // protocolFeeBps: string
      )

      const { amountInEthWithSlippage: amountInEthWithSlippage1 } =
        await getEthQuote(
          USDCAddr,
          _reservePricePerToken.toString()
          // slippagePerCent: number = 0.3
        )

      const tx1 = await DSponsorMarketplace.connect(user2).bid(
        listingId,
        _reservePricePerToken,
        user3Addr,
        referralAdditionalInformation,
        { value: amountInEthWithSlippage1 }
      )

      await expect(tx1)
        .to.emit(DSponsorMarketplace, 'NewBid')
        .withArgs(
          listingId,
          _quantity,
          user3Addr,
          newPricePerToken1,
          ZERO_ADDRESS,
          refundBonusAmount1,
          USDCAddr,
          _endTime
        )

      await expect(tx1).to.changeTokenBalances(
        USDCContract,
        [user3, user2, user, owner, treasury, DSponsorMarketplace],
        [0, 0, 0, 0, 0, _reservePricePerToken]
      )

      await expect(tx1).to.changeEtherBalances(
        [user2, DSponsorMarketplace],
        [-amountInEthWithSlippage1, 0]
      )

      ///// BID 2 /////////////////////

      const {
        minimalBidPerToken: minimalBidPerToken2,
        refundBonusAmount: refundBonusAmount2,
        refundAmountToPreviousBidder: refundAmountToPreviousBidder2,
        newPricePerToken: newPricePerToken2,
        newAmount: newAmount2
      } = computeBidAmounts(
        getMinimalBidPerToken(
          newPricePerToken1.toString(),
          _reservePricePerToken.toString(),
          minimalAuctionBps.toString()
        ), //  newBidPerToken: string,
        _quantity.toString(), // quantity: string,
        _reservePricePerToken.toString(), // reservePricePerToken: string,
        _buyoutPricePerToken.toString(), // buyoutPricePerToken: string,
        newPricePerToken1.toString(), // previousPricePerToken: string | undefined,
        minimalAuctionBps.toString(), // minimalAuctionBps: string,
        bonusRefundBps.toString(), // bonusRefundBps: string,
        royaltyBps.toString(), // royaltyBps: string,
        protocolBps.toString() // protocolFeeBps: string
      )

      const { amountInEthWithSlippage: amountInEthWithSlippage2 } =
        await getEthQuote(
          USDCAddr,
          minimalBidPerToken2.toString()
          // slippagePerCent: number = 0.3
        )

      const tx2 = await DSponsorMarketplace.connect(user4).bid(
        listingId,
        minimalBidPerToken2,
        user4Addr,
        referralAdditionalInformation,
        { value: amountInEthWithSlippage2 }
      )

      await expect(tx2)
        .to.emit(DSponsorMarketplace, 'NewBid')
        .withArgs(
          listingId,
          _quantity,
          user4Addr,
          newPricePerToken2,
          user3Addr,
          refundBonusAmount2,
          USDCAddr,
          _endTime
        )

      await expect(tx2).to.changeTokenBalances(
        USDCContract,
        [user4, user3, user2, user, owner, treasury, DSponsorMarketplace],
        [
          0,
          refundAmountToPreviousBidder2,
          0,
          0,
          0,
          0,
          BigInt(minimalBidPerToken2) - BigInt(refundAmountToPreviousBidder2)
        ]
      )

      ///// BID FINAL /////////////////////

      const {
        minimalBidPerToken: minimalBidPerTokenFinal,
        minimalBuyoutPerToken: finalBidPrice,

        refundBonusAmount: refundBonusAmountFinal,
        refundAmountToPreviousBidder: refundAmountToPreviousBidderFinal,

        newPricePerToken: newPricePerTokenFinal,

        protocolFeeAmount,
        royaltyAmount,
        listerAmount
      } = computeBidAmounts(
        getMinimalBuyoutPricePerToken(
          newPricePerToken2,
          _buyoutPricePerToken.toString(),
          minimalAuctionBps.toString(),
          bonusRefundBps.toString()
        ), //  newBidPerToken: string,
        _quantity.toString(), // quantity: string,
        _reservePricePerToken.toString(), // reservePricePerToken: string,
        _buyoutPricePerToken.toString(), // buyoutPricePerToken: string,
        newPricePerToken2.toString(), // previousPricePerToken: string | undefined,
        minimalAuctionBps.toString(), // minimalAuctionBps: string,
        bonusRefundBps.toString(), // bonusRefundBps: string,
        royaltyBps.toString(), // royaltyBps: string,
        protocolBps.toString() // protocolFeeBps: string
      )

      const { amountInEthWithSlippage: amountInEthWithSlippage3 } =
        await getEthQuote(
          USDCAddr,
          finalBidPrice.toString()
          // slippagePerCent: number = 0.3
        )

      const finalTx = await DSponsorMarketplace.connect(user2).bid(
        listingId,
        finalBidPrice,
        user3Addr,
        referralAdditionalInformation,
        { value: amountInEthWithSlippage3 }
      )

      await expect(finalTx)
        .to.emit(DSponsorMarketplace, 'AuctionClosed')
        .withArgs(listingId, user2Addr, false, userAddr, user3Addr)

      await expect(finalTx)
        .to.emit(DSponsorMarketplace, 'NewBid')
        .withArgs(
          listingId,
          _quantity,
          user3Addr,
          newPricePerTokenFinal,
          user4Addr,
          refundBonusAmountFinal,
          USDCAddr,
          _endTime
        )

      await expect(finalTx).to.changeTokenBalances(
        USDCContract,
        [user4, user3, user2, user, owner, treasury, DSponsorMarketplace],
        [
          refundAmountToPreviousBidderFinal,
          0,
          0,
          listerAmount,
          royaltyAmount,
          protocolFeeAmount,
          -BigInt(newAmount2)
        ]
      )

      await expect(finalTx).to.changeTokenBalances(
        DSponsorNFT,
        [user4, user3, user2, user, DSponsorMarketplaceAddress],
        [0, 1, 0, 0, -1]
      )

      expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(user3Addr)

      expect(await ERC20Mock.balanceOf(DSponsorMarketplace)).to.equal(0)
    })

    it('Should allow to cancel if no bid', async function () {
      await loadFixture(auctionListingRentFixture)

      expect(await DSponsorNFT.userOf(tokenId)).to.equal(
        DSponsorMarketplaceAddress
      )

      const tx = DSponsorMarketplace.connect(user).closeAuction(listingId)

      await expect(tx)
        .to.emit(DSponsorMarketplace, 'AuctionClosed')
        .withArgs(listingId, userAddr, true, userAddr, ZERO_ADDRESS)

      expect(await DSponsorNFT.userOf(tokenId)).to.equal(user)

      const bidPrice = (ERC20Amount * BigInt('110')) / BigInt('100')

      await ERC20Mock.connect(user2).approve(
        DSponsorMarketplaceAddress,
        bidPrice
      )

      await expect(
        DSponsorMarketplace.connect(user2).bid(
          listingId,
          bidPrice,
          user2Addr,
          referralAdditionalInformation
        )
      )
        .to.be.revertedWithCustomError(
          DSponsorMarketplace,
          'ListingDoesNotExist'
        )
        .withArgs(listingId)
    })

    it('Should forbid to cancel if there is a bid', async function () {
      await loadFixture(bidAuctionListingRentFixture)

      await expect(
        DSponsorMarketplace.connect(user).closeAuction(listingId)
      ).to.revertedWithCustomError(DSponsorMarketplace, 'AuctionStillActive')
    })

    it('Should close an auction sale listing', async function () {
      await loadFixture(closingBidAuctionListingSaleFixture)
    })

    it('Should forbid bid for closed sale listing', async function () {
      await loadFixture(closingBidAuctionListingSaleFixture)

      const minimalAuctionBps =
        await DSponsorMarketplace.MIN_AUCTION_INCREASE_BPS()
      const bonusRefundBps =
        await DSponsorMarketplace.ADDITIONNAL_REFUND_PREVIOUS_BIDDER_BPS()

      const [
        ,
        _tokenOwner,
        _assetContract,
        _tokenId,
        _startTime,
        _endTime,
        _quantity,
        _currency,
        _reservePricePerToken,
        _buyoutPricePerToken
      ] = await DSponsorMarketplace.listings(listingId)

      const [__listingId, previousBidder, previousPricePerToken] =
        await DSponsorMarketplace.winningBid(listingId)

      const { minimalBidPerToken } = computeBidAmounts(
        getMinimalBidPerToken(
          previousPricePerToken.toString(),
          _reservePricePerToken.toString(),
          minimalAuctionBps.toString()
        ), //  newBidPerToken: string,
        _quantity.toString(), // quantity: string,
        _reservePricePerToken.toString(), // reservePricePerToken: string,
        _buyoutPricePerToken.toString(), // buyoutPricePerToken: string,
        previousPricePerToken.toString(), // previousPricePerToken: string | undefined,
        minimalAuctionBps.toString(), // minimalAuctionBps: string,
        bonusRefundBps.toString(), // bonusRefundBps: string,
        royaltyBps.toString(), // royaltyBps: string,
        protocolBps.toString() // protocolFeeBps: string
      )

      await ERC20Mock.connect(user4).approve(
        DSponsorMarketplaceAddress,
        minimalBidPerToken
      )

      await expect(
        DSponsorMarketplace.connect(user4).bid(
          listingId,
          minimalBidPerToken,
          user2Addr,
          referralAdditionalInformation
        )
      ).to.be.revertedWithCustomError(
        DSponsorMarketplace,
        'OutOfValidityPeriod'
      )
    })

    it('Should rent a token from an auction listing', async function () {
      await loadFixture(buyAuctionListingRentFixture)
    })

    it('Should bid on a token from an auction rent listing', async function () {
      await loadFixture(bidAuctionListingRentFixture)
    })

    it('Should bid on a token from an auction rent listing with a higher bid', async function () {
      await loadFixture(higherBidAuctionListingRentFixture)
    })

    it('Should close an auction rent listing', async function () {
      await loadFixture(closingBidAuctionListingRentFixture)
    })

    it('Should only allow the tenant to rent a token, but owner only to sell', async function () {
      await loadFixture(closingBidAuctionListingRentFixture)

      expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(userAddr)
      expect(await DSponsorNFT.userOf(tokenId)).to.equal(user2Addr)

      await DSponsorNFT.connect(user2).setApprovalForAll(
        DSponsorMarketplaceAddress,
        true
      )

      const rentalExpirationTimestamp = await DSponsorNFT.userExpires(tokenId)

      const startTime = await now()

      const rentListingParams: IDSponsorMarketplace.ListingParametersStruct = {
        assetContract: DSponsorNFTAddress,
        tokenId,
        startTime,
        secondsUntilEndTime: 2000,
        quantityToList: 1,
        currencyToAccept: ERC20MockAddress,
        reservePricePerToken: ERC20Amount,
        buyoutPricePerToken: ERC20Amount * reserveToBuyMul,
        transferType: transferTypeRent,
        rentalExpirationTimestamp,
        listingType: listingTypeAuction
      }

      const saleListingParams: IDSponsorMarketplace.ListingParametersStruct =
        Object.assign(
          {},
          { ...rentListingParams },
          {
            transferType: transferTypeSale
          }
        )

      await expect(
        DSponsorMarketplace.connect(user).createListing(rentListingParams)
      ).to.be.revertedWithCustomError(
        DSponsorMarketplace,
        'InsufficientAllowanceOrBalance'
      )
      await expect(
        DSponsorMarketplace.connect(user2).createListing(saleListingParams)
      ).to.be.revertedWithCustomError(
        DSponsorMarketplace,
        'InsufficientAllowanceOrBalance'
      )

      await expect(
        DSponsorMarketplace.connect(user2).createListing(rentListingParams)
      ).to.be.emit(DSponsorMarketplace, 'ListingAdded')

      await DSponsorNFT.connect(user).transferFrom(userAddr, user3Addr, tokenId)

      await DSponsorNFT.connect(user3).approve(
        DSponsorMarketplaceAddress,
        tokenId
      )

      await expect(
        DSponsorMarketplace.connect(user3).createListing(saleListingParams)
      ).to.be.emit(DSponsorMarketplace, 'ListingAdded')
    })
  })

  describe('Offers', function () {
    it('Should make a sale offer for a token', async function () {
      await loadFixture(makeSaleOfferFixture)
    })

    it('Should accept a sale offer for a token', async function () {
      await loadFixture(acceptSaleOfferFixture)
    })

    it('Should make a rent offer for a token', async function () {
      await loadFixture(makeRentOfferFixture)
    })

    it('Should accept a rent offer for a token', async function () {
      await loadFixture(acceptRentOfferFixture)
    })

    it('Should revert if the offer is completed', async function () {
      await loadFixture(acceptRentOfferFixture)

      const tx = DSponsorMarketplace.connect(user2).acceptOffer(offerId)

      await expect(tx).to.revertedWithCustomError(
        DSponsorMarketplace,
        'OfferIsNotActive'
      )
    })

    it('Should revert if the offer is cancelled', async function () {
      await loadFixture(makeRentOfferFixture)

      await expect(DSponsorMarketplace.connect(user3).cancelOffer(offerId))
        .to.emit(DSponsorMarketplace, 'CancelledOffer')
        .withArgs(user3Addr, offerId)

      await expect(
        DSponsorMarketplace.connect(user2).acceptOffer(offerId)
      ).to.revertedWithCustomError(DSponsorMarketplace, 'OfferIsNotActive')
    })
  })

  describe('ERC2771 Related Functions', function () {
    it('Should set the trusted forwarder correctly', async function () {
      await loadFixture(deployFixture)

      const nftEncodedFunctionData = DSponsorNFT.interface.encodeFunctionData(
        'approve',
        [DSponsorMarketplaceAddress, tokenId]
      )

      await executeByForwarder(
        forwarder,
        DSponsorNFT as BaseContract,
        user,
        nftEncodedFunctionData
      )

      const startTime = (await now()) + BigInt('1') // 1 second in the future to anticipate the next block timestamp
      listingParams = {
        assetContract: DSponsorNFTAddress,
        tokenId,
        startTime,
        secondsUntilEndTime: BigInt('3600'),
        quantityToList: 1,
        currencyToAccept: ERC20MockAddress,
        reservePricePerToken: ERC20Amount,
        buyoutPricePerToken: ERC20Amount * reserveToBuyMul,
        transferType: transferTypeSale,
        rentalExpirationTimestamp:
          (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
        listingType: listingTypeAuction
      }

      const encodedFunctionData =
        DSponsorMarketplace.interface.encodeFunctionData('createListing', [
          listingParams
        ])

      const forwarderFactory2 =
        await ethers.getContractFactory('ERC2771Forwarder')
      const forwarder2 = await forwarderFactory2.deploy('ERC2771Forwarder')
      await forwarder2.waitForDeployment()
      await DSponsorMarketplace.connect(deployer).setTrustedForwarder(
        await forwarder2.getAddress()
      )

      await expect(
        executeByForwarder(
          forwarder,
          DSponsorMarketplace as BaseContract,
          owner,
          encodedFunctionData
        )
      ).to.revertedWithCustomError(forwarder, 'ERC2771UntrustfulTarget')

      const tx = executeByForwarder(
        forwarder2,
        DSponsorMarketplace as BaseContract,
        user,
        encodedFunctionData
      )

      await expect(tx).to.emit(DSponsorMarketplace, 'ListingAdded')

      await expect(tx).to.changeTokenBalances(
        DSponsorNFT,
        [user2, user, DSponsorMarketplaceAddress],
        [0, -1, 1]
      )

      expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(
        DSponsorMarketplaceAddress
      )
    })
  })
})
