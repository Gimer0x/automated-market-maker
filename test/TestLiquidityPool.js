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

    const dexPool = await ethers.deployContract("LiquidityPool");

    return { dexPool, uni,  dai, owner, supplier1, trader1, notOwner };
  }

  async function initializePool () {
    const { dexPool, uni, dai, owner, supplier1, trader1, notOwner} = await loadFixture(deployContracts);

    await expect(dexPool.initPool(dai, uni, FEES))
      .not.to.be.reverted;

    await uni.transfer(supplier1, initialTokens);
    await dai.transfer(supplier1, initialTokens);
    await uni.transfer(trader1, initialTokens);
    await dai.transfer(trader1, initialTokens);
    
    await uni.connect(supplier1).approve(dexPool, initialTokens);
    await dai.connect(supplier1).approve(dexPool, initialTokens);
    await uni.connect(trader1).approve(dexPool, initialTokens);
    await dai.connect(trader1).approve(dexPool, initialTokens);

    await uni.connect(supplier1).transfer(dexPool, TEN);
    await dai.connect(supplier1).transfer(dexPool, FIVE);

    return { dexPool, uni,  dai, owner, supplier1,  trader1, notOwner};
  }

  describe("Test setup and initialization", () => {
    it("Should be initialized only by contract Owner", async () => {
      const { dexPool, uni, dai, notOwner} = await loadFixture(deployContracts);

      await expect(dexPool.connect(notOwner).initPool(uni, dai, FEES))
          .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not be initilized with zero addresses", async () => {
      const { dexPool, uni, dai} = await loadFixture(deployContracts);

      await expect(dexPool.initPool(ZeroAddress, dai, FEES))
          .to.be.revertedWith("zero address not allowed!");

      await expect(dexPool.initPool(uni, ZeroAddress, FEES))
          .to.be.revertedWith("zero address not allowed!");
    });

    it("Should validate users funds", async () => {
      const { dexPool, uni, dai, supplier1} = await loadFixture(initializePool);

      expect(await uni.balanceOf(supplier1))
        .to.be.equal(initialTokens - TEN);

      expect(await dai.balanceOf(supplier1))
        .to.be.equal(initialTokens - FIVE);

      expect(await uni.balanceOf(dexPool.target))
        .to.be.equal(TEN);

      expect(await dai.balanceOf(dexPool.getAddress()))
        .to.be.equal(FIVE);
    });

    it("Should not initialize newly created pool more than once", async () => {
      const { dexPool, uni, dai } = await loadFixture(initializePool);
      
      await expect(dexPool.initPool(dai, uni, FEES))
          .to.be.revertedWith("initialization not allowed!");
    });

    it("Should validate the owner of the contract", async () => {
      const { dexPool, owner} = await loadFixture(deployContracts);

      expect(await dexPool.owner()).to.be.equal(owner.address);
    })
  });

   describe("Validate liquidity pool fee value", () => {
      it("Should be able to accept zero swapping fees", async () => {
        const { dexPool } = await loadFixture(initializePool);
        const _newFees = ZERO;

        await dexPool.setPoolFees(_newFees);
        expect(await dexPool.fees()).to.equal(_newFees);
      });

      it("Should not be able to change swapping fees if not owner", async () => {
        const { dexPool, notOwner } = await loadFixture(initializePool);
        const newFees = 4;

        await expect(dexPool.connect(notOwner).setPoolFees(newFees))
          .to.be.revertedWith("Ownable: caller is not the owner");
      });
      
      it("Should be a different new fee value", async () => {
        const { dexPool } = await loadFixture(initializePool);
        const newFees = FEES;

        await expect(dexPool.setPoolFees(newFees))
          .to.be.revertedWith("fees should be different!");
      });
  });

  describe("Test Liquidity Pool contract",  () =>  {
    it("Should allow to add liquidity", async () => {
        const { dexPool, supplier1} = await loadFixture(initializePool);

        await expect(dexPool.connect(supplier1).addLiquidity(supplier1.address))
            .not.to.be.reverted;
    });

    it("Should be able to swap tokens with fees", async () => {
      const { dexPool, uni, dai, supplier1, trader1} = await loadFixture(initializePool);

      const uniInitialBalance = await uni.balanceOf(trader1.address);

      await expect(dexPool.connect(supplier1).addLiquidity(supplier1.address))
        .not.to.be.reverted;

      // tokenOut = ( reserves1 * tokenIn) / (reserves0 + tokensIn )
      const tokensOut = await dexPool.getAmountOut(uni, ONE);
      
      await uni.connect(trader1).transfer(dexPool, ONE);
                   
      await expect(
        dexPool.connect(trader1).swapTokens(tokensOut, trader1.address, uni.target)
      ).to.changeTokenBalances(dai, [trader1], [tokensOut]);

      const uniNewBalance = (await uni.balanceOf(trader1.address));
      expect(uniNewBalance).to.be.equal(uniInitialBalance - ONE);

      const shares = await dexPool.balanceOf(supplier1.address);
      const _totalSupply = await dexPool.totalSupply();

      expect(_totalSupply).to.be.equal(shares);
    });

    it("Should be able to validate tokens amount after swapping", async() => {
      const { dexPool, uni, dai, supplier1, trader1} = await loadFixture(initializePool);

      const uniInitialBalance = await uni.balanceOf(trader1);
      const daiInitialBalance = await dai.balanceOf(trader1);

      await expect(dexPool.connect(supplier1).addLiquidity(supplier1))
            .not.to.be.reverted;

      const tokensOut = await dexPool.getAmountOut(uni, ONE);

      // tokenOut = ( reserves1 * tokenIn) / (reserves0 + tokensIn)
      await uni.connect(trader1).transfer(dexPool, ONE);
                
      await expect(dexPool.connect(trader1).swapTokens(tokensOut, trader1, uni))
        .not.to.be.reverted;

      const uniNewBalance = (await uni.balanceOf(trader1));
      const daiNewBalance = (await dai.balanceOf(trader1));

      expect(uniNewBalance).to.be.equal(uniInitialBalance - ONE);
      expect(tokensOut).to.be.equal(daiNewBalance - daiInitialBalance);
    });


    it("Should be able to validate tokens amount after swapping", async() => {
      const { dexPool, uni, dai, supplier1, trader1} = await loadFixture(initializePool);

      await expect(dexPool.connect(supplier1).addLiquidity(supplier1))
            .not.to.be.reverted;

      const tokensOut = await dexPool.getAmountOut(uni, ONE);

      // tokenOut = ( reserves1 * tokenIn) / (reserves0 + tokensIn)
      await uni.connect(trader1).transfer(dexPool, ONE);
                
      await expect(dexPool.connect(trader1).swapTokens(tokensOut, trader1, uni))
        .not.to.be.reverted;

    });

    it("Should be able to remove all liquidity", async () => {
        const { dexPool, uni, dai, supplier1, owner} = await loadFixture(initializePool);
        
        expect(await dexPool.connect(supplier1).addLiquidity(supplier1))
          .not.to.be.reverted;

        const totalSupply = await dexPool.totalSupply();
        const shares = await dexPool.balanceOf(supplier1);
        expect(totalSupply).to.be.equal(shares);

        await dexPool.connect(supplier1).approve(owner, shares);
        await dexPool.transferFrom(supplier1.address, dexPool, shares);
        
        await expect(
              dexPool.connect(supplier1).removeLiquidity(supplier1)
            )
            .to.changeTokenBalance(uni, supplier1, TEN);

        const _shares = await dexPool.balanceOf(supplier1);
        const _totalSupply = await dexPool.totalSupply();

        expect(_shares).to.be.equal(ZERO);
        expect(_totalSupply).to.be.equal(ZERO);
      });
  });

});