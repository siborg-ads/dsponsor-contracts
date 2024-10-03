// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@uniswap/v3-periphery/contracts/interfaces/IPeripheryPayments.sol";
import "@uniswap/swap-router-contracts/contracts/interfaces/IV3SwapRouter.sol";

interface IUniV3SwapRouter is IV3SwapRouter, IPeripheryPayments {
    function WETH9() external view returns (address);
}
