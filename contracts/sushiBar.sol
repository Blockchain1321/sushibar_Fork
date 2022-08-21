// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// SushiBar is the coolest bar in town. You come in with some Sushi, and leave with more! The longer you stay, the more Sushi you get.
//
// This contract handles swapping to and from xSushi, SushiSwap's staking token.
contract Sushibar is ERC20("SushiBar", "xSUSHI"){
    using SafeMath for uint256;

    struct Deposit{
        address who;
        uint256 when;
        uint256 amount;
    }
    Deposit[] public deposits;

    IERC20 public sushi;
    address public pool;

    // Define the Sushi token contract
    constructor(IERC20 _sushi, address _pool) {
        sushi = _sushi;
        pool = _pool;
    }

    // Enter the bar. Pay some SUSHIs. Earn some shares.
    // Locks Sushi and mints xSushi
    function enter(uint256 _amount) public {
        // Gets the amount of Sushi locked in the contract
        uint256 totalSushi = sushi.balanceOf(address(this));
        // Gets the amount of xSushi in existence
        uint256 totalShares = totalSupply();
        // If no xSushi exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalSushi == 0) {
            _mint(msg.sender, _amount);
        } 
        // Calculate and mint the amount of xSushi the Sushi is worth. The ratio will change overtime, as xSushi is burned/minted and Sushi deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalSushi);
            _mint(msg.sender, what);
        }

        Deposit memory deposit;
        deposit.who = msg.sender;
        deposit.when = block.timestamp;
        deposit.amount = _amount;

        deposits.push(deposit);

        // Lock the Sushi in the contract
        sushi.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the bar. Claim back your SUSHIs.
    // Unlocks the staked + gained Sushi and burns xSushi
    function leave(uint256 _share, uint _index) public {

        // Checks whether sender of the transaction is the depositor
        Deposit storage deposit = deposits[_index];
        require(msg.sender == deposit.who, "Sender is not the depositor");

        // Gets the amount of xSushi in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of Sushi the xSushi is worth
        uint256 what = _share.mul(sushi.balanceOf(address(this))).div(totalShares);

        // Calculating tax
        if (block.timestamp - deposit.when <= 8 days) {
            uint256 tax = _calculateTax(what, deposit.when);
            what = what - tax;
            sushi.transfer(pool, tax);
        }
        _burn(msg.sender, _share);
        if(what > 0){
            sushi.transfer(msg.sender, what);
        }
    }

    function _calculateTax(uint256 _amount, uint256 _whenDeposit) internal view returns (uint256) {
        uint256 depositDuration = block.timestamp - _whenDeposit;
        uint256 tax;
        if (depositDuration <= 2 days){
            return _amount;
        }
        if (depositDuration <= 4 days){
            tax = _amount * 75 / 100;
            return tax;
        }
        if (depositDuration <= 6 days){
            tax = _amount * 50 / 100;
            return tax;
        }
        tax = _amount * 25 / 100;
        return tax;
    }
}
