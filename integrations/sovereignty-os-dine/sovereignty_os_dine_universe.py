"""Sovereignty OS — Diné Living Universe & Tabor Earth, SQLite snapshot engine."""

import argparse
import hashlib
import json
import sqlite3
from contextlib import closing
from pathlib import Path

PROJECT = Path(__file__).resolve().parent
SECTIONS = {
    "landmarks": ("id", "source_claim"),
    "submerged_lands": ("id", "source_claim"),
    "linguistic_concordance": ("term", "hypothesis_or_wordplay"),
    "three_sisters_agronomy": ("name", "source_claim"),
    "ke_clans": ("clan_name", "source_claim"),
    "dine_lunar_months": ("month_order", "source_claim"),
    "community_projects": ("project_name", "project_proposal"),
}


def antipode(lat, lon):
    """Find decimal-degree antipodes, normalizing longitude to [-180, 180)."""
    if not -90 <= lat <= 90 or not -180 <= lon <= 180:
        raise ValueError("Latitude and longitude are outside decimal-degree bounds")
    return {"latitude": round(-lat, 10), "longitude": round(lon % 360 - 180, 10)}


def seed_statements():
    """Return the common SQLite and D1 import and the content-addressed source ID."""
    raw = (PROJECT / "Pasted-markdown-source.md").read_bytes()
    seed = json.loads((PROJECT / "dine_seed.json").read_text(encoding="utf-8"))
    sha256 = hashlib.sha256(raw).hexdigest()
    if (sha256, len(raw)) != (seed["source_sha256"], seed["source_bytes"]):
        raise ValueError("Markdown bytes do not match the seed provenance")
    if seed["sections"].keys() != SECTIONS.keys():
        raise ValueError("Seed sections do not match the supported sections")

    source_id = f"attachment-sha256-{sha256}"
    statements = [{
        "sql": """
            INSERT INTO sovereignty_dine_sources
                (source_id, sha256, original_markdown, source_bytes)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (source_id) DO NOTHING
        """,
        "params": [source_id, sha256, raw.decode("utf-8"), len(raw)],
    }]

    record_sql = """
        INSERT INTO sovereignty_dine_records
            (source_id, section, record_id, ordinal, content_status, payload_json)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (source_id, section, record_id) DO NOTHING
    """
    statements.append({
        "sql": record_sql,
        "params": [
            source_id, "system_meta", "bedrock-to-vine", 0, "author_framework",
            json.dumps(seed["system_meta"], ensure_ascii=False),
        ],
    })
    for section, (id_field, status) in SECTIONS.items():
        for ordinal, row in enumerate(seed["sections"][section]):
            payload = {**row, "content_status": status}
            if section in {"landmarks", "submerged_lands"}:
                payload["computed_antipode"] = antipode(row["lat"], row["lon"])
            statements.append({
                "sql": record_sql,
                "params": [
                    source_id, section, str(row[id_field]), ordinal, status,
                    json.dumps(payload, ensure_ascii=False),
                ],
            })
    return source_id, statements


class SovereigntyOS:
    def __init__(self, db_path=":memory:"):
        schema = (PROJECT / "001_bedrock.sql").read_text(encoding="utf-8")
        self.source_id, self._statements = seed_statements()
        self.conn = sqlite3.connect(db_path)
        self.conn.execute("PRAGMA foreign_keys = ON")
        self.conn.executescript(schema)

    def close(self):
        self.conn.close()

    def seed_all_data(self):
        """Import missing rows atomically. A repeat import preserves existing rows."""
        with self.conn:
            for statement in self._statements:
                self.conn.execute(statement["sql"], statement["params"])

    def export_full_snapshot(self):
        records = self.conn.execute(
            """
            SELECT section, payload_json
            FROM sovereignty_dine_records
            WHERE source_id = ?
            ORDER BY ordinal
            """,
            (self.source_id,),
        )
        snapshot = {"system_meta": {}, **{section: [] for section in SECTIONS}}
        for section, payload_json in records:
            payload = json.loads(payload_json)
            if section == "system_meta":
                snapshot[section] = payload
            else:
                snapshot[section].append(payload)
        return snapshot


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default=":memory:", help="Local SQLite file")
    parser.add_argument("--section", choices=("system_meta", *SECTIONS), help="Export just this section")
    args = parser.parse_args()
    with closing(SovereigntyOS(args.db)) as engine:
        engine.seed_all_data()
        snapshot = engine.export_full_snapshot()
    result = snapshot[args.section] if args.section else snapshot
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
