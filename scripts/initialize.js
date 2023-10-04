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
  
  const daiAddress = "0x5D56c511572B57eD24aB89f572659aC5016FB0BA";
  const batAddress = "0xAE65DD502c1A086A324a97248bB75e52c6a2A409";
  const uniAddress = "0x38bc780e0f42c3108a75FA6a5d762D2f11D661D4";
  const wethAddress = "0xB7C573fB7a38a68FE55D7C66BD1cdef880c8301F";
  const factoryAddress = "0x25AEfC6A20844Eeca35637cFADC7773537Ea287c";
  const routerAddress = "0x124B8c59A85859466E517Cd1529bEB25a55bfEa7";

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

  let tx = await factory.createPool(batAddress, daiAddress, FEES);
  await tx.wait(1);
  
  const pools = await factory.allPoolsLength();
  console.log("Pools: ", pools);
    
  const poolAddress = await factory.getPoolAddress(batAddress, daiAddress);
  console.log("Pool: ", poolAddress);

  tx = await router.addTokenToTokenLiquidity(batAddress, daiAddress, FIFTY, ONEHUNDRED, 0, 0);
  await tx.wait(1);

  const pool = await hre.ethers.getContractAt("LiquidityPool", poolAddress);

  console.log("Total shares: ", await pool.totalSupply());

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
