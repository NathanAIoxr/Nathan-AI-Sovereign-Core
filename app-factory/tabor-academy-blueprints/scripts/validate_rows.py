import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import re
import sqlite3
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
COLUMNS = (
    "id", "tier", "domain", "item_a_label", "item_b_label", "item_c_label",
    "clue_prompt", "core_parts", "operations", "traits_attributes", "scale_medium",
    "input_output", "flow_direction", "modification_exemption", "blind_spot_note",
)
TIERS = {"Tier 1: Kids", "Tier 2: Youth", "Tier 3: Adults"}
DOMAINS = {"Biology", "Mechanics", "Physics", "Nature", "Energy"}


def validate(row):
    if tuple(row.keys()) != COLUMNS or type(row["id"]) is not int or row["id"] <= 0:
        raise ValueError("Expected 15 ordered columns and a positive integer ID")
    if row["tier"] not in TIERS or row["domain"] not in DOMAINS:
        raise ValueError(f"Invalid tier/domain in row {row['id']}")
    for name in COLUMNS[1:]:
        value = row[name]
        if name == "item_c_label" and value is None:
            continue
        if not isinstance(value, str) or not value.strip() or "\0" in value:
            raise ValueError(f"Invalid or empty {name} in row {row['id']}")


def connect():
    db = sqlite3.connect(":memory:")
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    migrations = sorted((ROOT / "migrations").glob("*.sql"))
    if not migrations:
        raise ValueError("No migrations found")
    for migration in migrations:
        try:
            db.executescript(migration.read_text(encoding="utf-8"))
        except sqlite3.Error as error:
            raise ValueError(f"{migration.name}: {error}") from error
    if tuple(column["name"] for column in db.execute("PRAGMA table_info(blueprint_lessons)")) != COLUMNS:
        raise ValueError("Blueprint lesson schema does not match all 15 columns in order")
    return db


def export(rows, write):
    text = io.StringIO(newline="")
    csv_rows = csv.DictWriter(text, fieldnames=COLUMNS, lineterminator="\n")
    csv_rows.writeheader()
    # Some spreadsheet programs execute formulas in CSV cells.
    csv_rows.writerows({k: "'" + v if isinstance(v, str) and v.lstrip().startswith(("=", "+", "-", "@")) else v
                        for k, v in row.items()} for row in rows)
    contents = {
        "blueprints.json": json.dumps(rows, ensure_ascii=False, indent=2) + "\n",
        "blueprints.csv": text.getvalue(),
    }
    for name, content in contents.items():
        path = ROOT / "public" / "exports" / name
        if write:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8", newline="\n")
        elif not path.exists() or path.read_text(encoding="utf-8") != content:
            raise ValueError(f"Stale export: {name}. Run npm run exports")


def propose(db, event_file):
    event = json.loads(event_file.read_text(encoding="utf-8"))
    payload = event.get("client_payload", {})
    data = payload.get("blueprint")
    sources = payload.get("sources")
    if not isinstance(data, dict) or set(data) != set(COLUMNS[1:]):
        raise ValueError("Expected exactly the 14 supplied blueprint fields")
    if not isinstance(sources, list) or not 1 <= len(sources) <= 5:
        raise ValueError("Provide at least one source for editorial review")
    for source in sources:
        if not isinstance(source, str) or not re.fullmatch(r"https://[^\s<>]{1,500}", source):
            raise ValueError("Invalid source URL")
        parsed = urlsplit(source)
        if not parsed.hostname or parsed.username or parsed.password:
            raise ValueError("Invalid source host")
    for value in data.values():
        if value is not None and (not isinstance(value, str) or len(value) > 1200):
            raise ValueError("Field exceeds validation bounds")
    identity = hashlib.sha256(json.dumps(data, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:28]
    # Stable IDs allow independent proposals without conflicting with historical sequential IDs.
    row_id = 100_000 + int(identity[:12], 16) % 900_000
    row = {"id": row_id, **{field: data[field] for field in COLUMNS[1:]}}
    validate(row)
    root = ROOT / "migrations"
    path = root / f"1000_proposal_{identity}.sql"
    if path.exists():
        return
    if db.execute("SELECT 1 FROM blueprint_lessons WHERE id=?", (row_id,)).fetchone():
        raise ValueError("Proposal ID collision")
    # SQLite quotes every value, including any apostrophes or newlines in the draft.
    values = [db.execute("SELECT quote(?)", (value,)).fetchone()[0] for value in row.values()]
    sql = f"INSERT INTO blueprint_lessons ({', '.join(COLUMNS)}) VALUES ({', '.join(values)});\n"
    duplicate = payload.get("possible_duplicate")
    source_note = ""
    if isinstance(duplicate, dict) and type(duplicate.get("lessonId")) is int and type(duplicate.get("similarity")) in (int, float):
        existing = duplicate["lessonId"]
        similarity = duplicate["similarity"]
        if 0.94 < similarity <= 1.01 and db.execute("SELECT 1 FROM blueprint_lessons WHERE id=?", (existing,)).fetchone():
            label = row["item_a_label"] + " / " + row["item_b_label"]
            quoted = db.execute("SELECT quote(?)", (label,)).fetchone()[0]
            sql = f"INSERT OR IGNORE INTO blueprint_aliases(label,lesson_id) VALUES ({quoted},{existing});\n"
            source_note = f"-- Proposed alias (cosine {similarity:.4f}). Confirm mechanism and boundaries before merging.\n"
    db.executescript(sql)
    source_comments = "".join(f"-- Editorial source: {url}\n" for url in sources)
    path.write_text(f"-- Review factual claims against the sources before accepting this lesson.\n{source_note}{source_comments}{sql}", encoding="utf-8")
    print(identity)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--export", action="store_true")
    parser.add_argument("--propose", type=Path)
    args = parser.parse_args()
    db = connect()
    if args.propose:
        propose(db, args.propose)
        return
    rows = [dict(row) for row in db.execute("SELECT * FROM blueprint_lessons ORDER BY id")]
    if not rows:
        raise ValueError("The published curriculum is empty")
    for row in rows:
        validate(row)
    export(rows, args.export)
    print(f"Validated {len(rows)} blueprint lessons across {len(COLUMNS)} columns.")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, sqlite3.Error) as error:
        raise SystemExit(str(error)) from error
