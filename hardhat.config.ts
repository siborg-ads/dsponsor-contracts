import 'dotenv/config'
import 'hardhat-contract-sizer'
import 'hardhat-gas-reporter'
import '@nomicfoundation/hardhat-toolbox'
import '@openzeppelin/hardhat-upgrades'

import type { HardhatUserConfig } from 'hardhat/config'
import type { NetworksUserConfig } from 'hardhat/types'

import '@matterlabs/hardhat-zksync'

const deploymentNetworks: NetworksUserConfig = {}

if (process.env.BASE_RPC_URL && process.env.DEPLOYER_PRIVATE_KEY) {
  deploymentNetworks.base = {
    url: process.env.BASE_RPC_URL,
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
  deploymentNetworks.mode = {
    url: 'https://mainnet.mode.network',
    chainId: 34443,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY]
  }

  deploymentNetworks.abstractTestnet = {
    url: 'https://api.testnet.abs.xyz',
    chainId: 11124,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    ethNetwork: 'sepolia',
    zksync: true,
    verifyURL:
      'https://api-explorer-verify.testnet.abs.xyz/contract_verification'
  }
}

const config: HardhatUserConfig = {
  zksolc: {
    version: 'latest',
    settings: {
      // Note: This must be true to call NonceHolder & ContractDeployer system contracts
      enableEraVMExtensions: false
    }
  },

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

      
      forking: {
        url: 'https://mainnet.mode.network',
        blockNumber: 12774977
      },
      chainId: 34443,
      */
      forking: {
        url: 'https://api.testnet.abs.xyz',
        blockNumber: 421315
      },
      chainId: 11124
    },

    ...deploymentNetworks
  },

  etherscan: {
    enabled: true,
    apiKey: {
      base: process.env.BASESCAN_API_KEY as string,
      baseSepolia: process.env.BASESCAN_API_KEY as string,
      mode: process.env.ETHERSCAN_API_KEY as string,
      sepolia: process.env.ETHERSCAN_API_KEY as string
    },

    // if not in npx hardhat verify --list-networks
    customChains: [
      {
        network: 'mode',
        chainId: 34443,
        urls: {
          apiURL: 'https://explorer.mode.network/api?',
          browserURL: 'https://explorer.mode.network'
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
