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

### Base Sepolia Testnet (Chain ID = 84532)

- `DSponsorAdmin`: [`0x5cF7F046818E5Dd71bd3E004f2040E0e3C59467D`](https://sepolia.basescan.org/address/0x5cF7F046818E5Dd71bd3E004f2040E0e3C59467D)

- `DSponsorNFTFactory`: [`0x73adbA5994B48F5139730BE55622f298445179B0`](https://sepolia.basescan.org/address/0x73adbA5994B48F5139730BE55622f298445179B0)

- Example of `DSponsorNFT` deployed: [`0x90b692492B8be931392AeC358843b8b33675fAD2`](https://sepolia.basescan.org/address/0x90b692492B8be931392AeC358843b8b33675fAD2)

- `DSponsorMarketplace`: [`0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09`](https://sepolia.basescan.org/address/0xdf42633BD40e8f46942e44a80F3A58d0Ec971f09)

### Sepolia Testnet (Chain ID = 11155111)

- `DSponsorAdmin`: [`0x22554D70702C60A5fa30297908005B6cE19eEf51`](https://sepolia.etherscan.io/address/0x22554D70702C60A5fa30297908005B6cE19eEf51)

- `DSponsorNFTFactory`: [`0x05B90b7CfbcEd967C20684b9bf2fAb196BDb1DBd`](https://sepolia.etherscan.io/address/0x05B90b7CfbcEd967C20684b9bf2fAb196BDb1DBd)

- Example of `DSponsorNFT` deployed: [`0x51A533E5FBc542B0Df00c352D8A8A65Fff1727ac`](https://sepolia.etherscan.io/address/0x51A533E5FBc542B0Df00c352D8A8A65Fff1727ac)

- `DSponsorMarketplace`: [`0xd36097D256F31F1BF5aa597dA7C3E098d466aD13`](https://sepolia.etherscan.io/address/0xd36097D256F31F1BF5aa597dA7C3E098d466aD13)

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
npm run deploy arbitrum
```
