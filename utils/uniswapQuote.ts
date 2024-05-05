import { formatUnits } from 'ethers'
import { ethers } from 'hardhat'
import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json'
import { QUOTE_ADDR, USDC_ADDR, WETH_ADDR } from './constants'

export const getEthQuote = async (
  tokenOutAddr: string,
  amountOut: string,
  slippagePerCent: number = 0.3
) => {
  if (slippagePerCent < 0.01) throw new Error('Slippage must be at least 0.01%')

  const { provider } = ethers

  const { chainId: chainIdBigInt } = await provider.getNetwork()
  const chainId = chainIdBigInt.toString()

  const quoterContract = await ethers.getContractAtFromArtifact(
    Quoter,
    QUOTE_ADDR[chainId]
  )
  const [
    amountInEth,
    _sqrtPriceX96After,
    _initializedTicksCrossed,
    _gasEstimate
  ] = await quoterContract.getFunction('quoteExactOutputSingle').staticCall({
    tokenIn: WETH_ADDR[chainId],
    tokenOut: tokenOutAddr,
    fee: 3000,
    amount: amountOut,
    sqrtPriceLimitX96: 0
  })

  const [amountUSDC] = await quoterContract
    .getFunction('quoteExactInputSingle')
    .staticCall({
      tokenIn: WETH_ADDR[chainId],
      tokenOut: USDC_ADDR[chainId],
      fee: 3000,
      amountIn: amountInEth,
      sqrtPriceLimitX96: 0
    })

  const slippageMul = 10000
  const slippage = slippageMul + (slippagePerCent * slippageMul) / 100

  const amountInEthWithSlippage =
    (amountInEth * BigInt(slippage.toString())) / BigInt(slippageMul.toString())

  return {
    amountInEth,
    amountInEthWithSlippage,
    amountUSDC,
    amountInEthFormatted: formatUnits(amountInEth, 18),
    amountInEthWithSlippageFormatted: formatUnits(amountInEthWithSlippage, 18),
    amountUSDCFormatted: formatUnits(amountUSDC, 6)
  }
}

/*
// ARB
getEthQuote('0xaf88d065e77c8cC2239327C5EDb3A432268e5831', '3000000000') //  0.3% default slippage
  .then(console.log)
  .catch(console.error)
*/

/*
// SEPOLIA
// npx hardhat run utils/uniswapQuote.ts --network sepolia
getEthQuote('0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', '1000000', 5) // slippage 5%
  .then(console.log)
  .catch(console.error)
*/
