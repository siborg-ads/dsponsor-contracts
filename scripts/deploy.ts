import 'dotenv/config'
import { parseEther } from 'ethers'
import { ethers, run } from 'hardhat'
import { IDSponsorAgreements } from '../typechain-types'
import { IDSponsorNFTBase } from '../typechain-types/contracts/DSponsorNFT'
import {
  FORWARDER_ADDR,
  SWAP_ROUTER_ADDR,
  TREASURY_ADDR,
  USDC_ADDR,
  WETH_ADDR,
  ZERO_ADDRESS
} from '../utils/constants'
import { stringToUint256 } from '../utils/convert'

/***************************************
 * CONFIGURATION
 ***************************************/

const PROTOCOL_FEE_BPS = 400

// if offer already deployed
let offerId: number
let DSponsorNFTAddress: string

/***************************************
 * CONSTANTS & GLOBAL VARIABLES
 ***************************************/

const LISTING_TYPE_DIRECT = 0
const LISTING_TYPE_AUCTION = 1
const TRANSFER_TYPE_RENT = 0
const TRANSFER_TYPE_SALE = 1

const UINT256_MAX = BigInt(
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'
)

let deployerAddr: string
let chainId: string
let DSponsorNFTImplementationAddr: string
let DSponsorNFTFactoryAddr: string
let DSponsorAdminAddr: string
let DSponsorMarketplaceAddr: string
let DSponsorAdminArgs: (string | number)[]
let DSponsorMarketplaceArgs: (string | number)[]

const { provider } = ethers

const now = async (): Promise<bigint> => {
  const lastBlock = await provider.getBlock('latest')
  if (!lastBlock?.timestamp) throw new Error('No timestamp fetched')
  return BigInt(lastBlock.timestamp.toString())
}

async function deployContracts() {
  const { name: networkName, chainId: chainIdBigInt } =
    await provider.getNetwork()
  chainId = chainIdBigInt.toString()

  const [deployer] = await ethers.getSigners()
  deployerAddr = await deployer.getAddress()
  console.log(
    `Deploying to ${networkName} (chainId: ${chainId}) with deployer: ${deployerAddr}`
  )

  const DSponsorNFTImplementation = await ethers.deployContract(
    'DSponsorNFT',
    []
  )
  DSponsorNFTImplementationAddr = await DSponsorNFTImplementation.getAddress()
  console.log(
    'DSponsorNFTImplementation deployed to:',
    DSponsorNFTImplementationAddr
  )

  const DSponsorNFTFactory = await ethers.deployContract('DSponsorNFTFactory', [
    DSponsorNFTImplementationAddr
  ])
  DSponsorNFTFactoryAddr = await DSponsorNFTFactory.getAddress()
  console.log('DSponsorNFTFactory deployed to:', DSponsorNFTFactoryAddr)

  DSponsorAdminArgs = [
    DSponsorNFTFactoryAddr,
    FORWARDER_ADDR[chainId],
    deployerAddr,
    SWAP_ROUTER_ADDR[chainId],
    TREASURY_ADDR[chainId],
    PROTOCOL_FEE_BPS
  ]

  const DSponsorAdmin = await ethers.deployContract(
    'DSponsorAdmin',
    DSponsorAdminArgs
  )
  DSponsorAdminAddr = await DSponsorAdmin.getAddress()
  console.log(
    'DSponsorAdmin deployed to:',
    DSponsorAdminAddr,
    ' with args: ',
    DSponsorAdminArgs
  )

  DSponsorMarketplaceArgs = [
    FORWARDER_ADDR[chainId],
    deployerAddr,
    SWAP_ROUTER_ADDR[chainId],
    TREASURY_ADDR[chainId],
    PROTOCOL_FEE_BPS
  ]

  const DSponsorMarketplace = await ethers.deployContract(
    'DSponsorMarketplace',
    DSponsorMarketplaceArgs
  )

  DSponsorMarketplaceAddr = await DSponsorMarketplace.getAddress()
  console.log(
    'DSponsorMarketplace deployed to:',
    DSponsorMarketplaceAddr,
    ' with args: ',
    DSponsorMarketplaceArgs
  )
}

async function deploySiBorgOffer() {
  const defaultMintPriceUSDC = BigInt((30 * 10 ** 6).toString()) // 30 USDC

  const name = 'SiBorg Ads'

  const contractURI =
    'https://orange-elegant-swallow-161.mypinata.cloud/ipfs/QmaBBHP3Nc8DNN9GPQHQkLTVJhct61fLsGSEWkFch4zGiy'

  const offerMetadataURI =
    'https://orange-elegant-swallow-161.mypinata.cloud/ipfs/QmbYWE9qVJhppZTVEGzWuKRUqJR395AUSdvBY8kGERF8ZW'

  const adParameters: string[] = [
    'linkURL',
    'imageURL-5:1',
    'xCreatorHandle',
    'xSpaceId'
  ]

  const specificTokens = [
    {
      tokenData: 'Bitcoin',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'XRP',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Tether',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'BNB',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Solana',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Stablecoin',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Depeg',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Cryptocurrency',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Blockchain',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Web3',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Immutable',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'SwissBorg',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Bittensor',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Optimism',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Arbitrum',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Podcast',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Doland Tremp',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Borpa',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'ZK',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Layer',
      startTime: 1719327600,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'NFT',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Decentralized',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Wallet',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Smart contract',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Ethereum',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'USDC',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Mining',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Dogecoin',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Toncoin',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Cardano',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Cryptography',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Sybil',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Fork',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Scalability',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Governance',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'ZRO',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'DePin',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: '1inch',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Aave',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'party',
      startTime: 1719414000,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Token',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Altcoin',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'memecoin',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Exchange',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Digital Asset',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },

    {
      tokenData: 'Avalanche',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Shiba',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Tron',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Polkadot',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Near',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },

    {
      tokenData: 'Halving',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Whitepaper',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Yield Farming',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Staking',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'IPFS',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'news',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'airdrop',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'season',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'pudgy',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'punks',
      startTime: 1719500400,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'ICO',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Dapp',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'DAO',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Consensus',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Hash',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Polygon',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'alpha',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Litecoin',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'DAI',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Uniswap',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Oracle',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Cross-chain',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Interoperability',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Ordinals',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'dogwifhat',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'rekt',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'SocialFi',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Symbiotic',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Restaking',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'GameFi',
      startTime: 1719586800,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Proof of work',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Proof of stake',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Solidity',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Metaverse',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Gas',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Hedera',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Aptos',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Render',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Cosmos',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'PEPE',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Cronos',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Mantle',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'The Graph',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Filecoin',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Stacks',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Bonk',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Borg',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Degen',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Bonsai',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    },
    {
      tokenData: 'Pointless',
      startTime: 1719673200,
      secondsUntilEndTime: 86400,
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.06'),
      buyoutPricePerToken: parseEther('100'),
      transferType: 1,
      rentalExpirationTimestamp: 2678400,
      listingType: 1
    }
  ]

  // const [deployer] = await ethers.getSigners()

  const DSponsorAdmin = await ethers.getContractAt(
    'DSponsorAdmin',
    DSponsorAdminAddr
  )
  const DSponsorNFTFactory = await ethers.getContractAt(
    'DSponsorNFTFactory',
    DSponsorNFTFactoryAddr
  )
  const DSponsorMarketplace = await ethers.getContractAt(
    'DSponsorMarketplace',
    DSponsorMarketplaceAddr
  )

  if (!offerId && !DSponsorNFTAddress) {
    const offerOptions: IDSponsorAgreements.OfferOptionsStruct = {
      admins: [deployerAddr],
      validators: [],
      adParameters
    }

    const offerInit: IDSponsorAgreements.OfferInitParamsStruct = {
      name: 'SiBorg Ads',
      offerMetadata: offerMetadataURI,
      options: offerOptions
    }

    const initDSponsorNFTParams: IDSponsorNFTBase.InitParamsStruct = {
      name,
      symbol: 'DSNFT-SIBORG',
      baseURI: `https://relayer.dsponsor.com/api/${chainId}/tokenMetadata`,
      contractURI,
      maxSupply: UINT256_MAX,
      minter: deployerAddr, // will be replaced by DSponsorAdmin
      forwarder: FORWARDER_ADDR[chainId],
      initialOwner: deployerAddr,
      royaltyBps: 690, // 6.9%
      currencies: [], // [USDC_ADDR[chainId]],
      prices: [], // [defaultMintPriceUSDC],
      allowedTokenIds: []
    }

    const tx = await DSponsorAdmin.createDSponsorNFTAndOffer(
      initDSponsorNFTParams,
      offerInit,
      {
        gasLimit: '1000000' // 1M gas, hardhat set automatically a limit too low
      }
    )
    await tx.wait(6)

    if (!tx.hash) throw new Error('No tx hash')
    const receipt = await provider.getTransactionReceipt(tx.hash || '')

    const eventDSponsorNFT = receipt?.logs
      .map((log: any) => DSponsorNFTFactory.interface.parseLog(log))
      .find((e) => e?.name === 'NewDSponsorNFT')
    DSponsorNFTAddress = eventDSponsorNFT?.args[0] || ''

    const eventOffer = receipt?.logs
      .map((log: any) => DSponsorAdmin.interface.parseLog(log))
      .find((e) => e?.name === 'UpdateOffer')
    offerId = eventOffer?.args[0] || ''

    console.log('Created offer', { offerId, DSponsorNFTAddress })
  }

  const DSponsorNFT = await ethers.getContractAt(
    'DSponsorNFT',
    DSponsorNFTAddress
  )
  for (const {
    tokenData,
    startTime,
    secondsUntilEndTime,
    quantityToList,
    currencyToAccept,
    reservePricePerToken,
    buyoutPricePerToken,
    transferType,
    rentalExpirationTimestamp,
    listingType
  } of specificTokens) {
    const tokenId = stringToUint256(tokenData)

    try {
      const txMint = await DSponsorNFT.mint(
        tokenId,
        deployerAddr,
        ZERO_ADDRESS,
        tokenData,
        {
          gasLimit: '1000000' // 1M gas, hardhat set automatically a limit too low
        }
      )
      await txMint.wait(2)

      console.log('Minted token', { tokenData, tokenId })
    } catch (e) {
      console.log(e)
      console.log('Token already minted', { tokenData, tokenId })
    }

    const txApprove = await DSponsorNFT.approve(
      DSponsorMarketplaceAddr,
      tokenId
    )

    await txApprove.wait(2)

    await DSponsorMarketplace.createListing(
      {
        assetContract: DSponsorNFTAddress,
        tokenId,
        startTime,
        secondsUntilEndTime,
        quantityToList,
        currencyToAccept,
        reservePricePerToken,
        buyoutPricePerToken,
        transferType,
        rentalExpirationTimestamp,
        listingType
      },
      {
        gasLimit: '1000000' // 1M gas, hardhat set automatically a limit too low
      }
    )

    console.log('Created listing', { tokenData, tokenId })
  }
}

async function verifyContracts() {
  await run('verify:verify', {
    address: DSponsorNFTImplementationAddr,
    constructorArguments: []
  })
  await run('verify:verify', {
    address: DSponsorNFTFactoryAddr,
    constructorArguments: [DSponsorNFTImplementationAddr]
  })
  await run('verify:verify', {
    address: DSponsorAdminAddr,
    constructorArguments: DSponsorAdminArgs
  })
  await run('verify:verify', {
    address: DSponsorMarketplaceAddr,
    constructorArguments: DSponsorMarketplaceArgs
  })
}

/*
deployerAddr = '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766'
chainId = '8453'
DSponsorNFTImplementationAddr = '0x5cF7F046818E5Dd71bd3E004f2040E0e3C59467D'
DSponsorNFTFactoryAddr = '0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09'
DSponsorAdminAddr = '0xC6cCe35375883872826DdF3C30557F16Ec4DD94c'

DSponsorAdminArgs = [
  '0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09',
  '0x0000000000000000000000000000000000000000',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  '0x2626664c2603336E57B271c5C0b26F421741e481',
  '0x5b15Cbb40Ef056F74130F0e6A1e6FD183b14Cdaf',
  400
]
DSponsorMarketplaceAddr = '0x86aDf604B5B72d270654F3A0798cabeBC677C7fc'

DSponsorMarketplaceArgs = [
  '0x0000000000000000000000000000000000000000',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  '0x2626664c2603336E57B271c5C0b26F421741e481',
  '0x5b15Cbb40Ef056F74130F0e6A1e6FD183b14Cdaf',
  400
]

offerId = 1
DSponsorNFTAddress = '0x141feC749536067fe4b9291FB00a8a398023c7C9'

verifyContracts()
*/

deployContracts()
  .then(() => deploySiBorgOffer())
  .then(() => verifyContracts())
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })

/* 

Deploying to sepolia (chainId: 11155111) with deployer: 0x9a7FAC267228f536A8f250E65d7C4CA7d39De766
DSponsorNFTImplementation deployed to: 0x22A6b84e3213A5A7625aA595d01F0caed5E459C2
DSponsorNFTFactory deployed to: 0x8Eb94523c3E01E172E1dd446Fecc8af74b6a2244
DSponsorAdmin deployed to: 0x10E0447dDB66f1d33E6b10dB5099FBa231ceCE5C  with args:  [
  '0x8Eb94523c3E01E172E1dd446Fecc8af74b6a2244',
  '0xfD8EdB731BB66A8d46ef4A18B09607DD29FfcAFC',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
  '0x6a0F850Cc341935Dd004a7C8C5aef3533ba284B9',
  400
]
DSponsorMarketplace deployed to: 0x0B7f100940f4152D01B42A626ab73f7A62dd7cdC  with args:  [
  '0xfD8EdB731BB66A8d46ef4A18B09607DD29FfcAFC',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
  '0x6a0F850Cc341935Dd004a7C8C5aef3533ba284B9',
  400
]
Created offer {
  offerId: 1n,
  DSponsorNFTAddress: '0xe1FDB9bF84368032e352c4A8050fA0a4d7b2D6AE'
}

----------------------------------------------------------------

Deploying to base (chainId: 8453) with deployer: 0x9a7FAC267228f536A8f250E65d7C4CA7d39De766
DSponsorNFTImplementation deployed to: 0x5cF7F046818E5Dd71bd3E004f2040E0e3C59467D
DSponsorNFTFactory deployed to: 0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09
DSponsorAdmin deployed to: 0xC6cCe35375883872826DdF3C30557F16Ec4DD94c  with args:  [
  '0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09',
  '0x0000000000000000000000000000000000000000',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  '0x2626664c2603336E57B271c5C0b26F421741e481',
  '0x5b15Cbb40Ef056F74130F0e6A1e6FD183b14Cdaf',
  400
]
DSponsorMarketplace deployed to: 0x86aDf604B5B72d270654F3A0798cabeBC677C7fc  with args:  [
  '0x0000000000000000000000000000000000000000',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  '0x2626664c2603336E57B271c5C0b26F421741e481',
  '0x5b15Cbb40Ef056F74130F0e6A1e6FD183b14Cdaf',
  400
]
Created offer {
  offerId: 1n,
  DSponsorNFTAddress: '0x141feC749536067fe4b9291FB00a8a398023c7C9'
}



// 64811535694367703682769931475725916177454416984783473390709242422588226989409 - tokenData farcaster
// 90616754875103578559897293644305665530305783446554677063919912809091389674723 - tokenData lens
// 21427090045381719823298842084323012234395108153199279809693771386125843395635 - tokenData runes
*/
