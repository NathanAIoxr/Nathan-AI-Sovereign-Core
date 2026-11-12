#!/usr/bin/env python3
"""Build a portable, full-text-searchable research database from the checked-in catalog.

No external dependencies. CERO originals are loaded from an unmodified companion
transcript; UNO researched sources and DOS interpretations retain their stage.
"""
import argparse
import json
import sqlite3
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEFAULT_OUTPUT = HERE / "Nathan_AI_Cosmic_Body_Atlas.sqlite"

def build(output=DEFAULT_OUTPUT):
    data = json.loads((HERE / "atlas.json").read_text(encoding="utf-8"))
    if data["schema"] != "nathan-ai.cosmic-body-research-atlas.v1":
        raise ValueError("Unexpected catalog edition")
    if sum(data["counts"][x] for x in ("spine","question","bones")) != 246:
        raise ValueError("Pillar count changed")
    sources, records, edges = data["sources"], data["records"], data["links"]
    if len({s["id"] for s in sources}) != len(sources):
        raise ValueError("Duplicate source IDs")
    if len({r["id"] for r in records}) != len(records):
        raise ValueError("Duplicate concept IDs")
    if len({(e["from"],e["to"],e["relation"]) for e in edges}) != len(edges):
        raise ValueError("Duplicate relation keys")
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        output.unlink()
    with sqlite3.connect(output) as db:
        db.executescript((HERE / "schema.sqlite.sql").read_text(encoding="utf-8"))
        for s in sources:
            db.execute("INSERT INTO sources VALUES (?,?,?,?)",
                       (s["id"],s["title"],s["url"],s["kind"]))
        for r in records:
            db.execute("INSERT INTO concepts VALUES (?,?,?,?,?,?)",
                       (r["id"],r["category"],r["label"],r["detail"],r["tier"],
                        json.dumps(r["meta"],ensure_ascii=False,sort_keys=True)))
            db.execute("INSERT INTO concept_search VALUES (?,?,?,?,?)",
                       (r["id"],r["label"],r["category"],r["detail"],r["tier"]))
            for source_id in r["source_ids"]:
                db.execute("INSERT INTO concept_sources VALUES (?,?)",(r["id"],source_id))
        for e in edges:
            db.execute("INSERT INTO concept_links VALUES (?,?,?,?)",
                       (e["from"],e["to"],e["relation"],e["note"]))
        db.execute("INSERT INTO source_transcripts VALUES (?,?,?,?)",
                   ("USER-SUBMISSION-2026-11-12","user-supplied conversation compilation",
                    (HERE / "SOURCE_TRANSCRIPT.md").read_text(encoding="utf-8"),
                    "2026-11-12"))
        integrity=db.execute("PRAGMA integrity_check").fetchone()[0]
        if integrity!="ok": raise RuntimeError(integrity)
        db.commit()
    return {"output":str(output),"records":len(records),"links":len(edges),
            "sources":len(sources),"integrity":"ok"}

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--output",type=Path,default=DEFAULT_OUTPUT)
    args=p.parse_args()
    print(json.dumps(build(args.output),indent=2))
