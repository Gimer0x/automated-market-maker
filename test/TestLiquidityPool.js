const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const ZERO = ethers.parseEther("0");
const FIVE = ethers.parseEther("5");
const TEN = ethers.parseEther("10");
const FEES = 2000;
const initialTokens = ethers.parseEther("100");

describe("Liquidity Pool", function () {
  async function initializePool () {
    const [owner, supplier1] = await ethers.getSigners();

    const uni = await ethers.deployContract("Token", ["Uniswap Token", "UNI"]);
    const dai = await ethers.deployContract("Token", ["DAI Token", "DAI"]);

    const dexPool = await ethers.deployContract("LiquidityPool");

    await expect(dexPool.initPool(dai, uni, FEES))
      .not.to.be.reverted;

    await uni.transfer(supplier1.address, initialTokens);
    await dai.transfer(supplier1.address, initialTokens);
    
    await uni.connect(supplier1).approve(dexPool, initialTokens);
    await dai.connect(supplier1).approve(dexPool, initialTokens);

    await uni.connect(supplier1).transfer(dexPool, TEN);
    await dai.connect(supplier1).transfer(dexPool, FIVE);

    return { dexPool, uni,  dai, owner, supplier1};
  }

  describe("Test Liquidity Pool contract",  () =>  {

    it("Should validate users funds", async () => {
        const { dexPool, uni, dai, supplier1} = await loadFixture(initializePool);

        expect(await uni.balanceOf(supplier1.address))
            .to.be.equal(initialTokens - TEN);

        expect(await dai.balanceOf(supplier1.address))
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

    it("Should allow to add liquidity", async () => {
        const { dexPool, supplier1} = await loadFixture(initializePool);

        await expect(dexPool.connect(supplier1).addLiquidity(supplier1.address))
            .not.to.be.reverted;
    });

    it("Should be able to swap tokens", async () => {
      const { dexPool, uni, dai, supplier1} = await loadFixture(initializePool);

      const uniInitialBalance = await uni.balanceOf(supplier1.address);

      await expect(dexPool.connect(supplier1).addLiquidity(supplier1.address))
        .not.to.be.reverted;

      // tokenOut = ( reserves1 * tokenIn) / (reserves0 + tokensIn )
      const tokensOut = await dexPool.getTokensOutAmount(uni, FIVE);

      await uni.connect(supplier1).transfer(dexPool, FIVE);
                   
      await expect(
        dexPool.connect(supplier1).swapTokens(tokensOut, supplier1.address, uni)
      ).to.changeTokenBalances(dai, [supplier1], [tokensOut]);

      const uniNewBalance = (await uni.balanceOf(supplier1.address));
      expect(uniNewBalance).to.be.equal(uniInitialBalance - FIVE);

      const shares = await dexPool.balanceOf(supplier1.address);
      const _totalSupply = await dexPool.totalSupply();

      expect(_totalSupply).to.be.equal(shares);
    });

    it("Should be able to remove all liquidity", async () => {
        const { dexPool, uni, dai, supplier1, owner} = await loadFixture(initializePool);
        
        expect(await dexPool.connect(supplier1).addLiquidity(supplier1.address))
          .not.to.be.reverted;

        const totalSupply = await dexPool.totalSupply();
        const shares = await dexPool.balanceOf(supplier1.address);
        expect(totalSupply).to.be.equal(shares);

        await dexPool.connect(supplier1).approve(owner, shares);
        await dexPool.transferFrom(supplier1.address, dexPool, shares);
        
        await expect(
              dexPool.connect(supplier1).removeLiquidity(supplier1.address)
            )
            .to.changeTokenBalance(uni, supplier1, TEN);

        const _shares = await dexPool.balanceOf(supplier1.address);
        const _totalSupply = await dexPool.totalSupply();

        expect(_shares).to.be.equal(ZERO);
        expect(_totalSupply).to.be.equal(ZERO);
      });
  });

});