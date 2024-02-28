# d>sponsor contracts

**d>sponsor** revolutionizes the way media and creators engage with sponsorships. By leveraging the power of NFTs, the protocol offers a community-owned ad inventory, enabling seamless and transparent sponsorship management.

![logo d>sponsor](assets/schema%20dsponsor.png)

## Contracts features

### DSponsorAdmin.sol

This main contract is the entrypoint for frontends within the d>sponsor ecosystem. Compatible with any ERC721 contract, it grants each NFT token owner a right to advertise.

This contract provides a set of functions to create and manage sponsorship tokens and ad proposals. It also includes a mechanism to collect minting fees sent to the protocol treasury, and a referral system to track and reward later fee contributions.

On the sponsorship management side:

* A sponsee can specify any set of sponsoring properties, according to its off-chain implementation. This could be an audio URL, a website link, a logo, etc.
* Sponsors can submit data for provided sponsoring properties only
* The sponsee validates (or not) the submitted data.
* Sponsor can transfer a token to another address, new owner will be the only one able to set sponsoring data linked to the `tokenId`

On the fee management side:

* The protocol owner can update the fee basis points.
* The fee mechanism can be used with any call, with minting being a relevant use case.

### DSponsorNFT.sol

Although any ERC721 compliant contract is compatible with d>sponsor protocol, this is an NFT contract that integrates various standards and custom functionalities.

* Pricing in ERC20 tokens & native currency
* Rental capabilities (ERC4907)
* ERC2981 royalties built-in
* Contract owner can set a custom base URI for token metadata and a contract-level metadata URI.

## Deployments addresses

### Polygon Mumbai testnet

* `DSponsorAdmin` contract is deployed to: [`0xA82B4bBc8e6aC3C100bBc769F4aE0360E9ac9FC3`](https://mumbai.polygonscan.com/address/0xA82B4bBc8e6aC3C100bBc769F4aE0360E9ac9FC3)

* An exemple of `DSponsorNFT` deployed: [`0x8C4115060A52DD8693521095f6f150D3F2aaFa53`](https://mumbai.polygonscan.com/address/0x8C4115060A52DD8693521095f6f150D3F2aaFa53)

## Development

### Set up environment

* Check the required and optional environment variables from the `.env_example` file.
* Create your own `.env` file
* Install dependencies and build the project

```
# 1- Environment variables are used for tests and deployment
cp .env_example .env

# 2- Install dependencies
npm i

# 3- Compile contracts
npx hardhat compile
```

### Run tests

```shell
npm run test # with gas reports according hardhat.config.js
```

Check testing coverage with:

```shell
npm run coverage
```

### Deploy

```shell
# deploy in testnet
npm run deploy mumbai

# deploy in mainnet
npm run deploy polygon
```
