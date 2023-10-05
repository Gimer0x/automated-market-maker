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

describe("Pool Factory Test", function () {
  async function deployContracts () {
    const [owner, supplier1, trader1, notOwner] = await ethers.getSigners();

    const uni = await ethers.deployContract("Token", ["Uniswap Token", "UNI"]);
    const dai = await ethers.deployContract("Token", ["DAI Token", "DAI"]);

    const factory = await ethers.deployContract("PoolFactory");

    return {factory, uni,  dai, owner, supplier1, trader1, notOwner };
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

    it("Should allow to create a pair", async () => {
        const { factory, uni, dai, owner } = await loadFixture(initializePool);

        expect(await factory.allPoolsLength()).to.be.equal(ZERO);

        expect(await factory.poolExists(uni, dai)).to.be.equal(false);

        // Create a pool with the tokens UNI and DAI
        await factory.createPool(uni, dai, FEES);

        expect(await factory.allPoolsLength()).to.be.equal(1);

        // Verify that the pair was created
        expect(await factory.poolExists(uni, dai)).to.be.equal(true);

        expect(await factory.poolExists(dai, uni)).to.be.equal(true);
    });

    it("Should initialize the dex pool", async () => {
        const { factory, uni, dai, owner } = await loadFixture(initializePool);

        // Create a pool with the tokens WETH and DAI
        await expect(factory.createPool(uni, dai, FEES))
          .not.to.be.reverted;

        const poolAddress = await factory.getPoolAddress(uni, dai);

        const liquidityPool = await ethers.getContractAt("LiquidityPool", poolAddress);
        expect(await liquidityPool.initialized()).to.be.equal(true);
        expect(await liquidityPool.owner()).to.be.equal(owner.address);
    });

     it("Should validate a pair address", async () => {
        const { factory, uni, dai, owner } = await loadFixture(initializePool);

        const initialAddress = await factory.getPoolAddress(uni, dai);
        expect(initialAddress).to.be.equal(ZeroAddress);

        expect(await factory.poolExists(uni, dai)).to.be.equal(false);

        // Create a pool with the tokens WETH and DAI
        await expect(factory.createPool(uni, dai, FEES))
            .not.to.be.reverted;

        const poolAddress = await factory.getPoolAddress(uni, dai);
        const liquidityPool = await ethers.getContractAt("LiquidityPool", poolAddress);

        const _token0 = await liquidityPool.token0();
        const _token1 = await liquidityPool.token1();
      
        expect(_token0).to.be.equal(uni.target);
        expect(_token1).to.be.equal(dai.target);
    });

    it("Should validate pool creation on both ways", async () => {
        const { factory, uni, dai, owner } = await loadFixture(initializePool);

        // Create a pool with the tokens WETH and DAI
        await factory.createPool(uni, dai, FEES);

        const poolAddressRight = await factory.getPoolAddress(uni, dai);
        const poolAddressLeft = await factory.getPoolAddress(dai, uni);
        
        expect(poolAddressRight).to.be.equal(poolAddressLeft);
    });
  });

});