// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract OnChainWhitelist is Ownable{

    mapping(address => bool) public whitelist;

    modifier onlyWhitelisted(address _account) {
        require(
            whitelist[_account],
            "user not whitelisted!"
        );
        _;
    }

    function addToWhitelist(address[] calldata toAddAddresses)
        onlyOwner
        external 
    {
        for (uint i = 0; i < toAddAddresses.length; i++) {
            whitelist[toAddAddresses[i]] = true;
        }
    }

    function removeFromWhitelist(address[] calldata toRemoveAddresses)
        onlyOwner
        external 
    {
        for (uint i = 0; i < toRemoveAddresses.length; i++) {
            delete whitelist[toRemoveAddresses[i]];
        }
    }
}