// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ITicket_NFT {
    function safeMint(address to) external returns (uint256);
    function batchMint(address to, uint256 quantity) external returns (uint256[] memory);
    function balanceOf(address owner) external view returns (uint256);
}