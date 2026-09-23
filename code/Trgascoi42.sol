// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Trgascoi42 {
    string public name = "Trgascoi42";
    string public symbol = "TRG42";
    uint8 public decimals = 18;

    uint256 public totalSupply;
    address public owner;
    mapping(address => uint256) public balanceOf;

    mapping(address => mapping(address => uint256)) public allowance;
}
