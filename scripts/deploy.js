// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {

  const Dai = await hre.ethers.deployContract("Token", ["DAI Token", "DAI"]);
  await Dai.waitForDeployment();

  const Bat = await hre.ethers.deployContract("Token", ["BAT Token", "BAT"]);
  await Bat.waitForDeployment();

  const Uni = await hre.ethers.deployContract("Token", ["UNI Token", "UNI"]);
  await Uni.waitForDeployment();

  const weth = await hre.ethers.deployContract("WETH9");
  await weth.waitForDeployment();

  const factory = await hre.ethers.deployContract("PoolFactory");
  await factory.waitForDeployment();

  const router = await hre.ethers.deployContract("PoolRouter", [
        factory.target, 
        weth.target
  ]);

  await router.waitForDeployment();

  console.log(`\nconst daiAddress = "${Dai.target}";`);
  console.log(`const batAddress = "${Bat.target}";`);
  console.log(`const uniAddress = "${Uni.target}";`);
  console.log(`const wethAddress = "${weth.target}";`);
  console.log(`const factoryAddress = "${factory.target}";`);
  console.log(`const routerAddress = "${router.target}";\n`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
