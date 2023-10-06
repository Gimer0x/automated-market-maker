// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {OnChainWhitelist} from './utils/OnChainWhitelist.sol';
import {LiquidityPool} from './LiquidityPool.sol';

contract PoolFactory is Pausable, OnChainWhitelist {
    address[] public allPools;
    
    mapping(address => mapping(address => address)) public getPoolAddress;
    
    event LogCreatePool(address _token0, address _token1, address _sender, uint _pairsLength);

    constructor() {}

    function allPoolsLength() 
        external 
        view 
        returns (uint) 
    {
        return allPools.length;
    }

    function createPool(address _token0, address _token1, uint _fees)
        external
        whenNotPaused
        returns (address poolAddress) 
    {
        require(whitelist[msg.sender] || msg.sender == owner(), "not authorized!");
        require(_token0 != _token1, "identical addresses not allowed!");
        require(_token0 != address(0) && _token1 != address(0), "zero address is not allowed!");
        require(getPoolAddress[_token0][_token1] == address(0), "token pair exists!");
        
        bytes memory bytecode = type(LiquidityPool).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(_token0, _token1));
        
        assembly {
            poolAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        
        require(poolAddress != address(0), "contract deployment failed!");

        getPoolAddress[_token0][_token1] = poolAddress;
        getPoolAddress[_token1][_token0] = poolAddress;

        allPools.push(poolAddress);

        LiquidityPool(poolAddress).initPool(_token0, _token1, _fees);
        LiquidityPool(poolAddress).transferOwnership(msg.sender);

        emit LogCreatePool(_token0, _token1, msg.sender, allPools.length);
    }

    function poolExists(address _tokenA, address _tokenB)
        external
        view
        returns (bool _exists)
    {
        _exists = getPoolAddress[_tokenA][_tokenB] != address(0);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}