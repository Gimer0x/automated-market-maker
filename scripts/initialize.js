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
  
  const daiAddress = "0x8F97c9e52dDfC1F8b03e897c1F7D85db5242b55D";
  const batAddress = "0x0d299b7E262250F1a84fb53AC5cF75176415B48D";
  const uniAddress = "0x3bfCDdf53140f8e87E0c942e3Cb17076C30876FD";
  const wethAddress = "0x90857924Dab0effcBebd7108Eae5bA9060Fdf4a8";
  const factoryAddress = "0x034174932b140352555c138087224c043503974e";
  const routerAddress = "0x65983431d26FdfC8f1A6A9A03732C050A95D3Ee1";

  // Pool Address:0x83531E6467b81723b0E5d2f88105e50465b40Aa4

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
