#!/usr/bin/env python3
"""Build a D1 snapshot from Airtable field-ID record exports."""

import argparse
import json
import sqlite3
from pathlib import Path

from d1_snapshot import export_snapshot


SCHEMA = """
CREATE TABLE airtable_base(
  id TEXT PRIMARY KEY, name TEXT NOT NULL, observed_at TEXT NOT NULL
);
CREATE TABLE airtable_tables(
  id TEXT PRIMARY KEY, base_id TEXT NOT NULL REFERENCES airtable_base(id),
  name TEXT NOT NULL, description TEXT, primary_field_id TEXT
);
CREATE TABLE airtable_fields(
  table_id TEXT NOT NULL REFERENCES airtable_tables(id), id TEXT NOT NULL,
  name TEXT NOT NULL, type TEXT NOT NULL, description TEXT, included INTEGER NOT NULL
  CHECK(included IN (0,1)), PRIMARY KEY(table_id,id)
);
CREATE TABLE airtable_records(
  table_id TEXT NOT NULL REFERENCES airtable_tables(id), id TEXT NOT NULL,
  created_time TEXT, cells TEXT NOT NULL CHECK(json_valid(cells) AND json_type(cells)='object'),
  PRIMARY KEY(table_id,id)
);
CREATE VIEW airtable_table_counts AS
  SELECT t.id,t.name,COUNT(r.id) AS record_count
  FROM airtable_tables t LEFT JOIN airtable_records r ON r.table_id=t.id
  GROUP BY t.id,t.name;
"""


def build(export_dir, db):
    db.execute("PRAGMA foreign_keys=ON")
    db.executescript(SCHEMA)
    snapshot = json.loads((export_dir / "schema.json").read_text(encoding="utf-8"))
    base = snapshot["base"]
    db.execute("INSERT INTO airtable_base VALUES (?,?,?)", (base["id"], base["name"], snapshot["observedAt"]))
    for table in snapshot["tables"]:
        table_id = table["id"]
        db.execute("INSERT INTO airtable_tables VALUES (?,?,?,?,?)",
                   (table_id, base["id"], table["name"], table.get("description"), table.get("primaryFieldId")))
        db.executemany("INSERT INTO airtable_fields VALUES (?,?,?,?,?,?)", (
            (table_id, field["id"], field["name"], field["type"], field.get("description"), field["included"])
            for field in table["fields"]
        ))
        included = {field["id"] for field in table["fields"] if field["included"]}
        count = 0
        for path in sorted(export_dir.glob(table_id + "-*.json")):
            records = json.loads(path.read_text(encoding="utf-8"))
            for record in records:
                cells = record["cellValuesByFieldId"]
                if not cells.keys() <= included:
                    raise ValueError(f"Unexpected field in {table_id}/{record['id']}")
                db.execute("INSERT INTO airtable_records VALUES (?,?,?,?)",
                           (table_id, record["id"], record.get("createdTime"), json.dumps(cells, ensure_ascii=False)))
                count += 1
        if count != table["recordCount"]:
            raise ValueError(f"Expected {table['recordCount']} rows in {table_id}, got {count}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("export_dir", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    database = args.output.with_suffix(".sqlite")
    if database.exists():
        raise FileExistsError(database)
    with sqlite3.connect(database) as connection:
        build(args.export_dir, connection)
    print(json.dumps(export_snapshot(database, args.output), sort_keys=True))
