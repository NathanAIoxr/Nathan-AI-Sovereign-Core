"""Build the Imagination catalog from the supplied 101-entry text."""
import hashlib
import json
from pathlib import Path
import re
import sys

BASE = Path(__file__).parent
UPSTREAMS = {
    1: ("dragon-species", "/dragon?seed=Ember", "Dragon species"),
    9: ("dragon-names", "/?seed=cloud", "Dragon name"),
    31: ("yin-yang-svg", "/", "Yin-Yang SVG"),
    45: ("alphabet-portals", "/?letter=C", "Creature portal"),
    56: ("story-dice", "/?seed=starlight", "Story prompt"),
    73: ("coloring-svg", "/?kind=castle", "Printable coloring page"),
    87: ("planet-jump", "/?planet=Moon&earth_jump_m=0.5", "Moon jump"),
    93: ("clubhouse-cipher", "/", "Decoder ring"),
}

def build(source):
    categories, entries = [], []
    for line in source.splitlines():
        if line.startswith("How to Plug"):
            break
        heading = re.fullmatch(r"(\d+)\. (.+) \((\d+)–(\d+)\)", line)
        if heading:
            group, title, first, last = heading.groups()
            categories.append(dict(id=int(group), title=title, first=int(first), last=int(last)))
            continue
        entry = re.fullmatch(r"(\d+)\. (.+?) – (.+)", line)
        if entry:
            number, title, description = entry.groups()
            number = int(number)
            group = categories[-1]
            if not group["first"] <= number <= group["last"]:
                raise ValueError(f"Entry {number} is outside category {group['id']}")
            row = dict(id=f"IMAG-{number:03}", number=number, category=group["id"],
                       title=title, description=description)
            if number in UPSTREAMS:
                slug, path, label = UPSTREAMS[number]
                row["demo"] = dict(service=f"tabor-imag-{number:03}-{slug}", path=path, label=label)
            entries.append(row)
    if [row["number"] for row in entries] != list(range(1, 102)) or len(categories) != 8:
        raise ValueError("Expected entries 1–101 across eight categories")
    return dict(schema="tabor.imagination-catalog.v1", title="Library of Tabor · Imagination Engines",
                categories=categories, engines=entries)

if __name__ == "__main__":
    source = Path(sys.argv[1]).read_text(encoding="utf-8")
    catalog = build(source)
    data = (json.dumps(catalog, ensure_ascii=False, indent=2) + "\n").encode()
    (BASE / "catalog.json").write_bytes(data)
    print(f"{len(catalog['engines'])} engines, {len(data)} bytes, SHA-256 {hashlib.sha256(data).hexdigest()}")
