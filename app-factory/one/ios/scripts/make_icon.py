#!/usr/bin/env python3
"""Generate original opaque iPhone icon using only Python standard library."""
import math
import pathlib
import struct
import zlib

N = 1024
target = pathlib.Path(__file__).parents[1] / "Resources/Assets.xcassets/AppIcon.appiconset/ONE-1024.png"
target.parent.mkdir(parents=True, exist_ok=True)

def pack_chunk(kind, data):
    payload = kind + data
    return struct.pack(">I", len(data)) + payload + struct.pack(">I", zlib.crc32(payload) & 0xFFFFFFFF)

leaves = [(393, 393, (21, 126, 86)), (631, 393, (215, 173, 83)),
          (393, 631, (173, 60, 52)), (631, 631, (39, 124, 205))]
raw = bytearray()
for y in range(N):
    raw.append(0)
    for x in range(N):
        g = int(18 + 18 * (1 - y / N))
        rgb = (8, g, 35)
        for cx, cy, color in leaves:
            radius = math.hypot(x - cx, y - cy)
            if radius <= 177:
                rgb = color if radius < 164 else (238, 203, 129)
        center = math.hypot(x - 512, y - 512)
        if center < 134:
            rgb = (14, 31, 44) if center < 124 else (239, 204, 132)
        # A small original 4-leaf central accent, not copied artwork.
        raw.extend(rgb)
png = b"\x89PNG\r\n\x1a\n"
png += pack_chunk(b"IHDR", struct.pack(">IIBBBBB", N, N, 8, 2, 0, 0, 0))
png += pack_chunk(b"IDAT", zlib.compress(bytes(raw), level=9))
png += pack_chunk(b"IEND", b"")
target.write_bytes(png)
print("Created", target, len(png), "bytes")
