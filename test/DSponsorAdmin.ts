import 'dotenv/config'
import { expect } from 'chai'
import { BaseContract, parseEther, Signer } from 'ethers'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { executeByForwarder } from '../utils/eip712'
import {
  DSponsorNFT,
  DSponsorNFTFactory,
  ERC20,
  ERC20Mock,
  ERC2771Forwarder,
  IDSponsorAgreements,
  IProtocolFee,
  DSponsorAdmin,
  ReentrantDSponsorAdmin
} from '../typechain-types'
import { IDSponsorNFTBase } from '../typechain-types/contracts/DSponsorNFT'
import { ZERO_ADDRESS } from '../utils/constants'

describe('DSponsorAdmin', function () {
  const provider = ethers.provider

  let DSponsorAdmin: DSponsorAdmin
  let DSponsorAdminAddress: string
  let DSponsorNFTFactory: DSponsorNFTFactory
  let DSponsorNFTFactoryAddress: string
  let DSponsorNFTImplementation: DSponsorNFT
  let DSponsorNFTImplementationAddress: string
  let DSponsorNFT: DSponsorNFT
  let DSponsorNFTAddress: string
  let ERC20Mock: ERC20Mock
  let ERC20MockAddress: string
  let forwarder: ERC2771Forwarder
  let forwarderAddress: string
  let Reentrant: ReentrantDSponsorAdmin
  let ReentrantAddress: string

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

  let USDCeAddr = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
  let USDCeContract: ERC20

  const ERC20Amount: bigint = parseEther('15')
  const valuePrice: bigint = parseEther('1')
  const USDCePrice = BigInt((55 * 10 ** 6).toString()) // 55 USDCe

  const bps = 400

  let initDSponsorNFTParams: IDSponsorNFTBase.InitParamsStruct
  let referral: IProtocolFee.ReferralRevenueStruct
  let offerInit: IDSponsorAgreements.OfferInitParamsStruct
  let offerOptions: IDSponsorAgreements.OfferOptionsStruct

  const adParameters: string[] = ['logo', 'url']
  const adDatas: string[] = ['adData1', 'adData2']
  const referralAdditionalInformation = 'referralAdditionalInformation'

  let offerId = 1
  let tokenId = 10
  const tokenData = 'tokenData'
  const callData = (to: string, currency: string) => {
    tokenId++
    return DSponsorNFT.interface.encodeFunctionData('mint', [
      tokenId,
      to,
      currency,
      tokenData
    ])
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

    forwarder = await ethers.deployContract('ERC2771Forwarder', [])
    await forwarder.waitForDeployment()
    forwarderAddress = await forwarder.getAddress()

    ERC20Mock = await ethers.deployContract('ERC20Mock', [])
    await ERC20Mock.waitForDeployment()
    ERC20MockAddress = await ERC20Mock.getAddress()
    await ERC20Mock.mint(userAddr, ERC20Amount * BigInt('10'))

    DSponsorNFTImplementation = await ethers.deployContract('DSponsorNFT', [])
    DSponsorNFTImplementationAddress =
      await DSponsorNFTImplementation.getAddress()

    DSponsorNFTFactory = await ethers.deployContract('DSponsorNFTFactory', [
      DSponsorNFTImplementationAddress
    ])
    DSponsorNFTFactoryAddress = await DSponsorNFTFactory.getAddress()

    initDSponsorNFTParams = {
      name: 'DSponsorNFT',
      symbol: 'DSNFT',
      baseURI: 'baseURI',
      contractURI: 'contractURI',
      maxSupply: BigInt('5'),
      forwarder: forwarderAddress,
      initialOwner: ownerAddr,
      royaltyBps: 100, // 1%
      currencies: [ERC20MockAddress, ZERO_ADDRESS, USDCeAddr],
      prices: [ERC20Amount, valuePrice, USDCePrice],
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

    DSponsorAdmin = await ethers.deployContract('DSponsorAdmin', [
      DSponsorNFTFactoryAddress,
      forwarderAddress,
      deployerAddr,
      swapRouter,
      treasuryAddr,
      400
    ])
    DSponsorAdminAddress = await DSponsorAdmin.getAddress()

    offerOptions = {
      admins: [ownerAddr],
      validators: [],
      adParameters
    }

    offerInit = {
      name: 'Offer X',
      rulesURI: 'rulesURI',
      options: offerOptions
    }

    await DSponsorAdmin.connect(user).createOffer(DSponsorNFTAddress, offerInit)

    await ERC20Mock.connect(user).approve(
      DSponsorAdminAddress,
      ERC20Amount * BigInt('20')
    )

    referral = {
      enabler: ownerAddr,
      spender: userAddr,
      additionalInformation: 'additionalInformation'
    }

    Reentrant = await ethers.deployContract('ReentrantDSponsorAdmin', [])
    ReentrantAddress = await Reentrant.getAddress()
  }

  describe('Deployment', function () {
    it('Should be set with the constructor arguments', async function () {
      await loadFixture(deployFixture)

      expect(await DSponsorAdmin.nftFactory()).to.equal(
        DSponsorNFTFactoryAddress
      )
      expect(await DSponsorAdmin.trustedForwarder()).to.equal(forwarderAddress)
      expect(await DSponsorAdmin.owner()).to.equal(deployerAddr)
      expect(await DSponsorAdmin.recipient()).to.equal(treasuryAddr)
      expect(await DSponsorAdmin.bps()).to.equal(bps)
    })
  })

  describe('callWithProtocolFee', function () {
    it('Should work with ERC20', async function () {
      await loadFixture(deployFixture)

      const fee = (ERC20Amount * BigInt(bps.toString())) / BigInt('10000')

      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, ERC20MockAddress),
          ERC20MockAddress,
          ERC20Amount,
          referral
        )
      )
        .to.emit(DSponsorAdmin, 'CallWithProtocolFee')
        .withArgs(
          DSponsorNFT,
          ERC20MockAddress,
          fee,
          referral.enabler,
          referral.spender,
          referral.additionalInformation
        )

      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, ERC20MockAddress),
          ERC20MockAddress,
          ERC20Amount,
          referral
        )
      ).to.changeTokenBalances(
        ERC20Mock,
        [user, user2, owner, treasury, DSponsorAdmin],
        [(fee + ERC20Amount) * BigInt('-1'), 0, ERC20Amount, fee, 0]
      )

      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, ERC20MockAddress),
          ERC20MockAddress,
          ERC20Amount,
          referral
        )
      ).to.changeTokenBalances(
        DSponsorNFT,
        [user, user2, owner, treasury, DSponsorAdmin],
        [0, 1, 0, 0, 0]
      )
    })

    it('Should work with native currency', async function () {
      await loadFixture(deployFixture)

      const fee = (valuePrice * BigInt(bps.toString())) / BigInt('10000')

      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, ZERO_ADDRESS),
          ZERO_ADDRESS,
          valuePrice,
          referral,
          { value: valuePrice + fee }
        )
      )
        .to.emit(DSponsorAdmin, 'CallWithProtocolFee')
        .withArgs(
          DSponsorNFTAddress,
          ZERO_ADDRESS,
          fee,
          referral.enabler,
          referral.spender,
          referral.additionalInformation
        )

      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, ZERO_ADDRESS),
          ZERO_ADDRESS,
          valuePrice,
          referral,
          { value: valuePrice + fee }
        )
      ).to.changeEtherBalances(
        [user, user2, owner, treasury, DSponsorAdmin],
        [(fee + valuePrice) * BigInt('-1'), 0, valuePrice, fee, 0]
      )

      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, ZERO_ADDRESS),
          ZERO_ADDRESS,
          valuePrice,
          referral,
          { value: valuePrice + fee }
        )
      ).to.changeTokenBalances(
        DSponsorNFT,
        [user, user2, owner, treasury, DSponsorAdmin],
        [0, 1, 0, 0, 0]
      )
    })

    it('Should work even with no amount', async function () {
      await loadFixture(deployFixture)

      await DSponsorNFT.connect(owner).setDefaultMintPrice(
        ZERO_ADDRESS,
        true,
        0
      )

      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, ZERO_ADDRESS),
          ZERO_ADDRESS,
          0,
          referral
        )
      ).to.changeTokenBalances(
        DSponsorNFT,
        [user, user2, owner, treasury, DSponsorAdmin],
        [0, 1, 0, 0, 0]
      )

      await expect(
        DSponsorAdmin.connect(owner).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, ZERO_ADDRESS),
          ZERO_ADDRESS,
          0,
          referral
        )
      ).to.changeEtherBalances(
        [user, user2, owner, treasury, DSponsorAdmin],
        [0, 0, 0, 0, 0]
      )
    })

    it('Should work even with low amount (no fee for treasury)', async function () {
      await loadFixture(deployFixture)

      await DSponsorNFT.connect(owner).setDefaultMintPrice(
        ERC20MockAddress,
        true,
        1
      )
      await DSponsorNFT.connect(owner).setDefaultMintPrice(
        ZERO_ADDRESS,
        true,
        1
      )

      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, ERC20MockAddress),
          ERC20MockAddress,
          1,
          referral
        )
      ).to.changeTokenBalances(
        DSponsorNFT,
        [user, user2, owner, treasury, DSponsorAdmin],
        [0, 1, 0, 0, 0]
      )

      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, ERC20MockAddress),
          ERC20MockAddress,
          1,
          referral
        )
      ).to.changeTokenBalances(
        ERC20Mock,
        [user, user2, owner, treasury, DSponsorAdmin],
        [-1, 0, 1, 0, 0]
      )

      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, ZERO_ADDRESS),
          ZERO_ADDRESS,
          1,
          referral,
          { value: 1 }
        )
      ).to.changeEtherBalances(
        [user, user2, owner, treasury, DSponsorAdmin],
        [-1, 0, 1, 0, 0]
      )
    })

    it('Should work with a valid swap', async function () {
      await loadFixture(deployFixture)

      const fee = (USDCePrice * BigInt(bps.toString())) / BigInt('10000')
      const value = parseEther('1000')
      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, USDCeAddr),
          USDCeAddr,
          USDCePrice,
          referral,
          { value: value }
        )
      ).to.changeTokenBalances(
        USDCeContract,
        [user, user2, owner, treasury, DSponsorAdmin],
        [0, 0, USDCePrice, fee, 0]
      )

      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, USDCeAddr),
          USDCeAddr,
          USDCePrice,
          referral,
          { value: value }
        )
      ).to.changeTokenBalances(
        DSponsorNFT,
        [user, user2, owner, treasury, DSponsorAdmin],
        [0, 1, 0, 0, 0]
      )

      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, USDCeAddr),
          USDCeAddr,
          USDCePrice,
          referral,
          { value: value }
        )
      ).to.changeEtherBalances(
        [user, user2, owner, treasury, DSponsorAdmin],
        [-value, 0, 0, 0, 0]
      )
    })

    it('Should revert if value for the swap is too low', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, USDCeAddr),
          USDCeAddr,
          USDCePrice,
          referral,
          { value: parseEther('0.01') }
        )
      ).to.reverted
    })

    it('Should revert if no path for the swap ', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, ERC20MockAddress),
          ERC20MockAddress,
          ERC20Amount,
          referral,
          { value: parseEther('0.01') }
        )
      ).to.reverted
    })

    it('Should revert if ERC20 Amount overflow', async function () {
      await loadFixture(deployFixture)

      const uint256Max = BigInt(
        '115792089237316195423570985008687907853269984665640564039457584007913129639935'
      )

      await expect(
        DSponsorAdmin.connect(user2).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, ERC20MockAddress),
          ERC20MockAddress,
          uint256Max,
          referral
        )
      ).to.revertedWithPanic(0x11)
    })

    it('Should revert if not enough ERC20 allowance', async function () {
      await loadFixture(deployFixture)

      const fee = (ERC20Amount * BigInt(bps.toString())) / BigInt('10000')

      await expect(
        DSponsorAdmin.connect(user2).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, ERC20MockAddress),
          ERC20MockAddress,
          ERC20Amount,
          referral
        )
      ).to.revertedWithCustomError(DSponsorAdmin, 'InsufficientAllowance')
    })

    it('Should revert if not enough ERC20 tokens', async function () {
      await loadFixture(deployFixture)

      const fee = (ERC20Amount * BigInt(bps.toString())) / BigInt('10000')

      await ERC20Mock.connect(user2).approve(
        DSponsorAdminAddress,
        ERC20Amount * BigInt('20')
      )
      await ERC20Mock.mint(user2Addr, ERC20Amount) // not enough as we need to pay the fee

      await expect(
        DSponsorAdmin.connect(user2).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, ERC20MockAddress),
          ERC20MockAddress,
          ERC20Amount,
          referral
        )
      ).to.revertedWithCustomError(ERC20Mock, 'ERC20InsufficientBalance')

      expect(
        await ERC20Mock.balanceOf(await DSponsorAdmin.recipient())
      ).to.equal(0)
    })

    it('Should revert is value is too low', async function () {
      await loadFixture(deployFixture)

      const balanceBeforeCall = await provider.getBalance(
        await DSponsorAdmin.recipient()
      )

      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(user2Addr, ZERO_ADDRESS),
          ZERO_ADDRESS,
          valuePrice,
          referral,
          { value: valuePrice }
        )
      ).to.revertedWithCustomError(DSponsorAdmin, 'InsufficientFunds')

      const balanceAfterCall = await provider.getBalance(
        await DSponsorAdmin.recipient()
      )

      expect(balanceAfterCall).to.equal(balanceBeforeCall)
    })

    it('Should revert if encoded data is not valid', async function () {
      await loadFixture(deployFixture)

      const balanceBeforeCall = await provider.getBalance(
        await DSponsorAdmin.recipient()
      )
      const fee = (valuePrice * BigInt(bps.toString())) / BigInt('10000')

      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          DSponsorNFT,
          callData(ZERO_ADDRESS, ZERO_ADDRESS),
          ZERO_ADDRESS,
          valuePrice,
          referral,
          { value: valuePrice + fee }
        )
      ).to.reverted
      // ).to.revertedWithCustomError(DSponsorNFT, 'CannotBeZeroAddress')

      const balanceAfterCall = await provider.getBalance(
        await DSponsorAdmin.recipient()
      )

      expect(balanceAfterCall).to.equal(balanceBeforeCall)
    })

    it('Should revert if the call is reentrant', async function () {
      await loadFixture(deployFixture)

      const value = 1000
      await expect(
        DSponsorAdmin.connect(user).callWithProtocolFee(
          ReentrantAddress,
          Reentrant.interface.encodeFunctionData('dummy', [true]),
          ZERO_ADDRESS,
          value,
          referral,
          { value: value * 2 }
        )
      ).to.revertedWithCustomError(
        DSponsorAdmin,
        'ReentrancyGuardReentrantCall'
      )

      await DSponsorAdmin.connect(user).createOffer(ReentrantAddress, offerInit)
      let offerId2 = offerId + 1
      await expect(
        DSponsorAdmin.connect(user).mintAndSubmit(
          {
            tokenId,
            to: user2Addr,
            currency: ZERO_ADDRESS,
            tokenData,
            offerId: offerId2,
            adParameters,
            adDatas,
            referralAdditionalInformation
          },
          { value: value * 3 }
        )
      ).to.revertedWithCustomError(
        DSponsorAdmin,
        'ReentrancyGuardReentrantCall'
      )
    })
  })

  describe('updateProtocolFee', function () {
    it('Should revert if not called by the owner', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAdmin.connect(user).updateProtocolFee(userAddr, 500)
      ).to.be.revertedWithCustomError(
        DSponsorAdmin,
        'OwnableUnauthorizedAccount'
      )
    })

    it('Should allow deployer to the protocol fee', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAdmin.connect(deployer).updateProtocolFee(user2Addr, 500)
      )
        .to.emit(DSponsorAdmin, 'FeeUpdate')
        .withArgs(user2Addr, 500)
      expect(await DSponsorAdmin.recipient()).to.equal(user2Addr)
      expect(await DSponsorAdmin.bps()).to.equal(500)
    })

    it('Should revert if fee recipient is ZERO_ADDRESS', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAdmin.connect(deployer).updateProtocolFee(ZERO_ADDRESS, 500)
      ).to.revertedWithCustomError(DSponsorAdmin, 'ZeroAddress')
    })
  })

  describe('createDSponsorNFTAndOffer', function () {
    it('Should create a DSponsorNFT and an offer in a single call', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAdmin.connect(user).createDSponsorNFTAndOffer(
          initDSponsorNFTParams,
          offerInit
        )
      ).to.emit(DSponsorNFTFactory, 'NewDSponsorNFT')

      await expect(
        DSponsorAdmin.connect(user).createDSponsorNFTAndOffer(
          initDSponsorNFTParams,
          offerInit
        )
      ).to.emit(DSponsorAdmin, 'UpdateOffer')

      expect(
        await DSponsorAdmin.isOfferAdmin(2, offerInit.options.admins[0])
      ).to.equal(true)

      const DSponsorNFTCreated: DSponsorNFT = await ethers.getContractAt(
        'DSponsorNFT',
        await DSponsorAdmin.getOfferContract(2)
      )
      expect(await DSponsorNFTCreated.owner()).to.equal(
        initDSponsorNFTParams.initialOwner
      )
    })

    it('Should revert if params are incorrect', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAdmin.connect(user).createDSponsorNFTAndOffer(
          Object.assign({}, initDSponsorNFTParams, { maxSupply: 0 }),
          offerInit
        )
      ).to.revertedWithCustomError(DSponsorNFT, 'MaxSupplyShouldBeGreaterThan0')

      await expect(
        DSponsorAdmin.connect(user).createDSponsorNFTAndOffer(
          initDSponsorNFTParams,
          Object.assign({}, offerInit, { rulesURI: '' })
        )
      ).to.revertedWithCustomError(DSponsorAdmin, 'EmptyString')
    })
  })

  describe('mintAndSubmit', function () {
    it('Should mint a token and submit an ad proposal with ERC20 in a single call', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAdmin.connect(user).mintAndSubmit({
          tokenId,
          to: user2Addr,
          currency: ERC20MockAddress,
          tokenData,
          offerId,
          adParameters,
          adDatas,
          referralAdditionalInformation
        })
      )
        .to.emit(DSponsorAdmin, 'UpdateAdProposal')
        .withArgs(offerId, tokenId, 1, adParameters[0], adDatas[0])
    })

    it('Should mint a token and submit an ad proposal with native currency in a single call', async function () {
      await loadFixture(deployFixture)
      const fee = (valuePrice * BigInt(bps.toString())) / BigInt('10000')

      await expect(
        DSponsorAdmin.connect(user).mintAndSubmit(
          {
            tokenId,
            to: user2Addr,
            currency: ZERO_ADDRESS,
            tokenData,
            offerId,
            adParameters,
            adDatas,
            referralAdditionalInformation
          },
          { value: valuePrice + fee }
        )
      ).to.changeEtherBalances(
        [user, user2, owner, treasury, DSponsorAdmin],
        [(valuePrice + fee) * BigInt('-1'), 0, valuePrice, fee, 0]
      )

      await expect(
        DSponsorAdmin.connect(user).mintAndSubmit(
          {
            tokenId: tokenId + 1,
            to: user2Addr,
            currency: ZERO_ADDRESS,
            tokenData,
            offerId,
            adParameters,
            adDatas,
            referralAdditionalInformation
          },
          { value: valuePrice + fee }
        )
      ).to.changeTokenBalances(
        DSponsorNFT,
        [user, user2, owner, treasury, DSponsorAdmin],
        [0, 1, 0, 0, 0]
      )
    })

    it('Should revert if the offer does not exist', async function () {
      await loadFixture(deployFixture)
      const fee = (valuePrice * BigInt(bps.toString())) / BigInt('10000')

      await expect(
        DSponsorAdmin.connect(user).mintAndSubmit(
          {
            tokenId,
            to: user2Addr,
            currency: ZERO_ADDRESS,
            tokenData,
            offerId: offerId + 10,
            adParameters,
            adDatas,
            referralAdditionalInformation
          },
          { value: valuePrice + fee }
        )
      ).to.revertedWithCustomError(DSponsorAdmin, 'OfferDoesNotExist')
    })

    it('Should revert if the ad args do not have the same length', async function () {
      await loadFixture(deployFixture)
      const fee = (valuePrice * BigInt(bps.toString())) / BigInt('10000')

      await expect(
        DSponsorAdmin.connect(user).mintAndSubmit(
          {
            tokenId,
            to: user2Addr,
            currency: ZERO_ADDRESS,
            tokenData,
            offerId: offerId + 10,
            adParameters,
            adDatas: ['test', ...adDatas],
            referralAdditionalInformation
          },
          { value: valuePrice + fee }
        )
      ).to.revertedWithCustomError(DSponsorAdmin, 'InvalidAdData')
    })

    it('Should revert if a param is incorrect', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAdmin.connect(user).mintAndSubmit({
          tokenId,
          to: ZERO_ADDRESS,
          currency: ERC20MockAddress,
          tokenData,
          offerId,
          adParameters: ['testParam', ...adParameters],
          adDatas: ['', ...adDatas],
          referralAdditionalInformation
        })
      ).to.reverted

      await expect(
        DSponsorAdmin.connect(user).mintAndSubmit({
          tokenId,
          to: user2Addr,
          currency: ERC20MockAddress,
          tokenData,
          offerId,
          adParameters: ['testParam', ...adParameters],
          adDatas: ['', ...adDatas],
          referralAdditionalInformation
        })
      ).to.revertedWithCustomError(DSponsorAdmin, 'NoAdDataSubmitted')
    })
  })

  describe('ERC2771 Related Functions', function () {
    it('Should set the trusted forwarder correctly', async function () {
      await loadFixture(deployFixture)

      const encodedFunctionData = DSponsorAdmin.interface.encodeFunctionData(
        'mintAndSubmit',
        [
          {
            tokenId,
            to: user2Addr,
            currency: ERC20MockAddress,
            tokenData,
            offerId,
            adParameters,
            adDatas,
            referralAdditionalInformation
          }
        ]
      )

      const forwarder2 = await ethers.deployContract('ERC2771Forwarder', [])
      await forwarder2.waitForDeployment()
      await DSponsorAdmin.connect(deployer).setTrustedForwarder(
        await forwarder2.getAddress()
      )

      await expect(
        executeByForwarder(
          forwarder,
          DSponsorAdmin as BaseContract,
          owner,
          encodedFunctionData
        )
      ).to.revertedWithCustomError(forwarder, 'ERC2771UntrustfulTarget')

      await expect(
        executeByForwarder(
          forwarder2,
          DSponsorAdmin as BaseContract,
          user,
          encodedFunctionData
        )
      )
        .to.emit(DSponsorAdmin, 'UpdateAdProposal')
        .withArgs(offerId, tokenId, 1, adParameters[0], adDatas[0])
    })

    it('Should allow a user to create an offer without gas spent via the forwarder', async function () {
      await loadFixture(deployFixture)

      const encodedFunctionData = DSponsorAdmin.interface.encodeFunctionData(
        'createDSponsorNFTAndOffer',
        [initDSponsorNFTParams, offerInit]
      )

      await expect(
        executeByForwarder(
          forwarder,
          DSponsorAdmin as BaseContract,
          user,
          encodedFunctionData
        )
      ).to.changeEtherBalance(user, 0)
    })

    it('Should not allow user to send unauthorized operations via the forwarder', async function () {
      await loadFixture(deployFixture)

      const encodedFunctionData = DSponsorAdmin.interface.encodeFunctionData(
        'updateProtocolFee',
        [user2Addr, 500]
      )

      await expect(
        executeByForwarder(
          forwarder,
          DSponsorAdmin as BaseContract,
          user2,
          encodedFunctionData
        )
      ).to.revertedWithCustomError(forwarder, 'FailedInnerCall')
    })
  })
})
