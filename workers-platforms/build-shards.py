"""Partition the pinned Glottolog release into 989 independent Workers."""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import urllib.request
import importlib

catalog = importlib.import_module("import-languages")
SHARD_COUNT = 989

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--csv", type=Path)
    args = parser.parse_args()
    if args.csv:
        content = args.csv.read_bytes()
    else:
        with urllib.request.urlopen(catalog.URL, timeout=45) as response:
            content = response.read()
    if hashlib.sha256(content).hexdigest() != catalog.SHA256:
        raise SystemExit("Glottolog source checksum mismatch")
    originals = sorted(csv.DictReader(io.StringIO(content.decode("utf-8-sig"))), key=lambda row: row["ID"])
    ids = [row["ID"] for row in originals]
    if len(ids) != len(set(ids)) or len(ids) < SHARD_COUNT:
        raise SystemExit("Unexpected catalog keys or record count")
    records = [{"id": row["ID"], "name": row["Name"], "kind": row["Level"], "iso": row["ISO639P3code"] or None}
               for row in originals]
    sizes = len(records) // SHARD_COUNT
    remainder = len(records) % SHARD_COUNT
    offset = 0
    with args.output.open("w", encoding="utf-8") as file:
        for index in range(SHARD_COUNT):
            count = sizes + (index < remainder)
            block = records[offset:offset + count]
            offset += count
            item = {"id": f"language-shard-{index + 1:04}", "first": block[0]["id"], "last": block[-1]["id"],
                    "source": "Glottolog CLDF v5.4", "records": block}
            file.write(json.dumps(item, ensure_ascii=False, separators=(",", ":")) + "\n")

if __name__ == "__main__":
    main()
