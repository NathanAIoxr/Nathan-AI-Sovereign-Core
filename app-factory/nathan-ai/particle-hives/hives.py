#!/usr/bin/env python3
"""Nathan AI particle-hive reference engine.

Each *registered logical particle address* owns one hive, with exactly 50,000
individually addressable worker slots.  This is SOFTWARE, not a representation
of measured locations of individual physical particles or a claim of running
astronomical numbers of LLM processes.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import re
import sqlite3
from typing import Any, Iterable

WORKERS_PER_HIVE = 50_000
EPI_ROLES = 100
COPIES_PER_ROLE = WORKERS_PER_HIVE // EPI_ROLES
PARTICLE_KINDS = ("proton", "neutron", "electron")
VALID_TIERS = ("CERO", "UNO", "DOS")
ID_PATTERN = re.compile(r"^[a-zA-Z0-9_.:/-]{1,120}$")
HERE = Path(__file__).resolve().parent
DEFAULT_ROSTER = HERE / "EPISTEMIC_100_UNIT_REGISTRY.json"

SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS atoms (
    atom_id TEXT PRIMARY KEY,
    protons INTEGER NOT NULL CHECK (protons >= 0),
    neutrons INTEGER NOT NULL CHECK (neutrons >= 0),
    electrons INTEGER NOT NULL CHECK (electrons >= 0),
    status TEXT NOT NULL DEFAULT 'symbolic_model'
);
CREATE TABLE IF NOT EXISTS hives (
    hive_id TEXT PRIMARY KEY,
    atom_id TEXT REFERENCES atoms(atom_id),
    particle_kind TEXT NOT NULL CHECK (particle_kind IN ('proton','neutron','electron')),
    particle_index INTEGER NOT NULL CHECK (particle_index > 0),
    purpose TEXT NOT NULL,
    slot_count INTEGER NOT NULL CHECK (slot_count=50000),
    created_at_utc TEXT NOT NULL,
    UNIQUE (atom_id,particle_kind,particle_index)
);
CREATE TABLE IF NOT EXISTS workers (
    worker_id TEXT PRIMARY KEY,
    hive_id TEXT NOT NULL REFERENCES hives(hive_id),
    slot INTEGER NOT NULL CHECK (slot >= 0 AND slot < 50000),
    role_id INTEGER NOT NULL CHECK (role_id BETWEEN 1233 AND 1332),
    family TEXT NOT NULL,
    replica INTEGER NOT NULL CHECK (replica >= 0 AND replica < 500),
    state TEXT NOT NULL DEFAULT 'ready',
    UNIQUE (hive_id,slot)
);
CREATE INDEX IF NOT EXISTS ix_workers_hive_role ON workers(hive_id,role_id);
CREATE TABLE IF NOT EXISTS reviews (
    review_id TEXT PRIMARY KEY,
    hive_id TEXT NOT NULL REFERENCES hives(hive_id),
    input_sha256 TEXT NOT NULL,
    source_tier TEXT NOT NULL CHECK (source_tier IN ('CERO','UNO','DOS')),
    result_json TEXT NOT NULL,
    recorded_at_utc TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    hive_id TEXT NOT NULL REFERENCES hives(hive_id),
    type TEXT NOT NULL,
    event_json TEXT NOT NULL,
    sha256 TEXT NOT NULL,
    recorded_at_utc TEXT NOT NULL
);
"""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def read_roster(path: Path = DEFAULT_ROSTER) -> list[dict[str, Any]]:
    content = json.loads(path.read_text(encoding="utf-8"))
    units = sorted(content["units"], key=lambda item: item["id"])
    assert len(units) == EPI_ROLES
    assert [r["id"] for r in units] == list(range(1233, 1333))
    assert len({r["family_name"] for r in units}) == 10
    assert all(r["source_tier"] in VALID_TIERS for r in units)
    return units


def connect(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(str(path))
    db.execute("PRAGMA foreign_keys=ON")
    db.executescript(SCHEMA)
    return db


def _checked_ref(value: str, field: str) -> str:
    if not ID_PATTERN.fullmatch(value):
        raise ValueError(f"{field} must be 1-120 ASCII letters, numbers, . _ : / or -")
    return value


def register_atom(db: sqlite3.Connection, atom_id: str, protons: int,
                  neutrons: int, electrons: int) -> None:
    _checked_ref(atom_id, "atom_id")
    counts = (protons, neutrons, electrons)
    if any(type(n) is not int or n < 0 for n in counts) or sum(counts) == 0:
        raise ValueError("Particle counts must be nonnegative integers with positive total")
    row = db.execute("SELECT protons,neutrons,electrons FROM atoms WHERE atom_id=?",
                     (atom_id,)).fetchone()
    if row and tuple(row) != counts:
        raise ValueError("Existing atom address has incompatible counts")
    db.execute("INSERT OR IGNORE INTO atoms(atom_id,protons,neutrons,electrons) VALUES(?,?,?,?)",
               (atom_id, *counts))


def hive_ref(atom_id: str, kind: str, particle_index: int) -> str:
    _checked_ref(atom_id, "atom_id")
    if kind not in PARTICLE_KINDS or type(particle_index) is not int or particle_index < 1:
        raise ValueError("Invalid particle type or index")
    reference = f"{atom_id}/{kind}/{particle_index:06d}"
    _checked_ref(reference, "hive_id")
    return reference


def worker_ref(hive_id: str, slot: int) -> str:
    if type(slot) is not int or not 0 <= slot < WORKERS_PER_HIVE:
        raise ValueError("Worker slot must be in [0,50000)")
    return f"{hive_id}:bee:{slot:05d}"


def worker_address(hive_id: str, slot: int, roster: list[dict[str, Any]]) -> dict[str, Any]:
    role_index, replica = divmod(slot, COPIES_PER_ROLE)
    r = roster[role_index]
    return {"worker_id":worker_ref(hive_id, slot), "hive_id":hive_id,
            "slot":slot,"role_id":r["id"], "role_name":r["name"],
            "family":r["family_name"], "replica":replica}


def register_hive(db: sqlite3.Connection, atom_id: str, kind: str,
                  particle_index: int, purpose: str, materialize: bool = False,
                  roster: list[dict[str, Any]] | None = None) -> str:
    if not purpose or not purpose.strip():
        raise ValueError("Hive purpose must be explicit")
    h = hive_ref(atom_id, kind, particle_index)
    row = db.execute("SELECT purpose FROM hives WHERE hive_id=?", (h,)).fetchone()
    if row and row[0] != purpose:
        raise ValueError("Existing hive purpose differs; no silent rewrite")
    db.execute("INSERT OR IGNORE INTO hives VALUES(?,?,?,?,?,?,?)",
               (h,atom_id,kind,particle_index,purpose,WORKERS_PER_HIVE,utc_now()))
    if materialize:
        materialize_hive(db, h, roster or read_roster())
    return h


def materialize_hive(db: sqlite3.Connection, hive_id: str,
                     roster: list[dict[str, Any]] | None = None) -> int:
    roster = roster or read_roster()
    if not db.execute("SELECT 1 FROM hives WHERE hive_id=?",(hive_id,)).fetchone():
        raise ValueError("Register hive before materialization")
    rows = ((worker_ref(hive_id, s), hive_id, s,
             roster[s//COPIES_PER_ROLE]["id"],
             roster[s//COPIES_PER_ROLE]["family_name"],
             s % COPIES_PER_ROLE)
            for s in range(WORKERS_PER_HIVE))
    db.executemany("INSERT OR IGNORE INTO workers(worker_id,hive_id,slot,role_id,family,replica) "
                   "VALUES (?,?,?,?,?,?)", rows)
    count = db.execute("SELECT COUNT(*) FROM workers WHERE hive_id=?",(hive_id,)).fetchone()[0]
    if count != WORKERS_PER_HIVE:
        raise AssertionError(f"Expected {WORKERS_PER_HIVE} stored worker records; got {count}")
    return count


def build_atom(db: sqlite3.Connection, atom_id: str, protons: int,
               neutrons: int, electrons: int, purpose: str,
               materialize: bool = False,
               roster: list[dict[str, Any]] | None = None) -> list[str]:
    register_atom(db, atom_id, protons, neutrons, electrons)
    result = []
    for kind, count in zip(PARTICLE_KINDS, (protons, neutrons, electrons)):
        for i in range(1, count+1):
            result.append(register_hive(db,atom_id,kind,i,purpose,materialize,roster))
    return result


def validate_spec(spec: dict[str, Any]) -> dict[str, Any]:
    """Run concrete deterministic checks, not an LLM's opinion or proof of truth.

    Keys are optional and omissions are reported as limits, not silently assumed.
    Supported: items[{id}], measurements[{value,unit}], intervals[{start,end}],
    fractions[{numerator,denominator}], ordered_steps[{sequence}],
    time{utc_iso, duration_monotonic_seconds}, claims[{tier,source}].
    """
    errors: list[dict[str, Any]] = []
    warnings: list[str] = []
    items = spec.get("items",[])
    ids = [r.get("id") for r in items if isinstance(r,dict)]
    if any(x is None for x in ids) or len(set(map(str, ids))) != len(ids):
        errors.append({"rule":5,"message":"Missing or repeated item ID"})
    for i,m in enumerate(spec.get("measurements",[])):
        if not isinstance(m,dict) or not m.get("unit"):
            errors.append({"rule":3,"message":f"Measurement {i} missing explicit unit"})
        if not isinstance(m,dict) or not isinstance(m.get("value"),(int,str)):
            errors.append({"rule":4,"message":f"Measurement {i} needs exact integer or decimal-string value"})
        elif isinstance(m["value"],str):
            try: Decimal(m["value"])
            except Exception: errors.append({"rule":4,"message":f"Measurement {i} invalid decimal"})
    for i,v in enumerate(spec.get("intervals",[])):
        if not isinstance(v,dict) or "start" not in v or "end" not in v:
            errors.append({"rule":1,"message":f"Interval {i} missing half-open boundaries"})
        elif type(v["start"]) is not int or type(v["end"]) is not int or v["end"] < v["start"]:
            errors.append({"rule":2,"message":f"Interval {i} invalid [start,end) range"})
    for i,f in enumerate(spec.get("fractions",[])):
        if not isinstance(f,dict) or not isinstance(f.get("denominator"),(int,float,Decimal,str)):
            errors.append({"rule":13,"message":f"Fraction {i} missing denominator"})
        else:
            try:
                d=Decimal(str(f["denominator"]))
                if d==0 or not d.is_finite():
                    errors.append({"rule":13,"message":f"Fraction {i} denominator is zero or non-finite"})
            except Exception:
                errors.append({"rule":13,"message":f"Fraction {i} invalid denominator"})
    steps=spec.get("ordered_steps",[])
    if steps and [s.get("sequence") for s in steps] != list(range(len(steps))):
        errors.append({"rule":11,"message":"Steps must be consecutively indexed from zero"})
    for i,c in enumerate(spec.get("claims",[])):
        if not isinstance(c,dict) or c.get("tier") not in VALID_TIERS:
            errors.append({"rule":12,"message":f"Claim {i} missing CERO/UNO/DOS provenance tier"})
        elif c["tier"]=="UNO" and not c.get("source"):
            warnings.append(f"Claim {i} says UNO but has no cited source; review required")
    t=spec.get("time")
    if t is not None:
        if not isinstance(t,dict) or not str(t.get("utc_iso","")).endswith(("Z","+00:00")):
            errors.append({"rule":10,"message":"UTC timestamp must have Z or +00:00 offset"})
        if not isinstance(t,dict) or not isinstance(t.get("duration_monotonic_seconds"),(int,float)):
            warnings.append("Elapsed duration should come from a monotonic clock")
    if not any(k in spec for k in ("measurements","intervals","items","fractions","ordered_steps","claims","time")):
        warnings.append("No structured test fields supplied: cannot establish substantive correctness")
    for rule in (6,7,8,9):
        warnings.append(f"Rule {rule} requires domain-specific context, not auto-certified")
    return {"status":"requires_review" if errors or warnings else "checks_passed",
            "errors":errors,"warnings":warnings,
            "rules_attempted":[1,2,3,4,5,10,11,12,13],
            "rules_not_automatically_certified":[6,7,8,9]}


def record_review(db:sqlite3.Connection,hive_id:str,spec:dict[str, Any],
                  tier:str="DOS") -> dict[str, Any]:
    if tier not in VALID_TIERS:
        raise ValueError("Evidence tier must be CERO/UNO/DOS")
    if not db.execute("SELECT 1 FROM hives WHERE hive_id=?",(hive_id,)).fetchone():
        raise ValueError("Hive not found")
    result=validate_spec(spec)
    request_hash=sha256(spec)
    marker=sha256({"hive":hive_id,"spec":request_hash,"at":utc_now()})
    record={"review_id":marker,"hive_id":hive_id,"result":result,
            "source_tier":tier,"input_sha256":request_hash}
    db.execute("INSERT OR IGNORE INTO reviews VALUES (?,?,?,?,?,?)",
               (marker,hive_id,request_hash,tier,canonical_json(result),utc_now()))
    db.execute("INSERT INTO events(hive_id,type,event_json,sha256,recorded_at_utc) VALUES(?,?,?,?,?)",
               (hive_id,"review",canonical_json(record),sha256(record),utc_now()))
    return record




# Actual, deterministic role-family execution. These are callable worker handlers;
# they do not pretend to be independently running language models.
def execute_family(family: str, spec: dict[str, Any]) -> dict[str, Any]:
    claims = spec.get("claims", [])
    if family == "Conjectural":
        return {"hypotheses": sum(isinstance(x,dict) and x.get("tier")=="DOS" for x in claims),
                "next_step":"Write a falsifiable prediction and a test for each conjecture"}
    if family == "Conceptual":
        return {"has_definitions":bool(spec.get("definitions")),
                "next_step":"Define terms, scope and boundaries before implementation"}
    if family == "Abstract":
        return {"invariants_recorded":len(spec.get("invariants", [])),
                "next_step":"Identify assumptions and invariants; abstractions are not physical proof"}
    if family == "Empirical (The Contrast)":
        evidence = spec.get("observations", [])
        return {"observations_logged":len(evidence),
                "has_repeatability_data":any(isinstance(o,dict) and o.get("replicate_count",0)>1 for o in evidence),
                "next_step":"Seek measurements, repeatability and independent controls"}
    if family == "Common Sense":
        return {"budget_specified": "resource_budget" in spec,
                "next_step":"Check resource limits, operational safety and measurable benefit"}
    if family == "Logic":
        validated=validate_spec(spec)
        return {"errors":validated["errors"],"rules_attempted":validated["rules_attempted"],
                "not_certified":validated["rules_not_automatically_certified"]}
    if family == "Wisdom":
        return {"human_action_approval": bool(spec.get("human_authorized",False)),
                "next_step":"Consider consequences; require human approval for external effects"}
    if family == "Knowledge":
        return {"sourced_claims":sum(isinstance(x,dict) and bool(x.get("source")) for x in claims),
                "next_step":"Link references and distinguish CERO, UNO and DOS"}
    if family == "Intuition":
        return {"candidate_anomaly":bool(validate_spec(spec)["errors"]),
                "next_step":"Treat anomalies as hypotheses until independently checked"}
    if family == "Discernment":
        return {"decision":"human_review_required",
                "next_step":"Cross-check evidence, truth claims, ethics and authorization"}
    raise ValueError("Worker family has no registered handler")


def execute_worker(db: sqlite3.Connection, hive_id: str, slot: int,
                   spec: dict[str, Any], roster: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    """Run actual code for one addressed worker, recording an inspectable event."""
    roster=roster or read_roster()
    entry=worker_address(hive_id,slot,roster)
    row=db.execute("SELECT role_id FROM workers WHERE worker_id=?",(entry["worker_id"],)).fetchone()
    if row is None:
        raise ValueError("Materialize this hive before executing individual worker")
    if row[0] != entry["role_id"]:
        raise AssertionError("Role mismatch between immutable manifest and stored worker")
    outcome=execute_family(entry["family"],spec)
    result={"worker":entry,"outcome":outcome,"input_sha256":sha256(spec),
            "executor":"deterministic_python_handler"}
    db.execute("INSERT INTO events(hive_id,type,event_json,sha256,recorded_at_utc) VALUES(?,?,?,?,?)",
               (hive_id,"worker_execution",canonical_json(result),sha256(result),utc_now()))
    return result


def execute_family_leads(db:sqlite3.Connection,hive_id:str,
                         spec:dict[str,Any]) -> list[dict[str,Any]]:
    """Run all ten family leads on a task, one selected worker from each family."""
    roster=read_roster()
    return [execute_worker(db,hive_id,family_index*10*COPIES_PER_ROLE,spec,roster)
            for family_index in range(10)]


def capacity_by_particles(particle_count:int, workers_per_hive:int=WORKERS_PER_HIVE) -> int:
    if type(particle_count) is not int or particle_count < 0:
        raise ValueError("Particle count must be a nonnegative integer")
    return particle_count*workers_per_hive


def summary(db:sqlite3.Connection) -> dict[str,Any]:
    n_hives=db.execute("SELECT COUNT(*) FROM hives").fetchone()[0]
    n_workers=db.execute("SELECT COUNT(*) FROM workers").fetchone()[0]
    return {"registered_hives":n_hives,"addressable_worker_slots":n_hives*WORKERS_PER_HIVE,
            "materialized_worker_records":n_workers,"events":db.execute("SELECT COUNT(*) FROM events").fetchone()[0],
            "conceptual_scope":"user-defined logical particle addresses; not actual observed particles"}


def main() -> None:
    cli=argparse.ArgumentParser(description="Particle hives: actual SQLite worker records, not astronomical processes")
    cli.add_argument("--database",type=Path,default=HERE/"particle_hives_demo.sqlite")
    sub=cli.add_subparsers(dest="command",required=True)
    seed=sub.add_parser("seed",help="Create one proton, one neutron, one electron hive (deuterium model)")
    seed.add_argument("--materialize",action="store_true",help="Persist all 150,000 workers")
    seed.add_argument("--purpose",default="Preserve evidence, check boundaries, coordinate review, and require human authorization for real actions")
    reg=sub.add_parser("register",help="Register a specified symbolic atom")
    reg.add_argument("atom_id");reg.add_argument("--protons",type=int,required=True)
    reg.add_argument("--neutrons",type=int,required=True);reg.add_argument("--electrons",type=int,required=True)
    reg.add_argument("--purpose",required=True);reg.add_argument("--materialize",action="store_true")
    show=sub.add_parser("worker",help="Resolve an individual worker's stable identity")
    show.add_argument("hive_id");show.add_argument("slot",type=int)
    review=sub.add_parser("review",help="Execute deterministic safety/integrity checks on JSON")
    review.add_argument("hive_id");review.add_argument("spec_file",type=Path)
    work=sub.add_parser("work",help="Execute one materialized worker against a JSON task")
    work.add_argument("hive_id");work.add_argument("slot",type=int)
    work.add_argument("spec_file",type=Path)
    family=sub.add_parser("families",help="Execute ten family leads on a JSON task")
    family.add_argument("hive_id");family.add_argument("spec_file",type=Path)
    sub.add_parser("status",help="Show registered vs persisted capacity")
    cap=sub.add_parser("capacity",help="Compute symbolic worker counts with integer exactness")
    cap.add_argument("particles",type=int)
    a=cli.parse_args()
    if a.command=="capacity":
        print(capacity_by_particles(a.particles));return
    db=connect(a.database)
    try:
        with db:
            if a.command=="seed":
                h=build_atom(db,"DEUTERIUM-DEMO-001",1,1,1,a.purpose,a.materialize)
                print(canonical_json({"created_hives":h,"summary":summary(db)}))
            elif a.command=="register":
                h=build_atom(db,a.atom_id,a.protons,a.neutrons,a.electrons,a.purpose,a.materialize)
                print(canonical_json({"created_hives":h,"summary":summary(db)}))
            elif a.command=="worker":
                print(canonical_json(worker_address(a.hive_id,a.slot,read_roster())))
            elif a.command=="review":
                spec=json.loads(a.spec_file.read_text(encoding="utf-8"))
                print(canonical_json(record_review(db,a.hive_id,spec)))
            elif a.command=="work":
                spec=json.loads(a.spec_file.read_text(encoding="utf-8"))
                print(canonical_json(execute_worker(db,a.hive_id,a.slot,spec)))
            elif a.command=="families":
                spec=json.loads(a.spec_file.read_text(encoding="utf-8"))
                print(json.dumps(execute_family_leads(db,a.hive_id,spec),indent=2,ensure_ascii=False))
            elif a.command=="status":
                print(canonical_json(summary(db)))
    finally:
        db.close()


if __name__=="__main__": main()
