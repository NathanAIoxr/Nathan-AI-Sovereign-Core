"""Load the source case into SQLite or emit a parameterized Cloudflare D1 batch."""
import argparse
import hashlib
import json
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parent


def load_case():
    raw = (ROOT / "case.json").read_bytes()
    data = json.loads(raw)
    case = data["case"]
    case_id = case["id"]
    seed = {
        "cases": [(
            case_id, case["title"], case["scope"], case["recorded_at_utc"],
            case["status"], hashlib.sha256(raw).hexdigest(),
        )],
        "messages": [
            (case_id, row["id"], number, row["speaker"], row["kind"], row["text"])
            for number, row in enumerate(data["entries"], start=1)
        ],
        "findings": [
            (case_id, row["id"], row["status"], row["finding"])
            for row in data["findings"]
        ],
        "sources": [
            (case_id, row["id"], row["title"], row["kind"], row["url"], row["observation"])
            for row in data["sources"]
        ],
        "finding_messages": [
            (case_id, row["id"], ref)
            for row in data["findings"] for ref in row["entries"]
        ],
        "finding_sources": [
            (case_id, row["id"], ref)
            for row in data["findings"] for ref in row["sources"]
        ],
    }
    return case_id, seed


def schema_statements():
    return [
        statement.strip()
        for statement in (ROOT / "schema.sql").read_text(encoding="utf-8").split(";")
        if statement.strip()
    ]


def insert_statement(table, length):
    placeholders = ", ".join("?" for _ in range(length))
    return f"INSERT INTO {table} VALUES ({placeholders}) ON CONFLICT DO NOTHING"


def verify(db, case_id, seed):
    for table, expected in seed.items():
        case_column = "id" if table == "cases" else "case_id"
        actual = db.execute(f"SELECT * FROM {table} WHERE {case_column} = ?", (case_id,)).fetchall()
        if sorted(actual) != sorted(expected):
            raise RuntimeError(f"Stored rows differ from the case source: {table}")
    if db.execute("PRAGMA foreign_key_check").fetchone():
        raise RuntimeError("Ledger contains broken evidence links")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--database", type=Path, help="Create or verify a SQLite database file.")
    mode.add_argument("--d1-payload", action="store_true", help="Write the parameterized D1 batch as JSON.")
    args = parser.parse_args()
    case_id, seed = load_case()

    if args.d1_payload:
        batch = [{"sql": sql} for sql in schema_statements()]
        for table, rows in seed.items():
            for row in rows:
                placeholders = ", ".join("NULL" if item is None else "?" for item in row)
                params = [str(item) for item in row if item is not None]
                sql = f"INSERT INTO {table} VALUES ({placeholders}) ON CONFLICT DO NOTHING"
                batch.append({"sql": sql, "params": params})
        print(json.dumps({"batch": batch}, ensure_ascii=False))
        return

    db = sqlite3.connect(args.database or ":memory:")
    db.execute("PRAGMA foreign_keys = ON")
    with db:
        for sql in schema_statements():
            db.execute(sql)
        for table, rows in seed.items():
            if rows:
                db.executemany(insert_statement(table, len(rows[0])), rows)
        verify(db, case_id, seed)
    print(json.dumps({"case": case_id, "verified": {table: len(rows) for table, rows in seed.items()}}))


if __name__ == "__main__":
    main()
