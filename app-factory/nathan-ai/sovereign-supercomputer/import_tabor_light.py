"""Create an idempotent D1 import from an owner-supplied Tabor Light JSON file."""
import argparse
import hashlib
import json
import sqlite3
import subprocess
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
COLUMNS = ("record_id, collection_type, title, raw_text_preserved, reverse_text, "
           "first_letter_code, sha256_hash, created_at")
INSERT = f"INSERT INTO tabor_light_vault ({COLUMNS})"
TRANSFORM = """
import { readFileSync } from 'node:fs';
import { words } from './ledger.mjs';
const input = JSON.parse(readFileSync(0, 'utf8'));
const output = [];
for (const text of input) output.push(await words(text));
process.stdout.write(JSON.stringify(output));
"""


def make_rows(source):
    data = json.loads(source.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        data = data.get("records", [data])
    if not isinstance(data, list) or not all(isinstance(item, dict) for item in data):
        raise ValueError("Use a record object, an array, or an object containing a records array.")
    text = [item.get("raw_text", item.get("text", item.get("raw_text_preserved"))) for item in data]
    if not all(isinstance(value, str) and value.strip() and len(value) <= 8192 for value in text):
        raise ValueError("Each record needs non-empty raw_text or text.")
    transformed = subprocess.run(["node", "--input-type=module", "-e", TRANSFORM], cwd=ROOT,
                                 input=json.dumps(text), text=True, check=True, capture_output=True)
    decoded = json.loads(transformed.stdout)
    now = datetime.now(timezone.utc).isoformat()
    seen = {}
    for index, (item, proof) in enumerate(zip(data, decoded, strict=True), 1):
        collection = str(item.get("collection_type") or "TRINITY_17")
        title = str(item.get("title") or f"Record {index}")
        digest = proof["sha256"]
        expected = item.get("sha256_hash", item.get("sha256"))
        if expected is not None and digest != expected:
            raise ValueError(f"Hash mismatch for record {index}.")
        record_id = str(item.get("record_id") or "tl-" + hashlib.sha256(
            (collection + "\0" + title + "\0" + digest).encode()).hexdigest())
        row = (record_id, collection, title, proof["exact_preserved"], proof["reverse_mirror"],
               proof["first_letter_extraction"], digest, now)
        if record_id in seen and seen[record_id] != row:
            raise ValueError(f"Conflicting records share ID {record_id}.")
        seen[record_id] = row
    return list(seen.values())


def export_sql(rows, destination):
    # UTF-8 hex literals preserve quotes and embedded controls across SQLite and D1 imports.
    def literal(value):
        return "CAST(X'" + value.encode("utf-8").hex() + "' AS TEXT)"

    with destination.open("x", encoding="utf-8") as file:
        for row in rows:
            values = ", ".join(map(literal, row))
            file.write(f"{INSERT} VALUES ({values}) ON CONFLICT(record_id) DO NOTHING;\n")


def import_local(rows, destination):
    with closing(sqlite3.connect(destination)) as db:
        db.executescript((ROOT / "migrations/0001_sovereign_core.sql").read_text())
        with db:
            before = db.total_changes
            db.executemany(f"{INSERT} VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(record_id) DO NOTHING", rows)
            return db.total_changes - before


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("json_input", type=Path)
    destination = parser.add_mutually_exclusive_group(required=True)
    destination.add_argument("--sql", type=Path)
    destination.add_argument("--db", type=Path)
    args = parser.parse_args()
    try:
        rows = make_rows(args.json_input)
        if args.sql:
            export_sql(rows, args.sql)
            print(json.dumps({"records": len(rows), "sql": str(args.sql)}))
        else:
            count = import_local(rows, args.db)
            print(json.dumps({"inserted": count, "existing": len(rows) - count}))
    except (OSError, ValueError, subprocess.CalledProcessError, sqlite3.Error) as error:
        parser.error(str(error))


if __name__ == "__main__":
    main()
