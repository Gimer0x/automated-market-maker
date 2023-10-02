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
    const [owner, supplier1, supplier2, trader1, trader2, notOwner] = await ethers.getSigners();

    const uni = await ethers.deployContract("Token", ["Uniswap Token", "UNI"]);
    const dai = await ethers.deployContract("Token", ["DAI Token", "DAI"]);
    const weth = await ethers.deployContract("WETH9");

    const factory = await ethers.deployContract("PoolFactory");
    const router = await ethers.deployContract("PoolRouter", [factory.target, weth.target]);

    await uni.transfer(supplier1, initialTokens);
    await uni.transfer(supplier2, initialTokens);
    await uni.transfer(trader1, initialTokens);
    await uni.transfer(trader2, initialTokens);

    await dai.transfer(supplier1, initialTokens);
    await dai.transfer(supplier2, initialTokens);
    await dai.transfer(trader1, initialTokens);
    await dai.transfer(trader2, initialTokens);

    return {router, factory, uni,  dai, owner, supplier1, supplier2, trader1, trader2, notOwner };
  }

  async function beforeAddingLiquidity () {
    const { router, factory, uni, dai, owner, supplier1, supplier2, trader1, trader2, notOwner} = await loadFixture(deployContracts);

    await expect(factory.createPool(uni, dai, FEES))
        .not.to.be.reverted;

    // Verify that the pair was created
    expect(await factory.poolExists(uni, dai)).to.be.equal(true);
        
    // Obtain the pool address
    const poolAddress = await factory.getPoolAddress(uni, dai);
        
    await uni.connect(supplier1).approve(router, initialTokens);
    await dai.connect(supplier1).approve(router, initialTokens);

    await uni.connect(supplier2).approve(router, initialTokens);
    await dai.connect(supplier2).approve(router, initialTokens);

    await uni.connect(trader1).approve(router, initialTokens);
    await dai.connect(trader1).approve(router, initialTokens);

    await uni.connect(trader2).approve(router, initialTokens);
    await dai.connect(trader2).approve(router, initialTokens);

    const pool = await ethers.getContractAt("LiquidityPool", poolAddress);
    
    return { pool, router, factory, uni,  dai, owner, supplier1, supplier2, trader1, trader2, notOwner};
  }

  async function beforeSwappingTokens () { 
    const { pool, router, factory, uni, dai, owner, supplier1, supplier2, trader1, trader2, notOwner} = await loadFixture(beforeAddingLiquidity);

    await expect (router.connect(supplier1)
          .addTokenToTokenLiquidity(uni, dai, FIVE, TEN, 0, 0))
          .not.to.be.reverted;

    expect(await pool.initialized()).to.be.equal(true);
        
    // Verify reserves.
    const [reserve0, reserve1, ] = await pool.getLatestReserves();

    expect(reserve0).to.be.equal(FIVE);
    expect(reserve1).to.be.equal(TEN);
    return { pool, router, factory, uni, dai, owner, supplier1, supplier2, trader1, trader2, notOwner};
  }


  describe("Test setup and initialization", () => {
    it("Should be set the right contract Owner", async () => {
      const { pool, router, factory, uni, dai, owner} = await loadFixture(deployContracts);

      expect(await factory.owner()).to.be.equal(owner.address);
    });

    it("Should be able to add liquidity", async () => {
      const { pool, router, factory, uni, dai, owner, supplier1} = await loadFixture(beforeAddingLiquidity);

      await expect (router.connect(supplier1)
          .addTokenToTokenLiquidity(uni, dai, FIVE, TEN, 0, 0))
          .not.to.be.reverted;
    });

    it("Should be able to add liquidity in reverse order", async () => {
      const { pool, router, factory, uni, dai, owner, supplier1} = await loadFixture(beforeAddingLiquidity);

      await expect (router.connect(supplier1)
          .addTokenToTokenLiquidity(dai, uni, TEN, FIVE, 0, 0))
          .not.to.be.reverted;
    });

    it("Should validate zero values when adding liquidity", async () => {
        const { pool, router, factory, uni, dai, owner, supplier1} = await loadFixture(beforeAddingLiquidity);

        await expect(router.connect(supplier1)
          .addTokenToTokenLiquidity(dai, uni, ZERO, TEN, 0, 0))
          .to.be.revertedWith("TokenA amount is zero!");

        await expect(router.connect(supplier1)
          .addTokenToTokenLiquidity(dai, uni, FIVE, ZERO, 0, 0))
          .to.be.revertedWith("TokenB amount is zero!");
    });

    it("Should validate zero addresses when adding liquidity", async () => {
        const { pool, router, factory, uni, dai, owner, supplier1} = await loadFixture(beforeAddingLiquidity);

        await expect(router.connect(supplier1)
          .addTokenToTokenLiquidity(dai, uni, ZERO, TEN, 0, 0))
          .to.be.revertedWith("TokenA amount is zero!");

        await expect(router.connect(supplier1)
          .addTokenToTokenLiquidity(ZeroAddress, dai, FIVE, TEN, 0, 0))
          .to.be.revertedWith("token address should not be zero!");
      });
  });

  describe("Test setup and initialization", () => {
    it("Should be able to swap tokens", async () => {
      const { pool, router, factory, uni, dai, owner, supplier1, supplier2, trader1, trader2, notOwner} = await loadFixture(beforeSwappingTokens);
      
      await expect(router.connect(trader1)
          .swapTokenToToken(uni, dai, ONE, ZERO))
          .not.to.be.revertedWith;
    }); 
  });

});