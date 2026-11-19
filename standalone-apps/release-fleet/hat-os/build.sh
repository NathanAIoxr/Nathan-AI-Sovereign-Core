#!/usr/bin/env bash
set -euo pipefail
here="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
out="${1:?Provide an output directory}"
mkdir -p "$out"
temporary="$(mktemp -d)"
trap 'rm -rf "$temporary"' EXIT
as --32 -o "$temporary/boot.o" "$here/boot.s"
ld -m elf_i386 -Ttext 0x7c00 --oformat binary -o "$out/hat-os-boot.img" "$temporary/boot.o"
python3 - "$out/hat-os-boot.img" <<'PY'
import pathlib
import sys

image = pathlib.Path(sys.argv[1]).read_bytes()
if len(image) != 512 or image[-2:] != b"\x55\xaa":
    raise SystemExit("Missing 512-byte BIOS boot image signature")
pathlib.Path(sys.argv[1]).write_bytes(image.ljust(1474560,b"\x00"))
print("HAT OS boot sector verified and packed into a 1.44 MiB floppy image")
PY
