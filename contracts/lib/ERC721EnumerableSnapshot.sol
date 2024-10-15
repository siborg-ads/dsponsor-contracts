// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract ERC721EnumerableSnapshot is ERC721Enumerable, Ownable {
    constructor()
        ERC721("ERC721EnumerableSnapshot", "E721ES")
        Ownable(msg.sender)
    {}

    function mint(address to, uint256 tokenId) external onlyOwner {
        _mint(to, tokenId);
    }
}
