import 'dotenv/config'

const { ALCHEMY_API_KEY } = process.env

async function snapshot() {
  const contractAddress = '0x0012989E982C2c473e36418384Ab707C72f2B782'
  const ownersResponse = await fetch(
    `https://polygon-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getOwnersForContract?contractAddress=${contractAddress}&withTokenBalances=true`,
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

  console.log(JSON.stringify(owners, null, 2))
}

snapshot().catch(console.error)
