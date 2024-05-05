import 'dotenv/config'
import { parseEther } from 'ethers'
import { ethers, run } from 'hardhat'
import { IDSponsorAgreements } from '../typechain-types'
import { IDSponsorNFTBase } from '../typechain-types/contracts/DSponsorNFT'
import { ZERO_ADDRESS } from '../utils/constants'
import { Network } from 'hardhat/types'
import { stringToUint256 } from '../utils/convert'

const { provider } = ethers
let chainId: string
let deployerAddr: string

async function updateListing() {
  const { name: networkName, chainId: chainIdBigInt } =
    await provider.getNetwork()
  chainId = chainIdBigInt.toString()

  const [deployer] = await ethers.getSigners()
  deployerAddr = await deployer.getAddress()

  const DSponsorMarketplace = await ethers.getContractAt(
    'DSponsorMarketplace',
    '0x56d6002a15A3485b54817e91a84884Bd88292f78'
  )
  const listingId = 2
  const updateParams = {
    startTime: 1714478136,
    secondsUntilEndTime: BigInt('3600') * BigInt('24') * BigInt('31'), // 31 days
    quantityToList: 1,
    currencyToAccept: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    reservePricePerToken: parseEther('0.0000004'),
    buyoutPricePerToken: parseEther('0.0000004'),
    rentalExpirationTimestamp: 1717156536
  }

  console.log(
    `Updating lisiitng  to ${networkName} (chainId: ${chainId}) with deployer: ${deployerAddr}`
  )

  await DSponsorMarketplace.updateListing(listingId, updateParams)

  console.log('Listing updated')
}

updateListing().catch(console.error)
