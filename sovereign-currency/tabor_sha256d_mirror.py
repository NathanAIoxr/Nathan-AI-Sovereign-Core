#!/usr/bin/env python3
"""TABOR Sovereign Multi-Axis Engine: SHA-256d reference implementation.

Originator of source architecture: JOHN NATHAN TABOR (email source May 24, 2026).
This implementation: functional OFFLINE Bitcoin-header work and verification demo.
Does not contact a pool, pay a wallet, validate transactions, or earn mining revenue.

Axis A serializes a 76-byte Bitcoin header prefix and hashes prefix + 4-byte nonce.
Axis B independently verifies candidate's complete 80-byte header and PoW target.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import multiprocessing as mp
import queue
import struct
from typing import Any

MAINNET_POW_LIMIT = (0xFFFF << (8 * (0x1D - 3)))
GENESIS_MERKLE_WIRE_HEX = "3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a"
GENESIS_EXPECTED_HASH = "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
GENESIS_NONCE = 2083236893


def _uint32(value: Any, label: str) -> int:
    if not isinstance(value, int) or isinstance(value, bool) or not (0 <= value <= 0xFFFFFFFF):
        raise ValueError(f"{label} must be an integer from 0 to 2^32-1")
    return value


def _display_hash_to_wire(value: Any, label: str) -> bytes:
    if not isinstance(value, str) or len(value) != 64:
        raise ValueError(f"{label} must be 64 hex characters in display order")
    try:
        return bytes.fromhex(value)[::-1]
    except ValueError as exc:
        raise ValueError(f"{label} is not valid hex") from exc


def compact_to_target(n_bits: int) -> int:
    """Decode Bitcoin's unsigned compact target; reject negative/zero/overflow.

    Header PoW check is not full consensus (difficulty transitions, timestamps,
    valid transactions and Merkle inclusion require a full node).
    """
    n_bits = _uint32(n_bits, "n_bits")
    exponent = n_bits >> 24
    mantissa = n_bits & 0x007FFFFF
    if n_bits & 0x00800000:
        raise ValueError("n_bits encodes a negative target")
    if mantissa == 0:
        raise ValueError("n_bits encodes a zero target")
    if exponent <= 3:
        target = mantissa >> (8 * (3 - exponent))
    else:
        target = mantissa << (8 * (exponent - 3))
    if target == 0 or target >= (1 << 256):
        raise ValueError("n_bits target is zero or overflows 256 bits")
    if target > MAINNET_POW_LIMIT:
        raise ValueError("target exceeds Bitcoin mainnet PoW limit")
    return target


def serialize_prefix(block: dict[str, Any]) -> bytes:
    """Produce EXACTLY 76 bytes: version, previous, Merkle, n_time, n_bits."""
    target = compact_to_target(block["n_bits"])
    del target  # decoding above rejects invalid targets before any hashing
    prefix = (
        struct.pack("<I", _uint32(block["version"], "version"))
        + _display_hash_to_wire(block["prev_hash"], "prev_hash")
        + _display_hash_to_wire(block["merkle_root"], "merkle_root")
        + struct.pack("<II", _uint32(block["n_time"], "n_time"), block["n_bits"])
    )
    assert len(prefix) == 76
    return prefix


def sha256d(payload: bytes) -> bytes:
    """Hash bytes twice: SHA256(SHA256(payload))."""
    return hashlib.sha256(hashlib.sha256(payload).digest()).digest()


def header_display_hash(header: bytes) -> str:
    if len(header) != 80:
        raise ValueError("Bitcoin header must be exactly 80 bytes")
    return sha256d(header)[::-1].hex()


def verify_header(header: bytes) -> dict[str, Any]:
    """Axis B: check header structure/hash threshold, not transactions or chain."""
    if len(header) != 80:
        raise ValueError("Bitcoin header must be exactly 80 bytes")
    n_bits = struct.unpack_from("<I", header, 72)[0]
    target = compact_to_target(n_bits)
    raw_digest = sha256d(header)
    value = int.from_bytes(raw_digest, "little")
    nonce = struct.unpack_from("<I", header, 76)[0]
    return {
        "nonce": nonce,
        "block_hash": raw_digest[::-1].hex(),
        "meets_header_pow_target": value <= target,
        "target_hex": f"{target:064x}",
        "scope": "header proof-of-work only; not a complete Bitcoin block validation",
    }


def run_forward_mirror_axis(worker_id: int, inbound_queue: mp.Queue, outbound_queue: mp.Queue) -> None:
    """Axis A worker: search a bounded nonce range of an immutable header prefix.

    Each request: {job_id, block: {version,prev_hash,merkle_root,n_time,n_bits},
                   start_nonce, max_nonces}. stop sentinel: None.
    Output: candidate (if found), then scan_complete; or worker_error.
    """
    while True:
        job = inbound_queue.get()
        if job is None:
            return
        job_id = job.get("job_id", "unknown") if isinstance(job, dict) else "unknown"
        try:
            if not isinstance(job, dict):
                raise ValueError("job must be a dictionary")
            prefix = serialize_prefix(job["block"])
            threshold = compact_to_target(job["block"]["n_bits"])
            first = _uint32(job.get("start_nonce", 0), "start_nonce")
            count = job.get("max_nonces", 1000)
            if not isinstance(count, int) or isinstance(count, bool) or count < 1 or count > 5_000_000:
                raise ValueError("max_nonces must be in 1..5,000,000")
            if first + count > (1 << 32):
                raise ValueError("nonce range may not exceed 2^32")
            solutions = 0
            for nonce in range(first, first + count):
                header = prefix + struct.pack("<I", nonce)
                digest = sha256d(header)
                if int.from_bytes(digest, "little") <= threshold:
                    outbound_queue.put({
                        "type": "candidate", "job_id": job_id,
                        "worker_id": worker_id, "nonce": nonce,
                        "header_hex": header.hex(), "block_hash": digest[::-1].hex(),
                    })
                    solutions += 1
            outbound_queue.put({
                "type": "scan_complete", "job_id": job_id,
                "worker_id": worker_id, "tested": count, "candidates": solutions,
            })
        except (KeyError, ValueError, TypeError, struct.error) as exc:
            outbound_queue.put({"type": "worker_error", "job_id": job_id, "error": str(exc)})


def run_reverse_mirror_axis(worker_id: int, inbound_queue: mp.Queue, outbound_queue: mp.Queue) -> None:
    """Axis B independently recomputes an Axis A candidate's proof of work."""
    while True:
        candidate = inbound_queue.get()
        if candidate is None:
            return
        job_id = candidate.get("job_id", "unknown") if isinstance(candidate, dict) else "unknown"
        try:
            if not isinstance(candidate, dict) or candidate.get("type") != "candidate":
                raise ValueError("expected candidate dictionary")
            header = bytes.fromhex(candidate["header_hex"])
            result = verify_header(header)
            reported_hash = candidate.get("block_hash")
            result.update({
                "type": "verified_candidate", "worker_id": worker_id, "job_id": job_id,
                "matching_reported_hash": reported_hash == result["block_hash"],
            })
            result["accepted"] = result["meets_header_pow_target"] and result["matching_reported_hash"]
            outbound_queue.put(result)
        except (KeyError, ValueError, TypeError) as exc:
            outbound_queue.put({"type": "worker_error", "job_id": job_id, "error": str(exc)})


def genesis_block_template() -> dict[str, Any]:
    return {
        "version": 1,
        "prev_hash": "00" * 32,
        "merkle_root": bytes.fromhex(GENESIS_MERKLE_WIRE_HEX)[::-1].hex(),
        "n_time": 1231006505,
        "n_bits": 0x1D00FFFF,
    }


def run_offline_demo() -> dict[str, Any]:
    """Exercise separate processes/queues on the historical genesis header."""
    block = genesis_block_template()
    if serialize_prefix(block) + struct.pack("<I", GENESIS_NONCE) != bytes.fromhex(
        "01000000" + "00"*32 + GENESIS_MERKLE_WIRE_HEX + "29ab5f49" + "ffff001d" + "1dac2b7c"
    ):
        raise RuntimeError("genesis serialization incorrect")
    fwd_in, fwd_out = mp.Queue(), mp.Queue()
    rev_in, rev_out = mp.Queue(), mp.Queue()
    forward = mp.Process(target=run_forward_mirror_axis, args=(0, fwd_in, fwd_out))
    reverse = mp.Process(target=run_reverse_mirror_axis, args=(1, rev_in, rev_out))
    forward.start()
    reverse.start()
    try:
        fwd_in.put({"job_id": "bitcoin-genesis", "block": block,
                    "start_nonce": GENESIS_NONCE-2, "max_nonces": 5})
        found = []
        while True:
            msg = fwd_out.get(timeout=10)
            if msg["type"] == "candidate":
                found.append(msg)
                rev_in.put(msg)
            elif msg["type"] == "scan_complete":
                scanned = msg
                break
            else:
                raise RuntimeError(f"forward axis error: {msg}")
        validations = [rev_out.get(timeout=10) for _ in found]
        genesis_valid = any(
            v.get("accepted") and v.get("nonce") == GENESIS_NONCE
            and v.get("block_hash") == GENESIS_EXPECTED_HASH
            for v in validations
        )
        if not genesis_valid:
            raise AssertionError("Bitcoin genesis hash/Pow validation failed")
        return {
            "success": True,
            "originator": "JOHN NATHAN TABOR",
            "mode": "offline reference implementation — no network, wallets or transactions",
            "forward_axis": scanned,
            "reverse_axis": validations,
            "expected_hash": GENESIS_EXPECTED_HASH,
        }
    finally:
        fwd_in.put(None)
        rev_in.put(None)
        forward.join(timeout=5)
        reverse.join(timeout=5)
        if forward.is_alive():
            forward.terminate()
            forward.join()
        if reverse.is_alive():
            reverse.terminate()
            reverse.join()
        for q in [fwd_in, fwd_out, rev_in, rev_out]:
            q.close()
            q.join_thread()


def main() -> None:
    parser = argparse.ArgumentParser(description="Nathan Tabor SHA-256d mirror reference — offline only")
    parser.add_argument("--demo", action="store_true", help="run genesis test through two processes")
    args = parser.parse_args()
    if args.demo:
        print(json.dumps(run_offline_demo(), indent=2))
    else:
        parser.print_help()


if __name__ == "__main__":
    mp.freeze_support()
    main()
