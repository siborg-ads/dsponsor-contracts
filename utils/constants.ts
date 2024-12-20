export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const UINT256_MAX = BigInt(
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'
)

export const ABSTRACT_TESTNET_CHAIN_ID = '11124'
export const BASE_CHAIN_ID = '8453'
export const MODE_CHAIN_ID = '34443'
export const SEPOLIA_CHAIN_ID = '11155111'

type ChainIdAddr = {
  [key: string]: string
}

export const USDC_ADDR: ChainIdAddr = {
  [ABSTRACT_TESTNET_CHAIN_ID]: '0xf374801d73f8093833aE5D38b49C97270C34AE10', // /!\ Mock
  [BASE_CHAIN_ID]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [MODE_CHAIN_ID]: '0xd988097fb8612cc24eeC14542bC03424c656005f',
  [SEPOLIA_CHAIN_ID]: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8'
}
export const WETH_ADDR: ChainIdAddr = {
  [ABSTRACT_TESTNET_CHAIN_ID]: '0x740810c5CB6a562BC0F4F387dC7cFaDa9f3A7ebf',
  [BASE_CHAIN_ID]: '0x4200000000000000000000000000000000000006',
  [MODE_CHAIN_ID]: '0x4200000000000000000000000000000000000006',
  [SEPOLIA_CHAIN_ID]: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'
}

export const FORWARDER_ADDR: ChainIdAddr = {
  [ABSTRACT_TESTNET_CHAIN_ID]: '0x0000000000000000000000000000000000000000',
  [BASE_CHAIN_ID]: '0xD04F98C88cE1054c90022EE34d566B9237a1203C', // thirdweb trust forwarder
  [MODE_CHAIN_ID]: '0xD04F98C88cE1054c90022EE34d566B9237a1203C',
  [SEPOLIA_CHAIN_ID]: '0xD04F98C88cE1054c90022EE34d566B9237a1203C'
}

export const TREASURY_ADDR: ChainIdAddr = {
  [ABSTRACT_TESTNET_CHAIN_ID]: '0x9a7FAC267228f536A8f250E65d7C4CA7d39De766',
  [BASE_CHAIN_ID]: '0x5b15Cbb40Ef056F74130F0e6A1e6FD183b14Cdaf', // dsponsor.eth
  [MODE_CHAIN_ID]: '0x5b15Cbb40Ef056F74130F0e6A1e6FD183b14Cdaf',
  [SEPOLIA_CHAIN_ID]: '0x6a0F850Cc341935Dd004a7C8C5aef3533ba284B9'
}

// https://docs.uniswap.org/contracts/v3/reference/deployments

// SwapRouter02
export const SWAP_ROUTER_ADDR: ChainIdAddr = {
  [ABSTRACT_TESTNET_CHAIN_ID]: '0x5eA0064fE5bc2449472C7DfF9CB4bc5010095392', // https://agentexchange.notion.site/Pattern-Testnet-Contracts-10b5e53a3a724411a2bfc61e6815e57c
  [BASE_CHAIN_ID]: '0x2626664c2603336E57B271c5C0b26F421741e481',
  [MODE_CHAIN_ID]: '0x016e131C05fb007b5ab286A6D614A5dab99BD415', // https://docs.supswap.xyz/developers/smart-contracts/supswap-exchange/v3-contracts
  [SEPOLIA_CHAIN_ID]: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E'
}

// QuoterV2
export const QUOTE_ADDR: ChainIdAddr = {
  [ABSTRACT_TESTNET_CHAIN_ID]: '0x1FFBf27EBa96342A9755c4974b5F28286c41201A', // https://agentexchange.notion.site/Pattern-Testnet-Contracts-10b5e53a3a724411a2bfc61e6815e57c
  [BASE_CHAIN_ID]: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
  [MODE_CHAIN_ID]: '0x5E6AEbab1AD525f5336Bd12E6847b851531F72ba', // https://docs.supswap.xyz/developers/smart-contracts/supswap-exchange/v3-contracts
  [SEPOLIA_CHAIN_ID]: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3'
}

export const DSPONSOR_FACTORY_ADDR: ChainIdAddr = {
  [ABSTRACT_TESTNET_CHAIN_ID]: '0x9FCf7ecdC815B21E18C5eda720Db9e41a6EaE6B9',
  [BASE_CHAIN_ID]: '0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09',
  [MODE_CHAIN_ID]: '0x5cF7F046818E5Dd71bd3E004f2040E0e3C59467D',
  [SEPOLIA_CHAIN_ID]: '0x8Eb94523c3E01E172E1dd446Fecc8af74b6a2244'
}

export const DSPONSOR_ADMIN_ADDR: ChainIdAddr = {
  [ABSTRACT_TESTNET_CHAIN_ID]: '0xBEA0a4E815e5A8b544712144DA3865a1aa69ECD9',
  [BASE_CHAIN_ID]: '0xC6cCe35375883872826DdF3C30557F16Ec4DD94c',
  [MODE_CHAIN_ID]: '0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09',
  [SEPOLIA_CHAIN_ID]: '0x10E0447dDB66f1d33E6b10dB5099FBa231ceCE5C'
}
