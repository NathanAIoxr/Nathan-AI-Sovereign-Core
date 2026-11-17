#!/usr/bin/env python3
"""Build SQLite copies of the checked-in worlds and historical sports references."""

import argparse
import json
import sqlite3
from pathlib import Path

from d1_snapshot import export_snapshot


ROOT = Path(__file__).resolve().parents[1]
WORLDS = ROOT / "app-factory/one/mespark-memory-matrix"
SPORTS = ROOT / "app-factory/historical-sports"


def worlds(db):
    schema = (WORLDS / "worlds-atlas.sql").read_text(encoding="utf-8")
    db.executescript(schema.replace("DOUBLE PRECISION", "REAL").replace("TIMESTAMPTZ DEFAULT now()", "TEXT"))
    db.execute("CREATE TABLE atlas_metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL)")
    atlas = json.loads((WORLDS / "worlds-atlas.json").read_text(encoding="utf-8"))
    db.executemany("INSERT INTO atlas_metadata VALUES (?,?)", ((key, atlas[key]) for key in ("schema", "note")))
    db.executemany(
        """INSERT INTO mespark_worlds
           (id,name,type,region,latitude,longitude,relationship,description,source_label,era)
           VALUES (:id,:name,:type,:region,:lat,:lon,:relationship,:description,:source,:era)""",
        atlas["records"],
    )


def historical_sports(db):
    schema = (SPORTS / "schema.sql").read_text(encoding="utf-8")
    db.executescript(
        schema.replace("JSONB", "TEXT").replace("'[]'::jsonb", "'[]'")
        .replace("CREATE OR REPLACE VIEW", "CREATE VIEW")
    )
    db.execute("""CREATE TABLE historical_sports_source_records(
                  team_id TEXT PRIMARY KEY REFERENCES master_universe_teams(team_id),
                  source_json TEXT NOT NULL CHECK(json_valid(source_json)))""")
    for record in json.loads((SPORTS / "examples.json").read_text(encoding="utf-8")):
        db.execute(
            """INSERT INTO master_universe_teams
               (team_id,display_name,record_kind,provenance_label,founding_year,simulation_year,
                legacy_anchor_team_id,reference_urls,rights_status,rights_documents,original_research_notes)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (record["id"], record["name"], record["record_kind"], record["provenance"],
             record.get("founding_year"), record.get("simulation_year"), record.get("legacy_anchor_id"),
             json.dumps(record["sources"], ensure_ascii=False), record["rights_status"],
             json.dumps(record["rights_documents"], ensure_ascii=False), record["notes"]),
        )
        db.execute("INSERT INTO historical_sports_source_records VALUES (?,?)",
                   (record["id"], json.dumps(record, ensure_ascii=False)))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    for name, builder in (("tabor-worlds-atlas", worlds), ("tabor-historical-sports", historical_sports)):
        source = args.output / (name + ".sqlite")
        if source.exists():
            raise FileExistsError(source)
        with sqlite3.connect(source) as db:
            db.execute("PRAGMA foreign_keys=ON")
            builder(db)
        print(json.dumps(export_snapshot(source, args.output / (name + ".sql")), sort_keys=True))
