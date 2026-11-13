#!/usr/bin/env python3
"""Nathan AI / ONE worker-family registry and proposal-only task router.

An additive extension of the existing ONE Federation SQLite master.
This module never connects to networks or launches physical/remote agents.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
import uuid

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from federation import ingest, now, open_main  # Reuse existing master, never replace.

REGISTRY = HERE / "registry.v21.json"

SCHEMA = """
CREATE TABLE IF NOT EXISTS one_worker_family_versions (
 family_id INTEGER NOT NULL, definition_sha256 TEXT NOT NULL,
 source_class TEXT NOT NULL, exact_json TEXT NOT NULL, first_indexed_at TEXT NOT NULL,
 PRIMARY KEY(family_id,definition_sha256)
);
CREATE TABLE IF NOT EXISTS one_worker_family_current (
 family_id INTEGER PRIMARY KEY,
 definition_sha256 TEXT NOT NULL,
 FOREIGN KEY (family_id,definition_sha256)
 REFERENCES one_worker_family_versions(family_id,definition_sha256)
);
CREATE TABLE IF NOT EXISTS one_worker_family_task_proposals (
 task_id TEXT PRIMARY KEY, created_at TEXT NOT NULL,
 title TEXT NOT NULL, context TEXT NOT NULL, work_class TEXT NOT NULL,
 scope TEXT NOT NULL, primary_family INTEGER NOT NULL,
 ranked_families_json TEXT NOT NULL, policy_families_json TEXT NOT NULL,
 approval_required INTEGER NOT NULL DEFAULT 1,
 state TEXT NOT NULL DEFAULT 'proposed'
 CHECK (state IN ('proposed','review_required','blocked','cancelled')),
 reasoning_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS one_worker_family_audit (
 event_id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL,
 action TEXT NOT NULL, detail_json TEXT NOT NULL
);
"""
WORK_CLASSES = ("maintenance", "production", "innovation")
SCOPES = (
    "local_simulation", "owned_infrastructure", "public_research",
    "third_party", "unknown"
)


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_registry(path=REGISTRY):
    root = json.loads(Path(path).read_text(encoding="utf-8"))
    families = root.get("minds")
    if not isinstance(families, list) or len(families) != 21:
        raise ValueError("Registry must contain exactly 21 family definitions")
    if [f.get("family_id") for f in families] != list(range(1, 22)):
        raise ValueError("Family IDs must appear in numeric 1..21 order")
    for f in families:
        if (not isinstance(f.get("name"), str) or not f["name"]
            or not isinstance(f.get("keywords"), list) or not f["keywords"]
            or not all(isinstance(t, str) and t.strip() for t in f["keywords"])
            or f.get("source_class") not in ("editorial_crosswalk", "creator_supplied")):
            raise ValueError("Invalid family definition")
    if families[20]["name"] != "ONE":
        raise ValueError("Family 21 must be ONE")
    if not families[20].get("author_verbatim", "").startswith("family 21 is ONE - we are all family"):
        raise ValueError("Family 21's exact author declaration must be preserved")
    return root


def bootstrap(db, registry=REGISTRY):
    root = load_registry(registry)
    db.executescript(SCHEMA)
    # The existing federation captures unchanged original text, SHA-256 and
    # independent source IDs: do not create a competing main database.
    federation_result = ingest(db, registry)
    new_versions = 0
    for item in root["minds"]:
        raw = canonical(item)
        h = digest(raw)
        old_changes = db.total_changes
        db.execute("""INSERT OR IGNORE INTO one_worker_family_versions
            (family_id,definition_sha256,source_class,exact_json,first_indexed_at)
            VALUES(?,?,?,?,?)""",
            (item["family_id"], h, item["source_class"], raw, now()))
        new_versions += int(db.total_changes > old_changes)
        db.execute("""INSERT INTO one_worker_family_current
            (family_id,definition_sha256) VALUES(?,?)
            ON CONFLICT(family_id) DO UPDATE SET definition_sha256=excluded.definition_sha256""",
            (item["family_id"], h))
    db.execute("INSERT INTO one_worker_family_audit(at,action,detail_json) VALUES(?,?,?)",
               (now(), "bootstrap",
                canonical({"families": 21, "new_versions": new_versions,
                           "federation": federation_result})))
    db.commit()
    return {"families": 21, "new_family_versions": new_versions,
            "federation": federation_result}


def active_families(db):
    rows = db.execute("""SELECT v.exact_json FROM one_worker_family_current c
        JOIN one_worker_family_versions v
          ON c.family_id=v.family_id AND c.definition_sha256=v.definition_sha256
        ORDER BY c.family_id""")
    return [json.loads(raw) for (raw,) in rows]


def rank(text, families):
    found = []
    lower = text.casefold()
    for family in families:
        matched = [
            word for word in family["keywords"]
            if re.search(r"(?<!\w)" + re.escape(word.casefold()) + r"(?!\w)", lower)
        ]
        if matched:
            found.append((family["family_id"], len(matched), matched))
    found.sort(key=lambda x: (-x[1], x[0]))
    # Unknown work belongs to Family 3's human-reviewed classifier.
    return found[:3] or [(3, 0, [])]


def propose(db, title, context="", work_class="maintenance", scope="local_simulation"):
    if not isinstance(title, str) or not title.strip() or len(title) > 500:
        raise ValueError("Task title must contain 1–500 characters")
    if not isinstance(context, str) or len(context) > 3000:
        raise ValueError("Context must be a string of at most 3000 characters")
    if work_class not in WORK_CLASSES or scope not in SCOPES:
        raise ValueError("Unknown work class or authorization scope")
    families = active_families(db)
    if len(families) != 21:
        raise ValueError("Bootstrap the complete 21-family registry first")
    matches = rank(title + " " + context, families)
    state = ("blocked" if scope == "third_party" else
             "review_required" if scope == "unknown" else "proposed")
    reasoning = {
        "matching_keywords": {str(fid): words for fid, _, words in matches},
        "owner_permission": "required for every real-world, external, or network action",
        "scope_rule": "third-party scope blocked; unknown scope requires review",
        "execution": "none; task proposal only",
        "family_21": "ONE: equal standing, consent, human dignity, non-harm",
        "research": "speculative capabilities are not treated as proven"
    }
    task_id = "ONE-" + uuid.uuid4().hex[:16]
    db.execute("""INSERT INTO one_worker_family_task_proposals
        (task_id,created_at,title,context,work_class,scope,primary_family,
         ranked_families_json,policy_families_json,approval_required,state,reasoning_json)
        VALUES(?,?,?,?,?,?,?,?,?,1,?,?)""",
        (task_id, now(), title, context, work_class, scope, matches[0][0],
         canonical([row[0] for row in matches]), canonical([19, 20, 21]),
         state, canonical(reasoning)))
    db.execute("INSERT INTO one_worker_family_audit(at,action,detail_json) VALUES(?,?,?)",
               (now(), "proposed_task", canonical({"task_id": task_id, "state": state})))
    db.commit()
    return {
        "task_id": task_id, "state": state,
        "primary_family": matches[0][0],
        "ranked_families": [row[0] for row in matches],
        "policy_families": [19, 20, 21],
        "work_class": work_class, "scope": scope,
        "approval_required": True, "execution": "none",
        "reasoning": reasoning
    }


def status(db):
    db.executescript(SCHEMA)
    return {
        "current_families": db.execute(
            "SELECT COUNT(*) FROM one_worker_family_current").fetchone()[0],
        "saved_versions": db.execute(
            "SELECT COUNT(*) FROM one_worker_family_versions").fetchone()[0],
        "task_proposals": db.execute(
            "SELECT COUNT(*) FROM one_worker_family_task_proposals").fetchone()[0],
        "external_actions_executed": 0
    }


def main():
    p = argparse.ArgumentParser(description="ONE v21 registry and proposal-only dispatcher")
    p.add_argument("--db", default="ONE_Federation_Master.sqlite3")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("bootstrap")
    sub.add_parser("status")
    route = sub.add_parser("route")
    route.add_argument("title")
    route.add_argument("--context", default="")
    route.add_argument("--work-class", choices=WORK_CLASSES, default="maintenance")
    route.add_argument("--scope", choices=SCOPES, default="local_simulation")
    args = p.parse_args()
    db = open_main(args.db)
    try:
        if args.cmd == "bootstrap":
            result = bootstrap(db)
        elif args.cmd == "status":
            result = status(db)
        else:
            result = propose(db, args.title, args.context, args.work_class, args.scope)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    finally:
        db.close()


if __name__ == "__main__":
    main()
