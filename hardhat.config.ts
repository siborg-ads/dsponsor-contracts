import 'dotenv/config'
import 'hardhat-contract-sizer'
import 'hardhat-gas-reporter'
import '@nomicfoundation/hardhat-toolbox'
import '@openzeppelin/hardhat-upgrades'

import type { HardhatUserConfig } from 'hardhat/config'
import type { NetworksUserConfig } from 'hardhat/types'

const deploymentNetworks: NetworksUserConfig = {}

if (process.env.SEPOLIA_RPC_URL && process.env.DEPLOYER_PRIVATE_KEY) {
  deploymentNetworks.sepolia = {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY]
  }
}

if (process.env.ARBITRUM_RPC_URL && process.env.DEPLOYER_PRIVATE_KEY) {
  deploymentNetworks.arbitrum = {
    url: process.env.ARBITRUM_RPC_URL,
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
        url: process.env.ARBITRUM_RPC_URL as string,
        blockNumber: 195167985
      },
      chainId: 42161
    },

    ...deploymentNetworks
  },

  etherscan: {
    enabled: true,
    apiKey: {
      arbitrum: process.env.ARBISCAN_API_KEY as string,
      sepolia: process.env.ETHERSCAN_API_KEY as string
    }
  },

  sourcify: {
    enabled: true
  },

  gasReporter: {
    enabled: process.env.COINMARKETCAP_KEY !== undefined,
    token: 'ETH',
    currency: 'EUR',
    coinmarketcap: process.env.COINMARKETCAP_KEY
  }
}

export default config
