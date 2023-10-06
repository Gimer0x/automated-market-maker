// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const FEES = 2000;
  const FIFTY = ethers.parseEther("50");
  const ONEHUNDRED = ethers.parseEther("100");
  const initialTokens = ethers.parseEther("10000");

  const daiAddress = "0x53A912943928F6d26696DF9C31B16355Ff4ED924";
  const batAddress = "0x929EA224b9304a2D4A818520eF79C23f22CC7c8e";
  const uniAddress = "0xfe457663234EC1Db6CB4eE472931A9553362440E";
  const wethAddress = "0x6188dbAbdD8e347a69530dF39bA1f167cFCac88a";
  const factoryAddress = "0xA47B4cC48f77dbC0726Fa12eF15c6dbBaff09c79";
  const routerAddress = "0xDcC0FD6FEC01B50c560eA3E749322F1D9f9C6ec3";

  // Pool Address: 0xF580CF8CDbC3009aD4D87E21fE5CA4543ad35Ba4

  const dai = await hre.ethers.getContractAt("Token", daiAddress);
  const bat = await hre.ethers.getContractAt("Token", batAddress);
  const uni = await hre.ethers.getContractAt("Token", uniAddress);
  const weth = await hre.ethers.getContractAt("WETH9", wethAddress);

  const router = await hre.ethers.getContractAt("PoolRouter", routerAddress);
  const factory = await hre.ethers.getContractAt("PoolFactory", factoryAddress);

  await bat.approve(routerAddress, initialTokens);
  await dai.approve(routerAddress, initialTokens);
  await uni.approve(routerAddress, initialTokens);
  await weth.approve(routerAddress, initialTokens);

  console.log("Tokens approved");

  let tx = await factory.createPool(uniAddress, daiAddress, FEES);
  await tx.wait(1);
  
  const pools = await factory.allPoolsLength();
  console.log("Pools: ", pools);
    
  const poolAddress = await factory.getPoolAddress(uniAddress, daiAddress);
  console.log("Pool: ", poolAddress);

  tx = await router.addTokenToTokenLiquidity(uniAddress, daiAddress, FIFTY, ONEHUNDRED, 0, 0);
  await tx.wait(1);

  const pool = await hre.ethers.getContractAt("LiquidityPool", poolAddress);

  console.log("Done!");

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
