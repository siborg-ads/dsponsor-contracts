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

async function deployMocks() {
  const { name: networkName, chainId: chainIdBigInt } =
    await provider.getNetwork()

  chainId = chainIdBigInt.toString()

  const [deployer] = await ethers.getSigners()
  deployerAddr = await deployer.getAddress()
  console.log(
    `Deploying MOCKS to ${networkName} (chainId: ${chainId}) with deployer: ${deployerAddr}`
  )

  const WETH = await ethers.deployContract('WETH', [])
  const WETHAddr = await WETH.getAddress()
  console.log('WETH deployed to:', WETHAddr)

  const ERC20 = await ethers.deployContract('ERC20Mock', [])
  const ERC20Addr = await ERC20.getAddress()
  console.log('ERC20 deployed to:', ERC20Addr)

  const ERC721 = await ethers.deployContract('ERC721Mock', [])
  const ERC721Addr = await ERC721.getAddress()
  console.log('ERC721 deployed to:', ERC721Addr)

  const UNIV3 = await ethers.deployContract('UniV3SwapRouterMock', [WETHAddr])
  const UNIV3Addr = await UNIV3.getAddress()
  console.log('UniswapV3 deployed to:', UNIV3Addr)

  await run('verify:verify', {
    address: WETHAddr,
    constructorArguments: []
  })

  await run('verify:verify', {
    address: ERC20Addr,
    constructorArguments: []
  })

  await run('verify:verify', {
    address: ERC721Addr,
    constructorArguments: []
  })

  await run('verify:verify', {
    address: UNIV3Addr,
    constructorArguments: [WETHAddr]
  })

  console.log('Mock contracts verified')
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

  await verifyContracts()
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

async function deployOffer({
  name,
  symbol,
  maxSupply,
  royaltyBps,
  adParameters,
  contractURI,
  offerMetadataURI,
  currencies,
  prices
}: {
  name: string
  symbol: string
  maxSupply: number
  royaltyBps: number
  adParameters: string[]
  currencies: string[]
  prices: bigint[]
  contractURI: string
  offerMetadataURI: string
}) {
  const DSponsorAdmin = await ethers.getContractAt(
    'DSponsorAdmin',
    DSponsorAdminAddr
  )
  const DSponsorNFTFactory = await ethers.getContractAt(
    'DSponsorNFTFactory',
    DSponsorNFTFactoryAddr
  )

  if (!offerId && !DSponsorNFTAddress) {
    const offerOptions: IDSponsorAgreements.OfferOptionsStruct = {
      admins: [deployerAddr],
      validators: [],
      adParameters
    }

    const offerInit: IDSponsorAgreements.OfferInitParamsStruct = {
      name,
      offerMetadata: offerMetadataURI,
      options: offerOptions
    }

    // create nft contract and then offer
    const initDSponsorNFTParams: IDSponsorNFTBase.InitParamsStruct = {
      name,
      symbol,
      baseURI: `https://relayer.dsponsor.com/api/${chainId}/tokenMetadata`,
      contractURI,
      maxSupply,
      minter: deployerAddr, // will be replaced by DSponsorAdmin
      forwarder: FORWARDER_ADDR[chainId],
      initialOwner: deployerAddr,
      royaltyBps,
      currencies,
      prices,
      allowedTokenIds: Array.from({ length: maxSupply }, (_, i) => i)
    }

    const tx = await DSponsorAdmin.createDSponsorNFTAndOffer(
      initDSponsorNFTParams,
      offerInit,
      {
        gasLimit: '60000000' // 60M gas, hardhat set automatically a limit too low
      }
    )

    // alternative : create offer from nft contract
    /*
    const DSponsorNFT = await ethers.deployContract('DSponsorNFT', [])
    await DSponsorNFT.initialize(initDSponsorNFTParams)
    DSponsorNFTAddress = await DSponsorNFT.getAddress()

    console.log('DSponsorNFT deployed to:', DSponsorNFTAddress)

    const tx = await DSponsorAdmin.createOffer(DSponsorNFTAddress, offerInit)
*/

    await tx.wait(6)

    if (!tx.hash) throw new Error('No tx hash')
    const receipt = await provider.getTransactionReceipt(tx.hash || '')

    const eventDSponsorNFT = receipt?.logs
      .map((log: any) => DSponsorNFTFactory.interface.parseLog(log))
      .find((e: any) => e?.name === 'NewDSponsorNFT')
    DSponsorNFTAddress = eventDSponsorNFT?.args[0] || DSponsorNFTAddress

    const eventOffer = receipt?.logs
      .map((log: any) => DSponsorAdmin.interface.parseLog(log))
      .find((e: any) => e?.name === 'UpdateOffer')
    offerId = eventOffer?.args[0] || ''

    console.log('Created offer', { offerId, DSponsorNFTAddress })
  }
}

async function deployDemoOffer() {
  const name = 'Demo Offer Sponsorship'
  const symbol = 'DSNFT-DEMO'
  const maxSupply = 5
  const royaltyBps = 500 // 5%
  const adParameters: string[] = ['linkURL', 'imageURL-1:1']
  const currencies: string[] = [WETH_ADDR[chainId]]
  const prices = [BigInt('10000000000000000')] // 0.01

  const contractURI =
    'https://orange-elegant-swallow-161.mypinata.cloud/ipfs/QmQ3tcHLpCF5DDn53BaEFDNnvfkcoKGg7N5mfZhtF9wHsJ'
  const offerMetadataURI =
    'https://orange-elegant-swallow-161.mypinata.cloud/ipfs/QmW1QmyXzMEwPyw1x4p2oniHmb1nG9tdPq5sNaJg24ZRtA'

  await deployOffer({
    name,
    symbol,
    maxSupply,
    royaltyBps,
    adParameters,
    contractURI,
    offerMetadataURI,
    currencies,
    prices
  })
}

/////////// Full deployment ///////////////////////////////////

deployContracts()
  .then(() => deployDemoOffer())
  .catch((error) => {
    console.error(error)
  })

/////////// Offer deployment only ///////////////////////////////////

/*

deployerAddr = '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766'
chainId = '11124'
DSponsorNFTImplementationAddr = '0xBf8Aa5ECe57D07dd700d3A952eb803C9CC8A0Cdb'
DSponsorNFTFactoryAddr = '0xAe24518ffC7D699F3328a5eE3666cc5175bE2149'
DSponsorAdminAddr = '0xA3B2469A2a4422058F70C59Fcd63EdaA219A2571'
DSponsorMarketplaceAddr = '0x747aCdC82A90cca57587F20Ee1041088F53c3b15'

deployDemoOffer().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

*/
/////////////  Results  //////////////////////////////////////////

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


---------------------------------------------------------------

Deploying to modeMainnet (chainId: 34443) with deployer: 0x9a7FAC267228f536A8f250E65d7C4CA7d39De766
DSponsorNFTImplementation deployed to: 0x73adbA5994B48F5139730BE55622f298445179B0
DSponsorNFTFactory deployed to: 0x5cF7F046818E5Dd71bd3E004f2040E0e3C59467D
DSponsorAdmin deployed to: 0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09  with args:  [
  '0x5cF7F046818E5Dd71bd3E004f2040E0e3C59467D',
  '0xD04F98C88cE1054c90022EE34d566B9237a1203C',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  '0x016e131C05fb007b5ab286A6D614A5dab99BD415',
  '0x5b15Cbb40Ef056F74130F0e6A1e6FD183b14Cdaf',
  400
]
DSponsorMarketplace deployed to: 0xC6cCe35375883872826DdF3C30557F16Ec4DD94c  with args:  [
  '0xD04F98C88cE1054c90022EE34d566B9237a1203C',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  '0x016e131C05fb007b5ab286A6D614A5dab99BD415',
  '0x5b15Cbb40Ef056F74130F0e6A1e6FD183b14Cdaf',
  400
]

Created offer {
  offerId: 1n,
  DSponsorNFTAddress: '0x69d0B85B2F6378229f9EB03E76e82F81D90C2C47'
}

----------------------------------------------

Deploying to unknown (chainId: 11124) with deployer: 0x9a7FAC267228f536A8f250E65d7C4CA7d39De766
DSponsorNFTImplementation deployed to: 0xadEc59aBF577aC61939D1742d622FaF97A28Fdf8
DSponsorNFTFactory deployed to: 0x9FCf7ecdC815B21E18C5eda720Db9e41a6EaE6B9
DSponsorAdmin deployed to: 0xBEA0a4E815e5A8b544712144DA3865a1aa69ECD9  with args:  [
  '0x9FCf7ecdC815B21E18C5eda720Db9e41a6EaE6B9',
  '0x0000000000000000000000000000000000000000',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  '0x5eA0064fE5bc2449472C7DfF9CB4bc5010095392',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  400
]
DSponsorMarketplace deployed to: 0x833721E8651682043CDFcD577Aa2DC5b3D28abC6  with args:  [
  '0x0000000000000000000000000000000000000000',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  '0x5eA0064fE5bc2449472C7DfF9CB4bc5010095392',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  400
]
Created offer {
  offerId: 1n,
  DSponsorNFTAddress: '0xE40f24dc5B6b7D10890Fd7d3196c1A93957247A8'
}


WETHMock: 0x80392dF95f8ed7F2f6299Be35A1007f31D5Fc5b6
ERC20Mock: 0xa70e901a190c5605a5137a1019c6514F5a626517
ERC721Mock: 0xe3aCb7d6F6878a72479c9645489e9D531B789528
UniswapV3Mock: 0x03DD2f8996A2fBA6a4f7b3A383C4c0Ff367Dd95c

*/
