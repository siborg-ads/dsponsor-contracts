import 'dotenv/config'
import fs from 'fs'

import { parseEther, parseUnits } from 'ethers'
import { ethers, run } from 'hardhat'
import { IDSponsorNFTBase } from '../typechain-types/contracts/DSponsorNFTPrivateSales'
import {
  DSPONSOR_ADMIN_ADDR,
  DSPONSOR_FACTORY_ADDR,
  FORWARDER_ADDR,
  USDC_ADDR
} from '../utils/constants'
import { IDSponsorAgreements } from '../typechain-types/contracts/DSponsorAgreements'
import { DSponsorAdmin__factory } from '../typechain-types'

const { ALCHEMY_API_KEY } = process.env

const CRYPTOAST_JOURNAL_DAO_CONTRACT_ADDR =
  '0x0012989E982C2c473e36418384Ab707C72f2B782'
const SNAPSHOT_FILE = './data/cryptoastSnapshot_2024-10-15.json'
const GALAXY_SNAPSHOT_CONTRACT_ADDR = (chainId: string) =>
  chainId === '11155111'
    ? '0x4D546c111Dda413AE8DFbef4340d213966f3d81F'
    : chainId === '8453'
      ? '0x86987569e1B3f03467270884Ae17CB002e3b7456'
      : ''
const GOLD_SNAPSHOT_CONTRACT_ADDR = (chainId: string) =>
  chainId === '11155111'
    ? '0x5117Ab34594360ED5031086874c5401591AFac69'
    : chainId === '8453'
      ? '0xac389a71638709094c3EECB3616a3849C19777Af'
      : ''

const { provider } = ethers

async function snapshot() {
  const ownersResponse = await fetch(
    `https://polygon-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getOwnersForContract?contractAddress=${CRYPTOAST_JOURNAL_DAO_CONTRACT_ADDR}&withTokenBalances=true`,
    { method: 'GET', headers: { accept: 'application/json' } }
  )
  const { owners } = await ownersResponse.json()

  for (let ownerIndex = 0; ownerIndex < owners.length; ownerIndex++) {
    const { tokenBalances } = owners[ownerIndex]
    for (
      let tokenBalanceIndex = 0;
      tokenBalanceIndex < tokenBalances.length;
      tokenBalanceIndex++
    ) {
      const { tokenId, balance } = tokenBalances[tokenBalanceIndex]
      const metadataResponse = await fetch(
        `https://6f375d41f2a33f1f08f6042a65d49ec9.ipfscdn.io/ipfs/bafybeibc2lcjwtwl2urjbpnmrrirzkbu266hdf65nevzap6stoe6qmc3um/${tokenId}.json`,
        { method: 'GET', headers: { accept: 'application/json' } }
      )
      const {
        attributes: [{ value }]
      } = await metadataResponse.json()
      owners[ownerIndex].tokenBalances[tokenBalanceIndex].metadata = value
    }
  }

  const [date] = new Date().toJSON().split('T')
  await fs.writeFileSync(
    `./data/cryptoastSnapshot_${date}.json`,
    JSON.stringify(owners, null, 2)
  )

  console.log(JSON.stringify(owners, null, 2))
}

async function airdrop(attribute: 'Galaxy' | 'Gold') {
  const snapshotData = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'))

  const { name: networkName, chainId: chainIdBigInt } =
    await provider.getNetwork()
  const chainId = chainIdBigInt.toString()

  const [deployer] = await ethers.getSigners()
  const deployerAddr = await deployer.getAddress()
  console.log(
    `Airdropping for ${attribute} attribute - Chain = ${networkName} (chainId: ${chainId}), Deployer = ${deployerAddr}`
  )

  const ERC721EnumerableSnapshot = await ethers.deployContract(
    'ERC721EnumerableSnapshot',
    []
  )

  const ERC721EnumerableSnapshotAddr =
    await ERC721EnumerableSnapshot.getAddress()

  console.log(
    `ERC721EnumerableSnapshot deployed to: ${ERC721EnumerableSnapshotAddr}`
  )

  /*
  const ERC721EnumerableSnapshot = await ethers.getContractAt(
    'ERC721EnumerableSnapshot',
    attribute === 'Galaxy'
      ? SEPOLIA_GALAXY_SNAPSHOT_CONTRACT_ADDR
      : attribute === 'Gold'
        ? SEPOLIA_GOLD_SNAPSHOT_CONTRACT_ADDR
        : ''
  )
  */

  for (let ownerIndex = 0; ownerIndex < snapshotData.length; ownerIndex++) {
    const { ownerAddress, tokenBalances } = snapshotData[ownerIndex]
    for (
      let tokenBalanceIndex = 0;
      tokenBalanceIndex < tokenBalances.length;
      tokenBalanceIndex++
    ) {
      const { tokenId, balance, metadata } = tokenBalances[tokenBalanceIndex]
      if (metadata === attribute) {
        try {
          try {
            await ERC721EnumerableSnapshot.ownerOf(tokenId)
            console.log(
              `Already airdropped ${metadata} to ${ownerAddress} (tokenId = ${tokenId}) `
            )
          } catch (e) {
            await ERC721EnumerableSnapshot.mint(ownerAddress, tokenId)
            console.log(
              `Airdropped ${metadata} to ${ownerAddress} (tokenId = ${tokenId}) `
            )
          }
        } catch (e) {
          console.log(
            `Error airdropping ${metadata} to ${ownerAddress} (tokenId = ${tokenId})`,
            e
          )
        }
      }
    }
  }
}

async function deployOffer() {
  const { name: networkName, chainId: chainIdBigInt } =
    await provider.getNetwork()
  const chainId = chainIdBigInt.toString()

  const [deployer] = await ethers.getSigners()
  const deployerAddr = await deployer.getAddress()

  const DSponsorAdmin = await ethers.getContractAt(
    'DSponsorAdmin',
    DSPONSOR_ADMIN_ADDR[chainId]
  )
  const DSponsorAdminAddress = await DSponsorAdmin.getAddress()

  console.log(
    `Deploying Cryptoast Parcelles to ${networkName} (chainId: ${chainId}) 
    with deployer: ${deployerAddr}, and DSponsorAdmin: ${DSponsorAdminAddress}`
  )

  const maxSupply = 100

  const adParameters: string[] = ['imageURL-1:1']

  const offerInit: IDSponsorAgreements.OfferInitParamsStruct = {
    name: 'Parcelles - Journal Cryptoast #5',
    offerMetadata:
      'https://orange-elegant-swallow-161.mypinata.cloud/ipfs/Qmcdqn4tTQaotcrYiU1JFHZYqQhrn2ksgVhP5p6BsiLXT1',
    options: {
      admins: [deployerAddr],
      validators: [],
      adParameters
    }
  }

  const initDSponsorNFTParams: IDSponsorNFTBase.InitParamsStruct = {
    name: 'Parcelles - Journal Cryptoast #5',
    symbol: 'CP5',
    baseURI: `https://relayer.dsponsor.com/api/${chainId}/tokenMetadata`,
    contractURI:
      'https://orange-elegant-swallow-161.mypinata.cloud/ipfs/QmfDX4TssDU4tZsod3CwuaGSiSv6QtCU7qseBvdfeMrZX5',
    maxSupply,
    minter: DSponsorAdminAddress,
    forwarder: FORWARDER_ADDR[chainId],
    initialOwner: deployerAddr,
    royaltyBps: 500, // 5 %
    currencies: [],
    prices: [],
    allowedTokenIds: []
  }

  const DSponsorNFTImplementation = await ethers.deployContract(
    'DSponsorNFTPrivateSales',
    []
  )
  const DSponsorNFTImplementationAddress =
    await DSponsorNFTImplementation.getAddress()

  console.log(
    'DSponsorNFTImplementation deployed to: ',
    DSponsorNFTImplementationAddress
  )

  const DSponsorNFTFactory = await ethers.deployContract('DSponsorNFTFactory', [
    DSponsorNFTImplementationAddress
  ])

  const DSponsorNFTFactoryAddress = await DSponsorNFTFactory.getAddress()

  console.log('DSponsorNFTFactory deployed to: ', DSponsorNFTFactoryAddress)

  const tx = await DSponsorNFTFactory.createDSponsorNFT(initDSponsorNFTParams)

  console.log('DSponsorNFTFactory.createDSponsorNFT tx hash: ', tx.hash)

  await tx.wait(6)

  if (!tx.hash) throw new Error('No tx hash')
  const receipt = await provider.getTransactionReceipt(tx.hash || '')
  const event = receipt?.logs
    .map((log: any) => DSponsorNFTFactory.interface.parseLog(log))
    .find((e) => e?.name === 'NewDSponsorNFT')
  if (!event) throw new Error('No event')

  const DSponsorNFTAddress = event.args[0].toLowerCase()

  const DSponsorNFT = await ethers.getContractAt(
    'DSponsorNFTPrivateSales',
    DSponsorNFTAddress
  )

  console.log(`DSponsorNFT deployed to: ${DSponsorNFTAddress}`)

  await DSponsorNFT.connect(deployer).setPrivateSaleSettings(
    USDC_ADDR[chainId],
    GOLD_SNAPSHOT_CONTRACT_ADDR(chainId),
    1
  )

  await DSponsorNFT.connect(deployer).setPrivateSaleSettings(
    '0x0000000000000000000000000000000000000000',
    GALAXY_SNAPSHOT_CONTRACT_ADDR(chainId),
    1
  )

  console.log('Private sale settings set')

  await DSponsorAdmin.createOffer(DSponsorNFTAddress, offerInit)

  console.log('Offer created')

  await DSponsorNFT.connect(deployer).setDefaultMintPrice(
    USDC_ADDR[chainId],
    true,
    parseUnits('25', 6)
  )

  await DSponsorNFT.connect(deployer).setDefaultMintPrice(
    '0x0000000000000000000000000000000000000000',
    true,
    0
  )

  console.log('Default mint prices set')

  await DSponsorNFT.setTokensAllowlist(true)

  await DSponsorNFT.setTokensAreAllowed(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    [true, true, true, true, true, true, true, true, true, true]
  )
  console.log('Tokens are allowed set from 1 to 10')
  await DSponsorNFT.setTokensAreAllowed(
    [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    [true, true, true, true, true, true, true, true, true, true]
  )
  console.log('Tokens are allowed set from 11 to 20')
  await DSponsorNFT.setTokensAreAllowed(
    [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    [true, true, true, true, true, true, true, true, true, true]
  )
  console.log('Tokens are allowed set from 21 to 30')
  await DSponsorNFT.setTokensAreAllowed(
    [31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
    [true, true, true, true, true, true, true, true, true, true]
  )
  console.log('Tokens are allowed set from 31 to 40')
  await DSponsorNFT.setTokensAreAllowed(
    [41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
    [true, true, true, true, true, true, true, true, true, true]
  )
  console.log('Tokens are allowed set from 41 to 50')
  await DSponsorNFT.setTokensAreAllowed(
    [51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
    [true, true, true, true, true, true, true, true, true, true]
  )
  console.log('Tokens are allowed set from 51 to 60')
  await DSponsorNFT.setTokensAreAllowed(
    [61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
    [true, true, true, true, true, true, true, true, true, true]
  )
  console.log('Tokens are allowed set from 61 to 70')
  await DSponsorNFT.setTokensAreAllowed(
    [71, 72, 73, 74, 75, 76, 77, 78, 79, 80],
    [true, true, true, true, true, true, true, true, true, true]
  )
  console.log('Tokens are allowed set from 71 to 80')
  await DSponsorNFT.setTokensAreAllowed(
    [81, 82, 83, 84, 85, 86, 87, 88, 89, 90],
    [true, true, true, true, true, true, true, true, true, true]
  )
  console.log('Tokens are allowed set from 81 to 90')
  await DSponsorNFT.setTokensAreAllowed(
    [91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
    [true, true, true, true, true, true, true, true, true, true]
  )
  console.log('Tokens are allowed set from 91 to 100')
}

deployOffer().catch(console.error)
