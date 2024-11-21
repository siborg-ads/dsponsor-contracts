// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract ERC721Mock is ERC721Enumerable {
    constructor() ERC721("ERC721Mock", "ERC721Mock") {}

    function mint(uint256 tokenId) external {
        _safeMint(msg.sender, tokenId);
    }
}
