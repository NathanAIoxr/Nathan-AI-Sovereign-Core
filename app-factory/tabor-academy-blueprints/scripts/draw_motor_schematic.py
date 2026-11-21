"""Draw a reviewed energy-flow schematic for lesson 19."""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def font(size, bold=False):
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    return ImageFont.truetype(name, size)


image = Image.new("RGB", (1080, 520), "#f8f5ed")
draw = ImageDraw.Draw(image)
ink = "#182a22"
forest = "#204235"
draw.text((40, 36), "Electric motor and generator", font=font(40, True), fill=ink)
draw.text((42, 94), "Compare how electrical energy and shaft rotation exchange roles.", font=font(23), fill=forest)

for index, (name, first, second) in enumerate((
    ("Motor", "Electrical energy", "Shaft rotation"),
    ("Generator", "Shaft rotation", "Electrical energy"),
)):
    start = 40 + 510 * index
    draw.rounded_rectangle((start, 160, start + 490, 443), radius=18, fill="#fffdf7", outline="#aeb8a8", width=3)
    draw.text((start + 24, 185), name, font=font(32, True), fill=ink)
    for x, kind, label in ((start + 125, "INPUT", first), (start + 365, "OUTPUT", second)):
        draw.rounded_rectangle((x - 105, 270, x + 105, 382), radius=12, fill="#e4edbd")
        draw.text((x, 300), kind, font=font(17, True), anchor="mm", fill=forest)
        draw.text((x, 344), label, font=font(19), anchor="mm", fill=ink)
    draw.line((start + 235, 324, start + 254, 324), fill=forest, width=4)
    draw.polygon([(start + 255, 324), (start + 246, 317), (start + 246, 331)], fill=forest)

draw.text((42, 469), "Some machines can perform both roles. Both conversions have energy losses.",
          font=font(22), fill=forest)
target = Path(sys.argv[1])
target.parent.mkdir(parents=True, exist_ok=True)
image.save(target, optimize=True)
