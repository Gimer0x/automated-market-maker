const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers} = require("hardhat")
const BN = require('bn.js');

const ZERO = ethers.parseEther("0");
const ONE  = ethers.parseEther("1"); 
const FIVE = ethers.parseEther("5");
const TEN  = ethers.parseEther("10");
const FACTOR = 100000;
const FEES = 2000;
const initialTokens = ethers.parseEther("100");
const ZeroAddress   = ethers.ZeroAddress;

describe("Pool Router Test", function () {
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

    return {router, factory, uni,  dai, weth, owner, supplier1, supplier2, trader1, trader2, notOwner };
  }

  async function beforeAddingLiquidity () {
    const { router, factory, uni, dai, weth, owner, supplier1, supplier2, trader1, trader2, notOwner} = await loadFixture(deployContracts);

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
    
    return { pool, router, factory, uni,  dai, weth, owner, supplier1, supplier2, trader1, trader2, notOwner};
  }

  async function beforeSwappingTokens () { 
    const { pool, router, factory, uni, dai, weth, owner, supplier1, supplier2, trader1, trader2, notOwner} = await loadFixture(beforeAddingLiquidity);

    await expect (router.connect(supplier1)
          .addTokenToTokenLiquidity(uni, dai, FIVE, TEN, 0, 0))
          .not.to.be.reverted;

    expect(await pool.initialized()).to.be.equal(true);
        
    // Verify reserves.
    const [reserve0, reserve1, ] = await pool.getLatestReserves();

    expect(reserve0).to.be.equal(FIVE);
    expect(reserve1).to.be.equal(TEN);
    return { pool, router, factory, uni, dai, weth, owner, supplier1, supplier2, trader1, trader2, notOwner};
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

    it("Should validate the tokens amount out", async () => {

    });
  });

  describe("Test swap tokens", () => {
    it("Should validate the tokens amount out", async () => {
      const { pool, router, factory, uni, dai, owner, supplier1, supplier2, trader1, trader2, notOwner} = await loadFixture(beforeSwappingTokens);

      const amountOutRouter = await router.getPoolAmountOut(uni, dai, ONE);

      const [,,reserveIn, reserveOut] = await pool.getReserves(uni);
      
      const nFactor = BigInt(FACTOR);
      const nFees = BigInt(FEES);

      const [,amountIn] = await router.getAmountIn(ONE);

      const amountInWithFee = (amountIn * (nFactor - nFees))/nFactor;
      const poolAmountOut = (reserveOut * amountInWithFee)/(reserveIn + amountInWithFee);

      expect(amountOutRouter).to.be.equal(poolAmountOut);
    });

    it("Should be able to swap tokens", async () => {
      const { pool, router, factory, uni, dai, owner, supplier1, supplier2, trader1, trader2, notOwner} = await loadFixture(beforeSwappingTokens);
      
      await expect(router.connect(trader1)
          .swapTokenToToken(uni, dai, ONE, ZERO))
          .not.to.be.revertedWith;
    });

    it("should be able to swap in both directions", async() => {
      const { pool, router, factory, uni, dai, owner, supplier1, supplier2, trader1, trader2, notOwner} = await loadFixture(beforeSwappingTokens);
      
      await expect(router.connect(trader1)
          .swapTokenToToken(dai, uni, ONE, ZERO))
          .not.to.be.revertedWith;
    });

    it("should be able to obtain the right amount", async () => {
      const { pool, router, factory, uni, dai, owner, supplier1, supplier2, trader1, trader2, notOwner} = await loadFixture(beforeSwappingTokens);
      const amountOut = await router.getPoolAmountOut(uni, dai, ONE);

      await expect(
        router.connect(trader1).swapTokenToToken(uni, dai, ONE, ZERO)
      ).to.changeTokenBalances(dai, [trader1], [amountOut]);
    });

    it("Verify correct logs after swaping a token", async () => {
        const { pool, router, factory, uni, dai, owner, supplier1, supplier2, trader1, trader2, notOwner} = await loadFixture(beforeSwappingTokens);
        
        const poolFees = await pool.fees();
        const amountOut = await router.getPoolAmountOut(uni,dai, ONE);

        await expect(router.connect(trader1).swapTokenToToken(uni, dai, ONE, ZERO))
          .to.emit(router, "LogSwapTokenToToken")
          .withArgs(
              trader1.address, uni.target, dai.target, pool.target, poolFees, ONE, amountOut 
          );
    });

    it("Should owner receive multiple token fees", async () => {
        const { pool, router, factory, uni, dai, owner, supplier1, supplier2, trader1, trader2, notOwner} = await loadFixture(beforeSwappingTokens);

        const FIRST_TRADE = ONE;
        const SECOND_TRADE = FIVE;
        const THIRD_TRADE = TEN
        const TOTAL_TRADE = ONE + FIVE + TEN;

        const ownerFees = await router.ownerFees();
        const fees = (TOTAL_TRADE * ownerFees) / BigInt(FACTOR);

        const daiBalanceBefore = await dai.balanceOf(owner.address);

        const amountOut1 = await router.getPoolAmountOut(dai,uni, FIRST_TRADE);
        await router.connect(trader1).swapTokenToToken(dai, uni, FIRST_TRADE, amountOut1)
        
        const amountOut2 = await router.getPoolAmountOut(dai,uni, SECOND_TRADE);
        await router.connect(trader2).swapTokenToToken(dai, uni, SECOND_TRADE, amountOut2)

        const amountOut3 = await router.getPoolAmountOut(dai,uni, THIRD_TRADE);
        await router.connect(trader1).swapTokenToToken(dai, uni, THIRD_TRADE, amountOut3)

        const daiBalanceAfter = await dai.balanceOf(owner.address);

        const earnDaiFees = daiBalanceAfter - daiBalanceBefore;

        expect(earnDaiFees).to.be.equal(fees);
        
      });
  });

  async function initEtherDaiPool () {
      const { pool, router, factory, uni, dai, weth, owner, supplier1, supplier2, trader1, trader2, notOwner} = await loadFixture(beforeSwappingTokens);

      await expect(factory.createPool(weth, dai, FEES))
            .not.to.be.reverted;

      const amountOut = await router.getPoolAmountOut(dai, weth, ONE);

      await weth.connect(supplier1).approve(router.target, initialTokens);
      await weth.connect(supplier1).deposit({value: initialTokens});

      await expect (router.connect(supplier1)
          .addLiquidityETH(dai.target, FIVE, 0, 0, {value: TEN}))
          .not.to.be.reverted;

      const poolEtherAddress = await factory.getPoolAddress(weth, dai);
      const poolEther = await ethers.getContractAt("LiquidityPool", poolEtherAddress);

      return { poolEther, router, amountOut, factory, uni, dai, weth, owner, supplier1, supplier2, trader1, trader2, notOwner};
  }

  describe("Test swap Ether to Token", () => {
      it("Should be able to swap Ether to Token",  async () => {
        const { poolEther, router, factory, amountOut, uni, dai, weth, owner, supplier1, supplier2, trader1, trader2, notOwner} = await loadFixture(initEtherDaiPool);

        await expect(
          router.connect(trader1).swapETHForTokens(dai, amountOut, {value: ONE})
        ).not.to.be.reverted;

        await expect(
          router.connect(trader1).swapETHForTokens(dai, amountOut, {value: ONE})
        ).to.changeEtherBalance(trader1, BigInt(-1) * ONE);

      });

      it("Should be able to validate shares", async () => {
        const { poolEther, router, factory, amountOut, uni, dai, weth, owner, supplier1, supplier2, trader1, trader2, notOwner} = await loadFixture(initEtherDaiPool);
        
        await weth.connect(supplier2).approve(router.target, initialTokens);
        await weth.connect(supplier2).deposit({value: TEN});

        await expect(router.connect(supplier2)
          .addLiquidityETH(dai.target, FIVE, 0, 0, {value: TEN}))
          .not.to.be.reverted;

        const shares1 = await poolEther.balanceOf(supplier1);
        const shares2 = await poolEther.balanceOf(supplier2);
        const totalShares = await poolEther.totalSupply();
        expect(totalShares).to.be.equal(shares1 + shares2);
      });

      it("Should be able to swap tokens for Ether", async () => {
        const { poolEther, router, factory, amountOut, uni, dai, weth, owner, supplier1, supplier2, trader1, trader2, notOwner} = await loadFixture(initEtherDaiPool);

        const amountEtherOut = await router.getPoolAmountOut(dai, weth, FIVE);

        await expect(
          router.connect(trader1).swapTokensForETH(dai, FIVE, amountEtherOut)
        ).to.changeEtherBalance(trader1, amountEtherOut);
      });
  });

});