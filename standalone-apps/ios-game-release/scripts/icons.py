"""Build opaque, original 1024 px app icons without image dependencies."""
import json
from pathlib import Path
import struct
import zlib

SIZE = 1024
ROOT = Path(__file__).resolve().parents[1] / 'Generated'
PALETTES = {
    'Scrambler': ((13, 31, 39), (202, 250, 132)),
    'YardArcade': ((27, 38, 28), (255, 210, 111)),
    'Sudoku': ((32, 28, 57), (231, 221, 255)),
    'Retro': ((39, 21, 55), (235, 140, 255)),
}


def art(app, x, y):
    if app == 'Scrambler':
        mark = 240 < x < 784 and abs(y - (740 - (x - 240) * 0.84)) < 37
        stop = (x - 710)**2 + (y - 330)**2 < 75**2
        return mark or stop
    if app == 'YardArcade':
        radius_squared = (x - 515)**2 + (y - 595)**2
        return (248**2 < radius_squared < 298**2
                or (98**2 < radius_squared < 146**2)
                or (476 < x < 528 and 160 < y < 415))
    if app == 'Sudoku':
        return 238 < x < 786 and 238 < y < 786 and (
            (x - 238) % 184 < 37 or (y - 238) % 184 < 37 or x > 750 or y > 750
        )
    row, column = (y - 250) // 110, (x - 250) // 110
    return (row, column) in {(0, 1), (1, 2), (2, 0), (2, 1), (2, 2), (3, 3), (4, 3)} and (
        (x - 250) % 110 < 85 and (y - 250) % 110 < 85
    )


def chunk(tag, data):
    return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data))


for app_name, (background, accent) in PALETTES.items():
    folder = ROOT / app_name / 'Assets.xcassets' / 'AppIcon.appiconset'
    folder.mkdir(parents=True, exist_ok=True)
    scan = bytearray()
    for y in range(SIZE):
        scan.append(0)
        low = tuple(c + (SIZE - y) * 10 // SIZE for c in background)
        for x in range(SIZE):
            scan.extend(accent if art(app_name, x, y) else low)
    image = (b'\x89PNG\r\n\x1a\n'
             + chunk(b'IHDR', struct.pack('>IIBBBBB', SIZE, SIZE, 8, 2, 0, 0, 0))
             + chunk(b'IDAT', zlib.compress(scan, 9))
             + chunk(b'IEND', b''))
    (folder / 'AppIcon.png').write_bytes(image)
    info = {'version': 1, 'author': 'xcode'}
    (folder / 'Contents.json').write_text(json.dumps({
        'images': [{'filename': 'AppIcon.png', 'idiom': 'universal', 'platform': 'ios', 'size': '1024x1024'}],
        'info': info,
    }))
    (folder.parent / 'Contents.json').write_text(json.dumps({'info': info}))
