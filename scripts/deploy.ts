import 'dotenv/config'
import { parseEther } from 'ethers'
import { ethers, run } from 'hardhat'
import { IDSponsorAgreements } from '../typechain-types'
import { IDSponsorNFTBase } from '../typechain-types/contracts/DSponsorNFT'
import { ZERO_ADDRESS } from '../utils/constants'

async function deploy() {
  const treasuryAddr = '0x64e8f7c2b4fd33f5e8470f3c6df04974f90fc2ca' // ARB: '0x5b15Cbb40Ef056F74130F0e6A1e6FD183b14Cdaf' dsponsor.eth

  const swapRouter = '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E' // ARB: '0xE592427A0AEce92De3Edee1F18E0157C05861564' https://docs.uniswap.org/contracts/v3/reference/deployments

  const protocolFeeBps = 400

  const forwarderAddress = ZERO_ADDRESS

  const { provider } = ethers
  const network = await provider.getNetwork()
  const chainId = network.chainId

  const [deployer] = await ethers.getSigners()
  const deployerAddr = await deployer.getAddress()
  console.log(
    `Deploying to ${network.name} (chainId: ${chainId}) with deployer: ${deployerAddr}`
  )

  const DSponsorNFTImplementation = await ethers.deployContract(
    'DSponsorNFT',
    []
  )
  const DSponsorNFTImplementationAddress =
    await DSponsorNFTImplementation.getAddress()
  console.log(
    'DSponsorNFTImplementation deployed to:',
    DSponsorNFTImplementationAddress
  )

  const DSponsorNFTFactory = await ethers.deployContract('DSponsorNFTFactory', [
    DSponsorNFTImplementationAddress
  ])
  const DSponsorNFTFactoryAddress = await DSponsorNFTFactory.getAddress()
  console.log('DSponsorNFTFactory deployed to:', DSponsorNFTFactoryAddress)

  const DSponsorAdminArgs = [
    DSponsorNFTFactoryAddress,
    forwarderAddress,
    deployerAddr,
    swapRouter,
    treasuryAddr,
    protocolFeeBps
  ]
  const DSponsorAdmin = await ethers.deployContract(
    'DSponsorAdmin',
    DSponsorAdminArgs
  )
  const DSponsorAdminAddress = await DSponsorAdmin.getAddress()
  console.log('DSponsorAdmin deployed to:', DSponsorAdminAddress)

  const ERC20Addr = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' // UNI SEPOLIA,
  // pool uniV3 testnet 1 UNI = 4,99778 ETH - 1 ETH = 0,20054 UNI

  const adParameters: string[] = ['logoUrl', 'linkUrl']

  const contractURI =
    'ipfs://bafkreicb5pvxuifwlchdxahd5i34sro2buhvzywwod5vdhscn77rsn7abu'

  const ERC20Amount = parseEther('0.0002')
  const valuePrice = parseEther('0.0001')

  const offerOptions: IDSponsorAgreements.OfferOptionsStruct = {
    admins: [deployerAddr],
    validators: [],
    adParameters
  }

  const offerInit: IDSponsorAgreements.OfferInitParamsStruct = {
    name: 'Offer TEST',
    offerMetadata: contractURI,
    options: offerOptions
  }

  const initDSponsorNFTParams: IDSponsorNFTBase.InitParamsStruct = {
    name: 'DSponsorNFT',
    symbol: 'DSNFT',
    baseURI: contractURI,
    contractURI,
    maxSupply: 50,
    minter: deployerAddr, // will be replaced by DSponsorAdmin
    forwarder: ZERO_ADDRESS,
    initialOwner: deployerAddr,
    royaltyBps: 100, // 1%
    currencies: [ZERO_ADDRESS, ERC20Addr],
    prices: [valuePrice, ERC20Amount],
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
  const event = receipt?.logs
    .map((log: any) => DSponsorNFTFactory.interface.parseLog(log))
    .find((e) => e?.name === 'NewDSponsorNFT')
  if (!event) {
    console.log('No event for tx', tx)
    throw new Error('No event for tx')
  }

  const DSponsorNFTAddress = event.args[0]

  console.log('DSponsorNFT deployed to:', DSponsorNFTAddress)

  const DSponsorMarketplaceArgs = [
    forwarderAddress,
    deployerAddr,
    swapRouter,
    treasuryAddr,
    protocolFeeBps
  ]

  const DSponsorMarketplace = await ethers.deployContract(
    'DSponsorMarketplace',
    DSponsorMarketplaceArgs
  )

  const DSponsorMarketplaceAddress = await DSponsorMarketplace.getAddress()
  console.log('DSponsorMarketplace deployed to:', DSponsorMarketplaceAddress)

  await run('verify:verify', {
    address: DSponsorNFTImplementationAddress,
    constructorArguments: []
  })
  await run('verify:verify', {
    address: DSponsorNFTFactoryAddress,
    constructorArguments: [DSponsorNFTImplementationAddress]
  })
  await run('verify:verify', {
    address: DSponsorAdminAddress,
    constructorArguments: DSponsorAdminArgs
  })
  await run('verify:verify', {
    address: DSponsorMarketplaceAddress,
    constructorArguments: DSponsorMarketplaceArgs
  })
}

deploy().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

/* 

Deploying to sepolia (chainId: 11155111) with deployer: 0x9a7FAC267228f536A8f250E65d7C4CA7d39De766
DSponsorNFTImplementation deployed to: 0x73adbA5994B48F5139730BE55622f298445179B0
DSponsorNFTFactory deployed to: 0x5cF7F046818E5Dd71bd3E004f2040E0e3C59467D
DSponsorAdmin deployed to: 0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09
DSponsorNFT deployed to: 0x69d0B85B2F6378229f9EB03E76e82F81D90C2C47
DSponsorMarketplace deployed to: 0x86aDf604B5B72d270654F3A0798cabeBC677C7fc

*/
