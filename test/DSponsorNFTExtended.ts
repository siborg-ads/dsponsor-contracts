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
  DSponsorNFTExtended,
  DSponsorNFTFactory,
  ERC20Mock,
  ERC721Mock,
  ReentrantDSponsorNFT,
  ERC2771Forwarder
} from '../typechain-types'
import { IDSponsorNFTBase } from '../typechain-types/contracts/DSponsorNFT'

import { ZERO_ADDRESS } from '../utils/constants'
import { erc721 } from '../typechain-types/@openzeppelin/contracts/token'

describe('DSponsorNFTExtended', function () {
  const provider = ethers.provider

  let DSponsorNFTFactory: DSponsorNFTFactory
  let DSponsorNFTImplementation: DSponsorNFTExtended
  let DSponsorNFTImplementationAddress: string
  let DSponsorNFT: DSponsorNFTExtended
  let DSponsorNFTAddress: string
  let ERC20Mock: ERC20Mock
  let ERC20MockAddress: string
  let ERC20Mock2: ERC20Mock
  let ERC20Mock2Address: string
  let ERC721Mock: ERC721Mock
  let ERC721MockAddress: string
  let ERC721Mock2: ERC721Mock
  let ERC721Mock2Address: string
  let forwarder: ERC2771Forwarder
  let forwarderAddress: string
  let reentrant: ReentrantDSponsorNFT
  let reentrantAddress: string

  let signers: Signer[]
  let deployer: Signer
  let deployerAddr: string
  let owner: Signer
  let ownerAddr: string
  let minter: Signer
  let minterAddr: string
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
    ;[deployer, owner, minter, user, user2, user3] = signers

    deployerAddr = await deployer.getAddress()
    ownerAddr = await owner.getAddress()
    minterAddr = await minter.getAddress()
    userAddr = await user.getAddress()
    user2Addr = await user2.getAddress()
    user3Addr = await user3.getAddress()

    const forwarderFactory = await ethers.getContractFactory('ERC2771Forwarder')
    forwarder = await forwarderFactory.deploy('ERC2771Forwarder')
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
    await ERC721Mock.connect(user).mint(1)
    await ERC721Mock.connect(user2).mint(2)

    ERC721Mock2 = await ethers.deployContract('ERC721Mock', [])
    await ERC721Mock2.waitForDeployment()
    ERC721Mock2Address = await ERC721Mock2.getAddress()
    await ERC721Mock2.connect(user).mint(1)
    await ERC721Mock2.connect(user).mint(11)

    reentrant = await ethers.deployContract('ReentrantDSponsorNFT', [])
    await reentrant.waitForDeployment()
    reentrantAddress = await reentrant.getAddress()

    DSponsorNFTImplementation = await ethers.deployContract(
      'DSponsorNFTExtended',
      []
    )
    DSponsorNFTImplementationAddress =
      await DSponsorNFTImplementation.getAddress()

    DSponsorNFTFactory = await ethers.deployContract('DSponsorNFTFactory', [
      DSponsorNFTImplementationAddress
    ])

    initParams = {
      name: 'DSponsorNFTExtended',
      symbol: 'DSNFT',
      baseURI: 'https://baseURI.com',
      contractURI: 'https://contractURI.com',
      maxSupply: BigInt('5'),
      minter: minterAddr,
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
    DSponsorNFT = await ethers.getContractAt(
      'DSponsorNFTExtended',
      DSponsorNFTAddress
    )

    await ERC20Mock.connect(minter).approve(
      DSponsorNFTAddress,
      ERC20Amount * ERC20ApproveCapacity
    )

    await DSponsorNFT.connect(owner).setMintPriceForTokenHolders(
      ERC721MockAddress,
      true,
      1,
      0,
      ERC20MockAddress,
      true,
      ERC20Amount / BigInt('2')
    )

    await DSponsorNFT.connect(owner).setMintPriceForTokenHolders(
      ERC721Mock2Address,
      true,
      1,
      0,
      ERC20MockAddress,
      true,
      0
    )

    await DSponsorNFT.connect(owner).setMintPriceForTokenHolders(
      ERC721MockAddress,
      true,
      1,
      0,
      ZERO_ADDRESS,
      true,
      value / BigInt('2')
    )

    await DSponsorNFT.connect(owner).setMintPriceForTokenHolders(
      ERC721Mock2Address,
      true,
      1,
      0,
      ZERO_ADDRESS,
      true,
      0
    )
  }

  describe('DSponsorNFT Minting', async function () {
    it('Should mint with ERC20 currency', async function () {
      await loadFixture(deployFixture)

      const ERC20balanceOfOwner = await ERC20Mock.balanceOf(ownerAddr)

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId,
          userAddr,
          ERC20MockAddress,
          tokenData
        )
      )
        .to.emit(DSponsorNFT, 'Mint')
        .withArgs(tokenId, minterAddr, userAddr, ERC20MockAddress, 0, tokenData)

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId + 1,
          user2Addr,
          ERC20MockAddress,
          tokenData
        )
      )
        .to.emit(DSponsorNFT, 'Mint')
        .withArgs(
          tokenId + 1,
          minter,
          user2Addr,
          ERC20MockAddress,
          ERC20Amount / BigInt('2'),
          tokenData
        )

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId + 2,
          user3Addr,
          ERC20MockAddress,
          tokenData
        )
      )
        .to.emit(DSponsorNFT, 'Mint')
        .withArgs(
          tokenId + 2,
          minterAddr,
          user3Addr,
          ERC20MockAddress,
          ERC20Amount,
          tokenData
        )

      expect(await ERC20Mock.balanceOf(ownerAddr)).to.be.equal(
        ERC20balanceOfOwner + ERC20Amount + ERC20Amount / BigInt('2')
      )

      expect(await DSponsorNFT.balanceOf(ownerAddr)).to.be.equal(BigInt('0'))
      expect(await DSponsorNFT.balanceOf(userAddr)).to.be.equal(BigInt('1'))
      expect(await DSponsorNFT.balanceOf(user2Addr)).to.be.equal(BigInt('1'))
      expect(await DSponsorNFT.balanceOf(user3Addr)).to.be.equal(BigInt('1'))

      expect(await DSponsorNFT.totalSupply()).to.be.equal(3)
    })

    it('Should mint with native currency', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorNFT.connect(user).mint(
          tokenId,
          user2Addr,
          ZERO_ADDRESS,
          tokenData
        )
      ).to.changeEtherBalances([userAddr, ownerAddr], [0, 0])

      await expect(
        DSponsorNFT.connect(user2).mint(
          tokenId + 1,
          user2Addr,
          ZERO_ADDRESS,
          tokenData,
          { value }
        )
      ).to.changeTokenBalances(DSponsorNFT, [user2Addr, ownerAddr], [1, 0])
    })
    /*
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
      */
  })

  describe('Extended owner operations', async function () {
    it('Should revert if owner operation is not called by owner', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorNFT.connect(user).setMintPriceForTokenHolders(
          ERC721MockAddress,
          true,
          1,
          0,
          ERC20Mock2Address,
          true,
          ERC20Amount
        )
      ).to.be.revertedWithCustomError(DSponsorNFT, 'OwnableUnauthorizedAccount')

      await expect(
        DSponsorNFT.connect(user2).setOnlyFromEligibleContracts(false)
      ).to.be.revertedWithCustomError(DSponsorNFT, 'OwnableUnauthorizedAccount')
    })

    it('Should update eligible contracts flag restrictions accordingly', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorNFT.connect(owner).setOnlyFromEligibleContracts(true)
      )
        .to.emit(DSponsorNFT, 'OnlyFromEligibleContractsUpdated')
        .withArgs(true)

      expect(await DSponsorNFT.onlyFromEligibleContracts()).to.be.equal(true)

      await expect(
        DSponsorNFT.connect(owner).setOnlyFromEligibleContracts(false)
      )
        .to.emit(DSponsorNFT, 'OnlyFromEligibleContractsUpdated')
        .withArgs(false)

      expect(await DSponsorNFT.onlyFromEligibleContracts()).to.be.equal(false)
    })

    it('Should set & get default pricing parameters for eligible contracts', async function () {
      await loadFixture(deployFixture)

      expect(
        await DSponsorNFT.getMintPriceFromEligibleContracts(
          userAddr,
          tokenId,
          ERC20MockAddress
        )
      ).to.be.deep.equal([ERC721Mock2Address, 1, true, 0])

      expect(
        await DSponsorNFT.getMintPriceFromEligibleContracts(
          user2Addr,
          tokenId,
          ERC20MockAddress
        )
      ).to.be.deep.equal([
        ERC721MockAddress,
        2,
        true,
        ERC20Amount / BigInt('2')
      ])

      expect(
        await DSponsorNFT.getMintPriceFromEligibleContracts(
          user3Addr,
          tokenId,
          ERC20MockAddress
        )
      ).to.be.deep.equal([ZERO_ADDRESS, 0, true, ERC20Amount])

      expect(
        await DSponsorNFT.getMintPriceFromEligibleContracts(
          userAddr,
          tokenId,
          ZERO_ADDRESS
        )
      ).to.be.deep.equal([ERC721Mock2Address, 1, true, 0])

      expect(
        await DSponsorNFT.getMintPriceFromEligibleContracts(
          user2Addr,
          tokenId,
          ZERO_ADDRESS
        )
      ).to.be.deep.equal([ERC721MockAddress, 2, true, value / BigInt('2')])

      expect(
        await DSponsorNFT.getMintPriceFromEligibleContracts(
          user3Addr,
          tokenId,
          ZERO_ADDRESS
        )
      ).to.be.deep.equal([ZERO_ADDRESS, 0, true, value])

      expect(
        await DSponsorNFT.getMintPriceFromEligibleContracts(
          userAddr,
          tokenId,
          ERC20Mock2Address
        )
      ).to.be.deep.equal([ZERO_ADDRESS, 0, false, 0])

      expect(
        await DSponsorNFT.getMintPriceFromEligibleContracts(
          user2Addr,
          tokenId,
          ERC20Mock2Address
        )
      ).to.be.deep.equal([ZERO_ADDRESS, 0, false, 0])

      expect(
        await DSponsorNFT.getMintPriceFromEligibleContracts(
          user3Addr,
          tokenId,
          ERC20Mock2Address
        )
      ).to.be.deep.equal([ZERO_ADDRESS, 0, false, 0])

      await expect(
        DSponsorNFT.connect(owner).setMintPriceForTokenHolders(
          ERC721Mock2Address,
          true,
          1,
          0,
          ZERO_ADDRESS,
          false,
          0
        )
      )
        .to.emit(DSponsorNFT, 'SpecialMintPriceUpdated')
        .withArgs(ERC721Mock2Address, true, 1, 0, ZERO_ADDRESS, false, 0)

      expect(
        await DSponsorNFT.getMintPriceFromEligibleContracts(
          userAddr,
          tokenId,
          ZERO_ADDRESS
        )
      ).to.be.deep.equal([ERC721MockAddress, 1, true, value / BigInt('2')])
    })

    it('Should set & get specific pricing parameters for eligible contracts', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorNFT.connect(owner).setMintPriceForTokenHolders(
          ERC721MockAddress,
          false,
          1,
          tokenId,
          ZERO_ADDRESS,
          true,
          0
        )
      )
        .to.emit(DSponsorNFT, 'SpecialMintPriceUpdated')
        .withArgs(ERC721MockAddress, false, 1, tokenId, ZERO_ADDRESS, true, 0)

      expect(
        await DSponsorNFT.getMintPriceFromEligibleContracts(
          user2Addr,
          tokenId + 1,
          ZERO_ADDRESS
        )
      ).to.be.deep.equal([ERC721MockAddress, 2, true, value / BigInt('2')])

      expect(
        await DSponsorNFT.getMintPriceFromEligibleContracts(
          user2Addr,
          tokenId,
          ZERO_ADDRESS
        )
      ).to.be.deep.equal([ERC721MockAddress, 2, true, 0])

      await expect(
        DSponsorNFT.connect(owner).setMintPriceForTokenHolders(
          ERC721MockAddress,
          false,
          1,
          tokenId,
          ERC20MockAddress,
          true,
          0
        )
      )
        .to.emit(DSponsorNFT, 'SpecialMintPriceUpdated')
        .withArgs(
          ERC721MockAddress,
          false,
          1,
          tokenId,
          ERC20MockAddress,
          true,
          0
        )

      expect(
        await DSponsorNFT.getMintPriceFromEligibleContracts(
          user2Addr,
          tokenId + 1,
          ERC20MockAddress
        )
      ).to.be.deep.equal([
        ERC721MockAddress,
        2,
        true,
        ERC20Amount / BigInt('2')
      ])

      expect(
        await DSponsorNFT.getMintPriceFromEligibleContracts(
          user2Addr,
          tokenId,
          ERC20MockAddress
        )
      ).to.be.deep.equal([ERC721MockAddress, 2, true, 0])
    })
  })
})
