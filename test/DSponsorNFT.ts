import 'dotenv/config'
import { expect } from 'chai'
import {
  BaseContract,
  keccak256,
  parseEther,
  Signer,
  toUtf8Bytes
} from 'ethers'
import { ethers, network } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { executeByForwarder } from '../utils/eip712'
import {
  DSponsorNFT,
  DSponsorNFTFactory,
  ERC20Mock,
  ERC721Mock,
  ReentrantDSponsorNFT
} from '../typechain-types'
import { IDSponsorNFTBase } from '../typechain-types/contracts/DSponsorNFT'

import { ERC2771Forwarder } from '../typechain-types/@openzeppelin/contracts/metatx/ERC2771Forwarder'
import { ZERO_ADDRESS } from '../utils/constants'

describe('DSponsorNFT', function () {
  const provider = ethers.provider

  let DSponsorNFTFactory: DSponsorNFTFactory
  let DSponsorNFTImplementation: DSponsorNFT
  let DSponsorNFTImplementationAddress: string
  let DSponsorNFT: DSponsorNFT
  let DSponsorNFTAddress: string
  let ERC20Mock: ERC20Mock
  let ERC20MockAddress: string
  let ERC20Mock2: ERC20Mock
  let ERC20Mock2Address: string
  let ERC721Mock: ERC721Mock
  let ERC721MockAddress: string
  let forwarder: ERC2771Forwarder
  let forwarderAddress: string
  let reentrant: ReentrantDSponsorNFT
  let reentrantAddress: string

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

  const ERC20Amount: bigint = parseEther('0.05')
  const ERC20MintCapacity = BigInt('5')
  const ERC20ApproveCapacity = BigInt('3')
  const etherValue: string = '10'
  const value: bigint = parseEther(etherValue)

  let initParams: IDSponsorNFTBase.InitParamsStruct

  const chainId = network.config.chainId
  let tokenId = 10

  const tokenData = 'keyword'
  const hashedTokenIdStr = keccak256(toUtf8Bytes(tokenData))
  const hashedTokenId = BigInt(hashedTokenIdStr)

  async function deployFixture() {
    signers = await ethers.getSigners()
    ;[deployer, owner, user, user2, user3] = signers

    deployerAddr = await deployer.getAddress()
    ownerAddr = await owner.getAddress()
    userAddr = await user.getAddress()
    user2Addr = await user2.getAddress()
    user3Addr = await user3.getAddress()

    forwarder = await ethers.deployContract('ERC2771Forwarder', [])
    await forwarder.waitForDeployment()
    forwarderAddress = await forwarder.getAddress()

    ERC20Mock = await ethers.deployContract('ERC20Mock', [])
    await ERC20Mock.waitForDeployment()
    ERC20MockAddress = await ERC20Mock.getAddress()

    for (let signer of signers) {
      await ERC20Mock.mint(
        await signer.getAddress(),
        ERC20MintCapacity * ERC20Amount
      )
    }

    ERC20Mock2 = await ethers.deployContract('ERC20Mock', [])
    await ERC20Mock2.waitForDeployment()
    ERC20Mock2Address = await ERC20Mock2.getAddress()

    ERC721Mock = await ethers.deployContract('ERC721Mock', [])
    await ERC721Mock.waitForDeployment()
    ERC721MockAddress = await ERC721Mock.getAddress()

    reentrant = await ethers.deployContract('ReentrantDSponsorNFT', [])
    await reentrant.waitForDeployment()
    reentrantAddress = await reentrant.getAddress()

    DSponsorNFTImplementation = await ethers.deployContract('DSponsorNFT', [])
    DSponsorNFTImplementationAddress =
      await DSponsorNFTImplementation.getAddress()

    DSponsorNFTFactory = await ethers.deployContract('DSponsorNFTFactory', [
      DSponsorNFTImplementationAddress
    ])

    initParams = {
      name: 'DSponsorNFT',
      symbol: 'DSNFT',
      baseURI: 'https://baseURI.com',
      contractURI: 'https://contractURI.com',
      maxSupply: BigInt('5'),
      minter: userAddr,
      forwarder: forwarderAddress,
      initialOwner: ownerAddr,
      royaltyBps: 400, // 4%
      currencies: [ERC20MockAddress, ZERO_ADDRESS],
      prices: [ERC20Amount, value],
      allowedTokenIds: []
    }

    const tx = await DSponsorNFTFactory.createDSponsorNFT(initParams)
    if (!tx.hash) throw new Error('No tx hash')
    const receipt = await provider.getTransactionReceipt(tx.hash || '')
    const event = receipt?.logs
      .map((log: any) => DSponsorNFTFactory.interface.parseLog(log))
      .find((e) => e?.name === 'NewDSponsorNFT')
    if (!event) throw new Error('No event')

    DSponsorNFTAddress = event.args[0].toLowerCase()
    DSponsorNFT = await ethers.getContractAt('DSponsorNFT', DSponsorNFTAddress)

    await ERC20Mock.connect(user).approve(
      DSponsorNFTAddress,
      ERC20Amount * ERC20ApproveCapacity
    )
    await ERC20Mock.connect(user2).approve(
      DSponsorNFTAddress,
      ERC20Amount * ERC20ApproveCapacity
    )
  }

  describe('Initialization', function () {
    it('Should set the right name, symbol, URIs and max supply', async function () {
      await loadFixture(deployFixture)

      expect(await DSponsorNFT.name()).to.equal(initParams.name)
      expect(await DSponsorNFT.symbol()).to.equal(initParams.symbol)
      expect(await DSponsorNFT.baseURI()).to.equal(initParams.baseURI)
      expect(await DSponsorNFT.contractURI()).to.equal(initParams.contractURI)
      expect(await DSponsorNFT.MAX_SUPPLY()).to.equal(initParams.maxSupply)
      expect(await DSponsorNFT.totalSupply()).to.equal(0)
    })

    it('Should set the right forwarder & owner', async function () {
      await loadFixture(deployFixture)
      expect(await DSponsorNFT.trustedForwarder()).to.equal(forwarderAddress)
      expect(await DSponsorNFT.owner()).to.equal(ownerAddr)
      expect(await DSponsorNFT.getOwner()).to.equal(ownerAddr)
    })

    it('Should set the right royalty infos', async function () {
      await loadFixture(deployFixture)
      const res =
        (BigInt('100') * BigInt(initParams.royaltyBps)) / BigInt('10000')
      expect(await DSponsorNFT.royaltyInfo(0, 100)).to.deep.equal([
        ownerAddr,
        res
      ])
    })

    it('Should set the right pricing infos', async function () {
      await loadFixture(deployFixture)

      expect(
        await DSponsorNFT.getMintPrice(tokenId, initParams.currencies[0])
      ).to.deep.equal([true, initParams.prices[0]])
    })

    it('Should set the right token allowlist parameters', async function () {
      await loadFixture(deployFixture)

      expect(await DSponsorNFT.applyTokensAllowlist()).to.equal(false)
      expect(await DSponsorNFT.tokenIdIsAllowedToMint(0)).to.equal(true)
      expect(await DSponsorNFT.tokenIdIsAllowedToMint(55)).to.equal(true)
    })

    it('Should support ERC721, ERC2981 and ERC4907 interfaces', async function () {
      await loadFixture(deployFixture)

      const supportsDummy = await DSponsorNFT.supportsInterface('0x80ac58cf')
      const supportsERC1555 = await DSponsorNFT.supportsInterface('0x4e2312e0')
      const supportsERC165 = await DSponsorNFT.supportsInterface('0x01ffc9a7')
      const supportsERC20 = await DSponsorNFT.supportsInterface('0x36372b07')
      const supportsERC2981 = await DSponsorNFT.supportsInterface('0x2a55205a')
      const supportsERC721 = await DSponsorNFT.supportsInterface('0x80ac58cd')
      const supportsERC721Enumerable =
        await DSponsorNFT.supportsInterface('0x780e9d63')
      const supportsERC721Metadata =
        await DSponsorNFT.supportsInterface('0x5b5e139f')
      const supportsERC4907 = await DSponsorNFT.supportsInterface('0xad092b5c')

      expect(supportsDummy).to.equal(false)
      expect(supportsERC1555).to.equal(false)
      expect(supportsERC165).to.equal(true)
      expect(supportsERC20).to.equal(false)
      expect(supportsERC2981).to.equal(true)
      expect(supportsERC721).to.equal(true)
      expect(supportsERC721Enumerable).to.equal(false)
      expect(supportsERC721Metadata).to.equal(true)
      expect(supportsERC4907).to.equal(true)
    })

    it('Should initialize correctly even with no forwarder', async function () {
      const params: IDSponsorNFTBase.InitParamsStruct = Object.assign(
        {},
        initParams,
        { forwarder: ZERO_ADDRESS }
      )

      const tx = await DSponsorNFTFactory.createDSponsorNFT(params)
      const receipt = await provider.getTransactionReceipt(tx?.hash || '')

      const event = receipt?.logs
        .map((log: any) => DSponsorNFTFactory.interface.parseLog(log))
        .find((e) => e?.name === 'NewDSponsorNFT')

      expect(event?.args?.[8]).to.equal(ZERO_ADDRESS)
    })

    it('Should fail if initialize with invalid arguments', async function () {
      await expect(
        DSponsorNFTFactory.createDSponsorNFT(
          Object.assign({}, initParams, { maxSupply: 0 })
        )
      ).to.be.revertedWithCustomError(
        DSponsorNFT,
        'MaxSupplyShouldBeGreaterThan0'
      )

      await expect(
        DSponsorNFTFactory.createDSponsorNFT(
          Object.assign({}, initParams, { initialOwner: ZERO_ADDRESS })
        )
      ).to.be.revertedWithCustomError(DSponsorNFT, 'OwnableInvalidOwner')

      await expect(
        DSponsorNFTFactory.createDSponsorNFT(
          Object.assign({}, initParams, {
            prices: [BigInt('100')]
          })
        )
      ).to.be.revertedWithCustomError(DSponsorNFT, 'InvalidPricingStructure')
    })

    it('Should correctly set the allowlist tokens params if provided in the constructor', async function () {
      await loadFixture(deployFixture)

      const initParams2: IDSponsorNFTBase.InitParamsStruct = Object.assign(
        {},
        initParams,
        { allowedTokenIds: [1, 2, 3] }
      )

      const tx = await DSponsorNFTFactory.createDSponsorNFT(initParams2)

      if (!tx.hash) throw new Error('No tx hash')
      const receipt = await provider.getTransactionReceipt(tx.hash || '')
      const event = receipt?.logs
        .map((log: any) => DSponsorNFTFactory.interface.parseLog(log))
        .find((e) => e?.name === 'NewDSponsorNFT')
      if (!event) throw new Error('No event')

      const DSponsorNFTAddress2 = event.args[0]
      const DSponsorNFT2 = await ethers.getContractAt(
        'DSponsorNFT',
        DSponsorNFTAddress2
      )

      expect(await DSponsorNFT2.applyTokensAllowlist()).to.equal(true)
      expect(await DSponsorNFT2.tokenIdIsAllowedToMint(1)).to.equal(true)
      expect(await DSponsorNFT2.tokenIdIsAllowedToMint(0)).to.equal(false)
    })
  })

  describe('NFT Minting', async function () {
    it('Should mint with ERC20 currency', async function () {
      await loadFixture(deployFixture)

      const ERC20balanceOfOwner = await ERC20Mock.balanceOf(ownerAddr)
      const ERC20balanceOfUser = await ERC20Mock.balanceOf(userAddr)
      const ERC20balanceOfUser2 = await ERC20Mock.balanceOf(user2Addr)

      const NFTbalanceOfOwner = await DSponsorNFT.balanceOf(ownerAddr)
      const NFTbalanceOfUser = await DSponsorNFT.balanceOf(userAddr)
      const NFTbalanceOfUser2 = await DSponsorNFT.balanceOf(user2Addr)

      await expect(
        DSponsorNFT.connect(user).mint(
          tokenId,
          user2,
          ERC20MockAddress,
          tokenData
        )
      )
        .to.emit(DSponsorNFT, 'Mint')
        .withArgs(
          tokenId,
          userAddr,
          user2Addr,
          ERC20MockAddress,
          ERC20Amount,
          tokenData
        )

      expect(await ERC20Mock.balanceOf(ownerAddr)).to.be.equal(
        ERC20balanceOfOwner + ERC20Amount
      )
      expect(await ERC20Mock.balanceOf(userAddr)).to.be.equal(
        ERC20balanceOfUser - ERC20Amount
      )
      expect(await ERC20Mock.balanceOf(user2Addr)).to.be.equal(
        ERC20balanceOfUser2
      )

      expect(await DSponsorNFT.balanceOf(ownerAddr)).to.be.equal(
        NFTbalanceOfOwner
      )
      expect(await DSponsorNFT.balanceOf(userAddr)).to.be.equal(
        NFTbalanceOfUser
      )
      expect(await DSponsorNFT.balanceOf(user2Addr)).to.be.equal(
        NFTbalanceOfUser2 + BigInt('1')
      )

      expect(await DSponsorNFT.totalSupply()).to.be.equal(1)
    })

    it('Should mint with native currency', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorNFT.connect(user).mint(
          tokenId,
          user2Addr,
          ZERO_ADDRESS,
          tokenData,
          { value }
        )
      ).to.changeEtherBalances(
        [userAddr, ownerAddr],
        [parseEther(`-${etherValue}`), value]
      )

      await expect(
        DSponsorNFT.connect(user).mint(
          tokenId + 1,
          user2Addr,
          ZERO_ADDRESS,
          tokenData,
          { value }
        )
      ).to.changeTokenBalances(DSponsorNFT, [user2Addr, ownerAddr], [1, 0])
    })

    it('Should allow to mint for free', async function () {
      await loadFixture(deployFixture)

      const ERC20balanceOfUser2 = await ERC20Mock.balanceOf(user2Addr)
      const ERC20balanceOfOwner = await ERC20Mock.balanceOf(ownerAddr)
      const NFTbalanceOfUser2 = await DSponsorNFT.balanceOf(user2Addr)
      const NFTbalanceOfOwner = await DSponsorNFT.balanceOf(ownerAddr)

      await DSponsorNFT.connect(owner).setDefaultMintPrice(
        ERC20MockAddress,
        true,
        0
      )
      await DSponsorNFT.connect(owner).setDefaultMintPrice(
        ZERO_ADDRESS,
        true,
        0
      )

      await expect(
        DSponsorNFT.connect(user).mint(
          tokenId,
          user2Addr,
          ZERO_ADDRESS,
          tokenData
        )
      )
        .to.emit(DSponsorNFT, 'Mint')
        .withArgs(tokenId, userAddr, user2Addr, ZERO_ADDRESS, 0, tokenData)

      await expect(
        DSponsorNFT.connect(user).mint(
          tokenId + 1,
          user2Addr,
          ERC20MockAddress,
          tokenData
        )
      )
        .to.emit(DSponsorNFT, 'Mint')
        .withArgs(
          tokenId + 1,
          userAddr,
          user2Addr,
          ERC20MockAddress,
          0, // ERC20Amount,
          tokenData
        )

      expect(await ERC20Mock.balanceOf(user2Addr)).to.be.equal(
        ERC20balanceOfUser2
      )
      expect(await DSponsorNFT.balanceOf(user2Addr)).to.be.equal(
        NFTbalanceOfUser2 + BigInt('2')
      )
      expect(await ERC20Mock.balanceOf(ownerAddr)).to.be.equal(
        ERC20balanceOfOwner
      )
      expect(await DSponsorNFT.balanceOf(ownerAddr)).to.be.equal(
        NFTbalanceOfOwner
      )

      await expect(
        DSponsorNFT.connect(user).mint(
          tokenId + 55,
          user2,
          ZERO_ADDRESS,
          tokenData
        )
      ).to.changeEtherBalances([userAddr, ownerAddr], [0, 0])
    })

    it('Should support specific pricing per token', async function () {
      await loadFixture(deployFixture)

      const newAmount = ERC20Amount / BigInt('25')
      const newValue = value / BigInt('15')

      await DSponsorNFT.connect(owner).setMintPrice(
        tokenId,
        ERC20MockAddress,
        true,
        newAmount
      )

      await expect(
        DSponsorNFT.connect(user).mint(
          tokenId,
          user,
          ERC20MockAddress,
          tokenData
        )
      ).to.changeTokenBalance(ERC20Mock, user, -newAmount)

      await DSponsorNFT.connect(owner).setMintPrice(
        tokenId + 1,
        ZERO_ADDRESS,
        true,
        newValue
      )

      await expect(
        DSponsorNFT.connect(user).mint(
          tokenId + 1,
          user,
          ZERO_ADDRESS,
          tokenData,
          { value: newValue }
        )
      ).to.changeEtherBalance(user, -newValue)

      // check default minting price still ok
      await expect(
        DSponsorNFT.connect(user).mint(
          tokenId + 2,
          user,
          ERC20MockAddress,
          tokenData
        )
      ).to.changeTokenBalance(ERC20Mock, user, -ERC20Amount)

      await expect(
        DSponsorNFT.connect(user).mint(
          tokenId + 3,
          user,
          ZERO_ADDRESS,
          tokenData,
          { value }
        )
      ).to.changeEtherBalance(user, -value)
    })

    it('Should respect the token allowlist', async function () {
      await loadFixture(deployFixture)

      await expect(DSponsorNFT.connect(owner).setTokensAllowlist(true))
        .to.emit(DSponsorNFT, 'TokensAllowlist')
        .withArgs(true)

      await expect(
        DSponsorNFT.connect(owner).setTokensAreAllowed(
          [20, 55, 80],
          [true, true, true]
        )
      )
        .to.emit(DSponsorNFT, 'TokensAllowlistUpdated')
        .withArgs(55, true)

      await expect(
        DSponsorNFT.connect(user).mint(10, user, ERC20MockAddress, tokenData)
      ).to.be.revertedWithCustomError(DSponsorNFT, 'TokenNotAllowed')

      await expect(
        DSponsorNFT.connect(user).mint(55, user, ERC20MockAddress, tokenData)
      ).to.changeTokenBalance(ERC20Mock, user, -ERC20Amount)

      await DSponsorNFT.connect(owner).setTokensAreAllowed([10], [true])

      await expect(
        DSponsorNFT.connect(user).mint(10, user, ERC20MockAddress, tokenData)
      ).to.changeTokenBalance(DSponsorNFT, user, 1)

      await expect(DSponsorNFT.connect(owner).setTokensAllowlist(false))
        .to.emit(DSponsorNFT, 'TokensAllowlist')
        .withArgs(false)

      await expect(
        DSponsorNFT.connect(user).mint(15550, user, ERC20MockAddress, tokenData)
      ).to.changeTokenBalance(DSponsorNFT, user, 1)
    })

    it('Should revert if minting already minted token id', async function () {
      await loadFixture(deployFixture)

      await DSponsorNFT.connect(user).mint(
        tokenId,
        user,
        ERC20MockAddress,
        tokenData
      )

      expect(await DSponsorNFT.getMintPrice(tokenId, ERC20MockAddress))
        .to.be.revertedWithCustomError(DSponsorNFT, 'AlreadyMinted')
        .withArgs(tokenId)

      await expect(
        DSponsorNFT.connect(user).mint(
          tokenId,
          user,
          ERC20MockAddress,
          tokenData
        )
      )
        .to.be.revertedWithCustomError(DSponsorNFT, 'AlreadyMinted')
        .withArgs(tokenId)

      await expect(
        DSponsorNFT.connect(owner).setTokensAreAllowed([tokenId], [true, false])
      ).to.be.revertedWithCustomError(DSponsorNFT, 'InvalidInputLengths')
    })

    it('Should allow owner to mint for free', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorNFT.connect(owner).mint(
          tokenId,
          user2Addr,
          ERC20Mock2Address,
          tokenData
        )
      )
        .to.emit(DSponsorNFT, 'Mint')
        .withArgs(
          tokenId,
          owner,
          user2Addr,
          ERC20Mock2Address,
          0, // amount,
          tokenData
        )
    })

    it('Should revert is not owner nor minter', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorNFT.connect(user2).mint(
          tokenId,
          user2Addr,
          ERC20Mock2Address,
          tokenData
        )
      ).to.be.revertedWithCustomError(DSponsorNFT, 'UnauthorizedToMint')
    })

    it('Should revert if not enough available amount to spend', async function () {
      await loadFixture(deployFixture)

      const ERC20balanceOfOwner = await ERC20Mock.balanceOf(ownerAddr)
      const ERC20balanceOfUser = await ERC20Mock.balanceOf(userAddr)
      const NFTbalanceOfOwner = await DSponsorNFT.balanceOf(ownerAddr)
      const NFTbalanceOfUser = await DSponsorNFT.balanceOf(userAddr)

      await expect(
        DSponsorNFT.connect(user).mint(tokenId, user, ZERO_ADDRESS, tokenData, {
          value: value - BigInt('1')
        })
      ).to.be.revertedWithCustomError(DSponsorNFT, 'AmountValueTooLow')

      await DSponsorNFT.connect(owner).setDefaultMintPrice(
        ERC20MockAddress,
        true,
        ERC20Amount * ERC20ApproveCapacity + BigInt('1')
      )

      await expect(
        DSponsorNFT.connect(user).mint(
          tokenId,
          user,
          ERC20MockAddress,
          tokenData
        )
      ).to.be.revertedWithCustomError(ERC20Mock, 'ERC20InsufficientAllowance')

      await DSponsorNFT.connect(owner).setDefaultMintPrice(
        ERC20MockAddress,
        true,
        ERC20Amount * ERC20MintCapacity + BigInt('1')
      )
      await ERC20Mock.connect(user).approve(
        DSponsorNFTAddress,
        ERC20Amount * ERC20MintCapacity + BigInt('10')
      )

      await expect(
        DSponsorNFT.connect(user).mint(
          tokenId,
          user,
          ERC20MockAddress,
          tokenData
        )
      ).to.be.revertedWithCustomError(ERC20Mock, 'ERC20InsufficientBalance')

      expect(await ERC20Mock.balanceOf(userAddr)).to.be.equal(
        ERC20balanceOfUser
      )
      expect(await DSponsorNFT.balanceOf(userAddr)).to.be.equal(
        NFTbalanceOfUser
      )

      expect(await ERC20Mock.balanceOf(ownerAddr)).to.be.equal(
        ERC20balanceOfOwner
      )
      expect(await DSponsorNFT.balanceOf(ownerAddr)).to.be.equal(
        NFTbalanceOfOwner
      )
    })

    it('Should revert if arguments are invalid', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorNFT.connect(user).mint(
          tokenId,
          ZERO_ADDRESS,
          ERC20MockAddress,
          tokenData
        )
      ).to.be.revertedWithCustomError(DSponsorNFT, 'CannotBeZeroAddress')

      await expect(
        DSponsorNFT.connect(user).mint(
          tokenId,
          user,
          ERC20Mock2Address,
          tokenData
        )
      )
        .to.be.revertedWithCustomError(DSponsorNFT, 'ForbiddenCurrency')
        .withArgs(ERC20Mock2Address)

      await DSponsorNFT.connect(owner).setDefaultMintPrice(
        ZERO_ADDRESS,
        false,
        value
      )
      await expect(
        DSponsorNFT.connect(user).mint(tokenId, user, ZERO_ADDRESS, tokenData)
      )
        .to.be.revertedWithCustomError(DSponsorNFT, 'ForbiddenCurrency')
        .withArgs(ZERO_ADDRESS)
    })

    it('Should revert if mint with reentrancy attack', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorNFT.connect(user).mint(
          await reentrant.tokenId(),
          reentrantAddress,
          ZERO_ADDRESS,
          tokenData,
          {
            value
          }
        )
      ).to.be.revertedWithCustomError(
        DSponsorNFT,
        'ReentrancyGuardReentrantCall'
      )

      await expect(
        DSponsorNFT.connect(user).mint(
          await reentrant.tokenId(),
          reentrantAddress,
          ERC20MockAddress,
          tokenData
        )
      ).to.be.revertedWithCustomError(
        DSponsorNFT,
        'ReentrancyGuardReentrantCall'
      )
    })

    it('Should revert if number of tokens exceed MAX_SUPPLY value', async function () {
      await loadFixture(deployFixture)

      await ERC20Mock.connect(user).mint(
        userAddr,
        ERC20Amount * ERC20ApproveCapacity * BigInt('40000')
      )

      await ERC20Mock.connect(user).approve(
        DSponsorNFTAddress,
        ERC20Amount * ERC20ApproveCapacity * BigInt('40000')
      )

      for (
        let i = 0;
        BigInt(i.toString()) < BigInt(initParams.maxSupply);
        i++
      ) {
        await DSponsorNFT.connect(user).mint(
          tokenId + i,
          user,
          ERC20MockAddress,
          tokenData
        )
      }

      await expect(
        DSponsorNFT.connect(user).mint(
          BigInt(tokenId.toString()) + BigInt(initParams.maxSupply),
          user,
          ERC20MockAddress,
          tokenData
        )
      ).to.be.revertedWithCustomError(DSponsorNFT, 'MaxSupplyExceeded')
    })
  })

  describe('Owner operations', async function () {
    it('Should revert if owner operation is not called by owner', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorNFT.connect(user2).setBaseURI('baseURI')
      ).to.be.revertedWithCustomError(DSponsorNFT, 'OwnableUnauthorizedAccount')

      await expect(
        DSponsorNFT.connect(user).setContractURI('contractURI')
      ).to.be.revertedWithCustomError(DSponsorNFT, 'OwnableUnauthorizedAccount')

      await expect(
        DSponsorNFT.connect(user3).setDefaultMintPrice(
          ERC20MockAddress,
          true,
          ERC20Amount
        )
      ).to.be.revertedWithCustomError(DSponsorNFT, 'OwnableUnauthorizedAccount')

      await expect(
        // deployer user
        DSponsorNFT.setDefaultMintPrice(ZERO_ADDRESS, true, 100000000)
      ).to.be.revertedWithCustomError(DSponsorNFT, 'OwnableUnauthorizedAccount')

      await expect(
        // deployer user
        DSponsorNFT.setMintPrice(1, ZERO_ADDRESS, true, 100000000)
      ).to.be.revertedWithCustomError(DSponsorNFT, 'OwnableUnauthorizedAccount')

      await expect(
        DSponsorNFT.setRoyalty(user, 100)
      ).to.be.revertedWithCustomError(DSponsorNFT, 'OwnableUnauthorizedAccount')

      await expect(
        DSponsorNFT.connect(user).setTokensAllowlist(true)
      ).to.be.revertedWithCustomError(DSponsorNFT, 'OwnableUnauthorizedAccount')

      await expect(
        DSponsorNFT.connect(user).setTokensAreAllowed([1], [true])
      ).to.be.revertedWithCustomError(DSponsorNFT, 'OwnableUnauthorizedAccount')

      await expect(
        DSponsorNFT.connect(user).setTokenURI(0, 'tokenURI')
      ).to.be.revertedWithCustomError(DSponsorNFT, 'OwnableUnauthorizedAccount')
    })

    it('Should set baseURI, tokenURI & contractURI correctly', async function () {
      await loadFixture(deployFixture)

      const maxSupply = await DSponsorNFT.MAX_SUPPLY()

      const baseURI2 = 'https://baseURI2.com'
      const contractURI2 = 'https://contractURI2.com'
      const tokenURI_0 = 'https://tokenURI_0.com'

      const tokenId = 0

      expect(await DSponsorNFT.tokenURI(tokenId)).to.be.equal(
        `${initParams.baseURI}/${DSponsorNFTAddress}/${tokenId}`
      )

      await DSponsorNFT.connect(owner).setBaseURI(baseURI2)
      expect(await DSponsorNFT.baseURI()).to.be.equal(baseURI2)

      await expect(DSponsorNFT.connect(owner).setContractURI(contractURI2))
        .to.emit(DSponsorNFT, 'ContractURIUpdated(string)')
        .withArgs(contractURI2)
      expect(await DSponsorNFT.contractURI()).to.be.equal(contractURI2)

      expect(await DSponsorNFT.tokenURI(tokenId)).to.be.equal(
        `${baseURI2}/${DSponsorNFTAddress}/${tokenId}`
      )
      await DSponsorNFT.connect(owner).setTokenURI(tokenId, tokenURI_0)
      expect(await DSponsorNFT.tokenURI(tokenId)).to.be.equal(tokenURI_0)

      const tokenId2 = 10000000
      expect(await DSponsorNFT.tokenURI(tokenId2)).to.be.equal(
        `${baseURI2}/${DSponsorNFTAddress}/${tokenId2}`
      )
      await DSponsorNFT.connect(owner).setTokenURIs([tokenId2], [tokenURI_0])
      expect(await DSponsorNFT.tokenURI(tokenId2)).to.be.equal(tokenURI_0)

      await expect(
        DSponsorNFT.connect(owner).setTokenURIs(
          [tokenId2],
          [tokenURI_0, tokenURI_0]
        )
      ).to.revertedWithCustomError(DSponsorNFT, 'InvalidInputLengths')
    })

    it('Should set & get default pricing parameters correctly', async function () {
      await loadFixture(deployFixture)

      expect(
        await DSponsorNFT.getMintPrice(tokenId, ERC20MockAddress)
      ).to.be.deep.equal([true, ERC20Amount])
      expect(
        await DSponsorNFT.getMintPrice(tokenId, ERC20Mock2Address)
      ).to.be.deep.equal([false, 0])
      expect(
        await DSponsorNFT.getMintPrice(tokenId, ZERO_ADDRESS)
      ).to.be.deep.equal([true, value])

      await expect(
        DSponsorNFT.connect(owner).setDefaultMintPrice(
          ZERO_ADDRESS,
          false,
          value
        )
      )
        .to.emit(DSponsorNFT, 'UpdateDefaultMintPrice')
        .withArgs(ZERO_ADDRESS, false, value)

      expect(
        await DSponsorNFT.getMintPrice(tokenId, ZERO_ADDRESS)
      ).to.be.deep.equal([false, value])

      await expect(
        DSponsorNFT.connect(owner).setDefaultMintPrice(
          ERC20Mock2Address,
          true,
          ERC20Amount
        )
      )
        .to.emit(DSponsorNFT, 'UpdateDefaultMintPrice')
        .withArgs(ERC20Mock2Address, true, ERC20Amount)

      expect(
        await DSponsorNFT.getMintPrice(tokenId, ERC20Mock2Address)
      ).to.be.deep.equal([true, ERC20Amount])
    })

    it('Should set & get specific pricing parameters correctly', async function () {
      await loadFixture(deployFixture)

      const newValue = value * BigInt('2')
      const newAmount = ERC20Amount * BigInt('2')

      await expect(
        DSponsorNFT.connect(owner).setMintPrice(
          tokenId,
          ZERO_ADDRESS,
          true,
          newValue
        )
      )
        .to.emit(DSponsorNFT, 'UpdateMintPrice')
        .withArgs(tokenId, ZERO_ADDRESS, true, newValue)

      expect(
        await DSponsorNFT.getMintPrice(tokenId, ZERO_ADDRESS)
      ).to.be.deep.equal([true, newValue])

      await expect(
        DSponsorNFT.connect(owner).setMintPrice(
          tokenId,
          ERC20MockAddress,
          true,
          newAmount
        )
      )
        .to.emit(DSponsorNFT, 'UpdateMintPrice')
        .withArgs(tokenId, ERC20MockAddress, true, newAmount)

      expect(
        await DSponsorNFT.getMintPrice(tokenId, ERC20MockAddress)
      ).to.be.deep.equal([true, newAmount])

      await DSponsorNFT.connect(user).mint(
        tokenId,
        user,
        ERC20MockAddress,
        tokenData
      )

      await expect(
        DSponsorNFT.connect(owner).setMintPrice(
          tokenId,
          ERC20Mock2Address,
          true,
          ERC20Amount
        )
      ).to.be.revertedWithCustomError(DSponsorNFT, 'AlreadyMinted')

      expect(
        await DSponsorNFT.getMintPrice(tokenId, ERC20Mock2Address)
      ).to.be.revertedWithCustomError(DSponsorNFT, 'AlreadyMinted')
    })

    it('Sets royalty correctly', async function () {
      const salePrice = BigInt('100')
      const tokenId = 0

      let expectedRoyalty =
        (salePrice * BigInt(initParams.royaltyBps)) / BigInt('10000')

      expect(
        await DSponsorNFT.royaltyInfo(tokenId, salePrice)
      ).to.be.deep.equal([ownerAddr, expectedRoyalty])

      const newFee = 1000 // 10%
      expectedRoyalty =
        (salePrice * BigInt(newFee.toString())) / BigInt('10000')

      await expect(DSponsorNFT.connect(owner).setRoyalty(user, newFee))
        .to.emit(DSponsorNFT, 'RoyalitiesSet')
        .withArgs(user, newFee)

      expect(
        await DSponsorNFT.royaltyInfo(tokenId, salePrice)
      ).to.be.deep.equal([userAddr, expectedRoyalty])
    })
  })

  describe('ERC2771 Related Functions', function () {
    it('Should set the trusted forwarder correctly', async function () {
      await loadFixture(deployFixture)

      const encodedFunctionData = DSponsorNFT.interface.encodeFunctionData(
        'mint',
        [tokenId, userAddr, ERC20MockAddress, tokenData]
      )

      const forwarder2 = await ethers.deployContract('ERC2771Forwarder', [])
      await forwarder2.waitForDeployment()
      await DSponsorNFT.connect(owner).setTrustedForwarder(
        await forwarder2.getAddress()
      )

      await expect(
        executeByForwarder(
          forwarder,
          DSponsorNFT as BaseContract,
          user,
          encodedFunctionData
        )
      ).to.revertedWithCustomError(forwarder, 'ERC2771UntrustfulTarget')

      await expect(
        executeByForwarder(
          forwarder2,
          DSponsorNFT as BaseContract,
          user,
          encodedFunctionData
        )
      )
        .to.emit(DSponsorNFT, 'Mint')
        .withArgs(
          tokenId,
          userAddr,
          userAddr,
          ERC20MockAddress,
          ERC20Amount,
          tokenData
        )
    })

    it('Should allow a user to mint without gas spent, via the forwarder', async function () {
      await loadFixture(deployFixture)

      const encodedFunctionData = DSponsorNFT.interface.encodeFunctionData(
        'mint',
        [tokenId, userAddr, ERC20MockAddress, tokenData]
      )

      await expect(
        executeByForwarder(
          forwarder,
          DSponsorNFT as BaseContract,
          user,
          encodedFunctionData
        )
      ).to.changeEtherBalance(user, 0)
    })

    it('Should not allow user to send owner operations via the forwarder', async function () {
      await loadFixture(deployFixture)

      const encodedFunctionData = DSponsorNFT.interface.encodeFunctionData(
        'setBaseURI',
        ['baseuriupdated']
      )
      await expect(
        executeByForwarder(forwarder, DSponsorNFT, user, encodedFunctionData)
      ).to.revertedWithCustomError(forwarder, 'FailedInnerCall')
    })
  })
})
