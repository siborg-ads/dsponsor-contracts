// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title ERC2771Context
 * @author Anthony Gourraud
 * @notice Enable gasless transactions using EIP2771 Approach, forwarder can be updated by owner
 * @dev Code from OZ's ERC2771Context smart contract
 */
abstract contract ERC2771Context is Ownable {
    address private _trustedForwarder;

    constructor(address forwarder, address initialOwner) Ownable(initialOwner) {
        _trustedForwarder = forwarder;
    }

    /**
     * @dev Update the address of the trusted forwarder.
     */
    function setTrustedForwarder(address forwarder) external onlyOwner {
        _trustedForwarder = forwarder;
    }

    /**
     * @dev Returns the address of the trusted forwarder.
     */
    function trustedForwarder() public view returns (address) {
        return _trustedForwarder;
    }

    /**
     * @dev Indicates whether any particular address is the trusted forwarder.
     */
    function isTrustedForwarder(
        address forwarder
    ) public view virtual returns (bool) {
        return forwarder == trustedForwarder();
    }

    /**
     * @dev Override for `msg.sender`. Defaults to the original `msg.sender` whenever
     * a call is not performed by the trusted forwarder or the calldata length is less than
     * 20 bytes (an address length).
     */
    function _msgSender() internal view virtual override returns (address) {
        uint256 calldataLength = msg.data.length;
        uint256 contextSuffixLength = _contextSuffixLength();
        if (
            isTrustedForwarder(msg.sender) &&
            calldataLength >= contextSuffixLength
        ) {
            return
                address(
                    bytes20(msg.data[calldataLength - contextSuffixLength:])
                );
        } else {
            return super._msgSender();
        }
    }

    /**
     * @dev Override for `msg.data`. Defaults to the original `msg.data` whenever
     * a call is not performed by the trusted forwarder or the calldata length is less than
     * 20 bytes (an address length).
     */
    function _msgData()
        internal
        view
        virtual
        override
        returns (bytes calldata)
    {
        uint256 calldataLength = msg.data.length;
        uint256 contextSuffixLength = _contextSuffixLength();
        if (
            isTrustedForwarder(msg.sender) &&
            calldataLength >= contextSuffixLength
        ) {
            return msg.data[:calldataLength - contextSuffixLength];
        } else {
            return super._msgData();
        }
    }

    /**
     * @dev ERC-2771 specifies the context as being a single address (20 bytes).
     */
    function _contextSuffixLength()
        internal
        view
        virtual
        override
        returns (uint256)
    {
        return 20;
    }
}
