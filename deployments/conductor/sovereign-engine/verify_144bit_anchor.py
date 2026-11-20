"""Validate one complete Nathan AI fixed-anchor frame in canonical byte order."""

import argparse
from pathlib import Path
import sys

ANCHOR_FRAME = bytes.fromhex("AA 55 FF 01 31 2B 31 3D 32 7E 31 2D 31 3D 30 04 00 F0")


def verify_frame(frame: bytes) -> bool:
    return frame == ANCHOR_FRAME


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", nargs="?", default="-", help="Raw binary file, or - for stdin")
    args = parser.parse_args()
    try:
        if args.file == "-":
            frame = sys.stdin.buffer.read(len(ANCHOR_FRAME) + 1)
        else:
            with Path(args.file).open("rb") as stream:
                frame = stream.read(len(ANCHOR_FRAME) + 1)
    except OSError as error:
        parser.exit(2, f"{error}\n")
    valid = verify_frame(frame)
    print("1+1=2" if valid else "1-1=0")
    return 0 if valid else 1


if __name__ == "__main__":
    sys.exit(main())
