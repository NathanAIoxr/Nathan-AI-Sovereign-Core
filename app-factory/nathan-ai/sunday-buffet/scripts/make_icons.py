"""Create the two app icons for Android, iOS and desktop browsers."""
from pathlib import Path
from PIL import Image, ImageDraw

public = Path(__file__).resolve().parents[1] / "public"
for size in (192, 512):
    scale = size / 512
    image = Image.new("RGB", (size, size), "#222b23")
    draw = ImageDraw.Draw(image)

    def box(*coordinates):
        return tuple(round(n * scale) for n in coordinates)

    def plate(x, y, radius, color):
        draw.ellipse(box(x - radius, y - radius, x + radius, y + radius), fill=color)
        for inset in (11, 20):
            r = radius - inset
            draw.ellipse(box(x - r, y - r, x + r, y + r), outline="#f8f2e5", width=max(1, round(3 * scale)))

    plate(298, 211, 126, "#ac583d")
    plate(220, 296, 126, "#efc579")
    draw.rounded_rectangle(box(173, 188, 339, 327), radius=round(10 * scale), fill="#fff8e7")
    for y, end, color in [(216, 306, "#a53623"), (241, 309, "#222b23"), (263, 291, "#222b23"), (293, 305, "#a53623")]:
        draw.line(box(197, y, end, y), fill=color, width=max(2, round(7 * scale)))
    image.save(public / f"icon-{size}.png", optimize=True)
