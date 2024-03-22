import 'dotenv/config'
import 'hardhat-contract-sizer'
import 'hardhat-gas-reporter'
import '@nomicfoundation/hardhat-toolbox'
import '@openzeppelin/hardhat-upgrades'

import type { HardhatUserConfig } from 'hardhat/config'
import type { NetworksUserConfig } from 'hardhat/types'

const deploymentNetworks: NetworksUserConfig = {}

if (process.env.TESTNET_RPC_URL && process.env.DEPLOYER_PRIVATE_KEY) {
  deploymentNetworks.mumbai = {
    url: process.env.TESTNET_RPC_URL,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY]
  }
}

if (process.env.MAINNET_RPC_URL && process.env.DEPLOYER_PRIVATE_KEY) {
  deploymentNetworks.polygon = {
    url: process.env.MAINNET_RPC_URL,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY]
  }
}

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true
        }
      },
      viaIR: false
    }
  },

  networks: {
    hardhat: {
      forking: {
        url: process.env.MAINNET_RPC_URL as string,
        blockNumber: 53116830
      },
      chainId: 137
    },
    ...deploymentNetworks
  },

  etherscan: {
    enabled: process.env.POLYGONSCAN_API_KEY !== undefined,
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_API_KEY as string,
      polygon: process.env.POLYGONSCAN_API_KEY as string
    }
  },

  sourcify: {
    enabled: true
  },

  gasReporter: {
    enabled: process.env.COINMARKETCAP_KEY !== undefined,

    token: 'MATIC',
    gasPriceApi:
      'https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice',

    currency: 'EUR',
    coinmarketcap: process.env.COINMARKETCAP_KEY
  }
}

export default config
