"""Generate dependency-free PNG icons for the installable Academy reader."""
from pathlib import Path
import struct
import sys
import zlib


def chunk(name, data):
    return (struct.pack(">I", len(data)) + name + data +
            struct.pack(">I", zlib.crc32(name + data)))


def color(x, y):
    ink = b"\x20\x42\x35"
    paper = b"\xf8\xf5\xed"
    lime = b"\xe4\xed\xbd"
    if .25 <= x <= .75 and .26 <= y <= .75:
        if .468 <= x <= .532:
            return ink
        edge = .39 - .13 * abs(x - .5)
        if edge <= y <= .69 + .13 * abs(x - .5):
            return lime if x < .5 else paper
    return ink


out = Path(sys.argv[1])
for size in (192, 512):
    raw = b"".join(b"\0" + b"".join(color(x / size, y / size) for x in range(size))
                   for y in range(size))
    header = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    png = (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) +
           chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))
    (out / f"academy-icon-{size}.png").write_bytes(png)
