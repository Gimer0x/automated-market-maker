# Decentralized Exchange Project
This repository contains a sample of a Decentralized Exchange developed to show my skills as a Smart Contract developer with Solidity. The project was deveoped using Hardhat, Ethers.js, javascript, mocha and chai. The architecture of the project is based on the UniswapV2 protocol. I implemented the following smart contracts: <br />

## Smart Contracts ##
1.**LiquidityPool**: This smart contract represents a generic liquidity pool. <br />

2.**PoolFactory**: The pool factory manage different liquidity pools. <br />

3.**PoolRouter**: The router is the contract designed to interact with. It obtain information from pools through the pool factory contract. <br />

## Installation and Deployment##
To execute the project run the following commands:
```
npm install

npx hardhat compile

npx hardat test
```
To deploy the contracts to the Sepolia test network follow the next steps:

```
deploy:sepolia
```
Copy the smart contract addresses into the script: scripts/initialize.js. Now to create a sample liquidity pool and add liquidity execute the following command:

```
npm run initialize:sepolia
```

## Features ##
These are some of the most important features implemented:
* Swapping of Token to Token  
* Swapping of Ether to Token
* Add and remove liquidity
* Implements the constant product model of UniswapV2<br />
* Validates tokens with different number of decimals.
* Testing

> [!NOTE]
> Please observe that these contracts are not ready for a production environment. It is necessary to add more functionality and testing.