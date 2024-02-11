// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

import "../interfaces/IERC4907.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

abstract contract ERC4907Upgradeable is
    IERC4907,
    Initializable,
    ERC721Upgradeable
{
    struct UserInfo {
        address user; // user (tenant) address
        uint256 expires; // rental expiration timestamp
    }

    mapping(uint256 => UserInfo) internal _users;

    function __ERC4907_init(
        string memory name,
        string memory symbol
    ) internal onlyInitializing {
        __ERC721_init_unchained(name, symbol);
        __ERC4907_init_unchained();
    }

    function __ERC4907_init_unchained() internal onlyInitializing {}

    /// @notice Specify who can use an NFT as a "user" (tenant)
    /// @dev The zero address indicates there is no user. Throws if `tokenId` is not valid NFT
    /// @param user  The new user of the NFT
    /// @param expires  UNIX timestamp, the new user could use the NFT before expires
    function setUser(
        uint256 tokenId,
        address user,
        uint64 expires
    ) public virtual override {
        _checkAuthorized(ownerOf(tokenId), _msgSender(), tokenId);
        UserInfo storage info = _users[tokenId];
        info.user = user;
        info.expires = expires;
        emit UpdateUser(tokenId, user, expires);
    }

    /// @notice Get the user address of an NFT
    /// @dev The zero address indicates that there is no user or the user is expired
    /// @param tokenId The NFT to get the user address for
    /// @return The user address for this NFT
    function userOf(
        uint256 tokenId
    ) public view virtual override returns (address) {
        if (_users[tokenId].expires >= block.timestamp) {
            return _users[tokenId].user;
        } else {
            return address(0);
        }
    }

    /// @notice Get the user expires of an NFT
    /// @dev The zero value indicates that there is no user
    /// @param tokenId The NFT to get the user expires for
    /// @return The user expires for this NFT
    function userExpires(
        uint256 tokenId
    ) public view virtual override returns (uint256) {
        return _users[tokenId].expires;
    }

    /// @dev See {IERC165-supportsInterface}.
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override returns (bool) {
        return
            interfaceId == type(IERC4907).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
