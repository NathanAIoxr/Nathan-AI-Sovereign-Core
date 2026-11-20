// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract CryptocurrencyPooper is ERC20Capped, EIP712 {
    bytes32 private constant CLEANUP_TYPEHASH = keccak256(
        "Cleanup(bytes32 jobKey,bytes32 receiptHash,address recipient,uint256 coins,uint256 expiresAt)"
    );

    address public immutable verifier;
    mapping(bytes32 jobKey => bool) public settledJob;
    mapping(bytes32 receiptHash => bool) public settledReceipt;

    error InvalidCleanup();
    error AlreadySettled();
    error InvalidVerifier();

    event CleanupSettled(bytes32 indexed jobKey, bytes32 indexed receiptHash, address indexed recipient, uint256 coins);

    constructor(address verifier_, uint256 cap_)
        ERC20("The Cryptocurrency Pooper", "POOPER")
        ERC20Capped(cap_)
        EIP712("The Cryptocurrency Pooper", "1")
    {
        if (verifier_ == address(0)) revert InvalidVerifier();
        verifier = verifier_;
    }

    function decimals() public pure override returns (uint8) {
        return 0;
    }

    function settle(
        bytes32 jobKey,
        bytes32 receiptHash,
        address recipient,
        uint256 coins,
        uint256 expiresAt,
        bytes calldata signature
    ) external {
        if (jobKey == bytes32(0) || receiptHash == bytes32(0) || recipient == address(0)
            || coins == 0 || block.timestamp > expiresAt) revert InvalidCleanup();
        if (settledJob[jobKey] || settledReceipt[receiptHash]) revert AlreadySettled();

        bytes32 data = keccak256(abi.encode(CLEANUP_TYPEHASH, jobKey, receiptHash, recipient, coins, expiresAt));
        if (ECDSA.recover(_hashTypedDataV4(data), signature) != verifier) revert InvalidVerifier();

        settledJob[jobKey] = true;
        settledReceipt[receiptHash] = true;
        _mint(recipient, coins);
        emit CleanupSettled(jobKey, receiptHash, recipient, coins);
    }
}
