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
  DSponsorNFT,
  DSponsorNFTFactory,
  ERC20,
  ERC20Mock,
  ERC2771Forwarder,
  IDSponsorAgreements,
  DSponsorAdmin,
  ReentrantDSponsorAdmin
} from '../typechain-types'
import { IDSponsorNFTBase } from '../typechain-types/contracts/DSponsorNFT'
import { ZERO_ADDRESS } from '../utils/constants'
import { stringToUint256 } from '../utils/convert'

const uint256Max = BigInt(
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'
)

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
  const USDCePrice = BigInt((2 * 10 ** 6).toString()) // 2 USDCe

  const bps = 400

  let initDSponsorNFTParams: IDSponsorNFTBase.InitParamsStruct
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
      minter: deployerAddr, // will be replaced by the DSponsorAdmin address
      maxSupply: BigInt('5'),
      forwarder: forwarderAddress,
      initialOwner: ownerAddr,
      royaltyBps: 100, // 1%
      currencies: [ERC20MockAddress, ZERO_ADDRESS, USDCeAddr],
      prices: [ERC20Amount, valuePrice, USDCePrice],
      allowedTokenIds: []
    }

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

    const tx = await DSponsorAdmin.connect(user).createDSponsorNFTAndOffer(
      initDSponsorNFTParams,
      offerInit
    )
    if (!tx.hash) throw new Error('No tx hash')
    const receipt = await provider.getTransactionReceipt(tx.hash || '')
    const event = receipt?.logs
      .map((log: any) => DSponsorNFTFactory.interface.parseLog(log))
      .find((e) => e?.name === 'NewDSponsorNFT')
    if (!event) throw new Error('No event')

    DSponsorNFTAddress = event.args[0]
    DSponsorNFT = await ethers.getContractAt('DSponsorNFT', DSponsorNFTAddress)

    await ERC20Mock.connect(user).approve(
      DSponsorAdminAddress,
      ERC20Amount * BigInt('20')
    )

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

    it('Should allow deployer to update the protocol fee', async function () {
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

    it('Should revert if fee bps > 100 %', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAdmin.connect(deployer).updateProtocolFee(user2Addr, 10001)
      ).to.revertedWithCustomError(DSponsorAdmin, 'InvalidBps')
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
      ).to.revertedWithCustomError(DSponsorNFT, 'CannotBeZeroAddress')

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
      ).to.revertedWithCustomError(DSponsorAdmin, 'UnallowedAdParameter')

      const [_, ...restAdDatas] = adDatas
      await expect(
        DSponsorAdmin.connect(user).mintAndSubmit({
          tokenId,
          to: user2Addr,
          currency: ERC20MockAddress,
          tokenData,
          offerId,
          adParameters,
          adDatas: ['', ...restAdDatas],
          referralAdditionalInformation
        })
      ).to.revertedWithCustomError(DSponsorAdmin, 'NoAdDataSubmitted')
    })

    describe('Protocol fee', function () {
      it('Should work with ERC20', async function () {
        await loadFixture(deployFixture)

        const fee = (ERC20Amount * BigInt(bps.toString())) / BigInt('10000')

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
          .to.emit(DSponsorAdmin, 'CallWithProtocolFee')
          .withArgs(
            DSponsorNFTAddress,
            ERC20MockAddress,
            fee,
            ownerAddr,
            user2Addr,
            referralAdditionalInformation
          )

        tokenId++
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
        ).to.changeTokenBalances(
          ERC20Mock,
          [user, user2, owner, treasury, DSponsorAdmin],
          [(fee + ERC20Amount) * BigInt('-1'), 0, ERC20Amount, fee, 0]
        )

        tokenId++
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
        )
          .to.emit(DSponsorAdmin, 'CallWithProtocolFee')
          .withArgs(
            DSponsorNFTAddress,
            ZERO_ADDRESS,
            fee,
            ownerAddr,
            user2Addr,
            referralAdditionalInformation
          )

        tokenId++
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
          [(fee + valuePrice) * BigInt('-1'), 0, valuePrice, fee, 0]
        )

        tokenId++
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
          DSponsorAdmin.connect(user).mintAndSubmit({
            tokenId,
            to: user2Addr,
            currency: ZERO_ADDRESS,
            tokenData,
            offerId,
            adParameters,
            adDatas,
            referralAdditionalInformation
          })
        ).to.changeTokenBalances(
          DSponsorNFT,
          [user, user2, owner, treasury, DSponsorAdmin],
          [0, 1, 0, 0, 0]
        )

        tokenId++
        await expect(
          DSponsorAdmin.connect(user).mintAndSubmit({
            tokenId,
            to: user2Addr,
            currency: ZERO_ADDRESS,
            tokenData,
            offerId,
            adParameters,
            adDatas,
            referralAdditionalInformation
          })
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
        ).to.changeTokenBalances(
          DSponsorNFT,
          [user, user2, owner, treasury, DSponsorAdmin],
          [0, 1, 0, 0, 0]
        )

        tokenId++
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
        ).to.changeTokenBalances(
          ERC20Mock,
          [user, user2, owner, treasury, DSponsorAdmin],
          [-1, 0, 1, 0, 0]
        )

        tokenId++
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

        const balanceUser2BeforeSwap = await provider.getBalance(user2Addr)

        await expect(
          DSponsorAdmin.connect(user).mintAndSubmit(
            {
              tokenId,
              to: user2Addr,
              currency: USDCeAddr,
              tokenData,
              offerId,
              adParameters,
              adDatas,
              referralAdditionalInformation
            },
            { value: value }
          )
        ).to.changeTokenBalances(
          USDCeContract,
          [user, owner, treasury, DSponsorAdmin],
          [0, USDCePrice, fee, 0]
        )

        const balanceUser2AfterSwap = await provider.getBalance(user2Addr)

        // refund received by user2
        expect(balanceUser2AfterSwap - balanceUser2BeforeSwap).to.be.gt(1)

        tokenId++
        await expect(
          DSponsorAdmin.connect(user).mintAndSubmit(
            {
              tokenId,
              to: user2Addr,
              currency: USDCeAddr,
              tokenData,
              offerId,
              adParameters,
              adDatas,
              referralAdditionalInformation
            },
            { value: value }
          )
        ).to.changeTokenBalances(
          DSponsorNFT,
          [user, user2, owner, treasury, DSponsorAdmin],
          [0, 1, 0, 0, 0]
        )

        tokenId++
        await expect(
          DSponsorAdmin.connect(user).mintAndSubmit(
            {
              tokenId,
              to: user2Addr,
              currency: USDCeAddr,
              tokenData,
              offerId,
              adParameters,
              adDatas,
              referralAdditionalInformation
            },
            { value: value }
          )
        ).to.changeEtherBalances(
          [user, owner, treasury, DSponsorAdmin],
          [-value, 0, 0, 0]
        )
      })

      it('Should revert if value for the swap is too low', async function () {
        await loadFixture(deployFixture)

        await expect(
          DSponsorAdmin.connect(user).mintAndSubmit(
            {
              tokenId,
              to: user2Addr,
              currency: USDCeAddr,
              tokenData,
              offerId,
              adParameters,
              adDatas,
              referralAdditionalInformation
            },
            { value: parseEther('0.01') }
          )
        ).to.reverted
      })

      it('Should revert if no path for the swap ', async function () {
        await loadFixture(deployFixture)

        await expect(
          DSponsorAdmin.connect(user).mintAndSubmit(
            {
              tokenId,
              to: user2Addr,
              currency: ERC20MockAddress,
              tokenData,
              offerId,
              adParameters,
              adDatas,
              referralAdditionalInformation
            },
            { value: parseEther('0.01') }
          )
        ).to.reverted
      })

      it('Should revert if ERC20 Amount overflow', async function () {
        await loadFixture(deployFixture)

        await DSponsorNFT.connect(owner).setDefaultMintPrice(
          ERC20MockAddress,
          true,
          uint256Max
        )

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
        ).to.revertedWithPanic(0x11)
      })

      it('Should revert if not enough ERC20 allowance', async function () {
        await loadFixture(deployFixture)

        await DSponsorNFT.connect(owner).setDefaultMintPrice(
          ERC20MockAddress,
          true,
          ERC20Amount * BigInt('1000000000')
        )

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
        ).to.revertedWithCustomError(ERC20Mock, 'ERC20InsufficientAllowance')
      })

      it('Should revert if not enough ERC20 tokens', async function () {
        await loadFixture(deployFixture)

        const newAmount = ERC20Amount * BigInt('1000000000')

        await DSponsorNFT.connect(owner).setDefaultMintPrice(
          ERC20MockAddress,
          true,
          newAmount
        )

        await ERC20Mock.connect(user).approve(
          DSponsorAdminAddress,
          newAmount * BigInt('100')
        )
        await ERC20Mock.mint(user, newAmount) // not enough as we need to pay the fee

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
            { value: valuePrice }
          )
        ).to.revertedWithCustomError(DSponsorAdmin, 'InsufficientFunds')

        const balanceAfterCall = await provider.getBalance(
          await DSponsorAdmin.recipient()
        )

        expect(balanceAfterCall).to.equal(balanceBeforeCall)
      })

      it('Should revert if the call is reentrant', async function () {
        await loadFixture(deployFixture)

        const value = 1000
        await DSponsorAdmin.connect(user).createOffer(
          ReentrantAddress,
          offerInit
        )
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

  describe('Complete scenarios', function () {
    it('Should work as expected for SiBorg', async function () {
      await loadFixture(deployFixture)

      /**
       * 0. Params to setup
       */

      // todo-creator: define royalties on secondary sales
      const royaltyBps = 690 // 6.9%

      // todo-creator: replace and impersonate addresses
      const siborgOwner = owner
      const siborgOwnerAddr = ownerAddr

      // todo-creator: replace with the real contract metadata & upload to IPFS
      const contractMetadata = {
        name: 'Siborg Search Keywords Ad Spaces',
        symbol: 'SiborgAds1',
        description: 'Tokenized ad spaces from SiBorg result search results',
        image: 'https://external-link-url.com/image.png',
        external_link: 'https://external-link-url.com',
        collaborators: [siborgOwnerAddr]
      }
      const contractURI = 'ipfs://QmX....'

      // todo-creator: creator metadata, terms of service and more - JSON stored on IPFS
      const rules = {
        creatorName: 'SiBorg',
        creatorDescription:
          'SiBorg app enhances Twitter spaces listening experience',
        creatorImg: 'https://external-link-url.com/image.png',
        offerName: contractMetadata.name,
        offerDescription: 'Ad spaces for SiBorg search results',
        offerImg: 'https://external-link-url.com/image.png',
        terms: 'ipfs://QmX....',
        validFromDate: '2024-01-01T00:00:00Z',
        validToDate: '2024-12-31T23:59:59Z'
      }
      const rulesURI = 'ipfs://QmX....'

      // todo-creator: define the first keywords to be tokenized, and their prices / currencies
      const tokenizedKeywords = ['bitcoin', 'ethereum', 'nft', 'crypto', 'eth']

      // todo-creator: need to define the prices for default token, and/or for each token
      // we give here all possibilities: ERC20 / native coin, specific token / default, swap / no swap
      const currencies = [ERC20MockAddress, ZERO_ADDRESS]
      const amounts = [
        // we want to set the price of 0.5 ERC20Mock for 'bitcoin'
        // sponsor has enough in balance to mint
        parseEther('0.5'),

        // we want to set the price of 150.50 MATIC for 'ethereum'
        parseEther('150.50')
      ]
      // set 6.25 USDCe for other tokens like 'nft'
      // as sponsor does have USDCe tokens, he will pay in MATIC, the contract will swap
      const defaultCurrency = USDCeAddr
      const defaultAmount = BigInt((6.25 * 10 ** 6).toString())

      // todo-tech: fetch the current price of USDCe, with Moralis API for example
      // https://docs.moralis.io/web3-data-api/evm/reference/price/get-token-price?address=0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0&chain=eth&include=percent_change
      // set the value accordingly, add a margin for the swap (will be refund to the sponsor if not used)
      const defaultAmountValue = parseEther('18.25') // 18.25 MATIC for 6.25 USDCe

      // todo-tech: referral system to apply, here we set vitalik.eth as the referral...
      const referralAdditionalInformation =
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

      // todo-tech: specs regarding adParameters / integrations
      const adParameters = [
        'linkURL',
        'img5:1URL',
        'twitterSpaceID',
        'twitterUserID'
      ]

      // todo-tech: API route https://app.dsponsor.com/api/baseURIs/:chainId/:contractAddr/:tokenId
      // -> should return a default 1:1 image
      const baseURI = 'https://app.dsponsor.com/api/baseURIs'

      const tokenIds: BigNumberish[] = tokenizedKeywords.map((t) =>
        stringToUint256(t)
      )

      const siborgOfferId = offerId + 1 // will be the value from UpdateOffer event

      const sponsor1 = user
      const sponsor1Addr = userAddr
      const sponsor2 = user2
      const sponsor2Addr = user2Addr

      const siborgNftParams: IDSponsorNFTBase.InitParamsStruct = {
        name: contractMetadata.name,
        symbol: contractMetadata.symbol,
        baseURI,
        contractURI,
        minter: DSponsorAdminAddress,
        maxSupply: uint256Max,
        forwarder: ZERO_ADDRESS,
        initialOwner: siborgOwnerAddr,
        royaltyBps,
        currencies: [],
        prices: [],
        allowedTokenIds: []
      }

      const siborgOfferInit: IDSponsorAgreements.OfferInitParamsStruct = {
        name: contractMetadata.name,
        rulesURI,
        options: {
          admins: [siborgOwnerAddr],
          validators: [],
          adParameters
        }
      }

      /**
       * 1. Create a DSponsorNFT contract and link an offer from it
       */

      const createDSponsorNFTAndOfferTx = await DSponsorAdmin.connect(
        siborgOwner
      ).createDSponsorNFTAndOffer(siborgNftParams, siborgOfferInit)

      const createDSponsorNFTAndOfferTxReceipt =
        await provider.getTransactionReceipt(createDSponsorNFTAndOfferTx.hash)

      const NewDSponsorNFTevent = createDSponsorNFTAndOfferTxReceipt?.logs
        .map((log: any) => DSponsorNFTFactory.interface.parseLog(log))
        .find((e) => e?.name === 'NewDSponsorNFT')

      const SiborgDSponsorNFTAddress = NewDSponsorNFTevent?.args[0]
      const SiborgDSponsorNFT = await ethers.getContractAt(
        'DSponsorNFT',
        SiborgDSponsorNFTAddress
      )

      const UpdateOfferEvent = createDSponsorNFTAndOfferTxReceipt?.logs
        .map((log: any) => DSponsorAdmin.interface.parseLog(log))
        .find((e) => e?.name === 'UpdateOffer')
      const offerIdFromEvent = UpdateOfferEvent?.args[0]

      expect(offerIdFromEvent).to.equal(siborgOfferId)
      expect(await DSponsorAdmin.getOfferContract(siborgOfferId)).to.equal(
        SiborgDSponsorNFTAddress
      )

      /**
       * 2. Specify tokens to be minted, and the prices
       */

      await SiborgDSponsorNFT.connect(siborgOwner).setTokensAllowlist(true)
      await SiborgDSponsorNFT.connect(siborgOwner).setTokensAreAllowed(
        tokenIds,
        [true, true, true, true, true]
      )

      // Only 'bitcoin'
      await SiborgDSponsorNFT.connect(siborgOwner).setMintPrice(
        tokenIds[0],
        currencies[0],
        true, // enable, set to false to disable this price parameter
        amounts[0]
      )
      // Only 'ethereum'
      await SiborgDSponsorNFT.connect(siborgOwner).setMintPrice(
        tokenIds[1],
        currencies[1],
        true, // enable, set to false to disable this price parameter
        amounts[1]
      )
      // allow 'nft', 'crypto', 'eth' tokens to be sold too
      await SiborgDSponsorNFT.connect(siborgOwner).setDefaultMintPrice(
        defaultCurrency,
        true, // enable, set to false to disable
        defaultAmount
      )

      /**
       * 3. Mint a token and submit an ad proposal
       */

      const fetchedBps = await DSponsorAdmin.connect(sponsor1).bps()
      const mintAmounts = (amount: bigint) => {
        const fee = (amount * fetchedBps) / BigInt('10000')
        const amountWithFee = amount + fee
        return { amount, fee, amountWithFee }
      }

      /**
       * Mint with ERC20 payment
       */
      const mintParams0 = {
        tokenId: stringToUint256(tokenizedKeywords[0]), // tokenIds[0]
        to: sponsor1Addr,
        currency: currencies[0],
        tokenData: tokenizedKeywords[0],
        offerId: siborgOfferId,
        adParameters: [adParameters[0], adParameters[1]],
        adDatas: [
          'https://www.bitcoinforever.com',
          'ipfs://ipfshash/b4ever-img5:1-edited.png'
        ],
        referralAdditionalInformation
      }
      await ERC20Mock.connect(sponsor1).approve(
        DSponsorAdminAddress,
        mintAmounts(amounts[0]).amountWithFee
      )
      const mintTx0 =
        await DSponsorAdmin.connect(sponsor1).mintAndSubmit(mintParams0)
      await expect(mintTx0).changeTokenBalances(
        ERC20Mock,
        [sponsor1, siborgOwner, treasury],
        [
          mintAmounts(amounts[0]).amountWithFee * BigInt('-1'),
          amounts[0],
          mintAmounts(amounts[0]).fee
        ]
      )
      expect(
        await SiborgDSponsorNFT.ownerOf(stringToUint256('bitcoin'))
      ).to.equal(sponsor1Addr)

      /**
       * Mint with native currency payment
       */
      const mintParams1 = {
        tokenId: stringToUint256(tokenizedKeywords[1]), // tokenIds[1]
        to: sponsor2Addr,
        currency: currencies[1],
        tokenData: tokenizedKeywords[1],
        offerId: siborgOfferId,
        adParameters: [adParameters[0], adParameters[1]],
        adDatas: [
          'https://www.ethforever.com',
          'ipfs://ipfshash/ethever-img5:1.png'
        ],
        referralAdditionalInformation
      }
      await ERC20Mock.connect(sponsor2).approve(
        DSponsorAdminAddress,
        mintAmounts(amounts[1]).amountWithFee
      )
      const mintTx1 = await DSponsorAdmin.connect(sponsor2).mintAndSubmit(
        mintParams1,
        { value: mintAmounts(amounts[1]).amountWithFee }
      )
      await expect(mintTx1).changeEtherBalances(
        [sponsor2, siborgOwner, treasury],
        [
          mintAmounts(amounts[1]).amountWithFee * BigInt('-1'),
          amounts[1],
          mintAmounts(amounts[1]).fee
        ]
      )
      expect(
        await SiborgDSponsorNFT.ownerOf(stringToUint256('ethereum'))
      ).to.equal(sponsor2Addr)

      /**
       * Mint with swap, paid by sponsor2 for sponsor1
       * sponsor1 will receive the refund from the swap
       */
      const mintParams2 = {
        tokenId: stringToUint256(tokenizedKeywords[2]), // tokenIds[2]
        to: sponsor1Addr,
        currency: defaultCurrency,
        tokenData: tokenizedKeywords[2],
        offerId: siborgOfferId,
        adParameters: [adParameters[0], adParameters[1]],
        adDatas: [
          'https://www.myawesomenft.com',
          'ipfs://ipfshash/manft-img5:1.png'
        ],
        referralAdditionalInformation
      }
      const sponsor1BalanceBefore = await provider.getBalance(sponsor1Addr)
      const mintTx2 = await DSponsorAdmin.connect(sponsor2).mintAndSubmit(
        mintParams2,
        {
          value: mintAmounts(defaultAmountValue).amountWithFee
        }
      )
      const sponsor1BalanceAfter = await provider.getBalance(sponsor1Addr)
      expect(sponsor1BalanceAfter).to.be.gt(sponsor1BalanceBefore)
      await expect(mintTx2).changeEtherBalances(
        [sponsor2, siborgOwner, treasury, DSponsorAdmin],
        [mintAmounts(defaultAmountValue).amountWithFee * BigInt('-1'), 0, 0, 0]
      )
      await expect(mintTx2).changeTokenBalances(
        USDCeContract,
        [sponsor1, siborgOwner, treasury],
        [0, defaultAmount, mintAmounts(defaultAmount).fee]
      )
      expect(await SiborgDSponsorNFT.ownerOf(stringToUint256('nft'))).to.equal(
        sponsor1Addr
      )

      expect(await SiborgDSponsorNFT.totalSupply()).to.be.equal(3)
      expect(await SiborgDSponsorNFT.MAX_SUPPLY()).to.be.equal(uint256Max)

      /**
       * siborgOwner mints and transfers it
       * (simulate secondary sale)
       */
      await SiborgDSponsorNFT.connect(siborgOwner).mint(
        stringToUint256('crypto'),
        siborgOwnerAddr,
        ZERO_ADDRESS, // ignored
        'crypto'
      )
      await SiborgDSponsorNFT.connect(siborgOwner).transferFrom(
        siborgOwnerAddr,
        sponsor2Addr,
        stringToUint256('crypto')
      )
      const manualSubmitTx = await DSponsorAdmin.connect(
        sponsor2
      ).submitAdProposal(
        siborgOfferId,
        stringToUint256('crypto'),
        adParameters[0],
        'https://www.crypto.com'
      )

      await expect(
        DSponsorAdmin.connect(sponsor1).mintAndSubmit(
          {
            tokenId: stringToUint256(tokenizedKeywords[3]),
            to: sponsor1Addr,
            currency: defaultCurrency,
            tokenData: tokenizedKeywords[3],
            offerId: siborgOfferId,
            adParameters: [adParameters[0], adParameters[1]],
            adDatas: [
              'https://www.myawesomenft.com',
              'ipfs://ipfshash/manft-img5:1.png'
            ],
            referralAdditionalInformation
          },
          {
            value: mintAmounts(defaultAmountValue).amountWithFee
          }
        )
      ).to.be.revertedWithCustomError(SiborgDSponsorNFT, 'AlreadyMinted')

      // fail to mint 'solana' as it's not allowed
      await expect(
        DSponsorAdmin.connect(sponsor1).mintAndSubmit(
          {
            tokenId: stringToUint256('solana'),
            to: sponsor1Addr,
            currency: defaultCurrency,
            tokenData: 'solana',
            offerId: siborgOfferId,
            adParameters: [adParameters[0], adParameters[1]],
            adDatas: [
              'https://www.myawesomenft.com',
              'ipfs://ipfshash/manft-img5:1.png'
            ],
            referralAdditionalInformation
          },
          {
            value: mintAmounts(defaultAmountValue).amountWithFee
          }
        )
      ).to.be.revertedWithCustomError(SiborgDSponsorNFT, 'TokenNotAllowed')

      /**
       * 4. Validate ad proposals
       */

      const receipt0 = await provider.getTransactionReceipt(mintTx0.hash)
      const events0 = receipt0?.logs
        .map((log: any) => DSponsorAdmin.interface.parseLog(log))
        .filter((e) => e?.name === 'UpdateAdProposal')
      const proposalIds0 = events0?.map((e) => e?.args[2])

      expect(
        await DSponsorAdmin.getOfferProposals(
          siborgOfferId,
          stringToUint256('bitcoin'),
          mintParams0.adParameters[0]
        )
      ).to.deep.equal([proposalIds0?.[0], 0, 0])

      await DSponsorAdmin.connect(siborgOwner).reviewAdProposals([
        {
          offerId: siborgOfferId,
          tokenId: stringToUint256('bitcoin'),
          proposalId: proposalIds0?.[0],
          adParameter: mintParams0.adParameters[0],
          validated: true,
          reason: 'Looks good'
        },
        {
          offerId: siborgOfferId,
          tokenId: stringToUint256('bitcoin'),
          proposalId: proposalIds0?.[1],
          adParameter: mintParams0.adParameters[1],
          validated: true,
          reason: 'Looks good too'
        }
      ])

      expect(
        await DSponsorAdmin.getOfferProposals(
          siborgOfferId,
          stringToUint256('bitcoin'),
          mintParams0.adParameters[0]
        )
      ).to.deep.equal([0, proposalIds0?.[0], 0])
      expect(
        await DSponsorAdmin.getOfferProposals(
          siborgOfferId,
          stringToUint256('bitcoin'),
          mintParams0.adParameters[1]
        )
      ).to.deep.equal([0, proposalIds0?.[1], 0])
    })
  })
})
