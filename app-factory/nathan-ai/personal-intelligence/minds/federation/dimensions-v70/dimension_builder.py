#!/usr/bin/env python3
"""NATHAN AI · ONE Federation v074 · 70 dimensions / 630 source-defined units.

Source-preserving deterministic indexing. Dimension numbers 0..69 have their
own namespace; they DO NOT overwrite worker-family IDs 65..75. Real-world
sensing, medical acts, physical control, invasive surveillance and all external
agent execution are outside this source metadata worker.
"""
from __future__ import annotations

import argparse
from collections import Counter
from contextlib import closing
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent))
from universal_workers import open_universal

VERSION = "nathan.one.federation.v074.dimensions-v70.v1"
REGISTRY = ROOT / "registry.v70.json"
SOURCE = ROOT / "USER_UPLOADED_EXACT_DIMENSIONS_0_69_20261113.txt"
FAMILY_REGISTRY = ROOT.parent / "families-v75" / "registry.v75.json"
FAMILY_SOURCE = ROOT.parent / "families-v75" / "USER_UPLOADED_EXACT_65_75_20261113.txt"
UNIT_ROLES = ("Anchor", "Scanner", "Router", "Builder", "Balancer",
              "Shield", "Translator", "Auditor", "Reset")
TEAM_MAP = ("nathan_orchestrator", "research", "nathan_orchestrator",
            "code", "quality", "watch", "books", "database", "quality")
SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS dimension70_source_editions(
 sha256 TEXT PRIMARY KEY, source_label TEXT NOT NULL,
 dimension_count INTEGER NOT NULL, unit_count INTEGER NOT NULL,
 indexed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS dimension70_dimension_records(
 dimension_id INTEGER PRIMARY KEY CHECK(dimension_id BETWEEN 0 AND 69),
 tier_id INTEGER NOT NULL CHECK(tier_id BETWEEN 1 AND 7),
 title TEXT NOT NULL, source_line TEXT NOT NULL,
 source_sha256 TEXT NOT NULL REFERENCES dimension70_source_editions(sha256)
);
CREATE TABLE IF NOT EXISTS dimension70_units(
 unit_id TEXT PRIMARY KEY,
 dimension_id INTEGER NOT NULL REFERENCES dimension70_dimension_records(dimension_id),
 role_position INTEGER NOT NULL CHECK(role_position BETWEEN 1 AND 9),
 unit_name TEXT NOT NULL, function_label TEXT NOT NULL,
 source_sha256 TEXT NOT NULL,
 assigned_creator_team TEXT NOT NULL,
 runtime_status TEXT NOT NULL,
 UNIQUE(dimension_id,role_position)
);
CREATE TABLE IF NOT EXISTS dimension70_family75_links(
 member_id INTEGER PRIMARY KEY CHECK(member_id BETWEEN 65 AND 163),
 family_id INTEGER NOT NULL CHECK(family_id BETWEEN 65 AND 75),
 source_member_id TEXT NOT NULL UNIQUE,
 exact_source_text TEXT NOT NULL,
 source_hash TEXT NOT NULL,
 runtime_status TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS dimension70_runs(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 started_at TEXT NOT NULL, completed_at TEXT,
 dimensions_seen INTEGER NOT NULL,
 units_seen INTEGER NOT NULL,
 family75_members_seen INTEGER NOT NULL,
 identity_collisions INTEGER NOT NULL,
 status TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS dimension70_unit_workcards(
 run_id INTEGER NOT NULL REFERENCES dimension70_runs(id),
 unit_id TEXT NOT NULL REFERENCES dimension70_units(unit_id),
 workcard_sha256 TEXT NOT NULL,
 status TEXT NOT NULL,
 PRIMARY KEY(run_id,unit_id)
);
CREATE INDEX IF NOT EXISTS idx_dimension70_tier ON dimension70_dimension_records(tier_id);
"""

def utc() -> str:
    return datetime.now(timezone.utc).isoformat()

def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()

def json_bytes(value) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8")

def file_checked(path: str | Path, expected_sha256: str) -> str:
    p = Path(path)
    if p.is_symlink() or not p.is_file() or p.stat().st_size > 1_500_000:
        raise ValueError("Owner source must be a regular file within size budget")
    raw = p.read_bytes()
    if digest(raw) != expected_sha256:
        raise ValueError("Source hash mismatch: originals must not be silently replaced")
    return raw.decode("utf-8")

def read_registry(registry=REGISTRY, source=SOURCE,
                  families=FAMILY_REGISTRY, family_source=FAMILY_SOURCE):
    reg_path = Path(registry)
    if reg_path.is_symlink() or reg_path.stat().st_size > 1_500_000:
        raise ValueError("Invalid registry file")
    doc = json.loads(reg_path.read_text(encoding="utf-8"))
    if doc.get("schema") != "nathan.one.federation.v074.dimensions-70.units-630":
        raise ValueError("Expected 70-dimensional source registry edition")
    text = file_checked(source, doc["source_sha256"])
    tiers, dims, units, categories = (doc.get(k) for k in
                                      ("tiers", "dimensions", "units", "categories"))
    if not all(isinstance(x, list) for x in (tiers,dims,units,categories)):
        raise ValueError("Incomplete dimensional registry lists")
    if len(tiers)!=7 or len(dims)!=70 or len(units)!=630 or len(categories)!=9:
        raise ValueError("Must have 7 tiers, 70 dimensions and 630 distinct units")
    if [t["tier_id"] for t in tiers] != list(range(1,8)):
        raise ValueError("Tier ordering changed")
    for k,t in enumerate(tiers):
        if t["first_dimension"] != k*10 or t["last_dimension"] != k*10+9:
            raise ValueError("Every tier must cover exactly ten dimensions")
        if t["source_line"] not in text:
            raise ValueError("Tier source line was altered")
    if [c["member_position"] for c in categories] != list(range(1,10)):
        raise ValueError("Role functions must be ordered one through nine")
    for c in categories:
        if c["source_line"] not in text:
            raise ValueError("Functional-role source changed")
    if [d["dimension_id"] for d in dims] != list(range(70)):
        raise ValueError("Dimensions must be in original 0..69 order")
    index = {}
    for dim in dims:
        number = dim["dimension_id"]
        t = tiers[number//10]
        if dim["tier_id"] != t["tier_id"] or dim["source_line"] not in text:
            raise ValueError("Dimension tier/source mismatch")
        match = re.fullmatch(r"• Dimension (\d+) — (.*?) \(9 Members\): (.+)",dim["source_line"])
        if match is None or int(match.group(1)) != number or match.group(2) != dim["title"]:
            raise ValueError("Author dimension declaration changed")
        listed = match.group(3).removesuffix(".").split(", ")
        if len(listed)!=9 or len(dim["unit_ids"])!=9:
            raise ValueError("Every dimension must retain nine original names")
        index[number] = listed
    expected_ids = []
    for n in range(70):
        for i in range(1,10):
            expected_ids.append(f"DIM-{n:02d}-{i:02d}")
    if [u["id"] for u in units] != expected_ids:
        raise ValueError("Independent source unit IDs must be complete and ordered")
    for unit in units:
        n=unit["dimension_id"]
        i=unit["member_position"]
        if not (0<=n<=69 and 1<=i<=9):
            raise ValueError("Invalid dimension unit index")
        if unit["name"] != index[n][i-1]:
            raise ValueError("Source-derived member name differs")
        if unit["function_label"] != categories[i-1]["function_label"]:
            raise ValueError("Standard functional role changed")
        if unit["tier_id"] != 1+n//10 or unit["source_line"] != dims[n]["source_line"]:
            raise ValueError("Unit provenance or tier mismatch")
        if unit["namespace"] != "one.dimensions.0_69":
            raise ValueError("Must not mix conceptual dimensions and family IDs")
        if unit.get("runtime_status")!="indexed_only" or unit.get("real_world_execution") is not False:
            raise ValueError("No unverified physical or remote activity can be declared active")
    if len(set(expected_ids))!=630:
        raise ValueError("Duplicate dimension identities")
    family_path = Path(families)
    if family_path.is_symlink() or family_path.stat().st_size > 1_500_000:
        raise ValueError("Invalid family registry")
    family = json.loads(family_path.read_text(encoding="utf-8"))
    family_source_hash = family.get("source_sha256")
    original_family_text = file_checked(family_source, family_source_hash)
    families_list = family.get("families")
    members = family.get("minds")
    if not isinstance(families_list,list) or len(families_list)!=11:
        raise ValueError("Must preserve 11 source Family records (65..75)")
    if not isinstance(members,list) or len(members)!=99:
        raise ValueError("Must preserve 99 source members (65..163)")
    if [f["family_id"] for f in families_list] != list(range(65,76)):
        raise ValueError("Family 65..75 numbering incomplete")
    if [m["member_id"] for m in members] != list(range(65,164)):
        raise ValueError("Member 65..163 numbering incomplete")
    for f in families_list:
        if f["source_line"] not in original_family_text or f["member_count"]!=9:
            raise ValueError("Family source or member count changed")
    for m in members:
        if m["family_id"] not in range(65,76) or m["exact_source_text"] not in original_family_text:
            raise ValueError("Member source wording changed")
        if m.get("runtime_status")!="indexed_only":
            raise ValueError("No claimed remote agent runtime")
    return doc, family, text, original_family_text

def _write(out: Path, relative: str, value) -> str:
    path=out/relative
    path.parent.mkdir(parents=True,exist_ok=True)
    raw=json_bytes(value)
    path.write_bytes(raw)
    return digest(raw)

def run(db,output,registry=REGISTRY,source=SOURCE,
        families=FAMILY_REGISTRY,family_source=FAMILY_SOURCE):
    doc,family,_,_=read_registry(registry,source,families,family_source)
    out=Path(output).resolve()
    for p in (Path(source).resolve(),Path(family_source).resolve(),
              Path(registry).resolve(),Path(families).resolve()):
        if p==out or out in p.parents:
            raise ValueError("Work directory cannot replace an original source")
    out.mkdir(parents=True,exist_ok=True)
    db.executescript(SCHEMA)
    existing = db.execute("SELECT COUNT(*) FROM dimension70_units").fetchone()[0]
    if existing not in (0,630):
        raise ValueError("Partial dimensional master requires an owner-reviewed repair")
    with db:
        db.execute("""INSERT OR IGNORE INTO dimension70_source_editions
           VALUES(?,?,?,?,?)""",
           (doc["source_sha256"],doc["source_file"],70,630,utc()))
        for d in doc["dimensions"]:
            db.execute("""INSERT OR IGNORE INTO dimension70_dimension_records VALUES(?,?,?,?,?)""",
                       (d["dimension_id"],d["tier_id"],d["title"],d["source_line"],doc["source_sha256"]))
        for u in doc["units"]:
            uhash=digest(u["source_line"].encode("utf-8"))
            role_pos=u["member_position"]
            db.execute("""INSERT OR IGNORE INTO dimension70_units VALUES(?,?,?,?,?,?,?,?)""",
                       (u["id"],u["dimension_id"],role_pos,u["name"],u["function_label"],
                        uhash,TEAM_MAP[role_pos-1],"indexed_only"))
        for m in family["minds"]:
            db.execute("""INSERT OR IGNORE INTO dimension70_family75_links
              VALUES(?,?,?,?,?,?)""",
                       (m["member_id"],m["family_id"],m["id"],m["exact_source_text"],
                        digest(m["exact_source_text"].encode("utf-8")),"indexed_only"))
        cur=db.execute("""INSERT INTO dimension70_runs(
         started_at,dimensions_seen,units_seen,family75_members_seen,identity_collisions,status)
         VALUES(?,?,?,?,?,?)""",(utc(),70,630,99,0,"running"))
        cycle_id=cur.lastrowid
        cards=[]
        for unit in doc["units"]:
            n=unit["dimension_id"]
            i=unit["member_position"]
            card={
              "workcard_schema":VERSION,
              "unit_id":unit["id"],
              "namespace":"one.dimensions.0_69",
              "dimension":n,
              "tier":unit["tier_id"],
              "role_number":i,
              "function":unit["function_label"],
              "source_name":unit["name"],
              "source_record":unit["source_line"],
              "assigned_creator_team":TEAM_MAP[i-1],
              "family21_one_policy":"Shared respect, consent, source preservation and owner veto",
              "source_sha256":doc["source_sha256"],
              "state":"source_indexed_work_card_created",
              "implementation_status":"proposal_only",
              "source_type":"user_supplied_dimension_matrix",
              "scientific_validation":"The numbering is a conceptual taxonomy; no claim of 70 verified physical spacetime dimensions",
              "external_models_launched":0,
              "devices_controlled":0
            }
            fname=f"units/DIM-{n:02d}-{i:02d}.json"
            sha=_write(out,fname,card)
            cards.append(card)
            db.execute("""INSERT INTO dimension70_unit_workcards VALUES(?,?,?,?)""",
                       (cycle_id,unit["id"],sha,"source_indexed_work_card_created"))
        _write(out,"DIMENSIONAL_WORKCARDS_ALL_630.json",cards)
        _write(out,"FAMILY_65_TO_75_MEMBERS_99.json",{
            "namespace":"one.family.65_75","source_hash":family["source_sha256"],
            "family_ids":[f["family_id"] for f in family["families"]],
            "members":[{"id":m["id"],"member_id":m["member_id"],
                        "family_id":m["family_id"],"name":m["name"],
                        "status":"source_only"} for m in family["minds"]],
            "not_merged_with_dimension_units":True
        })
        for tier in doc["tiers"]:
            start=tier["first_dimension"];end=tier["last_dimension"]
            section=[x for x in cards if start<=x["dimension"]<=end]
            if len(section)!=90:
                raise ValueError("Every ten-dimension tier must index 90 units")
            _write(out,f"tiers/TIER_{tier['tier_id']}.json",{
                "tier_id":tier["tier_id"],"tier_name":tier["name"],
                "dimension_span":[start,end],"unit_count":len(section),
                "unit_ids":[x["unit_id"] for x in section],
                "source_line":tier["source_line"]
            })
        stats={
          "schema":VERSION,"tier_count":7,"dimensional_families":70,
          "members_per_dimension":9,"dimensional_workcards":len(cards),
          "source_family65_to75_count":len(family["families"]),
          "source_member65_to163_count":len(family["minds"]),
          "total_independent_labelled_units":729,
          "family_archetype_and_dimensional_unit_namespaces_distinct":True,
          "earlier_member1_to64_individual_records_not_part_of_these_uploads":True,
          "family21_ONE_governance_applies":True,
          "original_source_mutations":0,"real_world_operations":0,
          "active_external_model_instances_created":0,
          "output_truth":"630 real local source cards plus 99 linked family-role records; no remote AI, medical or physical device execution"
        }
        _write(out,"MANIFEST.json",stats)
        db.execute("UPDATE dimension70_runs SET completed_at=?, status='completed' WHERE id=?",
                   (utc(),cycle_id))
    if db.execute("PRAGMA quick_check").fetchone()[0]!="ok":
        raise ValueError("ONE SQLite consistency check failed")
    return {"run_id":cycle_id,**stats}

def status(db):
    db.executescript(SCHEMA)
    return {
      "dimension_records":db.execute("SELECT COUNT(*) FROM dimension70_dimension_records").fetchone()[0],
      "unit_records":db.execute("SELECT COUNT(*) FROM dimension70_units").fetchone()[0],
      "family65_to75_members":db.execute("SELECT COUNT(*) FROM dimension70_family75_links").fetchone()[0],
      "last_completed_run":db.execute("SELECT MAX(id) FROM dimension70_runs WHERE status='completed'").fetchone()[0],
      "integrity":db.execute("PRAGMA quick_check").fetchone()[0]
    }

def main():
    p=argparse.ArgumentParser(description="NATHAN AI ONE · 70 conceptual dimensions / 630 source-linked units")
    p.add_argument("--db",default="ONE_Federation_Master.sqlite3")
    actions=p.add_subparsers(dest="action",required=True)
    action=actions.add_parser("build")
    action.add_argument("--out",required=True)
    actions.add_parser("status")
    args=p.parse_args()
    with closing(open_universal(args.db)) as db:
        result=run(db,args.out) if args.action=="build" else status(db)
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
