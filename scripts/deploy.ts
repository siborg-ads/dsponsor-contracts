import 'dotenv/config'
import { parseEther } from 'ethers'
import { ethers, run } from 'hardhat'
import { IDSponsorAgreements } from '../typechain-types'
import { IDSponsorNFTBase } from '../typechain-types/contracts/DSponsorNFT'
import { ZERO_ADDRESS } from '../utils/constants'

async function deploy() {
  const treasuryAddr = '0x64e8f7c2b4fd33f5e8470f3c6df04974f90fc2ca' //  '0x5b15Cbb40Ef056F74130F0e6A1e6FD183b14Cdaf' dsponsor.eth

  const swapRouter = '0xE592427A0AEce92De3Edee1F18E0157C05861564'

  const protocolFeeBps = 400

  const { provider } = ethers
  const network = await provider.getNetwork()
  const chainId = network.chainId
  const [deployer] = await ethers.getSigners()
  const deployerAddr = await deployer.getAddress() // 0x9a7FAC267228f536A8f250E65d7C4CA7d39De766
  console.log(`Deploying to chainId: ${chainId} with deployer: ${deployerAddr}`)

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
    ZERO_ADDRESS,
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

  const ERC20Addr = '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa' // WETH mumbai,
  // pool uniV3 testnet 0,02297 WETH per MATIC / 43,5329 MATIC per WETH

  const adParameters: string[] = ['logoUrl', 'linkUrl']

  const contractURI =
    'ipfs://bafkreicb5pvxuifwlchdxahd5i34sro2buhvzywwod5vdhscn77rsn7abu'

  const ERC20Amount = parseEther('0.00033')
  const valuePrice = parseEther('1')

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
}

deploy().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

/*
Deploying to chainId: 80001 with deployer: 0x9a7FAC267228f536A8f250E65d7C4CA7d39De766
DSponsorNFTImplementation deployed to: 0xFEAE8589A5e28bB8e9271F11062f8ECAb2bDB6EA
DSponsorNFTFactory deployed to: 0x06DC507a5b0Dd3aF54EBB56177f27283456048C4
DSponsorAdmin deployed to: 0xA82B4bBc8e6aC3C100bBc769F4aE0360E9ac9FC3
DSponsorNFT deployed to: 0x8C4115060A52DD8693521095f6f150D3F2aaFa53
*/
