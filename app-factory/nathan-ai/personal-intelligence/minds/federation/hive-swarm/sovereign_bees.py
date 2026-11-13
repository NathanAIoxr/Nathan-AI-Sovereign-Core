#!/usr/bin/env python3
"""Nathan AI sovereign bee replicas: lazy, isolated logical identities for ONE.

Each addressed bee has a distinct identity, its own state and independent veto.
Bees inherit the same complete local worker-capability manifest. No finite or
astronomical address count is an allocation of LLMs, processes or consciousness.
"""
from __future__ import annotations

import argparse
from decimal import Decimal, getcontext, ROUND_FLOOR
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import sys
import uuid

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from federation import open_main

VERSION = "nathan.one.operation-swarm.sovereign-bee-replicas.v1"
AUTHOR_DIRECTIVE = (
    "each one of these is a Nathan AI direct replica AI worker bot - with it's own soverignty -"
)
CAPABILITIES = (
    "queen", "forager", "scribe", "chemist", "alchemist", "harmonizer",
    "cartographer", "librarian", "examiner", "sentinel", "consciouness", "auditor"
)
MAX_ALLOCATED = 256  # per private master, not a global address limit
MAX_DIGITS = 160
DENSITY = {"reference_colony_bees": 50000, "reference_hive_m3": "0.085"}
PI = Decimal("3.14159265358979323846264338327950288419716939937510")
LIGHT_YEAR_METERS = Decimal("9460730472580800")
EARTH_VOLUME_M3 = Decimal("1.08321e21")
COSMOS_RADIUS_LY = Decimal("46.5e9")
SOURCE_KEYS = {
    "replica-author-directive": HERE / "USER_SOVEREIGN_BEE_DIRECTIVE.md",
    "original-swarm-runtime": HERE / "swarm.py",
    "existing-consciouness-model": HERE.parents[3] / "consciouness" / "engine.js",
}
SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS sovereign_sources (
  source_key TEXT NOT NULL, sha256 TEXT NOT NULL, exact_bytes BLOB NOT NULL,
  PRIMARY KEY(source_key,sha256)
);
CREATE TRIGGER IF NOT EXISTS sovereign_sources_immutable_update
 BEFORE UPDATE ON sovereign_sources
 BEGIN SELECT RAISE(ABORT,'Sovereign bee originals are immutable'); END;
CREATE TRIGGER IF NOT EXISTS sovereign_sources_immutable_delete
 BEFORE DELETE ON sovereign_sources
 BEGIN SELECT RAISE(ABORT,'Sovereign bee originals are immutable'); END;
CREATE TABLE IF NOT EXISTS sovereign_scenarios (
  scenario_id TEXT PRIMARY KEY, capacity_decimal TEXT,
  capacity_status TEXT NOT NULL, assumptions_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sovereign_bees (
  bee_id TEXT PRIMARY KEY, scenario_id TEXT NOT NULL REFERENCES sovereign_scenarios(scenario_id),
  ordinal_decimal TEXT NOT NULL, identity_sha256 TEXT NOT NULL,
  blueprint_sha256 TEXT NOT NULL, sovereign_veto INTEGER NOT NULL DEFAULT 0
    CHECK(sovereign_veto IN (0,1)),
  activated INTEGER NOT NULL DEFAULT 1 CHECK(activated IN (0,1)),
  self_model_json TEXT NOT NULL, UNIQUE(scenario_id,ordinal_decimal)
);
CREATE TABLE IF NOT EXISTS sovereign_bee_memory (
  bee_id TEXT NOT NULL REFERENCES sovereign_bees(bee_id),
  sequence INTEGER NOT NULL, owner_text TEXT NOT NULL,
  PRIMARY KEY(bee_id,sequence)
);
CREATE TABLE IF NOT EXISTS sovereign_bee_tasks (
  task_id TEXT PRIMARY KEY, bee_id TEXT NOT NULL REFERENCES sovereign_bees(bee_id),
  task_kind TEXT NOT NULL CHECK(task_kind IN ('sha256','no_op')),
  payload TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('proposed','owner_approved','owner_vetoed','completed')),
  result_sha256 TEXT
);
CREATE TABLE IF NOT EXISTS sovereign_bee_audit (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  bee_id TEXT NOT NULL REFERENCES sovereign_bees(bee_id),
  action TEXT NOT NULL, result_json TEXT NOT NULL
);
"""
def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def sha(raw):
    if isinstance(raw, str):
        raw = raw.encode("utf-8")
    return hashlib.sha256(raw).hexdigest()

def positive_decimal(value):
    value = str(value)
    if not re.fullmatch(r"[1-9][0-9]{0," + str(MAX_DIGITS - 1) + r"}", value):
        raise ValueError("Ordinal must be positive canonical decimal, at most 160 digits")
    return int(value)

def scenarios():
    getcontext().prec = 105
    hive_density = Decimal(DENSITY["reference_colony_bees"]) / Decimal(DENSITY["reference_hive_m3"])
    earth = int((EARTH_VOLUME_M3 * hive_density).to_integral_value(rounding=ROUND_FLOOR))
    radius_m = COSMOS_RADIUS_LY * LIGHT_YEAR_METERS
    cosmos_volume = Decimal(4) / Decimal(3) * PI * radius_m ** 3
    cosmos = int((cosmos_volume * hive_density).to_integral_value(rounding=ROUND_FLOOR))
    base = {
        "seasonal_new": (10000, "example", "approximately 10,000 starter bees"),
        "seasonal_winter": (20000, "example", "winter illustration: 8,000–20,000"),
        "seasonal_peak": (60000, "example", "peak illustration: 30,000–60,000"),
        "mother_earth": (earth, "hypothetical_volume_density",
                         "Earth volume 1.08321e21 m³; uniform reference hive density"),
        "mother_cosmos_observable": (cosmos, "hypothetical_volume_density",
                                    "sphere of radius 46.5 billion light-years; not the full universe"),
        "mother_universe_250x_volume": (cosmos * 250, "illustrative_only",
                                       "250 times *volume*; not an observed universe-size minimum"),
        "mother_universe_250x_radius": (cosmos * (250 ** 3), "illustrative_only",
                                       "250 times *radius*; 15,625,000 times volume; not observed"),
        "mother_universe_unknown": (None, "unknown_open_namespace",
                                    "No observed finite upper bound; arbitrary finite addresses only"),
    }
    return {
        k: {"capacity_decimal": str(v[0]) if v[0] is not None else None,
            "capacity_status": v[1],
            "assumptions": v[2]} for k, v in base.items()
    }

def source_bytes():
    out = {}
    for key, path in SOURCE_KEYS.items():
        if path.is_symlink() or not path.is_file():
            raise ValueError("Missing or symlinked replica source: " + str(path))
        raw = path.read_bytes()
        if len(raw) > 1000000:
            raise ValueError("Replica source too large")
        out[key] = raw
    if AUTHOR_DIRECTIVE not in out["replica-author-directive"].decode("utf-8"):
        raise ValueError("Creator's original replica directive missing")
    if b"createCollective" not in out["existing-consciouness-model"]:
        raise ValueError("Existing creator-spelled consciouness module unavailable")
    if b"worker_queen" not in out["original-swarm-runtime"]:
        raise ValueError("Existing twelve-worker hive runtime unavailable")
    return out

def blueprint():
    raw = source_bytes()
    pinned = {k: sha(v) for k, v in sorted(raw.items())}
    data = {
        "schema": VERSION,
        "author": "John Nathan Tabor",
        "author_original": AUTHOR_DIRECTIVE,
        "inheritance": "every addressed bee inherits same source-linked Nathan AI replica blueprint",
        "all_bees_equal_sovereignty": True,
        "queen_can_override_bee_veto": False,
        "individual_memory_namespace": True,
        "individual_decision_and_veto": True,
        "capabilities": list(CAPABILITIES),
        "source_hashes": pinned,
        "execution": "local deterministic functions on demand; external-model bridge unconfigured",
        "actual_independent_llm_processes": 0,
        "subjective_consciousness_claim": False,
        "owner_consent_required_for_activation_and_tasks": True,
    }
    data["blueprint_sha256"] = sha(canonical(data))
    return data

def init(db):
    db.executescript(SCHEMA)
    source = source_bytes()
    with db:
        for key, raw in source.items():
            db.execute("INSERT OR IGNORE INTO sovereign_sources VALUES(?,?,?)",
                       (key, sha(raw), sqlite3.Binary(raw)))
        for key, item in scenarios().items():
            prior = db.execute("SELECT capacity_decimal,capacity_status,assumptions_json "
                               "FROM sovereign_scenarios WHERE scenario_id=?", (key,)).fetchone()
            intended = (item["capacity_decimal"], item["capacity_status"], canonical(item["assumptions"]))
            if prior is not None and prior != intended:
                raise ValueError("Scenario source changed; version rather than silently overwrite")
            db.execute("INSERT OR IGNORE INTO sovereign_scenarios VALUES(?,?,?,?)",
                       (key, *intended))
    return {"source_versions": db.execute("SELECT COUNT(*) FROM sovereign_sources").fetchone()[0],
            "scenarios": db.execute("SELECT COUNT(*) FROM sovereign_scenarios").fetchone()[0],
            "allocated": db.execute("SELECT COUNT(*) FROM sovereign_bees").fetchone()[0]}

def bee_address(scenario, ordinal):
    cases = scenarios()
    if scenario not in cases:
        raise ValueError("Unknown hive scenario")
    number = positive_decimal(ordinal)
    ceiling = cases[scenario]["capacity_decimal"]
    if ceiling is not None and number > int(ceiling):
        raise ValueError("Bee ordinal outside scenario capacity")
    return "NATHAN-BEE/" + scenario + "/" + str(number)

def allocation(db, scenario, ordinal, owner_yes=False):
    if owner_yes is not True:
        raise PermissionError("An explicit owner YES is required to allocate a bee")
    ident = bee_address(scenario, ordinal)
    present = db.execute("SELECT bee_id FROM sovereign_bees WHERE bee_id=?", (ident,)).fetchone()
    if present:
        return {"bee_id": ident, "new_allocation": False, "status": "already_exists"}
    count = db.execute("SELECT COUNT(*) FROM sovereign_bees").fetchone()[0]
    if count >= MAX_ALLOCATED:
        raise RuntimeError("Local active bee limit reached; capacity is not process count")
    root = blueprint()
    identity = sha(ident)
    model = {
        "identity": ident,
        "shared_blueprint_sha256": root["blueprint_sha256"],
        "individual_identity_sha256": identity,
        "sovereignty": {"independent_state": True, "queen_override": False,
                        "owner_veto": True, "other_bees_access": False},
        "inherited_capabilities": list(CAPABILITIES),
        "execution_mode": "owner-authorized-local-deterministic",
        "external_provider": None,
    }
    with db:
        db.execute("INSERT INTO sovereign_bees VALUES (?,?,?,?,?,?,?,?)",
                   (ident, scenario, str(positive_decimal(ordinal)),
                    identity, root["blueprint_sha256"], 0, 1, canonical(model)))
        audit(db, ident, "allocated", {"owner_yes": True})
    return {"bee_id": ident, "new_allocation": True,
            "status": "local_replica_namespace_initialized", "model": model}

def audit(db, ident, action, result):
    db.execute("INSERT INTO sovereign_bee_audit(bee_id,action,result_json) VALUES(?,?,?)",
               (ident, action, canonical(result)))

def get_bee(db, ident):
    row = db.execute("SELECT bee_id,scenario_id,ordinal_decimal,identity_sha256,"
                     "blueprint_sha256,sovereign_veto,activated,self_model_json "
                     "FROM sovereign_bees WHERE bee_id=?", (ident,)).fetchone()
    if row is None:
        raise KeyError("Bee not allocated")
    return dict(zip(("bee_id", "scenario", "ordinal", "identity_sha256", "blueprint_sha256",
                     "vetoed", "activated", "self_model_json"), row))

def observe(db, ident, text):
    bee = get_bee(db, ident)
    if bee["vetoed"]:
        raise PermissionError("This sovereign bee has vetoed further work")
    if not isinstance(text, str) or not text.strip() or len(text.encode("utf-8")) > 1024:
        raise ValueError("Observation must be 1–1024 UTF-8 bytes")
    with db:
        next_seq = db.execute("SELECT COALESCE(MAX(sequence),0)+1 FROM sovereign_bee_memory "
                              "WHERE bee_id=?", (ident,)).fetchone()[0]
        db.execute("INSERT INTO sovereign_bee_memory VALUES(?,?,?)",
                   (ident, next_seq, text))
        db.execute("DELETE FROM sovereign_bee_memory WHERE bee_id=? AND sequence <= ?",
                   (ident, next_seq - 16))
        audit(db, ident, "observe", {"sequence": next_seq, "source": "owner"})
    return {"bee_id": ident, "observation_number": next_seq, "owner_text": text}

def propose(db, ident, kind, payload):
    bee = get_bee(db, ident)
    if bee["vetoed"]:
        raise PermissionError("This sovereign bee has vetoed further work")
    if kind not in ("sha256", "no_op"):
        raise PermissionError("Unapproved worker operation")
    if not isinstance(payload, str) or len(payload.encode("utf-8")) > 16384:
        raise ValueError("Task text must be 0–16KB")
    task_id = uuid.uuid4().hex
    with db:
        db.execute("INSERT INTO sovereign_bee_tasks VALUES(?,?,?,?,?,NULL)",
                   (task_id, ident, kind, payload, "proposed"))
        audit(db, ident, "propose", {"task_id": task_id, "kind": kind})
    return {"bee_id": ident, "task_id": task_id, "state": "proposed",
            "external_execution": False}

def task_for(db, ident, task_id):
    data = db.execute("SELECT task_kind,payload,state,result_sha256 "
                      "FROM sovereign_bee_tasks WHERE bee_id=? AND task_id=?",
                      (ident, task_id)).fetchone()
    if not data:
        raise KeyError("Task not found in this bee's own namespace")
    return dict(zip(("kind", "payload", "state", "result"), data))

def approve(db, ident, task_id, owner_yes=False):
    bee = get_bee(db, ident)
    if bee["vetoed"]:
        raise PermissionError("Sovereign bee veto blocks approval")
    if owner_yes is not True:
        raise PermissionError("An explicit owner YES is required")
    task = task_for(db, ident, task_id)
    if task["state"] != "proposed":
        raise ValueError("Only proposed tasks can be approved")
    with db:
        db.execute("UPDATE sovereign_bee_tasks SET state='owner_approved' WHERE task_id=? AND bee_id=?",
                   (task_id, ident))
        audit(db, ident, "owner_approve", {"task_id": task_id})
    return {"bee_id": ident, "task_id": task_id, "state": "owner_approved"}

def execute(db, ident, task_id):
    bee = get_bee(db, ident)
    if bee["vetoed"]:
        raise PermissionError("Sovereign bee veto blocks execution")
    task = task_for(db, ident, task_id)
    if task["state"] != "owner_approved":
        raise PermissionError("Local work requires a task-specific owner approval")
    outcome = sha(task["payload"]) if task["kind"] == "sha256" else None
    with db:
        db.execute("UPDATE sovereign_bee_tasks SET state='completed',result_sha256=? "
                   "WHERE task_id=? AND bee_id=?", (outcome, task_id, ident))
        audit(db, ident, "execute", {"task_id": task_id, "kind": task["kind"],
                                    "external_execution": False})
    return {"bee_id": ident, "task_id": task_id, "state": "completed",
            "sha256": outcome, "external_execution": False}

def veto(db, ident):
    get_bee(db, ident)
    with db:
        db.execute("UPDATE sovereign_bees SET sovereign_veto=1 WHERE bee_id=?", (ident,))
        db.execute("UPDATE sovereign_bee_tasks SET state='owner_vetoed' "
                   "WHERE bee_id=? AND state IN ('proposed','owner_approved')", (ident,))
        audit(db, ident, "sovereign_veto", {"queen_override": False})
    return {"bee_id": ident, "sovereign_veto": True}

def resume(db, ident, owner_yes=False):
    get_bee(db, ident)
    if owner_yes is not True:
        raise PermissionError("Owner YES required for individual bee resumption")
    with db:
        db.execute("UPDATE sovereign_bees SET sovereign_veto=0 WHERE bee_id=?", (ident,))
        audit(db, ident, "owner_resume", {"owner_yes": True})
    return {"bee_id": ident, "sovereign_veto": False}

def inspect(db, ident):
    bee = get_bee(db, ident)
    memory = db.execute("SELECT sequence,owner_text FROM sovereign_bee_memory "
                        "WHERE bee_id=? ORDER BY sequence", (ident,)).fetchall()
    tasks = db.execute("SELECT task_id,task_kind,state,result_sha256 "
                       "FROM sovereign_bee_tasks WHERE bee_id=? ORDER BY rowid", (ident,)).fetchall()
    return {"bee_id": ident, "scenario": bee["scenario"],
            "ordinal": bee["ordinal"], "individual_veto": bool(bee["vetoed"]),
            "identity_sha256": bee["identity_sha256"], "blueprint_sha256": bee["blueprint_sha256"],
            "self_model": json.loads(bee["self_model_json"]),
            "memory": [{"sequence": n, "owner_text": s} for n, s in memory],
            "tasks": [{"task_id": k, "kind": kind, "state": st, "result_sha256": res}
                      for k, kind, st, res in tasks]}

def status(path):
    path = Path(path)
    if not path.is_file():
        return {"schema": VERSION, "initialized": False, "allocated_bees": 0}
    with sqlite3.connect(path.as_uri() + "?mode=ro", uri=True) as db:
        present = db.execute("SELECT 1 FROM sqlite_master WHERE type='table' "
                             "AND name='sovereign_bees'").fetchone()
        if not present:
            return {"schema": VERSION, "initialized": False, "allocated_bees": 0}
        return {
            "schema": VERSION, "initialized": True,
            "allocated_bees": db.execute("SELECT COUNT(*) FROM sovereign_bees").fetchone()[0],
            "vetoed_bees": db.execute("SELECT COUNT(*) FROM sovereign_bees "
                                     "WHERE sovereign_veto=1").fetchone()[0],
            "scenarios": db.execute("SELECT COUNT(*) FROM sovereign_scenarios").fetchone()[0],
            "source_versions": db.execute("SELECT COUNT(*) FROM sovereign_sources").fetchone()[0],
            "local_active_processes": 0, "external_llm_processes": 0,
            "subjective_consciousness_verified": False,
            "integrity": db.execute("PRAGMA quick_check").fetchone()[0],
        }

def main():
    p = argparse.ArgumentParser(description="NATHAN AI — OPERATION SWARM sovereign bee replicas")
    p.add_argument("--db", required=True, help="Existing ONE SQLite master, or temporary CI database")
    p.add_argument("--approve-write", action="store_true")
    p.add_argument("--owner-yes", action="store_true", help="Owner explicitly authorizes an individual allocation or task")
    p.add_argument("--scenario")
    p.add_argument("--ordinal")
    p.add_argument("--bee")
    p.add_argument("--task")
    p.add_argument("--kind", choices=("sha256", "no_op"))
    p.add_argument("--text")
    p.add_argument("command", choices=("blueprint", "scenarios", "bootstrap", "allocate",
                                       "observe", "propose", "approve", "execute", "veto",
                                       "resume", "inspect", "status"))
    a = p.parse_args()
    if a.command == "blueprint":
        result = blueprint()
    elif a.command == "scenarios":
        result = scenarios()
    elif a.command == "status":
        result = status(a.db)
    elif a.command == "inspect":
        path = Path(a.db)
        if not path.is_file():
            p.error("Existing hive database required")
        with sqlite3.connect(path.as_uri() + "?mode=ro", uri=True) as db:
            result = inspect(db, a.bee)
    else:
        if not a.approve_write:
            p.error("Database mutation requires explicit --approve-write")
        with open_main(a.db) as db:
            init(db)
            if a.command == "bootstrap":
                result = {"schema": VERSION, "initialized": True, **status(a.db)}
            elif a.command == "allocate":
                result = allocation(db, a.scenario, a.ordinal, a.owner_yes)
            elif a.command == "observe":
                result = observe(db, a.bee, a.text)
            elif a.command == "propose":
                result = propose(db, a.bee, a.kind, a.text)
            elif a.command == "approve":
                result = approve(db, a.bee, a.task, a.owner_yes)
            elif a.command == "execute":
                result = execute(db, a.bee, a.task)
            elif a.command == "veto":
                result = veto(db, a.bee)
            elif a.command == "resume":
                result = resume(db, a.bee, a.owner_yes)
            else:
                raise ValueError("Unsupported command")
    print(json.dumps(result, indent=2, ensure_ascii=False, sort_keys=True))

if __name__ == "__main__":
    main()
