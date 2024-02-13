// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title ERC2771ContextUpgradeable
 * @author Anthony Gourraud
 * @notice Enable gasless transactions using EIP2771 Approach, forwarder can be updated by owner
 */
abstract contract ERC2771ContextUpgradeable is
    Initializable,
    ContextUpgradeable,
    OwnableUpgradeable
{
    address private _trustedForwarder;

    function __ERC2771Context_init(
        address forwarder,
        address initialOwner
    ) internal onlyInitializing {
        __Ownable_init_unchained(initialOwner);
        __Context_init_unchained();
        __ERC2771Context_init_unchained(forwarder);
    }

    function __ERC2771Context_init_unchained(
        address forwarder
    ) internal onlyInitializing {
        _trustedForwarder = forwarder;
    }

    /**
     * @dev Update the address of the trusted forwarder.
     */
    function setTrustedForwarder(address forwarder) external onlyOwner {
        // slither-disable-next-line missing-zero-check
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
