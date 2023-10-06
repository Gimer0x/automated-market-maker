require("@nomicfoundation/hardhat-toolbox");

require("dotenv").config();
const {
  ALCHEMY_ARBITRUM_MAINNET_RPC,
  ALCHEMY_ARBITRUM_GOERLI_RPC,
  ALCHEMY_SEPOLIA_RPC,
  ETHEREUM_SEPOLIA_KEY,
  ARBITRUM_GOERLI_KEY,
  ARBITRUM_MAINNET_KEY,
  ARBISCAN_APIKEY,
  ETHERSCAN_APIKEY
} = process.env;

module.exports = {
  solidity: "0.8.20",
  networks : {
    arbitrum_goerli: {
      url: ALCHEMY_ARBITRUM_GOERLI_RPC,
      chainId: 421613,
      accounts: [ ARBITRUM_GOERLI_KEY || '']
    },
    sepolia: {
      url: ALCHEMY_SEPOLIA_RPC,
      chainId: 11155111,
      accounts: [ ETHEREUM_SEPOLIA_KEY || '']
    }
  },
  arbiscan: {
    apiKey: ARBISCAN_APIKEY
  },
  etherscan: {
    apiKey: ETHERSCAN_APIKEY
  }
  
};