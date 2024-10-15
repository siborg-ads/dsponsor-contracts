import 'dotenv/config'
import fs from 'fs'

import { parseEther } from 'ethers'
import { ethers, run } from 'hardhat'

const { ALCHEMY_API_KEY } = process.env

const CRYPTOAST_JOURNAL_DAO_CONTRACT_ADDR =
  '0x0012989E982C2c473e36418384Ab707C72f2B782'
const SNAPSHOT_FILE = './data/cryptoastSnapshot_2024-10-15.json'
const SEPOLIA_GALAXY_SNAPSHOT_CONTRACT_ADDR =
  '0x4D546c111Dda413AE8DFbef4340d213966f3d81F'
const SEPOLIA_GOLD_SNAPSHOT_CONTRACT_ADDR =
  '0x5117Ab34594360ED5031086874c5401591AFac69'
const BASE_GALAXY_SNAPSHOT_CONTRACT_ADDR =
  '0x86987569e1B3f03467270884Ae17CB002e3b7456'
const BASE_GOLD_SNAPSHOT_CONTRACT_ADDR =
  '0xac389a71638709094c3EECB3616a3849C19777Af'

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

// airdrop('Galaxy').catch(console.error)
