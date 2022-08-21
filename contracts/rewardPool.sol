// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
interface IERC20{
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external returns(uint);
}

contract RewardPool is Ownable {

    IERC20 sushi;

    constructor(IERC20 _sushi){
        sushi = _sushi;
    }
    
    // Owner can withdraw the tax
    function withdraw() external onlyOwner{
        sushi.transfer(msg.sender,sushi.balanceOf(address(this)));
    }
}
