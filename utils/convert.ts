import { toUtf8Bytes, keccak256, BigNumberish } from 'ethers'

export function stringToUint256(value: string): BigNumberish {
  return BigInt(keccak256(toUtf8Bytes(value)))
}
