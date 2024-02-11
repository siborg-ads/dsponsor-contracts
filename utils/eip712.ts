import { ethers, upgrades } from 'hardhat'
import { ERC2771Forwarder } from '../typechain-types'
import { Contract, BaseContract, Signer, TypedDataDomain } from 'ethers'

type TypedDataNameEIP712 =
  | 'name'
  | 'version'
  | 'chainId'
  | 'verifyingContract'
  | 'salt'
type EIP712DomainType = { name: TypedDataNameEIP712; type: string }[]
const EIP712Domain: { name: TypedDataNameEIP712; type: string }[] = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
  { name: 'salt', type: 'bytes32' }
] as EIP712DomainType

const ForwardRequest = [
  { name: 'from', type: 'address' },
  { name: 'to', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'gas', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint48' },
  { name: 'data', type: 'bytes' }
]

async function getDomain(
  forwarder: ERC2771Forwarder
): Promise<TypedDataDomain> {
  const {
    fields,
    name,
    version,
    chainId,
    verifyingContract,
    salt,
    extensions
  }: {
    fields: string
    name: string
    version: string
    chainId: bigint
    verifyingContract: string
    salt: string
    extensions: bigint[]
  } = await forwarder.eip712Domain()

  if (extensions.length > 0) {
    throw Error('Extensions not implemented')
  }

  const domain = {
    name,
    version,
    chainId,
    verifyingContract,
    salt
  }

  for (const [i, { name }] of EIP712Domain.entries()) {
    if (!(parseInt(fields) & (1 << i))) {
      delete domain[name]
    }
  }

  return domain
}

const MAX_UINT48 = 2n ** 48n - 1n

type ForwardRequestDataToSign = {
  from: string // address
  to: string // address
  value: bigint // uint256
  data: string // bytes
  gas: bigint // uint256
  nonce: bigint
  deadline: bigint // uint48
}

export const executeByForwarder = async (
  forwarder: ERC2771Forwarder,
  contract: BaseContract,
  signer: Signer,
  encodedFunctionData: string
) => {
  const domain: TypedDataDomain = await getDomain(forwarder)
  const nonce = await forwarder.nonces(signer)

  const req: ForwardRequestDataToSign = {
    from: await signer.getAddress(),
    to: await contract.getAddress(),
    value: 0n,
    data: encodedFunctionData,
    gas: 1000000n,
    nonce,
    deadline: MAX_UINT48
  }
  const signature = await signer.signTypedData(domain, { ForwardRequest }, req)

  // ('ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,uint48 deadline,bytes data)');
  return forwarder.execute({ ...req, signature })
}
