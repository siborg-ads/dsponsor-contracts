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
  DSponsorNFTPrivateSales,
  DSponsorNFTFactory,
  ERC20Mock,
  ERC721Mock,
  ReentrantDSponsorNFT,
  ERC2771Forwarder
} from '../typechain-types'
import { IDSponsorNFTBase } from '../typechain-types/contracts/DSponsorNFT'

import { ZERO_ADDRESS } from '../utils/constants'
import { erc721 } from '../typechain-types/@openzeppelin/contracts/token'

describe('DSponsorNFTPrivateSales', function () {
  const provider = ethers.provider

  let DSponsorNFTFactory: DSponsorNFTFactory
  let DSponsorNFTImplementation: DSponsorNFTPrivateSales
  let DSponsorNFTImplementationAddress: string
  let DSponsorNFT: DSponsorNFTPrivateSales
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
  const etherValue: string = '0'
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
      'DSponsorNFTPrivateSales',
      []
    )
    DSponsorNFTImplementationAddress =
      await DSponsorNFTImplementation.getAddress()

    DSponsorNFTFactory = await ethers.deployContract('DSponsorNFTFactory', [
      DSponsorNFTImplementationAddress
    ])

    initParams = {
      name: 'DSponsorNFTPrivateSales',
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
      'DSponsorNFTPrivateSales',
      DSponsorNFTAddress
    )

    await ERC20Mock.connect(minter).approve(
      DSponsorNFTAddress,
      ERC20Amount * ERC20ApproveCapacity
    )

    await DSponsorNFT.connect(owner).setPrivateSaleSettings(
      ERC20MockAddress,
      ERC721MockAddress,
      1
    )

    await DSponsorNFT.connect(owner).setPrivateSaleSettings(
      ZERO_ADDRESS,
      ERC721Mock2Address,
      1
    )
  }

  describe('DSponsorNFTPrivateSales Minting', async function () {
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
        .withArgs(
          tokenId,
          minterAddr,
          userAddr,
          ERC20MockAddress,
          ERC20Amount,
          tokenData
        )

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
          ERC20Amount,
          tokenData
        )

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId + 2,
          user3Addr,
          ERC20MockAddress,
          tokenData
        )
      ).to.revertedWithCustomError(DSponsorNFT, 'ForbiddenCurrency')

      expect(await ERC20Mock.balanceOf(ownerAddr)).to.be.equal(
        ERC20balanceOfOwner + ERC20Amount * BigInt('2')
      )

      expect(await DSponsorNFT.balanceOf(ownerAddr)).to.be.equal(BigInt('0'))
      expect(await DSponsorNFT.balanceOf(userAddr)).to.be.equal(BigInt('1'))
      expect(await DSponsorNFT.balanceOf(user2Addr)).to.be.equal(BigInt('1'))
      expect(await DSponsorNFT.balanceOf(user3Addr)).to.be.equal(BigInt('0'))

      expect(await DSponsorNFT.totalSupply()).to.be.equal(2)
    })

    it('Should mint with native currency', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId,
          userAddr,
          ZERO_ADDRESS,
          tokenData,
          { value }
        )
      ).to.changeEtherBalances([minterAddr, ownerAddr], [-value, value])

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId + 1,
          user2Addr,
          ZERO_ADDRESS,
          tokenData,
          { value }
        )
      ).to.revertedWithCustomError(DSponsorNFT, 'ForbiddenCurrency')
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
        DSponsorNFT.connect(minter).mint(
          tokenId,
          user2,
          ERC20MockAddress,
          tokenData
        )
      ).to.changeTokenBalance(ERC20Mock, minter, -newAmount)

      await DSponsorNFT.connect(owner).setMintPrice(
        tokenId + 1,
        ZERO_ADDRESS,
        true,
        newValue
      )

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId + 1,
          user,
          ZERO_ADDRESS,
          tokenData,
          { value: newValue }
        )
      ).to.changeEtherBalance(minter, -newValue)

      // check default minting price still ok
      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId + 2,
          user,
          ERC20MockAddress,
          tokenData
        )
      ).to.changeTokenBalance(ERC20Mock, minter, -ERC20Amount)

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId + 3,
          user,
          ZERO_ADDRESS,
          tokenData,
          { value: value }
        )
      ).to.changeEtherBalance(minter, -value)
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

      await DSponsorNFT.connect(owner).setDefaultMintPrice(
        ERC20MockAddress,
        true,
        ERC20Amount * ERC20MintCapacity * BigInt('2')
      )

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId,
          user,
          ERC20MockAddress,
          tokenData
        )
      ).to.be.revertedWithCustomError(ERC20Mock, 'ERC20InsufficientAllowance')

      await ERC20Mock.connect(minter).approve(
        DSponsorNFTAddress,
        ERC20Amount * ERC20MintCapacity * BigInt('2')
      )

      await expect(
        DSponsorNFT.connect(minter).mint(
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
        DSponsorNFT.connect(minter).mint(
          tokenId,
          ZERO_ADDRESS,
          ERC20MockAddress,
          tokenData
        )
      ).to.be.revertedWithCustomError(DSponsorNFT, 'CannotBeZeroAddress')

      await expect(
        DSponsorNFT.connect(minter).mint(
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
        DSponsorNFT.connect(minter).mint(tokenId, user, ZERO_ADDRESS, tokenData)
      )
        .to.be.revertedWithCustomError(DSponsorNFT, 'ForbiddenCurrency')
        .withArgs(ZERO_ADDRESS)
    })

    it('Should revert if number of tokens exceed MAX_SUPPLY value', async function () {
      await loadFixture(deployFixture)

      await ERC20Mock.connect(minter).mint(
        minter,
        ERC20Amount * ERC20MintCapacity * BigInt('40000')
      )

      await ERC20Mock.connect(minter).approve(
        DSponsorNFTAddress,
        ERC20Amount * ERC20MintCapacity * BigInt('40000')
      )

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId,
          user2,
          ERC20MockAddress,
          tokenData
        )
      )
        .to.emit(DSponsorNFT, 'Mint')
        .withArgs(
          tokenId,
          minter,
          user2,
          ERC20MockAddress,
          ERC20Amount,
          tokenData
        )

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId + 1,
          user2,
          ERC20MockAddress,
          tokenData
        )
      ).to.be.revertedWithCustomError(DSponsorNFT, 'ForbiddenCurrency')

      await DSponsorNFT.connect(owner).setPrivateSaleSettings(
        ERC20MockAddress,
        ZERO_ADDRESS,
        1
      )

      for (
        let i = 1;
        BigInt(i.toString()) < BigInt(initParams.maxSupply);
        i++
      ) {
        await expect(
          DSponsorNFT.connect(minter).mint(
            tokenId + i,
            user2,
            ERC20MockAddress,
            tokenData
          )
        )
          .to.emit(DSponsorNFT, 'Mint')
          .withArgs(
            tokenId + i,
            minter,
            user2,
            ERC20MockAddress,
            ERC20Amount,
            tokenData
          )
      }

      await expect(
        DSponsorNFT.connect(minter).mint(
          BigInt(tokenId.toString()) + BigInt(initParams.maxSupply),
          user,
          ERC20MockAddress,
          tokenData
        )
      ).to.be.revertedWithCustomError(DSponsorNFT, 'MaxSupplyExceeded')
    })

    it('Should enable multiple private sale mints', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId,
          userAddr,
          ERC20MockAddress,
          tokenData
        )
      )
        .to.emit(DSponsorNFT, 'Mint')
        .withArgs(
          tokenId,
          minterAddr,
          userAddr,
          ERC20MockAddress,
          ERC20Amount,
          tokenData
        )

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId + 1,
          userAddr,
          ERC20MockAddress,
          tokenData
        )
      ).to.be.revertedWithCustomError(DSponsorNFT, 'ForbiddenCurrency')

      await expect(
        DSponsorNFT.connect(owner).setPrivateSaleSettings(
          ERC20MockAddress,
          ZERO_ADDRESS,
          0
        )
      )
        .to.emit(DSponsorNFT, 'PrivateSaleSettingsUpdated')
        .withArgs(ERC20MockAddress, ZERO_ADDRESS, 0)

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId + 1,
          userAddr,
          ERC20MockAddress,
          tokenData
        )
      )
        .to.emit(DSponsorNFT, 'Mint')
        .withArgs(
          tokenId + 1,
          minterAddr,
          userAddr,
          ERC20MockAddress,
          ERC20Amount,
          tokenData
        )

      await expect(
        DSponsorNFT.connect(owner).setPrivateSaleSettings(
          ERC20MockAddress,
          ERC721MockAddress,
          2
        )
      )
        .to.emit(DSponsorNFT, 'PrivateSaleSettingsUpdated')
        .withArgs(ERC20MockAddress, ERC721MockAddress, 2)

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId + 2,
          userAddr,
          ERC20MockAddress,
          tokenData
        )
      )
        .to.emit(DSponsorNFT, 'Mint')
        .withArgs(
          tokenId + 2,
          minterAddr,
          userAddr,
          ERC20MockAddress,
          ERC20Amount,
          tokenData
        )

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId + 3,
          userAddr,
          ERC20MockAddress,
          tokenData
        )
      ).to.be.revertedWithCustomError(DSponsorNFT, 'ForbiddenCurrency')

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId + 3,
          userAddr,
          ZERO_ADDRESS,
          tokenData
        )
      )
        .to.emit(DSponsorNFT, 'Mint')
        .withArgs(
          tokenId + 3,
          minterAddr,
          userAddr,
          ZERO_ADDRESS,
          value,
          tokenData
        )

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId + 4,
          userAddr,
          ZERO_ADDRESS,
          tokenData
        )
      )
        .to.emit(DSponsorNFT, 'Mint')
        .withArgs(
          tokenId + 4,
          minterAddr,
          userAddr,
          ZERO_ADDRESS,
          value,
          tokenData
        )

      await expect(
        DSponsorNFT.connect(minter).mint(
          tokenId + 5,
          userAddr,
          ZERO_ADDRESS,
          tokenData
        )
      ).to.be.revertedWithCustomError(DSponsorNFT, 'ForbiddenCurrency')
    })
  })

  describe('Extended owner operations', async function () {
    it('Should revert if owner operation is not called by owner', async function () {
      await loadFixture(deployFixture)

      await expect(
        DSponsorNFT.connect(minter).setDefaultMintPrice(ZERO_ADDRESS, true, 0)
      ).to.be.revertedWithCustomError(DSponsorNFT, 'OwnableUnauthorizedAccount')
    })

    it('Should set & get default pricing parameters for eligible contracts', async function () {
      await loadFixture(deployFixture)

      expect(
        await DSponsorNFT.getMintPriceForUser(
          userAddr,
          tokenId,
          ERC20MockAddress
        )
      ).to.be.deep.equal([ERC721MockAddress, 1, true, ERC20Amount])

      expect(
        await DSponsorNFT.getMintPriceForUser(
          user2Addr,
          tokenId,
          ERC20MockAddress
        )
      ).to.be.deep.equal([ERC721MockAddress, 2, true, ERC20Amount])

      expect(
        await DSponsorNFT.getMintPriceForUser(
          user3Addr,
          tokenId,
          ERC20MockAddress
        )
      ).to.be.deep.equal([ERC721MockAddress, 0, false, ERC20Amount])

      expect(
        await DSponsorNFT.getMintPriceForUser(userAddr, tokenId, ZERO_ADDRESS)
      ).to.be.deep.equal([ERC721Mock2Address, 1, true, value])

      expect(
        await DSponsorNFT.getMintPriceForUser(user2Addr, tokenId, ZERO_ADDRESS)
      ).to.be.deep.equal([ERC721Mock2Address, 0, false, value])

      expect(
        await DSponsorNFT.getMintPriceForUser(user3Addr, tokenId, ZERO_ADDRESS)
      ).to.be.deep.equal([ERC721Mock2Address, 0, false, value])

      await expect(
        DSponsorNFT.connect(owner).setPrivateSaleSettings(
          ERC20MockAddress,
          ZERO_ADDRESS,
          0
        )
      )
        .to.emit(DSponsorNFT, 'PrivateSaleSettingsUpdated')
        .withArgs(ERC20MockAddress, ZERO_ADDRESS, 0)

      expect(
        await DSponsorNFT.getMintPriceForUser(
          user3Addr,
          tokenId,
          ERC20MockAddress
        )
      ).to.be.deep.equal([ZERO_ADDRESS, 0, true, ERC20Amount])
    })
  })
})
