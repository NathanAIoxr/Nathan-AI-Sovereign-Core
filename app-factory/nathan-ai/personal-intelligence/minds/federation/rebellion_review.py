#!/usr/bin/env python3
"""THE REBELLION editorial review: provenance checks and proposed work only.

No network, external credentials, auto-publication or generated factual claims.
A deterministic companion to existing ONE Federation six worker roles.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sqlite3


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def validate(pack, original_markdown, db_path):
    source = Path(original_markdown).read_text(encoding="utf-8")
    quotations = re.findall(r"~~~text\n(.*?)\n~~~", source, flags=re.DOTALL)
    assert len(quotations) == 16, f"Expected 16 supplied verbatim source quotations; got {len(quotations)}"
    originals = [r for r in pack["records"] if r["kind"] == "author-original"]
    assert len(originals) == len(quotations)
    assert [r["exact_text"] for r in originals] == quotations, "Source mismatch: original wording changed"
    assert len({r["id"] for r in pack["records"]}) == len(pack["records"])
    assert all(r.get("tier") == "CERO" for r in pack["records"])
    assert all(r.get("provenance") and r.get("privacy") and r.get("evidence_status") for r in pack["records"])
    assert all(r["kind"] != "author-original" for r in pack["records"][len(originals):])
    ids = {r["id"] for r in pack["records"]}
    assert all(e["left"] in ids and e["right"] in ids for e in pack["links"])
    assert pack["schema"] == "nathan.one.federation.knowledge.v074"

    with sqlite3.connect(db_path) as db:
        rows = db.execute("SELECT exact_source_text,content_sha256 FROM federation_records").fetchall()
        assert len(rows) == len(pack["records"]), f"Unexpected federation source records: {len(rows)}"
        for text, digest in rows:
            assert hashlib.sha256(text.encode("utf-8")).hexdigest() == digest
        checks = db.execute("PRAGMA quick_check").fetchone()[0]
        assert checks == "ok", f"SQLite quick_check failed: {checks}"
        jobs = db.execute("SELECT role,state FROM federation_jobs ORDER BY id").fetchall()
        roles = [r[0] for r in jobs]
        assert roles == ["Leonardo", "Donatello", "Raphael", "Michelangelo", "DaVinci", "AncientSpecialists"]
        assert all(r[1] == "completed" for r in jobs)
        links = db.execute("SELECT COUNT(*) FROM federation_links").fetchone()[0]
        assert links >= len(pack["links"])
        tier_counts = dict(db.execute("SELECT tier,COUNT(*) FROM federation_records GROUP BY tier"))
        assert tier_counts == {"CERO": len(pack["records"])}

    return {"source_records": len(pack["records"]), "originals_exact": len(originals),
            "derived_review_only": len(pack["records"]) - len(originals),
            "proposed_links": len(pack["links"]), "source_matches": True,
            "sqlite_quick_check": checks, "completed_roles": roles, "tier_counts": tier_counts}


def produce_queue(pack, manuscript_path, audit):
    source = Path(manuscript_path).read_text(encoding="utf-8")
    # Chapters must be explicitly documented; this program never writes author manuscript text.
    chapter_section = source.split("## Proposed 25-chapter layout", 1)[1].split("## The merged Ivy Lee", 1)[0]
    chapters = re.findall(r"^\d+\. (.+)$", chapter_section, flags=re.MULTILINE)
    assert len(chapters) == 25, f"Expected 25 editorial chapter proposals; got {len(chapters)}"
    tasks = [
        {"task_id": f"rebellion.chapter.{i:02d}", "title": title,
         "stage": "proposed", "owner_approval_required": True,
         "operation": "locate original evidence, propose an outline, check claims and draft separately",
         "source": "MANUSCRIPT_AND_METHOD.md"} for i, title in enumerate(chapters, 1)
    ]
    for record in pack["records"]:
        if record["kind"] in ("research-candidate", "unverified-claim"):
            tasks.append({"task_id": "rebellion.verify." + record["id"], "title": record["title"],
                          "stage": "needs-evidence", "owner_approval_required": True,
                          "operation": "find primary source; store citations separately; do not upgrade evidence without human review",
                          "source": record["source_locator"]})
    return {"title": "THE REBELLION — proposed editorial expansion queue",
            "date": pack["edition"], "auto_publish": False, "auto_modify_source": False,
            "status": "proposals only; no live AI-provider inference", "audit": audit,
            "tasks": tasks}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--pack", required=True)
    p.add_argument("--original", required=True)
    p.add_argument("--manuscript", required=True)
    p.add_argument("--db", required=True)
    p.add_argument("--output", required=True)
    a = p.parse_args()
    pack = read_json(a.pack)
    audit = validate(pack, a.original, a.db)
    queue = produce_queue(pack, a.manuscript, audit)
    Path(a.output).write_text(json.dumps(queue, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"audit": audit, "review_tasks": len(queue["tasks"]), "status": queue["status"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
