"""Opt-in, local file bridge: Nathan AI private SQLite -> meSPARK JSON.

Never uploads data. Public GitHub contains implementation only, no owner's records.
"""
import argparse
import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

KINDS = {
    "user_account": "personal-memory",
    "fictional_canon": "fiction",
    "source_code": "hypothesis",
    "documented": "documented",
    "hypothesis": "hypothesis",
    "analogy": "analogy",
}


def build_export(database, *, allow_private=False):
    """Read records only. Stable UUIDs make repeated browser imports idempotent."""
    connection = sqlite3.connect(f"file:{Path(database).resolve()}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    try:
        rows = connection.execute("""
            SELECT r.id, r.kind, r.title, r.description, r.evidence_class,
                   r.visibility, r.created_at, s.sha256 AS source_hash
              FROM record r LEFT JOIN source s ON s.id = r.source_id
             ORDER BY r.id
        """).fetchall()
    finally:
        connection.close()
    nodes = []
    for r in rows:
        if r["visibility"] != "public" and not allow_private:
            continue
        kind = KINDS.get(r["evidence_class"], "hypothesis")
        # A plain hash preserves provenance without exporting the original text.
        source = f"sha256:{r['source_hash']}" if r["source_hash"] else None
        nodes.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_URL, "mespark:source-record:" + str(r["id"]))),
            "name": r["title"], "notes": r["description"], "kind": kind,
            "lat": None, "lon": None, "created": r["created_at"],
            "source": source,
        })
    return {"schema": "mespark-v1", "exported": datetime.now(timezone.utc).isoformat(),
            "nodes": nodes}


def write_export(database, destination, *, allow_private=False):
    destination = Path(destination)
    if destination.exists():
        raise FileExistsError("Destination exists; choose a new file to preserve originals")
    payload = build_export(database, allow_private=allow_private)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("x", encoding="utf-8") as out:
        json.dump(payload, out, indent=2, ensure_ascii=False)
        out.write("\n")
    try:
        destination.chmod(0o600)
    except OSError:
        pass
    return len(payload["nodes"])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, required=True, help="Local private memory_matrix.sqlite3")
    parser.add_argument("--out", type=Path, required=True, help="New local JSON export path")
    parser.add_argument("--include-private", action="store_true",
                        help="Explicitly include private indexed records in this local export")
    args = parser.parse_args()
    count = write_export(args.db, args.out, allow_private=args.include_private)
    print(f"Exported {count} records to local file {args.out}; no network requests")


if __name__ == "__main__":
    main()
