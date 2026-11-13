#!/usr/bin/env python3
"""ONE master federation: 40 worker-family registry and proposal-only dispatcher.

The v21 and v40 registries coexist. 22–33 have deliberately unfilled original
definitions, rather than machine-invented family identities. Nothing here
controls hardware, remote accounts, private networks or human workers.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
import uuid

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "families-v21"))
import families_v21 as core

REGISTRY = HERE / "registry.v40.json"
WORK_CLASSES = core.WORK_CLASSES
SCOPES = core.SCOPES


def load_registry(path=REGISTRY):
    root = json.loads(Path(path).read_text(encoding="utf-8"))
    items = root.get("minds")
    if not isinstance(items, list) or len(items) != 40:
        raise ValueError("Expected all 40 worker family slots")
    if [f.get("family_id") for f in items] != list(range(1, 41)):
        raise ValueError("Expected unique numeric family IDs 1–40 in order")
    if items[20].get("name") != "ONE":
        raise ValueError("Family 21 must remain ONE")
    if items[20].get("author_verbatim", "") != core.load_registry()["minds"][20]["author_verbatim"]:
        raise ValueError("Family 21 creator declaration changed")
    for f in items:
        if not isinstance(f.get("name"), str) or not f["name"]:
            raise ValueError("Each slot must have a name or unresolved label")
        if f.get("source_class") == "unresolved_slot":
            if f["family_id"] not in range(22, 34) or f.get("keywords") or f.get("runtime_status") != "unresolved_not_routable":
                raise ValueError("Unresolved slots 22–33 must not gain invented capabilities")
        elif f.get("source_class") not in ("creator_supplied", "editorial_crosswalk"):
            raise ValueError("Unexpected author/source class")
    if {f["family_id"] for f in items if f["source_class"] == "unresolved_slot"} != set(range(22, 34)):
        raise ValueError("Exact individual definitions 22–33 remain pending")
    return root


def bootstrap(db, registry=REGISTRY):
    root = load_registry(registry)
    core.bootstrap(db)  # Preserve the prior 21 family snapshot in the ONE master.
    # Reuse existing local/private ONE Federation exact-source hash ledger.
    fed = core.ingest(db, registry)
    versions_added = 0
    for item in root["minds"]:
        raw = core.canonical(item)
        h = core.digest(raw)
        before = db.total_changes
        db.execute("""INSERT OR IGNORE INTO one_worker_family_versions
          (family_id,definition_sha256,source_class,exact_json,first_indexed_at)
          VALUES(?,?,?,?,?)""",
          (item["family_id"], h, item["source_class"], raw, core.now()))
        versions_added += int(db.total_changes > before)
        db.execute("""INSERT INTO one_worker_family_current(family_id,definition_sha256)
          VALUES(?,?)
          ON CONFLICT(family_id) DO UPDATE SET definition_sha256=excluded.definition_sha256""",
          (item["family_id"], h))
    db.execute("""INSERT INTO one_worker_family_audit(at,action,detail_json)
        VALUES(?,?,?)""",
        (core.now(), "v40_bootstrap",
         core.canonical({"indexed": 40, "unresolved": list(range(22, 34)),
                         "new_versions": versions_added,
                         "federation": fed})))
    db.commit()
    return {"indexed_family_slots": 40,
            "defined_family_slots": 28, "unresolved_family_slots": 12,
            "new_versions": versions_added, "federation": fed,
            "external_workers_started": 0}


def propose(db, title, context="", work_class="maintenance", scope="local_simulation"):
    if not isinstance(title, str) or not title.strip() or len(title) > 500:
        raise ValueError("Title must be 1–500 characters")
    if not isinstance(context, str) or len(context) > 3000:
        raise ValueError("Context must contain at most 3000 characters")
    if work_class not in WORK_CLASSES or scope not in SCOPES:
        raise ValueError("Unknown work classification or scope")
    active = core.active_families(db)
    if len(active) != 40:
        raise ValueError("Run bootstrap to index all 40 family slots")
    routable = [f for f in active if f["source_class"] != "unresolved_slot"]
    ranked = core.rank(title + " " + context, routable)
    state = ("blocked" if scope == "third_party" else
             "review_required" if scope == "unknown" else "proposed")
    policy = [19, 20, 21, 35]
    rationale = {
        "matching_keywords": {str(n): kw for n, _, kw in ranked},
        "policy_families": {
            "19": "Cross-domain synthesis as a research/design proposal",
            "20": "Stop, minimize, or reset within authorized data-retention rules",
            "21": "ONE — equal standing, consent, and owner veto",
            "35": "Fairness and truth audit modeled on Ma'at/Dharma imagery"
        },
        "source_truth": "22–33 are unresolved and never assigned; mythology is analogy",
        "execution": "none",
        "permission": "Owner approval and independent access checks required before any real action"
    }
    task_id = "ONE-40-" + uuid.uuid4().hex[:14]
    db.execute("""INSERT INTO one_worker_family_task_proposals
       (task_id,created_at,title,context,work_class,scope,primary_family,
        ranked_families_json,policy_families_json,approval_required,state,reasoning_json)
       VALUES(?,?,?,?,?,?,?,?,?,1,?,?)""",
       (task_id, core.now(), title, context, work_class, scope,
        ranked[0][0], core.canonical([n for n, _, _ in ranked]),
        core.canonical(policy), state, core.canonical(rationale)))
    db.execute("""INSERT INTO one_worker_family_audit(at,action,detail_json)
       VALUES(?,?,?)""", (core.now(), "v40_proposal",
                          core.canonical({"id": task_id,"state": state})))
    db.commit()
    return {
        "id": task_id, "state": state, "primary_family": ranked[0][0],
        "ranked_families": [n for n, _, _ in ranked],
        "policy_families": policy, "owner_approval_required": True,
        "external_execution": False, "rationale": rationale
    }


def status(db):
    base = core.status(db)
    base.update({
        "defined_family_slots": db.execute(
          """SELECT COUNT(*) FROM one_worker_family_current c JOIN
             one_worker_family_versions v ON c.family_id=v.family_id
             AND c.definition_sha256=v.definition_sha256
             WHERE v.source_class != 'unresolved_slot'""").fetchone()[0],
        "unresolved_family_slots": db.execute(
          """SELECT COUNT(*) FROM one_worker_family_current c JOIN
             one_worker_family_versions v ON c.family_id=v.family_id
             AND c.definition_sha256=v.definition_sha256
             WHERE v.source_class = 'unresolved_slot'""").fetchone()[0],
        "real_worker_deployments_by_this_module": 0
    })
    return base


def main():
    parser = argparse.ArgumentParser(description="ONE Federation v40 — 40 family codex")
    parser.add_argument("--db", default="ONE_Federation_Master.sqlite3")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("bootstrap")
    sub.add_parser("status")
    route = sub.add_parser("route")
    route.add_argument("title")
    route.add_argument("--context", default="")
    route.add_argument("--work-class", choices=WORK_CLASSES, default="maintenance")
    route.add_argument("--scope", choices=SCOPES, default="local_simulation")
    args = parser.parse_args()
    db = core.open_main(args.db)
    try:
        if args.command == "bootstrap":
            out = bootstrap(db)
        elif args.command == "status":
            out = status(db)
        else:
            out = propose(db, args.title, args.context, args.work_class, args.scope)
        print(json.dumps(out, ensure_ascii=False, indent=2))
    finally:
        db.close()


if __name__ == "__main__":
    main()
