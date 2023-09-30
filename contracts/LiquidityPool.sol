// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TokenPool} from "./utils/TokenPool.sol";
import {Math} from "./utils/Math.sol";

contract LiquidityPool is TokenPool, ReentrancyGuard, Pausable{
    using SafeERC20 for IERC20;

    IERC20 public token0;
    IERC20 public token1;

    uint public constant MAX_FEE_PERCENT = 2000; // 2%
    uint private constant FACTOR = 100000;
    uint private reserve0;
    uint private reserve1;
    uint public fees;
    uint private lastTimestamp;    
    bool public initialized;
    
    modifier onlyTokenInPool(address _tokenIn) {
        require(
            _tokenIn == address(token0) || _tokenIn == address(token1),
            "token is not supported!"
        );
        _;
    }

    event LogWithdrawIncorrectDeposit(address _tokenAddress, address _receiver);

    constructor() {}

    function initPool(address _token0, address _token1, uint _fees)
        external
        onlyOwner
    {
        require(!initialized, 'initialization not allowed!');
        require(_token0 != address(0) && _token1 != address(0), "zero address not allowed!");
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);

        fees = _fees;
        initialized = true;
    }

    function getLatestReserves() 
        public 
        view 
        returns (uint _reserve0, uint _reserve1, uint _lastTimestamp) 
    {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _lastTimestamp = lastTimestamp;
    }

    function setLiquidityPoolFees(uint _newFees)
        external 
        onlyOwner
    {
        require(_newFees != fees, "fees should be different!");
        require(_newFees <=  MAX_FEE_PERCENT, "fees exceed limit!");
        fees = _newFees;
    }

    function _updateReserves(uint _reserve0, uint _reserve1) 
        private
    {
        reserve0 = _reserve0;
        reserve1 = _reserve1;
        lastTimestamp = block.timestamp;
    }

    function swapTokens(uint _amountOut, address _to, address _tokenIn)
        whenNotPaused
        nonReentrant
        external
    {
        require(_amountOut > 0, "amountOut should be greater than zero!");
        
        (IERC20 tokenIn, IERC20 tokenOut, uint reserveIn, uint reserveOut) = getReserves(_tokenIn);
        
        require(_amountOut < reserveOut, "not enough reserveOut!");
        
        // Transfer token out to msg.sender
        IERC20(tokenOut).safeTransfer(_to, _amountOut);
        
        uint balance0 = tokenIn.balanceOf(address(this));
        uint balance1 = tokenOut.balanceOf(address(this));
        
        ( uint newReserve0, uint newReserve1 ) = 
            _tokenIn == address(token0) ? (balance0, balance1) : (balance1, balance0);

        // Update reserves
        _updateReserves(newReserve0, newReserve1);        

        // Fees are invested again in the pool!
        require(newReserve0 * newReserve1 >= reserveIn * reserveOut, "swap failed!");
    }

    function getReserves(address _tokenIn) 
        public
        view
        returns (IERC20 tokenIn, IERC20 tokenOut, uint reserveIn, uint reserveOut) 
    {
        bool isToken0 = _tokenIn == address(token0);
        (   
            tokenIn, tokenOut, reserveIn,  reserveOut
        ) = isToken0
            ? (token0, token1, reserve0, reserve1)
            : (token1, token0, reserve1, reserve0);
    }

    function getTokensOutAmount(address _tokenIn, uint _amountIn)
        external
        view
        onlyTokenInPool(_tokenIn)
        returns (uint amountOut)
    {       
        (,, uint reserveIn, uint reserveOut) = getReserves(_tokenIn);
        uint amountInWithFee = (_amountIn * (FACTOR-fees)) / FACTOR;
        amountOut = (reserveOut * amountInWithFee)/(reserveIn + amountInWithFee);
    }

    function getTokenPairRatio(address _tokenIn, uint _amountIn)
        external
        view
        onlyTokenInPool(_tokenIn)
        returns (uint tokenOut)
    {
        (,, uint reserveIn, uint reserveOut) = getReserves(_tokenIn);

        tokenOut = (reserveOut * _amountIn) / reserveIn;
    }

    function addLiquidity(address _to)
        external
        whenNotPaused
        returns (uint shares)
    {
        (uint _reserve0, uint _reserve1,) = getLatestReserves();

        uint _balance0 = token0.balanceOf(address(this));
        uint _balance1 = token1.balanceOf(address(this));

        uint _amount0 = _balance0 - _reserve0;
        uint _amount1 = _balance1 - _reserve1;

        require(_amount0 != 0 && _amount1 != 0, "Liquidity amount should not be zero!");
        
        uint _totalSupply = totalSupply();
        if(_totalSupply == 0) {
            shares = Math.sqrt(_amount0 * _amount1);
        }
        else {
            shares = Math.min(
                (_amount0 * _totalSupply) / _reserve0, 
                (_amount1 * _totalSupply) / _reserve1
            );
        }
        
        require(shares > 0, "shares equals 0");
        _mint(_to, shares);

        _updateReserves(
            token0.balanceOf(address(this)),
            token1.balanceOf(address(this))
        );
        
        (_reserve0, _reserve1,) = getLatestReserves();
    }

    function removeLiquidity(address _to)
        external
        nonReentrant
        returns (uint amount0, uint amount1)
    {
        uint balance0 = token0.balanceOf(address(this));
        uint balance1 = token1.balanceOf(address(this));

        uint shares = balanceOf(address(this));

        uint _totalSupply = totalSupply();
        amount0 = (shares * balance0) / _totalSupply;
        amount1 = (shares * balance1) / _totalSupply;
        require(amount0 > 0 && amount1 > 0, "amount0 or amount1 = 0");

        _burn(address(this), shares);

        _updateReserves(balance0 - amount0, balance1 - amount1);

        token0.safeTransfer(_to, amount0);
        token1.safeTransfer(_to, amount1);
        
    }

    function withdrawIncorrectDeposit(IERC20 _token, address _receiver)
        external
        onlyOwner
        nonReentrant
    {
        require(_token != token0 && _token != token1, "token in pool!");

        uint balance = _token.balanceOf(address(this));
        _token.safeTransfer(_receiver, balance);
        
        emit LogWithdrawIncorrectDeposit(address(_token), _receiver);
    }

    function pause() external onlyOwner() returns (bool) {
        _pause();
        return true;
    }
    
    function unpause() external onlyOwner() returns (bool) {
        _unpause();
        return true;
    }

}