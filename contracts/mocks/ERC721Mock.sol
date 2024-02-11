// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ERC721Mock is ERC721 {
    constructor() ERC721("ERC721Mock", "ERC721Mock") {}

    function mint(uint256 tokenId) external {
        _safeMint(msg.sender, tokenId);
    }
}
