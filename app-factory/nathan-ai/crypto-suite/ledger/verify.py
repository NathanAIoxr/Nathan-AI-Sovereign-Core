"""Reproduce the committed public receipt with Python's SHA-256 implementation."""

import hashlib
import json
from pathlib import Path
import sys

DIRECTORY = Path(__file__).resolve().parent
SOURCE = DIRECTORY.parent / "BLUEPRINT.md"
STATE = DIRECTORY / "state.json"
CHECKSUM = DIRECTORY / "state.sha256"
GENESIS = bytes.fromhex(
    "01000000" + "00" * 32
    + "3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29"
    + "ab5f49ffff001d1dac2b7c"
)
BITCOIN_GENESIS = "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
PURPOSE = "historical_bitcoin_genesis_header_replay"


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def expected_state():
    assert len(GENESIS) == 80
    nonce = int.from_bytes(GENESIS[76:], "little")
    bits = int.from_bytes(GENESIS[72:76], "little")
    target = (bits & 0x007fffff) << (8 * ((bits >> 24) - 3))
    cases = []
    for candidate in (nonce + 1, nonce, nonce - 1):
        header = GENESIS[:76] + candidate.to_bytes(4, "little")
        digest = hashlib.sha256(hashlib.sha256(header).digest()).digest()
        block_hash = digest[::-1].hex()
        cases.append({
            "nonce": candidate,
            "hash": block_hash,
            "meetsTarget": int.from_bytes(digest, "little") <= target,
        })
    assert cases[1]["hash"] == BITCOIN_GENESIS
    assert [case["meetsTarget"] for case in cases] == [False, True, False]
    return {
        "version": 1,
        "purpose": PURPOSE,
        "blueprintSha256": sha256(SOURCE.read_bytes()),
        "mining": {
            "header": GENESIS.hex(),
            "target": f"{target:064x}",
            "reverseProofs": cases,
        },
        "wallet": {
            "historicalReference": "available_in_private_catalog",
            "onChainStatus": "NOT_VERIFIED",
            "reserveRelationship": "NOT_ESTABLISHED",
        },
        "reserve": {
            "id": "voicebox-1700000000000",
            "label": "Locked Voicebox Reserve",
            "reportedUsd": "1700000000000",
            "evidenceStatus": "USER_REPORTED_UNVERIFIED",
            "custodyStatus": "NO_WALLET_OR_CUSTODY_VERIFIED",
            "mode": "HOLD",
            "timeScrollSha256": "0ced65055a15075fe7423524db7550854a5d5c96c047dc7bf31fca35089f7ad5",
        },
    }


def main():
    expected = (json.dumps(expected_state(), indent=2) + "\n").encode("utf-8")
    checksum = sha256(expected) + "\n"
    if sys.argv[1:] == ["--write"]:
        STATE.write_bytes(expected)
        CHECKSUM.write_bytes(checksum.encode("ascii"))
    elif sys.argv[1:]:
        raise SystemExit("Usage: verify.py [--write]")
    elif STATE.read_bytes() != expected or CHECKSUM.read_bytes() != checksum.encode("ascii"):
        raise SystemExit("State receipt or checksum differs from its independently recomputed bytes.")
    print(checksum.strip())


if __name__ == "__main__":
    main()
