import 'dotenv/config'
import { expect } from 'chai'
import {
  BaseContract,
  parseEther,
  Signer,
  toUtf8Bytes,
  keccak256,
  BigNumberish
} from 'ethers'
import { ethers, network } from 'hardhat'
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

import { ZERO_ADDRESS } from '../utils/constants'
import { IDSponsorMarketplace } from '../typechain-types/contracts/DSponsorMarketplace'

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
  let treasury: Signer
  let treasuryAddr: string

  const swapRouter = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'

  let WethAddr = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
  let WethContract: ERC20
  let USDCeAddr = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'
  let USDCeContract: ERC20

  const ERC20Amount: bigint = parseEther('15')
  const valuePrice: bigint = parseEther('1')
  const USDCePrice = BigInt((2 * 10 ** 6).toString()) // 2 USDCe
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
    signers = await ethers.getSigners()
    ;[deployer, owner, user, user2, user3, treasury] = signers

    deployerAddr = await deployer.getAddress()
    ownerAddr = await owner.getAddress()
    userAddr = await user.getAddress()
    user2Addr = await user2.getAddress()
    user3Addr = await user3.getAddress()
    treasuryAddr = await treasury.getAddress()

    USDCeContract = await ethers.getContractAt('ERC20', USDCeAddr)
    WethContract = await ethers.getContractAt('ERC20', WethAddr)

    forwarder = await ethers.deployContract('ERC2771Forwarder', [])
    await forwarder.waitForDeployment()
    forwarderAddress = await forwarder.getAddress()

    ERC20Mock = await ethers.deployContract('ERC20Mock', [])
    await ERC20Mock.waitForDeployment()
    ERC20MockAddress = await ERC20Mock.getAddress()
    await ERC20Mock.mint(userAddr, ERC20Amount * BigInt('10'))
    await ERC20Mock.mint(user2Addr, ERC20Amount * BigInt('10'))
    await ERC20Mock.mint(user3Addr, ERC20Amount * BigInt('10'))

    DSponsorNFTImplementation = await ethers.deployContract('DSponsorNFT', [])
    DSponsorNFTImplementationAddress =
      await DSponsorNFTImplementation.getAddress()

    DSponsorNFTFactory = await ethers.deployContract('DSponsorNFTFactory', [
      DSponsorNFTImplementationAddress
    ])

    initDSponsorNFTParams = {
      name: 'DSponsorNFT',
      symbol: 'DSNFT',
      baseURI: 'baseURI',
      contractURI: 'contractURI',
      minter: deployerAddr,
      maxSupply: BigInt('5'),
      forwarder: forwarderAddress,
      initialOwner: ownerAddr,
      royaltyBps: 100, // 1%
      currencies: [ERC20MockAddress, ZERO_ADDRESS, USDCeAddr, WethAddr],
      prices: [ERC20Amount, valuePrice, USDCePrice, valuePrice],
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
    DSponsorNFT = await ethers.getContractAt('DSponsorNFT', DSponsorNFTAddress)

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
      currencyToAccept: USDCeAddr,
      reservePricePerToken: USDCePrice,
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
      totalPrice,
      referralAdditionalInformation
    }

    const tx = DSponsorMarketplace.connect(user2).buy([buyParams])

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
      totalPrice,
      referralAdditionalInformation
    }

    const tx = DSponsorMarketplace.connect(user2).buy([buyParams])

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

    const bidPrice = ERC20Amount * reserveToBuyMul

    await ERC20Mock.connect(user2).approve(DSponsorMarketplaceAddress, bidPrice)

    const tx = DSponsorMarketplace.connect(user2).bid(
      listingId,
      bidPrice,
      referralAdditionalInformation
    )

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(
        listingId,
        user2Addr,
        1,
        bidPrice,
        listingParams.currencyToAccept
      )

    await expect(tx).to.changeTokenBalances(
      ERC20Mock,
      [user2, user, owner, treasury, DSponsorMarketplace],
      [bidPrice * BigInt(-1), ...computeFee(bidPrice), 0]
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

    const bidPrice = (ERC20Amount * BigInt('110')) / BigInt('100')

    await ERC20Mock.connect(user2).approve(DSponsorMarketplaceAddress, bidPrice)

    const tx = DSponsorMarketplace.connect(user2).bid(
      listingId,
      bidPrice,
      referralAdditionalInformation
    )

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(
        listingId,
        user2Addr,
        1,
        bidPrice,
        listingParams.currencyToAccept
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

    const previousBidPrice = (ERC20Amount * BigInt('110')) / BigInt('100')

    const bidPrice = ERC20Amount * BigInt('2')

    await ERC20Mock.connect(user3).approve(DSponsorMarketplaceAddress, bidPrice)

    const tx = DSponsorMarketplace.connect(user3).bid(
      listingId,
      bidPrice,
      referralAdditionalInformation
    )

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(listingId, user3Addr, 1, bidPrice, ERC20MockAddress)

    await expect(tx).to.changeTokenBalances(
      ERC20Mock,
      [user3, user2, user, owner, treasury, DSponsorMarketplace],
      [
        bidPrice * BigInt(-1),
        previousBidPrice,
        0,
        0,
        0,
        bidPrice - previousBidPrice
      ]
    )

    await expect(tx).to.changeTokenBalances(
      DSponsorNFT,
      [user3, user2, user, DSponsorMarketplaceAddress],
      [0, 0, 0, 0]
    )

    expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(
      DSponsorMarketplaceAddress
    )

    const finalBidPrice = ERC20Amount * reserveToBuyMul

    await ERC20Mock.connect(user2).approve(
      DSponsorMarketplaceAddress,
      finalBidPrice
    )

    const finalTx = DSponsorMarketplace.connect(user2).bid(
      listingId,
      finalBidPrice,
      referralAdditionalInformation
    )

    await expect(finalTx)
      .to.emit(DSponsorMarketplace, 'AuctionClosed')
      .withArgs(listingId, user2Addr, false, userAddr, user2Addr)

    await expect(finalTx)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(listingId, user2Addr, 1, finalBidPrice, ERC20MockAddress)

    await expect(finalTx).to.changeTokenBalances(
      ERC20Mock,
      [user3, user2, user, owner, treasury, DSponsorMarketplace],
      [bidPrice, -finalBidPrice, ...computeFee(finalBidPrice), -bidPrice]
    )

    await expect(finalTx).to.changeTokenBalances(
      DSponsorNFT,
      [user3, user2, user, DSponsorMarketplaceAddress],
      [0, 1, 0, -1]
    )

    expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(user2Addr)
  }

  async function closingBidAuctionListingSaleFixture() {
    await loadFixture(bidAuctionListingSaleFixture)

    const lastBidPrice = (ERC20Amount * BigInt('110')) / BigInt('100')
    const endTime =
      BigInt(listingParams.startTime) +
      BigInt(listingParams.secondsUntilEndTime)

    expect(await DSponsorNFT.ownerOf(tokenId)).to.equal(
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
      [0, 1, 0, -1]
    )

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

    const bidPrice = ERC20Amount * reserveToBuyMul

    await ERC20Mock.connect(user2).approve(DSponsorMarketplaceAddress, bidPrice)

    const tx = DSponsorMarketplace.connect(user2).bid(
      listingId,
      bidPrice,
      referralAdditionalInformation
    )

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(
        listingId,
        user2Addr,
        1,
        bidPrice,
        listingParams.currencyToAccept
      )

    await expect(tx).to.changeTokenBalances(
      ERC20Mock,
      [user2, user, owner, treasury, DSponsorMarketplace],
      [bidPrice * BigInt(-1), ...computeFee(bidPrice), 0]
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

    const tx = DSponsorMarketplace.connect(user2).bid(
      listingId,
      bidPrice,
      referralAdditionalInformation
    )

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(
        listingId,
        user2Addr,
        1,
        bidPrice,
        listingParams.currencyToAccept
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

    const previousBidPrice = (ERC20Amount * BigInt('110')) / BigInt('100')

    const bidPrice = ERC20Amount * BigInt('2')

    await ERC20Mock.connect(user3).approve(DSponsorMarketplaceAddress, bidPrice)

    const tx = DSponsorMarketplace.connect(user3).bid(
      listingId,
      bidPrice,
      referralAdditionalInformation
    )

    await expect(tx)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(listingId, user3Addr, 1, bidPrice, ERC20MockAddress)

    await expect(tx).to.changeTokenBalances(
      ERC20Mock,
      [user3, user2, user, owner, treasury, DSponsorMarketplace],
      [
        bidPrice * BigInt(-1),
        previousBidPrice,
        0,
        0,
        0,
        bidPrice - previousBidPrice
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

    const finalBidPrice = ERC20Amount * reserveToBuyMul

    await ERC20Mock.connect(user2).approve(
      DSponsorMarketplaceAddress,
      finalBidPrice
    )

    const finalTx = DSponsorMarketplace.connect(user2).bid(
      listingId,
      finalBidPrice,
      referralAdditionalInformation
    )

    await expect(finalTx)
      .to.emit(DSponsorMarketplace, 'AuctionClosed')
      .withArgs(listingId, user2Addr, false, userAddr, user2Addr)

    await expect(finalTx)
      .to.emit(DSponsorMarketplace, 'NewBid')
      .withArgs(listingId, user2Addr, 1, finalBidPrice, ERC20MockAddress)

    await expect(finalTx).to.changeTokenBalances(
      ERC20Mock,
      [user3, user2, user, owner, treasury, DSponsorMarketplace],
      [bidPrice, -finalBidPrice, ...computeFee(finalBidPrice), -bidPrice]
    )

    await expect(finalTx).to.changeTokenBalances(
      DSponsorNFT,
      [user3, user2, user, DSponsorMarketplaceAddress],
      [0, 0, 0, 0]
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

      const updateParams: IDSponsorMarketplace.ListingUpdateParametersStruct = {
        quantityToList: 1,
        reservePricePerToken: ERC20Amount * BigInt('2'),
        buyoutPricePerToken: ERC20Amount * BigInt('3'),
        currencyToAccept: USDCeAddr,
        startTime: await now(),
        secondsUntilEndTime: BigInt('3600'),
        rentalExpirationTimestamp: listingParams.rentalExpirationTimestamp
      }

      await expect(
        DSponsorMarketplace.connect(user).updateListing(listingId, updateParams)
      )
        .to.emit(DSponsorMarketplace, 'ListingUpdated')
        .withArgs(listingId, userAddr)
    })

    it('Should buy a token from a direct listing', async function () {
      await loadFixture(buyDirectListingSaleFixture)
    })

    it('Should buy multiple tokens from direct listings - thanks to swaps', async function () {
      const { WETHTotalPrice, USDCeTotalPrice } = await loadFixture(
        multipleDirectSalesFixture
      )

      const value = parseEther('8')

      const balanceUser2 = await provider.getBalance(user2Addr)

      const tx = await DSponsorMarketplace.connect(deployer).buy(
        [
          {
            listingId: 1,
            buyFor: user2Addr,
            quantity: 1,
            currency: WethAddr,
            totalPrice: WETHTotalPrice,
            referralAdditionalInformation
          },
          {
            listingId: 0,
            buyFor: user2Addr,
            quantity: 1,
            currency: USDCeAddr,
            totalPrice: USDCeTotalPrice,
            referralAdditionalInformation
          }
        ],
        { value }
      )

      await expect(tx).to.changeTokenBalances(
        DSponsorNFT,
        [user2, user],
        [2, -2]
      )
      expect(await DSponsorNFT.ownerOf(1)).to.equal(user2Addr)
      expect(await DSponsorNFT.ownerOf(10)).to.equal(user2Addr)

      await expect(tx).to.changeTokenBalances(
        WethContract,
        [deployer, user2, user, owner, treasury, DSponsorMarketplace],
        [0, 0, ...computeFee(WETHTotalPrice), 0]
      )

      await expect(tx).to.changeTokenBalances(
        USDCeContract,
        [deployer, user2, user, owner, treasury, DSponsorMarketplace],
        [0, 0, ...computeFee(USDCeTotalPrice), 0]
      )

      await expect(tx).to.changeEtherBalances([deployer], [-value])
      expect(await provider.getBalance(user2Addr)).to.be.gt(balanceUser2)
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
        totalPrice,
        referralAdditionalInformation
      }

      await expect(
        DSponsorMarketplace.connect(user2).buy([buyParams])
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

      const forwarder2 = await ethers.deployContract('ERC2771Forwarder', [])
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
