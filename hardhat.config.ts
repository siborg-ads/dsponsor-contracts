import 'dotenv/config'
import 'hardhat-contract-sizer'
import 'hardhat-gas-reporter'
import '@nomicfoundation/hardhat-toolbox'
import '@openzeppelin/hardhat-upgrades'

import type { HardhatUserConfig } from 'hardhat/config'
import type { NetworksUserConfig } from 'hardhat/types'

const deploymentNetworks: NetworksUserConfig = {}

if (process.env.BASE_RPC_URL && process.env.DEPLOYER_PRIVATE_KEY) {
  deploymentNetworks.base = {
    url: process.env.BASE_RPC_URL,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY]
  }
}

if (process.env.BASE_SEPOLIA_RPC_URL && process.env.DEPLOYER_PRIVATE_KEY) {
  deploymentNetworks.baseSepolia = {
    url: process.env.BASE_SEPOLIA_RPC_URL,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY]
  }
}

if (process.env.SEPOLIA_RPC_URL && process.env.DEPLOYER_PRIVATE_KEY) {
  deploymentNetworks.sepolia = {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY]
  }
}

if (process.env.DEPLOYER_PRIVATE_KEY) {
  deploymentNetworks.modeMainnet = {
    url: 'https://mainnet.mode.network',
    chainId: 34443,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY]
  }
  deploymentNetworks.modeTestnet = {
    url: 'https://sepolia.mode.network',
    chainId: 919,
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
      /*
      forking: {
        url: process.env.BASE_RPC_URL as string,
        blockNumber: 15141916
      },
      chainId: 8453
      */

      forking: {
        url: 'https://mainnet.mode.network',
        blockNumber: 12774977
      },
      chainId: 34443
    },

    ...deploymentNetworks
  },

  etherscan: {
    enabled: true,
    apiKey: {
      base: process.env.BASESCAN_API_KEY as string,
      baseSepolia: process.env.BASESCAN_API_KEY as string,
      sepolia: process.env.ETHERSCAN_API_KEY as string
    },
    customChains: [
      {
        network: 'baseSepolia',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org/'
        }
      }
    ]
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
