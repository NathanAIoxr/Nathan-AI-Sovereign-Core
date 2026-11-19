"""Select headwear object metadata from an official Met Open Access CSV snapshot."""

import argparse
import csv
import hashlib
import html
import json
import re
from pathlib import Path

HEADWEAR = re.compile(
    r"\b(?:hat|hats|headwear|headcloth|headband|headdress|headpiece|headscarf|headwrap|head covering|"
    r"helmet|helmets|bonnet|cap|caps|turban|crown|tiara|diadem|circlet|hood|boater|sombrero|beret|"
    r"wimple|coif|veil|kufi|fez|jingasa|kabuto|mitre|miter|nemes|kausia|petasos|pilos|chaperon|"
    r"toque|cloche|bowler|biretta|zucchetto|ushanka|kalpak|tagelmust|doppa|kofia|songkok|"
    r"blangkon|udeng|eboshi|kanmuri|gwan|samo|salakot|n[oó]n l[aá]|karakul)\b",
    re.IGNORECASE,
)
NON_HEADWEAR = re.compile(
    r"\b(?:toe caps?|knee caps?|cap lock|cap plate|cap badge|gun|crown coin|hatbox|hat box|hat stand|"
    r"hat pin|hatpin|cap stone|capital|crown glass|bottle cap|cap for a|cap for the|seal cap|"
    r"inkstand|perfume|cauldron|goblet|lamp|vessel|tall case clock|spar cap|hatch|umbrella|"
    r"figurine|statuette|sealing|scarab|statue|stela|plaque|portrait|drawing|print|painting|"
    r"photograph|relief|architectural ornament|head of|bust|torso|ornamentation|watch|coin|"
    r"wax seal|loincloth|wallpaper|playing card|pottery|figurine|furniture|headrest)\b",
    re.IGNORECASE,
)
COMPOSITE = re.compile(r"\b(?:dress|uniform|jacket|cape|coat|shirt|suit|robe|gown|ensemble|costume)\b", re.I)
TAG = re.compile(r"</?(?:i|em|b|strong|sup|sub)>", re.I)


def clean(value):
    return " ".join(TAG.sub("", html.unescape(value or "")).split())


def select(source):
    objects = {}
    with source.open(encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream):
            kind = clean(row["Object Name"])
            if not HEADWEAR.search(kind) or NON_HEADWEAR.search(kind):
                continue
            if COMPOSITE.match(kind) or row["Department"] in {"Photographs", "Musical Instruments"}:
                continue
            object_id = int(row["Object ID"])
            title = clean(row["Title"])
            objects[object_id] = [
                object_id, kind, title if title.casefold() != kind.casefold() else "",
                clean(row["Object Date"]), clean(row["Culture"] or row["Country"]),
                clean(row["Department"]),
            ]
    return [objects[key] for key in sorted(objects)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", type=Path)
    parser.add_argument("--output", type=Path, default=Path("met-headwear.mjs"))
    args = parser.parse_args()

    with args.csv.open("rb") as stream:
        sha = hashlib.file_digest(stream, "sha256").hexdigest()
    records = select(args.csv)
    if not records:
        raise SystemExit("No headwear records matched the CSV")
    with args.output.open("w", encoding="utf-8") as target:
        target.write("// The Metropolitan Museum of Art Open Access metadata (CC0).\n")
        target.write("// Object ID, object type, title where different, date, culture or country, department.\n")
        target.write("export const metSnapshot = " + json.dumps(sha) + "\nexport const metRecords = [\n")
        for item in records:
            target.write(json.dumps(item, ensure_ascii=False, separators=(",", ":")) + ",\n")
        target.write("]\n")
    print(f"{len(records)} unique records from {sha}")


if __name__ == "__main__":
    main()
