// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";

contract ERC2771ForwarderMock is ERC2771Forwarder {
    constructor() ERC2771Forwarder("ERC2771ForwarderMock") {}
}
