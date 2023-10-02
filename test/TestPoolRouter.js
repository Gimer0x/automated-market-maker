const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat")

const ZERO = ethers.parseEther("0");
const ONE  = ethers.parseEther("1"); 
const FIVE = ethers.parseEther("5");
const TEN  = ethers.parseEther("10");
const FEES = 2000;
const initialTokens = ethers.parseEther("100");
const ZeroAddress   = ethers.ZeroAddress;

describe("Liquidity Pool", function () {
  async function deployContracts () {
    const [owner, supplier1, trader1, notOwner] = await ethers.getSigners();

    const uni = await ethers.deployContract("Token", ["Uniswap Token", "UNI"]);
    const dai = await ethers.deployContract("Token", ["DAI Token", "DAI"]);
    const weth = await ethers.deployContract("WETH9");

    const factory = await ethers.deployContract("PoolFactory");
    const router = await ethers.deployContract("PoolRouter", [factory.target, weth.target]);

    return {router, factory, uni,  dai, owner, supplier1, trader1, notOwner };
  }

  async function initializePool () {
    const { factory, uni, dai, owner, supplier1, trader1, notOwner} = await loadFixture(deployContracts);

    await uni.transfer(supplier1, initialTokens);
    await dai.transfer(supplier1, initialTokens);
    await uni.transfer(trader1, initialTokens);
    await dai.transfer(trader1, initialTokens);
    
    return { factory, uni,  dai, owner, supplier1,  trader1, notOwner};
  }

  describe("Test setup and initialization", () => {
    it("Should be set the right contract Owner", async () => {
      const { factory, uni, dai, owner} = await loadFixture(deployContracts);

      expect(await factory.owner()).to.be.equal(owner.address);
    });

    
  });

});