# Automated Market Maker (AMM) Project
This repository contains a sample of an Automated Market Maker (AMM) developed to show my skills as a Smart Contract developer with Solidity. The architecture of the project is based on the UniswapV2 protocol and implements the constant product model. The project was developed using Hardhat, Ethers.js, javascript, mocha and chai.<br />

These are the addresses of the contracts deployed on the **Sepolia** test network:

**PoolRouter**: [0xDcC0FD6FEC01B50c560eA3E749322F1D9f9C6ec3](https://sepolia.etherscan.io/address/0xDcC0FD6FEC01B50c560eA3E749322F1D9f9C6ec3#code)

**PoolFactory**: [0xA47B4cC48f77dbC0726Fa12eF15c6dbBaff09c79](https://sepolia.etherscan.io/address/0xA47B4cC48f77dbC0726Fa12eF15c6dbBaff09c79#code)

## Smart Contracts ##
1.**LiquidityPool**: This smart contract represents a generic liquidity pool. <br />

2.**PoolFactory**: The pool factory manage and creates different liquidity pools. <br />

3.**PoolRouter**: The router is the contract designed to interact with the pool factory and the liquidity pools. <br />

## Installation and Deployment ##
To execute the project run the following commands:
```
npm install

npx hardhat compile

npx hardat test
```
Remeber that you need to create a .env file and configure an RPC endpoint for the Sepolia Network. [Alchemy](https://www.alchemy.com/) and [Infura](https://www.infura.io/) are very popular service providers. To deploy the contracts to the Sepolia test network follow the next steps:

```
npm run deploy:sepolia
```
Now copy the smart contract addresses into the script: scripts/initialize.js. To create a sample liquidity pool and initialize it execute the following command:

```
npm run initialize:sepolia
```
After this step you created a new pool and you also added liquidity.

This an example of swapping Uni and Dai test tokens on the Sepolia network: 

[https://sepolia.etherscan.io/tx/0xc58b99c41893ab118e02cd71c21bc87b685f4778033f442d3e33b63658ccb885](https://sepolia.etherscan.io/tx/0xc58b99c41893ab118e02cd71c21bc87b685f4778033f442d3e33b63658ccb885)

## Features ##
These are some of the most important features implemented:
* Swapping Token to Token  
* Swapping Ether to Token.
* Create new pools.
* Add and remove liquidity.
* Manage shares.
* Implements the constant product model of UniswapV2.
* Allows swap of tokens with different number of decimals.
* Testing


> [!NOTE]
> Please observe that these contracts are not ready for a production environment. It is necessary to add more functionality and testing.