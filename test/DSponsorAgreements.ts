import 'dotenv/config'
import { expect } from 'chai'
import { BaseContract, parseEther, Signer } from 'ethers'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { executeByForwarder } from '../utils/eip712'
import {
  DSponsorAgreements,
  DSponsorNFT,
  DSponsorNFTFactory,
  ERC2771Forwarder,
  ERC20Mock,
  ERC721Mock,
  IDSponsorAgreements
} from '../typechain-types'
import { IDSponsorNFTBase } from '../typechain-types/contracts/DSponsorNFT'

describe('DSponsorAgreements', function () {
  const provider = ethers.provider

  let DSponsorNFTFactory: DSponsorNFTFactory
  let DSponsorNFTImplementation: DSponsorNFT
  let DSponsorNFTImplementationAddress: string
  let DSponsorNFT: DSponsorNFT
  let DSponsorNFTAddress: string
  let DSponsorAgreements: DSponsorAgreements
  let DSponsorAgreementsAddress: string
  let ERC20Mock: ERC20Mock
  let ERC20MockAddress: string
  let ERC721Mock: ERC721Mock
  let ERC721MockAddress: string
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
  let validator: Signer
  let validatorAddr: string

  const ERC20Amount: bigint = parseEther('15')

  let initDSponsorNFTParams: IDSponsorNFTBase.InitParamsStruct
  let offerInit: IDSponsorAgreements.OfferInitParamsStruct
  let offerOptions: IDSponsorAgreements.OfferOptionsStruct

  const tokensUser = [1, 10]

  const adParameters = ['logo', 'url']

  const adData = 'http://exemple.com'

  let offerIdCounter = 0
  let proposalIdCounter = 0
  let offerIdERC721Mock: number
  let offerIdDSponsorNFT: number
  let proposalIdERC721Mock: number
  let proposalIdDSponsorNFT: number

  //  AFTER DEPLOYMENT:
  // - user is owner of token id 1 for ERC721Mock
  // - user2 is owner of token id 10 for ERC721Mock
  // - user is owner of token id 10 for DSponsorNFT
  // - user2 is a "user" (tenant) of token id 10 for DSponsorNFT

  async function deployFixture() {
    signers = await ethers.getSigners()
    ;[deployer, owner, user, user2, user3, validator] = signers

    deployerAddr = await deployer.getAddress()
    ownerAddr = await owner.getAddress()
    userAddr = await user.getAddress()
    user2Addr = await user2.getAddress()
    user3Addr = await user3.getAddress()
    validatorAddr = await validator.getAddress()

    forwarder = await ethers.deployContract('ERC2771Forwarder', [])
    await forwarder.waitForDeployment()
    forwarderAddress = await forwarder.getAddress()

    ERC20Mock = await ethers.deployContract('ERC20Mock', [])
    await ERC20Mock.waitForDeployment()
    ERC20MockAddress = await ERC20Mock.getAddress()
    for (let signer of signers) {
      await ERC20Mock.mint(
        await signer.getAddress(),
        ERC20Amount * BigInt('10')
      )
    }

    ERC721Mock = await ethers.deployContract('ERC721Mock', [])
    await ERC721Mock.waitForDeployment()
    ERC721MockAddress = await ERC721Mock.getAddress()
    await ERC721Mock.connect(user).mint(tokensUser[0])
    await ERC721Mock.connect(user2).mint(tokensUser[1])

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
      maxSupply: BigInt('5'),
      minter: userAddr,
      forwarder: forwarderAddress,
      initialOwner: ownerAddr,
      royaltyBps: 400, // 4%
      currencies: [ERC20MockAddress],
      prices: [ERC20Amount],
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

    await ERC20Mock.connect(user).approve(
      DSponsorNFTAddress,
      ERC20Amount * BigInt('20')
    )

    await DSponsorNFT.connect(user).mint(
      tokensUser[1],
      userAddr,
      ERC20MockAddress,
      ''
    )

    DSponsorAgreements = await ethers.deployContract('DSponsorAgreements', [
      forwarder,
      deployer
    ])
    DSponsorAgreementsAddress = await DSponsorAgreements.getAddress()

    offerOptions = {
      admins: [ownerAddr],
      validators: [validatorAddr],
      adParameters
    }

    offerInit = {
      name: 'Offer X',
      offerMetadata: 'offerMetadata',
      options: offerOptions
    }
    await DSponsorAgreements.connect(owner).createOffer(
      ERC721MockAddress,
      offerInit
    )

    offerIdCounter++
    offerIdERC721Mock = offerIdCounter

    await DSponsorAgreements.connect(user).submitAdProposal(
      offerIdERC721Mock,
      tokensUser[0],
      adParameters[0],
      adData
    )

    proposalIdCounter++
    proposalIdERC721Mock = proposalIdCounter

    await DSponsorAgreements.connect(owner).createOffer(
      DSponsorNFTAddress,
      offerInit
    )

    offerIdCounter++
    offerIdDSponsorNFT = offerIdCounter

    await DSponsorAgreements.connect(user).submitAdProposal(
      offerIdDSponsorNFT,
      tokensUser[1],
      adParameters[1],
      adData
    )

    proposalIdCounter++
    proposalIdDSponsorNFT = proposalIdCounter
  }

  describe('Deployment', async function () {
    it('Should be set with provided contract owner', async function () {
      await loadFixture(deployFixture)
      await expect(await DSponsorAgreements.trustedForwarder()).to.be.equal(
        forwarderAddress
      )
      await expect(await DSponsorAgreements.owner()).to.be.equal(deployerAddr)
    })
  })

  describe('Offer creation', async function () {
    it('Should create an offer, even with same contract addr', async function () {
      await loadFixture(deployFixture)
      await expect(
        DSponsorAgreements.connect(owner).createOffer(
          ERC721MockAddress,
          offerInit
        )
      )
        .to.emit(DSponsorAgreements, 'UpdateOffer')
        .withArgs(
          offerIdCounter + 1,
          false,
          offerInit.name,
          offerInit.offerMetadata,
          ERC721MockAddress
        )

      expect(
        await DSponsorAgreements.getOfferContract(offerIdCounter + 1)
      ).to.be.equal(ERC721MockAddress)
    })

    it('Should revert if params are not correct', async function () {
      await loadFixture(deployFixture)
      await expect(
        DSponsorAgreements.connect(owner).createOffer(
          ERC721MockAddress,
          Object.assign({}, offerInit, { offerMetadata: '' })
        )
      ).to.be.revertedWithCustomError(DSponsorAgreements, 'EmptyString')

      await expect(
        DSponsorAgreements.connect(owner).createOffer(
          ERC721MockAddress,
          Object.assign({}, offerInit, {
            options: { admins: [], validators: [], adParameters: ['ff'] }
          })
        )
      ).to.be.revertedWithCustomError(DSponsorAgreements, 'NoAdminsProvided')

      await expect(
        DSponsorAgreements.connect(owner).createOffer(
          ERC721MockAddress,
          Object.assign({}, offerInit, {
            options: {
              admins: [ownerAddr],
              validators: [],
              adParameters: []
            }
          })
        )
      ).to.be.revertedWithCustomError(
        DSponsorAgreements,
        'NoAdParametersProvided'
      )

      await expect(
        DSponsorAgreements.connect(owner).createOffer(
          ERC721MockAddress,
          Object.assign({}, offerInit, {
            options: {
              admins: [ownerAddr],
              validators: [],
              adParameters: ['test', '']
            }
          })
        )
      ).to.be.revertedWithCustomError(DSponsorAgreements, 'EmptyString')
    })
  })

  describe('Sponsor operations', async function () {
    it('Should allow sponsoring data submission for owner', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAgreements.connect(user).submitAdProposal(
          offerIdERC721Mock,
          tokensUser[0],
          adParameters[1],
          adData
        )
      )
        .to.emit(DSponsorAgreements, 'UpdateAdProposal')
        .withArgs(
          offerIdERC721Mock,
          tokensUser[0],
          proposalIdCounter + 1,
          adParameters[1],
          adData
        )

      await expect(
        DSponsorAgreements.connect(user).submitAdProposals(
          [offerIdERC721Mock],
          [tokensUser[0]],
          [adParameters[1]],
          [adData]
        )
      )
        .to.emit(DSponsorAgreements, 'UpdateAdProposal')
        .withArgs(
          offerIdERC721Mock,
          tokensUser[0],
          proposalIdCounter + 2,
          adParameters[1],
          adData
        )
    })

    it('Should allow sponsoring data submission for tenant only', async function () {
      await loadFixture(deployFixture)

      await DSponsorNFT.connect(user).setUser(
        tokensUser[1],
        user2Addr,
        3707065848
      )

      await expect(
        DSponsorAgreements.connect(user).submitAdProposal(
          offerIdDSponsorNFT,
          tokensUser[1],
          adParameters[1],
          adData
        )
      )
        .to.revertedWithCustomError(
          DSponsorAgreements,
          'UnallowedSponsorOperation'
        )
        .withArgs(userAddr, offerIdDSponsorNFT, tokensUser[1])

      await expect(
        DSponsorAgreements.connect(user2).submitAdProposal(
          offerIdDSponsorNFT,
          tokensUser[1],
          adParameters[1],
          adData
        )
      )
        .to.emit(DSponsorAgreements, 'UpdateAdProposal')
        .withArgs(
          offerIdDSponsorNFT,
          tokensUser[1],
          proposalIdCounter + 1,
          adParameters[1],
          adData
        )

      await expect(
        DSponsorAgreements.connect(user2).submitAdProposals(
          [offerIdDSponsorNFT],
          [tokensUser[1]],
          [adParameters[1]],
          [adData]
        )
      )
        .to.emit(DSponsorAgreements, 'UpdateAdProposal')
        .withArgs(
          offerIdDSponsorNFT,
          tokensUser[1],
          proposalIdCounter + 2,
          adParameters[1],
          adData
        )
    })

    it('Should revert if sender is not owner nor user/tenant of token', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAgreements.connect(user).submitAdProposal(
          offerIdERC721Mock,
          tokensUser[1],
          adParameters[1],
          adData
        )
      )
        .to.revertedWithCustomError(
          DSponsorAgreements,
          'UnallowedSponsorOperation'
        )
        .withArgs(userAddr, offerIdERC721Mock, tokensUser[1])

      await expect(
        DSponsorAgreements.connect(user).submitAdProposals(
          [offerIdERC721Mock],
          [tokensUser[1]],
          [adParameters[1]],
          [adData]
        )
      )
        .to.revertedWithCustomError(
          DSponsorAgreements,
          'UnallowedSponsorOperation'
        )
        .withArgs(userAddr, offerIdERC721Mock, tokensUser[1])
    })

    it('Should revert submit batch if args length are not equal', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAgreements.connect(user).submitAdProposals(
          [offerIdERC721Mock],
          [tokensUser[1]],
          [adParameters[1]],
          [adData, 'data2']
        )
      ).to.revertedWithCustomError(DSponsorAgreements, 'InvalidArrayLength')
    })

    it('Should revert if token id does not exist', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAgreements.connect(user).submitAdProposal(
          offerIdERC721Mock,
          100,
          adParameters[1],
          adData
        )
      ).to.revertedWithCustomError(ERC721Mock, 'ERC721NonexistentToken')

      await expect(
        DSponsorAgreements.connect(user).submitAdProposals(
          [offerIdERC721Mock],
          [100],
          [adParameters[1]],
          [adData]
        )
      ).to.revertedWithCustomError(ERC721Mock, 'ERC721NonexistentToken')
    })

    it('Should revert if ad parameter is not allowed', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAgreements.connect(user).submitAdProposal(
          offerIdERC721Mock,
          tokensUser[0],
          'test',
          adData
        )
      )
        .to.revertedWithCustomError(DSponsorAgreements, 'UnallowedAdParameter')
        .withArgs(offerIdERC721Mock, 'test')

      await expect(
        DSponsorAgreements.connect(user).submitAdProposals(
          [offerIdERC721Mock],
          [tokensUser[0]],
          ['test'],
          [adData]
        )
      )
        .to.revertedWithCustomError(DSponsorAgreements, 'UnallowedAdParameter')
        .withArgs(offerIdERC721Mock, 'test')
    })

    it('Should revert if data is empty', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAgreements.connect(user).submitAdProposal(
          offerIdERC721Mock,
          tokensUser[0],
          adParameters[1],
          ''
        )
      ).to.revertedWithCustomError(DSponsorAgreements, 'NoAdDataSubmitted')

      await expect(
        DSponsorAgreements.connect(user).submitAdProposals(
          [offerIdERC721Mock],
          [tokensUser[0]],
          [adParameters[1]],
          ['']
        )
      ).to.revertedWithCustomError(DSponsorAgreements, 'NoAdDataSubmitted')
    })

    it('Should revert if offer is not created', async function () {
      await loadFixture(deployFixture)

      const ERC721Mock2 = await ethers.deployContract('ERC721Mock', [])
      ERC721Mock2.connect(user).mint(0)

      await expect(
        DSponsorAgreements.connect(user).submitAdProposal(
          offerIdCounter + 1,
          0,
          adParameters[1],
          'test'
        )
      ).to.reverted

      await expect(
        DSponsorAgreements.connect(user).submitAdProposals(
          [offerIdCounter + 1],
          [0],
          [adParameters[1]],
          ['test']
        )
      ).to.reverted
    })

    it('Should revert if offer is not active', async function () {
      await loadFixture(deployFixture)

      const addOptions = { admins: [], validators: [], adParameters: [] }
      const removeOptions = { admins: [], validators: [], adParameters: [] }

      const disabled = true

      await DSponsorAgreements.connect(owner).updateOffer(
        offerIdERC721Mock,
        disabled,
        '',
        '',
        addOptions,
        removeOptions
      )

      await expect(
        DSponsorAgreements.connect(user).submitAdProposal(
          offerIdERC721Mock,
          tokensUser[0],
          adParameters[1],
          adData
        )
      )
        .to.revertedWithCustomError(DSponsorAgreements, 'DisabledOffer')
        .withArgs(offerIdERC721Mock)

      await expect(
        DSponsorAgreements.connect(user).submitAdProposals(
          [offerIdERC721Mock],
          [tokensUser[0]],
          [adParameters[1]],
          [adData]
        )
      ).to.revertedWithCustomError(DSponsorAgreements, 'DisabledOffer')
    })

    it('Should revert if offer is not linked to a valid ERC721 contract', async function () {
      await loadFixture(deployFixture)
      await DSponsorAgreements.connect(owner).createOffer(
        ERC20MockAddress,
        offerInit
      )
      await expect(
        DSponsorAgreements.connect(user).submitAdProposal(
          offerIdCounter + 1,
          0,
          adParameters[1],
          'test'
        )
      ).to.reverted

      await expect(
        DSponsorAgreements.connect(user).submitAdProposals(
          [offerIdCounter + 1],
          [0],
          [adParameters[1]],
          ['test']
        )
      ).to.reverted
    })
  })

  describe('Admin offer operations', async function () {
    it('Should allow admin to update offer', async function () {
      await loadFixture(deployFixture)

      const options1 = {
        admins: [user2Addr],
        validators: [user3Addr],
        adParameters: ['test']
      }
      const options2 = { admins: [], validators: [], adParameters: [] }
      const options3 = { admins: [], validators: [user3Addr], adParameters: [] }

      expect(
        await DSponsorAgreements.isAllowedAdParameter(offerIdERC721Mock, 'test')
      ).to.be.false

      expect(
        await DSponsorAgreements.isOfferAdmin(offerIdERC721Mock, user2Addr)
      ).to.be.false

      expect(await DSponsorAgreements.isOfferDisabled(offerIdERC721Mock)).to.be
        .false

      expect(
        await DSponsorAgreements.isOfferValidator(offerIdERC721Mock, user3Addr)
      ).to.be.false

      await expect(
        DSponsorAgreements.connect(owner).updateOffer(
          offerIdERC721Mock,
          true,
          'newName',
          'newRules',
          options1, // toAdd
          options2 // toRemove
        )
      )
        .to.emit(DSponsorAgreements, 'UpdateOffer')
        .withArgs(
          offerIdERC721Mock,
          true,
          'newName',
          'newRules',
          ERC721MockAddress
        )

      expect(
        await DSponsorAgreements.isAllowedAdParameter(offerIdERC721Mock, 'test')
      ).to.be.true

      expect(
        await DSponsorAgreements.isOfferAdmin(offerIdERC721Mock, user2Addr)
      ).to.be.true

      expect(await DSponsorAgreements.isOfferDisabled(offerIdERC721Mock)).to.be
        .true

      expect(
        await DSponsorAgreements.isOfferValidator(offerIdERC721Mock, user3Addr)
      ).to.be.true

      await expect(
        DSponsorAgreements.connect(owner).updateOffer(
          offerIdERC721Mock,
          false,
          'newName',
          'newRules',
          options1, // toAdd
          options2 // toRemove
        )
      )
        .to.emit(DSponsorAgreements, 'UpdateOfferAdmin')
        .withArgs(offerIdERC721Mock, user2Addr, true)

      await expect(
        DSponsorAgreements.connect(owner).updateOffer(
          offerIdERC721Mock,
          false,
          'newName',
          'newRules',
          options1, // toAdd
          options2 // toRemove
        )
      )
        .to.emit(DSponsorAgreements, 'UpdateOfferAdParameter')
        .withArgs(offerIdERC721Mock, 'test', true)

      await expect(
        DSponsorAgreements.connect(user2).updateOffer(
          offerIdERC721Mock,
          false,
          '',
          '',
          options2, // toAdd
          options3 // toRemove
        )
      )
        .to.emit(DSponsorAgreements, 'UpdateOfferValidator')
        .withArgs(offerIdERC721Mock, options3.validators[0], false)
    })

    it('Should allow to validate as an admin', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAgreements.connect(owner).reviewAdProposals([
          {
            offerId: offerIdDSponsorNFT,
            tokenId: tokensUser[1],
            proposalId: proposalIdDSponsorNFT,
            adParameter: adParameters[1],
            validated: true,
            reason: ''
          }
        ])
      )
        .to.emit(DSponsorAgreements, 'UpdateAdValidation')
        .withArgs(
          offerIdDSponsorNFT,
          tokensUser[1],
          proposalIdDSponsorNFT,
          adParameters[1],
          true,
          ''
        )

      expect(
        await DSponsorAgreements.getOfferProposals(
          offerIdDSponsorNFT,
          tokensUser[1],
          adParameters[1]
        )
      ).to.be.deep.equal([0, proposalIdDSponsorNFT, 0])
    })

    it('Should allow to reject as an admin', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAgreements.connect(owner).reviewAdProposals([
          {
            offerId: offerIdDSponsorNFT,
            tokenId: tokensUser[1],
            proposalId: proposalIdDSponsorNFT,
            adParameter: adParameters[1],
            validated: false,
            reason: ''
          }
        ])
      )
        .to.emit(DSponsorAgreements, 'UpdateAdValidation')
        .withArgs(
          offerIdDSponsorNFT,
          tokensUser[1],
          proposalIdDSponsorNFT,
          adParameters[1],
          false,
          ''
        )

      expect(
        await DSponsorAgreements.getOfferProposals(
          offerIdDSponsorNFT,
          tokensUser[1],
          adParameters[1]
        )
      ).to.be.deep.equal([0, 0, proposalIdDSponsorNFT])
    })

    it('Should allow to validate as a validator', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAgreements.connect(validator).reviewAdProposals([
          {
            offerId: offerIdDSponsorNFT,
            tokenId: tokensUser[1],
            proposalId: proposalIdDSponsorNFT,
            adParameter: adParameters[1],
            validated: true,
            reason: ''
          }
        ])
      )
        .to.emit(DSponsorAgreements, 'UpdateAdValidation')
        .withArgs(
          offerIdDSponsorNFT,
          tokensUser[1],
          proposalIdDSponsorNFT,
          adParameters[1],
          true,
          ''
        )
    })

    it('Should revert if user is not admin', async function () {
      await loadFixture(deployFixture)

      const options1 = {
        admins: [user2Addr],
        validators: [user3Addr],
        adParameters: ['test']
      }
      const options2 = { admins: [], validators: [], adParameters: [] }

      await expect(
        DSponsorAgreements.connect(validator).updateOffer(
          offerIdERC721Mock,
          false,
          'newName',
          'newRules',
          options1, // toAdd
          options2 // toRemove
        )
      )
        .to.revertedWithCustomError(
          DSponsorAgreements,
          'UnallowedAdminOperation'
        )
        .withArgs(validatorAddr, offerIdERC721Mock)

      await expect(
        DSponsorAgreements.connect(user).reviewAdProposals([
          {
            offerId: offerIdDSponsorNFT,
            tokenId: tokensUser[1],
            proposalId: proposalIdDSponsorNFT,
            adParameter: adParameters[1],
            validated: true,
            reason: ''
          }
        ])
      )
        .to.be.revertedWithCustomError(
          DSponsorAgreements,
          'UnallowedValidatorOperation'
        )
        .withArgs(userAddr, offerIdDSponsorNFT)
    })

    it('Should revert to remove admin if sender is admin', async function () {
      await loadFixture(deployFixture)

      const options2 = { admins: [], validators: [], adParameters: [] }
      const options3 = {
        admins: [ownerAddr],
        validators: [user3Addr],
        adParameters: []
      }

      await expect(
        DSponsorAgreements.connect(owner).updateOffer(
          offerIdERC721Mock,
          false,
          'newName',
          'newRules',
          options2, // toAdd
          options3 // toRemove
        )
      ).to.revertedWithCustomError(
        DSponsorAgreements,
        'CannotRemoveSelfAsAdmin'
      )
    })

    it('Should revert validation if it is not a proposal from the offer', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAgreements.connect(validator).reviewAdProposals([
          {
            offerId: offerIdERC721Mock,
            tokenId: tokensUser[0],
            proposalId: proposalIdDSponsorNFT,
            adParameter: adParameters[1],
            validated: true,
            reason: ''
          }
        ])
      )
        .to.revertedWithCustomError(
          DSponsorAgreements,
          'ProposalNotSubmittedBySponsor'
        )
        .withArgs(
          offerIdERC721Mock,
          tokensUser[0],
          adParameters[1],
          proposalIdDSponsorNFT
        )
    })

    it('Should revert validation if it is not a proposal from the correct ad parameter', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorAgreements.connect(validator).reviewAdProposals([
          {
            offerId: offerIdDSponsorNFT,
            tokenId: tokensUser[1],
            proposalId: proposalIdDSponsorNFT,
            adParameter: adParameters[0],
            validated: true,
            reason: ''
          }
        ])
      )
        .to.revertedWithCustomError(
          DSponsorAgreements,
          'ProposalNotSubmittedBySponsor'
        )
        .withArgs(
          offerIdDSponsorNFT,
          tokensUser[1],
          adParameters[0],
          proposalIdDSponsorNFT
        )
    })
  })

  describe('ERC2771 Related Functions', function () {
    it('Should set the trusted forwarder correctly', async function () {
      await loadFixture(deployFixture)

      const encodedFunctionData =
        DSponsorAgreements.interface.encodeFunctionData('createOffer', [
          ERC721MockAddress,
          offerInit
        ])

      const forwarder2 = await ethers.deployContract('ERC2771Forwarder', [])
      await forwarder2.waitForDeployment()
      await DSponsorAgreements.connect(deployer).setTrustedForwarder(
        await forwarder2.getAddress()
      )

      await expect(
        executeByForwarder(
          forwarder,
          DSponsorAgreements as BaseContract,
          owner,
          encodedFunctionData
        )
      ).to.revertedWithCustomError(forwarder, 'ERC2771UntrustfulTarget')

      await expect(
        executeByForwarder(
          forwarder2,
          DSponsorAgreements as BaseContract,
          owner,
          encodedFunctionData
        )
      )
        .to.emit(DSponsorAgreements, 'UpdateOffer')
        .withArgs(
          offerIdCounter + 1,
          false,
          offerInit.name,
          offerInit.offerMetadata,
          ERC721MockAddress
        )
    })

    it('Should allow a user to submit an ad proposal without gas spent via the forwarder', async function () {
      await loadFixture(deployFixture)

      const encodedFunctionData =
        DSponsorAgreements.interface.encodeFunctionData('submitAdProposals', [
          [offerIdERC721Mock],
          [tokensUser[0]],
          [adParameters[1]],
          [adData]
        ])

      await expect(
        executeByForwarder(
          forwarder,
          DSponsorAgreements as BaseContract,
          user,
          encodedFunctionData
        )
      ).to.changeEtherBalance(user, 0)
    })

    it('Should not allow user to send unauthorized operations via the forwarder', async function () {
      await loadFixture(deployFixture)

      const encodedFunctionData =
        DSponsorAgreements.interface.encodeFunctionData('submitAdProposals', [
          [offerIdERC721Mock],
          [tokensUser[0]],
          [adParameters[1]],
          [adData]
        ])

      await expect(
        executeByForwarder(
          forwarder,
          DSponsorAgreements as BaseContract,
          user2,
          encodedFunctionData
        )
      ).to.revertedWithCustomError(forwarder, 'FailedInnerCall')
    })
  })
})
