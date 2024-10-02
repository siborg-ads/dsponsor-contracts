# DSponsor contracts

*DSponsor* is a decentralized solution for sponsorship that provides funding in exchange for shares in visibility. It aligns the interests of both the sponsors and the sponsees.

This protocol allows anyone to create tokens for advertising spaces. These tokens can be purchased to acquire ad spaces on websites, apps, and more, for a specific time period, granting the exclusive right to place advertisements there.

![logo DSponsor](assets/schema%20dsponsor.png)

## Contracts Features

### DSponsorAdmin.sol

This is the primary contract and serves as the gateway for frontends within the DSponsor ecosystem. It is compatible with any ERC721 contract, providing token owners with the exclusive right to advertise. It is also compatible with ERC4907 to allow token *users* the exclusive right to advertise.

The contract offers functions for creating and managing sponsorship tokens and advertising proposals. It includes a system for collecting minting fees for the protocol's treasury and a referral program to reward contributions to these fees.

- A sponsee can define any number of sponsorship properties, which might include an audio URL, a website link, a logo, etc., based on their off-chain implementation.
- Sponsors are allowed to submit data only for the sponsorship properties provided.
- The sponsee may approve or reject the submitted data.
- A sponsor can transfer a token to another address; the new owner will then be the only one able to set sponsorship data linked to the `tokenId`.
- Includes a built-in Uniswap swap function to enable ERC20 payments from the native currency.

### DSponsorNFT.sol

While any ERC721-compliant contract can be used with the DSponsor protocol, this specific NFT contract incorporates various standards and unique functionalities.

- Allows pricing in ERC20 tokens and the native currency.
- Includes rental capabilities (ERC4907).
- Incorporates ERC2981 royalties.
- Enables the contract owner to define a custom base URI for token metadata and a contract-level metadata URI.

### DSponsorMarketplace.sol

This contract manages secondary sales and includes:

- Direct Listing, English Auctions, and Offer mechanisms.
- When a new bid is placed, the previous bidder is refunded and get also 5% of its bid amount.
- Options for sale or rent.
- Any ERC20 currency, swap built in if paid with the native coin.
- Royalties, fee and protocol rewards mechanisms.

## Deployment Addresses

### Base Mainnet (Chain ID = 8453)

- `DSponsorAdmin`: [`0xC6cCe35375883872826DdF3C30557F16Ec4DD94c`](https://basescan.org/address/0xC6cCe35375883872826DdF3C30557F16Ec4DD94c)

- `DSponsorNFTFactory`: [`0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09`](https://basescan.org/address/0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09)

- Example of `DSponsorNFT` deployed: [`0x141feC749536067fe4b9291FB00a8a398023c7C9`](https://basescan.org/address/0x141feC749536067fe4b9291FB00a8a398023c7C9)

- `DSponsorMarketplace`: [`0x86aDf604B5B72d270654F3A0798cabeBC677C7fc`](https://basescan.org/address/0x86aDf604B5B72d270654F3A0798cabeBC677C7fc)

### Mode Mainnet (Chain ID = 34443)

- `DSponsorAdmin`: [`0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09`](https://explorer.mode.network/address/0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09)

- `DSponsorNFTFactory`: [`0x5cF7F046818E5Dd71bd3E004f2040E0e3C59467D`](https://explorer.mode.network/address/0x5cF7F046818E5Dd71bd3E004f2040E0e3C59467D)

- Example of `DSponsorNFT` deployed: [`0x69d0B85B2F6378229f9EB03E76e82F81D90C2C47`](https://explorer.mode.network/address/0x69d0B85B2F6378229f9EB03E76e82F81D90C2C47)

- `DSponsorMarketplace`: [`0xC6cCe35375883872826DdF3C30557F16Ec4DD94c`](https://explorer.mode.network/address/0xC6cCe35375883872826DdF3C30557F16Ec4DD94c)

### Sepolia Testnet (Chain ID = 11155111)

- `DSponsorAdmin`: [`0x10E0447dDB66f1d33E6b10dB5099FBa231ceCE5C`](https://sepolia.etherscan.io/address/0x10E0447dDB66f1d33E6b10dB5099FBa231ceCE5C)

- `DSponsorNFTFactory`: [`0x8Eb94523c3E01E172E1dd446Fecc8af74b6a2244`](https://sepolia.etherscan.io/address/0x8Eb94523c3E01E172E1dd446Fecc8af74b6a2244)

- Example of `DSponsorNFT` deployed: [`0xe1FDB9bF84368032e352c4A8050fA0a4d7b2D6AE`](https://sepolia.etherscan.io/address/0xe1FDB9bF84368032e352c4A8050fA0a4d7b2D6AE)

- `DSponsorMarketplace`: [`0x0B7f100940f4152D01B42A626ab73f7A62dd7cdC`](https://sepolia.etherscan.io/address/0x0B7f100940f4152D01B42A626ab73f7A62dd7cdC)

### Abstract Testnet (Chain ID = 11124)

- `DSponsorAdmin`: [`0x873eb8d6E65982ea1793BC1eA302ECDDe5874237`](https://explorer.testnet.abs.xyz/address/0x873eb8d6E65982ea1793BC1eA302ECDDe5874237)

- `DSponsorNFTFactory`: [`0xc0ef8D43660cEe1461fA41aab486368bf0bc2D3f`](https://explorer.testnet.abs.xyz/address/0xc0ef8D43660cEe1461fA41aab486368bf0bc2D3f)

- Example of `ERC721Mock` deployed: [`0xe3aCb7d6F6878a72479c9645489e9D531B789528`](https://explorer.testnet.abs.xyz/address/0xe3aCb7d6F6878a72479c9645489e9D531B789528)

- `DSponsorMarketplace`: [`0x3e056f3512a7BE4234d02Fd8ED74c1682D525639`](https://explorer.testnet.abs.xyz/address/0x3e056f3512a7BE4234d02Fd8ED74c1682D525639)

## Development

### Setting Up the Environment

- Refer to the `.env_example` file for the necessary and optional environment variables.
- Create your own `.env` file.
- Install dependencies and compile the project:

```shell
# Set up environment variables for tests and deployment
cp .env_example .env

# Install project dependencies
npm install

# Compile contracts
npx hardhat compile
```

### Running tests

Execute tests with gas reports as configured in `hardhat.config.js`:

```shell
npm run test 
```

To check test coverage:

```shell
npm run coverage
```

### Security analysis

```shell
slither . --checklist  > slither-analysis.md
```

### Deploy

```shell
# deploy in testnet
npm run deploy sepolia

# deploy in mainnet
npm run deploy base
```
