// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IPoolFactory {
    //event LogNewPair(address indexed token0, address indexed token1, address pair, uint);

    function owner() external view returns (address);
    function allPairsLength() external view returns (uint);
    function allPairs(uint) external view returns (address pair);
    function getPairAddress(address tokenA, address tokenB) external view returns (address pair);
    function createPair(address tokenA, address tokenB, uint fees) external returns (address pair);
}