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
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
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
  let treasury: Signer
  let treasuryAddr: string

  const swapRouter = '0xE592427A0AEce92De3Edee1F18E0157C05861564'

  let WethAddr = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' // WMATIC on Polygon
  let WethContract: ERC20
  let USDCeAddr = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
  let USDCeContract: ERC20

  const ERC20Amount: bigint = parseEther('15')
  const valuePrice: bigint = parseEther('1')
  const USDCePrice = BigInt((2 * 10 ** 6).toString()) // 2 USDCe
  const reserveToBuyMul = BigInt('4')

  const protocolBps = 400 // 4%
  const royaltyBps = 100 // 1%

  let initDSponsorNFTParams: IDSponsorNFTBase.InitParamsStruct
  let listingParams: IDSponsorMarketplace.ListingParametersStruct
  let listingId = 0
  let tokenId = 1
  let listing: IDSponsorMarketplace.ListingStruct

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
    ;[deployer, owner, user, user2, treasury] = signers

    deployerAddr = await deployer.getAddress()
    ownerAddr = await owner.getAddress()
    userAddr = await user.getAddress()
    user2Addr = await user2.getAddress()
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
      transferType: 1, // TransferType.Sale
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: 0 // ListingType.Direct
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
      transferType: 1, // TransferType.Sale
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: 0 // ListingType.Direct
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
      transferType: 1, // TransferType.Sale
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: 0 // ListingType.Direct
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
      transferType: 0, // TransferType.Rent
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: 0 // ListingType.Direct
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
      transferType: 0, // TransferType.Rent
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: 1 // ListingType.Auction
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

  describe('createListing', function () {
    it('Should create a direct listing to sell an ERC721 token', async function () {
      await loadFixture(directListingSaleFixture)
    })

    it('Should create a direct listing to rent an ERC721 token', async function () {
      await loadFixture(directListingRentFixture)
    })

    it('Should create a auction listing to rent an ERC721 token', async function () {
      await loadFixture(auctionListingRentFixture)
    })
  })

  describe('buyListing', function () {
    it('Should buy a token from a direct listing', async function () {
      await loadFixture(buyDirectListingSaleFixture)
    })

    it('Should buy multiple tokens from sent value - thanks to swaps', async function () {
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
  })

  describe('bidListing', function () {
    it('Should rent a token from an auction listing', async function () {
      await loadFixture(buyAuctionListingRentFixture)
    })

    it('Should bid on a token from an auction rent listing', async function () {
      await loadFixture(bidAuctionListingRentFixture)
    })
  })
})
