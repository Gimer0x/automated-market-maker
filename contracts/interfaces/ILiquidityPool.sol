// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ILiquidityPool {
    function owner() external view returns (address);
    function fees() external view returns(uint);
    function addLiquidity(address _to) external returns (uint shares);
    function swapTokens(uint _amountOut, address _to, address _tokenIn) external;
    function removeLiquidity(address _to) external returns (uint amount0, uint amount1);
    function transferFrom(address from, address to, uint256 amount ) external returns (bool);
    function getTokenPairRatio(address _tokenIn, uint _amountIn) external view returns (uint tokenOut);
    function getAmountOut(address _tokenIn, uint _amountIn) external view returns (uint amountOut);
    function getLatestReserves() external view returns (uint _reserve0, uint _reserve1, uint _blockTimestampLast);
    function getReserves(address _tokenIn) external view returns (IERC20 tokenIn, IERC20 tokenOut, uint reserveIn, uint reserveOut);
}