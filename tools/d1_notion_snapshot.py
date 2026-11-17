#!/usr/bin/env python3
"""Build a D1 snapshot from a complete Notion data-source query result."""

import argparse
import json
import sqlite3
from pathlib import Path

from d1_snapshot import export_snapshot


SCHEMA = """
CREATE TABLE notion_source(
  id TEXT PRIMARY KEY, name TEXT NOT NULL, observed_at TEXT NOT NULL
);
CREATE TABLE notion_records(
  id TEXT PRIMARY KEY, source_id TEXT NOT NULL REFERENCES notion_source(id),
  page_url TEXT, created_time TEXT,
  properties TEXT NOT NULL CHECK(json_valid(properties) AND json_type(properties)='object')
);
"""


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    source = json.loads(args.source.read_text(encoding="utf-8"))
    if source.get("has_more") or len(source["results"]) != source["count"] or len(source["data_source_ids"]) != 1:
        raise ValueError("Expected a complete export from one Notion data source")
    database = args.output.with_suffix(".sqlite")
    if database.exists():
        raise FileExistsError(database)
    with sqlite3.connect(database) as db:
        db.execute("PRAGMA foreign_keys=ON")
        db.executescript(SCHEMA)
        source_id, = source["data_source_ids"]
        db.execute("INSERT INTO notion_source VALUES (?,?,?)", (source_id, source["title"], source["observedAt"]))
        for record in source["results"]:
            properties = {k: v for k, v in record.items() if k not in {"id", "url", "createdTime"}}
            db.execute("INSERT INTO notion_records VALUES (?,?,?,?,?)",
                       (record["id"], source_id, record["url"], record.get("createdTime"),
                        json.dumps(properties, ensure_ascii=False)))
    print(json.dumps(export_snapshot(database, args.output), sort_keys=True))
