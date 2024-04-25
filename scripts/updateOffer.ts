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
    '0xE442802706F3603d58F34418Eac50C78C7B4E8b3'
  )
  const offerId = 1

  console.log(
    `Updating offer  to ${networkName} (chainId: ${chainId}) with deployer: ${deployerAddr}`
  )

  await DSponsorAdmin.updateOffer(
    1,
    false,
    'Tokenized ad spaces in SiBorg App',
    'https://bafkreicmn6gia3cplyt7tu56sfue6cpw5dm2dnwuz2zkj4dhqrg5bzwuua.ipfs.nftstorage.link/',
    {
      admins: [],
      validators: [],
      adParameters: ['linkURL', 'imageURL-6.4:1']
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
