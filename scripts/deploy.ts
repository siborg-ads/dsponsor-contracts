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

// if SiBorg offer already deployed
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

  const name = 'Tokenized ad spaces in SiBorg App'

  const contractURI =
    'https://bafkreigxslyror62hz3bgeae4zo6kzeildjf2xpjw5s7twye55ghrzhzpe.ipfs.nftstorage.link/'
  // 'ipfs://bafkreigxslyror62hz3bgeae4zo6kzeildjf2xpjw5s7twye55ghrzhzpe'

  const offerMetadataURI =
    'https://bafkreibbpiazyln6hzc7yhv6ks5oskyvfbo7e5i6czllmp3fbjy52q7x3i.ipfs.nftstorage.link/'

  const adParameters: string[] = [
    'linkURL',
    'imageURL-5:1',
    'xCreatorHandle',
    'xSpaceId'
  ]

  const specificTokens = [
    {
      tokenData: 'swissborg',
      startTime: await now(),
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('31'), // 31 days
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.01'),
      buyoutPricePerToken: parseEther('100'),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_AUCTION
    },

    {
      tokenData: 'bitcoin',
      startTime: await now(),
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('31'), // 31 days
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.01'),
      buyoutPricePerToken: parseEther('100'),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_AUCTION
    },

    {
      tokenData: 'defi',
      startTime: await now(),
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('31'), // 31 days
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.0000004'),
      buyoutPricePerToken: parseEther('0.0000004'),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_DIRECT
    },
    {
      tokenData: 'staking',
      startTime: (await now()) + BigInt(Number(3600 * 24 * 7).toString()), // in  7 days
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('45'), // 45 days
      quantityToList: 1,
      currencyToAccept: USDC_ADDR[chainId],
      reservePricePerToken: BigInt((2.5 * 10 ** 6).toString()), // 2.5 USDC
      buyoutPricePerToken: BigInt((10000 * 10 ** 6).toString()), // 10000 USDC
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_AUCTION
    },
    {
      tokenData: 'bull run',
      startTime: await now(),
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('31'), // 31 days
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.01'),
      buyoutPricePerToken: parseEther('100'),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_AUCTION
    },
    {
      tokenData: 'ethereum',
      startTime: await now(),
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('15'), // 15 days
      quantityToList: 1,
      currencyToAccept: USDC_ADDR[chainId],
      reservePricePerToken: BigInt((12.5 * 10 ** 6).toString()), // 12.5 USDC
      buyoutPricePerToken: BigInt((10000 * 10 ** 6).toString()), // 10000 USDC
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_AUCTION
    },
    {
      tokenData: 'farcaster',
      startTime: await now(),
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('15'), // 15 days
      quantityToList: 1,
      currencyToAccept: USDC_ADDR[chainId],
      reservePricePerToken: BigInt((1 * 10 ** 6).toString()), // 1 USDC
      buyoutPricePerToken: BigInt((1 * 10 ** 6).toString()),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_DIRECT
    },
    {
      tokenData: 'btc',
      startTime: (await now()) + BigInt(Number(3600 * 24 * 7).toString()), // in  7 days
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('45'), // 45 days
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.02'),
      buyoutPricePerToken: parseEther('100'),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_AUCTION
    },
    {
      tokenData: 'socialfi',
      startTime: (await now()) + BigInt(Number(3600 * 24 * 7).toString()), // in  7 days
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('45'), // 45 days
      quantityToList: 1,
      currencyToAccept: USDC_ADDR[chainId],
      reservePricePerToken: BigInt((5.5 * 10 ** 6).toString()), // 5.5 USDC
      buyoutPricePerToken: BigInt((5.5 * 10 ** 6).toString()),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_DIRECT
    },
    {
      tokenData: 'halving',
      startTime: await now(),
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('31'), // 31 days
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.015'),
      buyoutPricePerToken: parseEther('100'),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_AUCTION
    },
    {
      tokenData: 'memecoin',
      startTime: (await now()) + BigInt(Number(3600 * 24 * 7).toString()), // in  7 days
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('45'), // 45 days
      quantityToList: 1,
      currencyToAccept: USDC_ADDR[chainId],
      reservePricePerToken: BigInt((12.5 * 10 ** 6).toString()), // 12.5 USDC
      buyoutPricePerToken: BigInt((10000 * 10 ** 6).toString()), // 10000 USDC
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_AUCTION
    },
    {
      tokenData: 'rwa',
      startTime: await now(),
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('31'), // 31 days
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.0000004'),
      buyoutPricePerToken: parseEther('0.0000004'),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_DIRECT
    },
    {
      tokenData: 'nft',
      startTime: await now(),
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('31'), // 31 days
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.01'),
      buyoutPricePerToken: parseEther('100'),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_AUCTION
    },
    {
      tokenData: 'elon musk',
      startTime: await now(),
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('15'), // 15 days
      quantityToList: 1,
      currencyToAccept: USDC_ADDR[chainId],
      reservePricePerToken: BigInt((12.5 * 10 ** 6).toString()), // 12.5 USDC
      buyoutPricePerToken: BigInt((10000 * 10 ** 6).toString()), // 10000 USDC
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_AUCTION
    },
    {
      tokenData: 'lens',
      startTime: await now(),
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('15'), // 15 days
      quantityToList: 1,
      currencyToAccept: USDC_ADDR[chainId],
      reservePricePerToken: BigInt((1 * 10 ** 6).toString()), // 1 USDC
      buyoutPricePerToken: BigInt((1 * 10 ** 6).toString()),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_DIRECT
    },
    {
      tokenData: 'degen',
      startTime: (await now()) + BigInt(Number(3600 * 24 * 7).toString()), // in  7 days
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('12'), // 12 days
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.02'),
      buyoutPricePerToken: parseEther('100'),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_AUCTION
    },
    {
      tokenData: 'airdrop',
      startTime: (await now()) + BigInt(Number(3600 * 24 * 3).toString()), // in  3 days
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('5'), // 5 days
      quantityToList: 1,
      currencyToAccept: USDC_ADDR[chainId],
      reservePricePerToken: BigInt((5.5 * 10 ** 6).toString()), // 5.5 USDC
      buyoutPricePerToken: BigInt((5.5 * 10 ** 6).toString()),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_DIRECT
    },
    {
      tokenData: 'ordinals',
      startTime: await now(),
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('7'), // 7 days
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.015'),
      buyoutPricePerToken: parseEther('100'),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_AUCTION
    },
    {
      tokenData: 'sol',
      startTime: (await now()) + BigInt(Number(3600 * 24 * 7).toString()), // in  7 days
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('45'), // 45 days
      quantityToList: 1,
      currencyToAccept: USDC_ADDR[chainId],
      reservePricePerToken: BigInt((12.5 * 10 ** 6).toString()), // 12.5 USDC
      buyoutPricePerToken: BigInt((10000 * 10 ** 6).toString()), // 10000 USDC
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_AUCTION
    },
    {
      tokenData: 'web3',
      startTime: await now(),
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('31'), // 31 days
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.0000004'),
      buyoutPricePerToken: parseEther('0.0000004'),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_DIRECT
    },
    {
      tokenData: 'alpha',
      startTime: await now(),
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('31'), // 31 days
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.01'),
      buyoutPricePerToken: parseEther('100'),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_AUCTION
    },
    {
      tokenData: 'presale alpha',
      startTime: await now(),
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('15'), // 15 days
      quantityToList: 1,
      currencyToAccept: USDC_ADDR[chainId],
      reservePricePerToken: BigInt((12.5 * 10 ** 6).toString()), // 12.5 USDC
      buyoutPricePerToken: BigInt((10000 * 10 ** 6).toString()), // 10000 USDC
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_AUCTION
    },
    {
      tokenData: 'crypto news',
      startTime: await now(),
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('15'), // 15 days
      quantityToList: 1,
      currencyToAccept: USDC_ADDR[chainId],
      reservePricePerToken: BigInt((1 * 10 ** 6).toString()), // 1 USDC
      buyoutPricePerToken: BigInt((1 * 10 ** 6).toString()),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_DIRECT
    },
    {
      tokenData: 'binance',
      startTime: (await now()) + BigInt(Number(3600 * 24 * 7).toString()), // in  7 days
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('45'), // 45 days
      quantityToList: 1,
      currencyToAccept: WETH_ADDR[chainId],
      reservePricePerToken: parseEther('0.02'),
      buyoutPricePerToken: parseEther('100'),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_AUCTION
    },
    {
      tokenData: 'base',
      startTime: (await now()) + BigInt(Number(3600 * 24 * 14).toString()), // in  14 days
      secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('45'), // 45 days
      quantityToList: 1,
      currencyToAccept: USDC_ADDR[chainId],
      reservePricePerToken: BigInt((0.005 * 10 ** 6).toString()), // 0.005 USDC
      buyoutPricePerToken: BigInt((0.005 * 10 ** 6).toString()),
      transferType: TRANSFER_TYPE_SALE,
      rentalExpirationTimestamp:
        (await now()) + BigInt(Number(3600 * 24 * 31).toString()), // 31 days
      listingType: LISTING_TYPE_DIRECT
    }
  ]

  const [deployer] = await ethers.getSigners()

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
      name: 'Tokenized ad spaces in SiBorg App',
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
      currencies: [USDC_ADDR[chainId]],
      prices: [defaultMintPriceUSDC],
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
        tokenData
      )
      await txMint.wait(2)

      console.log('Minted token', { tokenData, tokenId })
    } catch (e) {
      console.log('Token already minted', { tokenData, tokenId })
    }

    const txApprove = await DSponsorNFT.approve(
      DSponsorMarketplaceAddr,
      tokenId
    )

    await txApprove.wait(2)

    await DSponsorMarketplace.createListing({
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
    })

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
chainId = '11155111'
DSponsorNFTImplementationAddr = '0xCdd6C9975566bdAeb6967853fB7fea87a815531B'
DSponsorNFTFactoryAddr = '0x05B90b7CfbcEd967C20684b9bf2fAb196BDb1DBd'
DSponsorAdminAddr = '0x22554D70702C60A5fa30297908005B6cE19eEf51'

DSponsorAdminArgs = [
  '0x05B90b7CfbcEd967C20684b9bf2fAb196BDb1DBd',
  '0xfD8EdB731BB66A8d46ef4A18B09607DD29FfcAFC',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
  '0x6a0F850Cc341935Dd004a7C8C5aef3533ba284B9',
  400
]
DSponsorMarketplaceAddr = '0xd36097D256F31F1BF5aa597dA7C3E098d466aD13'

DSponsorMarketplaceArgs = [
  '0xfD8EdB731BB66A8d46ef4A18B09607DD29FfcAFC',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
  '0x6a0F850Cc341935Dd004a7C8C5aef3533ba284B9',
  400
]

offerId = 1
DSponsorNFTAddress = '0x51A533E5FBc542B0Df00c352D8A8A65Fff1727ac'
*/

deployContracts()
  .then(() => deploySiBorgOffer())
  .then(() => verifyContracts())
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })

/* 
Deploying to baseSepolia (chainId: 84532) with deployer: 0x9a7FAC267228f536A8f250E65d7C4CA7d39De766
DSponsorNFTImplementation deployed to: 0x55b01C3Bb0AE4FAb27cdb33D52b97604E1e4Ed63
DSponsorNFTFactory deployed to: 0x73adbA5994B48F5139730BE55622f298445179B0
DSponsorAdmin deployed to: 0x5cF7F046818E5Dd71bd3E004f2040E0e3C59467D  with args:  [
  '0x73adbA5994B48F5139730BE55622f298445179B0',
  '0xfD0CDD59a62dF27e464e462F489d6AF9869cCa44',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4',
  '0xa45Ee60DAC370B0363920978a18DdB74D325C3B2',
  400
]
DSponsorMarketplace deployed to: 0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09  with args:  [
  '0xfD0CDD59a62dF27e464e462F489d6AF9869cCa44',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4',
  '0xa45Ee60DAC370B0363920978a18DdB74D325C3B2',
  400
]
Created offer {
  offerId: 1n,
  DSponsorNFTAddress: '0x90b692492B8be931392AeC358843b8b33675fAD2'
}
*/

/*

Deploying to sepolia (chainId: 11155111) with deployer: 0x9a7FAC267228f536A8f250E65d7C4CA7d39De766
DSponsorNFTImplementation deployed to: 0xCdd6C9975566bdAeb6967853fB7fea87a815531B
DSponsorNFTFactory deployed to: 0x05B90b7CfbcEd967C20684b9bf2fAb196BDb1DBd
DSponsorAdmin deployed to: 0x22554D70702C60A5fa30297908005B6cE19eEf51  with args:  [
  '0x05B90b7CfbcEd967C20684b9bf2fAb196BDb1DBd',
  '0xfD8EdB731BB66A8d46ef4A18B09607DD29FfcAFC',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
  '0x6a0F850Cc341935Dd004a7C8C5aef3533ba284B9',
  400
]
DSponsorMarketplace deployed to: 0xd36097D256F31F1BF5aa597dA7C3E098d466aD13  with args:  [
  '0xfD8EdB731BB66A8d46ef4A18B09607DD29FfcAFC',
  '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
  '0x6a0F850Cc341935Dd004a7C8C5aef3533ba284B9',
  400
]
Created offer {
  offerId: 1n,
  DSponsorNFTAddress: '0x51A533E5FBc542B0Df00c352D8A8A65Fff1727ac'
}

*/
