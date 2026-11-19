"""Lossless brainstorming registry: stdlib only; SQLite for local staging.
Never rewrites original user text. Ideas are annotations, not substitutes.
"""
import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS source_messages (
 source_id TEXT PRIMARY KEY, origin TEXT NOT NULL, original_text TEXT NOT NULL,
 sha256 TEXT NOT NULL, captured_at TEXT NOT NULL, completeness TEXT NOT NULL
 CHECK(completeness IN ('verbatim','excerpt','summary'))
);
CREATE TABLE IF NOT EXISTS opportunity_ideas (
 idea_id TEXT PRIMARY KEY, source_id TEXT NOT NULL REFERENCES source_messages(source_id),
 title TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL,
 decision TEXT NOT NULL DEFAULT 'UNDECIDED'
 CHECK(decision IN ('UNDECIDED','ADOPT','MODIFY','BUILD_DIFFERENTLY','DEFER','REJECT')),
 implementation_status TEXT NOT NULL DEFAULT 'IDEA'
 CHECK(implementation_status IN ('IDEA','SOURCE_FOUND','PROTOTYPE','TESTED','DEPLOYED','VERIFIED'))
);
CREATE TABLE IF NOT EXISTS import_events (
 import_id TEXT PRIMARY KEY, source_id TEXT NOT NULL, recorded_at TEXT NOT NULL
);
"""
def connect(path):
    db=sqlite3.connect(path)
    db.execute("PRAGMA foreign_keys=ON")
    db.executescript(SCHEMA)
    return db

def record_source(db, source_id, text, origin="conversation", completeness="verbatim"):
    if not isinstance(text,str) or not text:
        raise ValueError("Original source text required")
    digest=hashlib.sha256(text.encode("utf-8")).hexdigest()
    existing=db.execute("SELECT sha256,completeness FROM source_messages WHERE source_id=?",(source_id,)).fetchone()
    if existing:
        if existing != (digest,completeness):
            raise ValueError("Immutable source collision: choose a new source_id")
        return False
    db.execute("INSERT INTO source_messages VALUES(?,?,?,?,?,?)",
       (source_id,origin,text,digest,datetime.now(timezone.utc).isoformat(),completeness))
    db.commit()
    return True

def record_idea(db, idea_id, source_id, title, category, description):
    if not db.execute("SELECT 1 FROM source_messages WHERE source_id=?",(source_id,)).fetchone():
        raise ValueError("Source must exist")
    db.execute("INSERT INTO opportunity_ideas(idea_id,source_id,title,category,description) VALUES(?,?,?,?,?)",
      (idea_id,source_id,title,category,description))
    db.commit()

def export_json(db):
    db.row_factory=sqlite3.Row
    return json.dumps({
      "sources":[dict(r) for r in db.execute("SELECT * FROM source_messages ORDER BY source_id")],
      "ideas":[dict(r) for r in db.execute("SELECT * FROM opportunity_ideas ORDER BY idea_id")]
    },ensure_ascii=False,indent=2)

if __name__=="__main__":
    import argparse
    p=argparse.ArgumentParser()
    p.add_argument("--db",default="brainstorm-staging.sqlite")
    p.add_argument("--import-file",help="Exact UTF-8 original text")
    p.add_argument("--source-id")
    p.add_argument("--completeness",choices=("verbatim","excerpt","summary"),default="verbatim")
    p.add_argument("--export",help="Write JSON export")
    args=p.parse_args()
    db=connect(args.db)
    if args.import_file:
        if not args.source_id: p.error("--source-id required for --import-file")
        record_source(db,args.source_id,Path(args.import_file).read_text(encoding="utf-8"),completeness=args.completeness)
    if args.export: Path(args.export).write_text(export_json(db),encoding="utf-8")
