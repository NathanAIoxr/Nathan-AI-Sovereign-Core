"""Validate the exact Nathan AI 18-byte fixed-anchor frame."""

import argparse
import sys
from pathlib import Path

FIXED_ANCHOR = bytes.fromhex("AA 55 FF 01 31 2B 31 3D 32 7E 31 2D 31 3D 30 04 00 F0")


def verify_144bit_anchor(frame: bytes) -> bool:
    return frame == FIXED_ANCHOR


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", nargs="?", help="Raw binary file. Read stdin when omitted.")
    args = parser.parse_args()
    try:
        if args.file:
            with Path(args.file).open("rb") as candidate:
                frame = candidate.read(len(FIXED_ANCHOR) + 1)
        else:
            frame = sys.stdin.buffer.read(len(FIXED_ANCHOR) + 1)
    except OSError as error:
        parser.exit(2, f"{error}\n")
    accepted = verify_144bit_anchor(frame)
    print(int(accepted))
    return 0 if accepted else 1


if __name__ == "__main__":
    sys.exit(main())
