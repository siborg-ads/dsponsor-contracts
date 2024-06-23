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

async function updateOffer() {
  const { name: networkName, chainId: chainIdBigInt } =
    await provider.getNetwork()
  chainId = chainIdBigInt.toString()

  const [deployer] = await ethers.getSigners()
  deployerAddr = await deployer.getAddress()

  const DSponsorAdmin = await ethers.getContractAt(
    'DSponsorAdmin',
    '0x22554D70702C60A5fa30297908005B6cE19eEf51'
  )
  const offerId = 1

  console.log(
    `Updating offer  to ${networkName} (chainId: ${chainId}) with deployer: ${deployerAddr}`
  )

  await DSponsorAdmin.updateOffer(
    offerId,
    false,
    'Tokenized ad spaces in SiBorg App',
    'https://bafkreibbpiazyln6hzc7yhv6ks5oskyvfbo7e5i6czllmp3fbjy52q7x3i.ipfs.nftstorage.link/',
    {
      admins: [],
      validators: [],
      adParameters: []
    },
    {
      admins: [],
      validators: [],
      adParameters: []
    }
  )

  console.log('Offer updated')
}

updateOffer().catch(console.error)
