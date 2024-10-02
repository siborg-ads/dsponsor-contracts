// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IProtocolFee.sol";
import "../interfaces/IUniV3SwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IPeripheryPayments.sol";
import "@uniswap/swap-router-contracts/contracts/interfaces/IV3SwapRouter.sol";

contract UniV3SwapRouterMock is IUniV3SwapRouter, Context, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public WETH9;

    constructor(address _WETH9) {
        WETH9 = _WETH9;
    }

    function exactInputSingle(
        IV3SwapRouter.ExactInputSingleParams calldata params
    ) external payable nonReentrant returns (uint256 amountOut) {
        IERC20(params.tokenIn).safeTransferFrom(
            _msgSender(),
            address(this),
            params.amountIn
        );
        IERC20(params.tokenOut).safeTransfer(
            _msgSender(),
            params.amountOutMinimum
        );

        return params.amountOutMinimum;
    }

    function exactInput(
        IV3SwapRouter.ExactInputParams calldata params
    ) external payable nonReentrant returns (uint256 amountOut) {
        IERC20(IERC20(abi.decode(params.path, (address[]))[0]))
            .safeTransferFrom(_msgSender(), address(this), params.amountIn);
        IERC20(
            IERC20(
                abi.decode(params.path, (address[]))[
                    abi.decode(params.path, (address[])).length - 1
                ]
            )
        ).safeTransfer(_msgSender(), params.amountOutMinimum);

        return params.amountOutMinimum;
    }

    function exactOutputSingle(
        IV3SwapRouter.ExactOutputSingleParams calldata params
    ) external payable nonReentrant returns (uint256 amountIn) {
        IERC20(params.tokenIn).safeTransferFrom(
            _msgSender(),
            address(this),
            params.amountInMaximum
        );
        IERC20(params.tokenOut).safeTransfer(
            _msgSender(),
            params.amountInMaximum
        );

        return params.amountInMaximum;
    }

    function exactOutput(
        IV3SwapRouter.ExactOutputParams calldata params
    ) external payable nonReentrant returns (uint256 amountIn) {
        IERC20(
            IERC20(
                abi.decode(params.path, (address[]))[
                    abi.decode(params.path, (address[])).length - 1
                ]
            )
        ).safeTransfer(_msgSender(), params.amountOut);

        return params.amountOut;
    }

    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    ) external override {
        // do nothing
    }

    function unwrapWETH9(
        uint256 amountMinimum,
        address recipient
    ) external payable nonReentrant {
        require(
            msg.value >= amountMinimum,
            "UniV3SwapRouterMock: INSUFFICIENT_AMOUNT"
        );
        IERC20(WETH9).safeTransfer(recipient, amountMinimum);
    }

    function refundETH() external payable nonReentrant {
        (bool success, ) = payable(_msgSender()).call{
            value: address(this).balance
        }("");
        require(success, "UniV3SwapRouterMock: REFUND_FAILED");
    }

    function sweepToken(
        address token,
        uint256 amountMinimum,
        address recipient
    ) external payable nonReentrant {
        IERC20(token).safeTransfer(recipient, amountMinimum);
    }
}
