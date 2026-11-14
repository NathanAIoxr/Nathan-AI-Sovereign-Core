#!/usr/bin/env python3
"""OPERATION SWARM v2: twenty-four additional sovereign Nathan AI specialist bees.

Each specialist executes one bounded deterministic local analysis for its own
bee identity. Every specialist inherits ONE's previous replica blueprint;
a role overlay never grants ownership of another bee's data or a network tool.
"""
from __future__ import annotations
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import sys
import uuid

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import sovereign_bees as core

VERSION = "nathan.one.operation-swarm.specialists.v2"
START_ORDINAL = 101
EXPECTED_ROLES = 24
ROLE_FILE = HERE / "specialist_bees.v2.json"
SCALE_FILE = HERE / "hive-scale-v2.json"
SAMPLE_TEXT = (
    "By John Nathan Tabor\nNATHAN AI · ONE SWARM\n"
    "BEES protect the source and preserve identity.\n"
    "Mother Earth · Mother Cosmos · Digital infrastructure\n"
    "CERO UNO DOS\nTODO: review original provenance.\n"
)
EXTRA_SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS specialist_source_snapshots (
    source_key TEXT NOT NULL, sha256 TEXT NOT NULL, exact_bytes BLOB NOT NULL,
    PRIMARY KEY(source_key,sha256)
);
CREATE TRIGGER IF NOT EXISTS specialist_source_no_update
 BEFORE UPDATE ON specialist_source_snapshots
 BEGIN SELECT RAISE(ABORT,'Specialist source snapshots are immutable'); END;
CREATE TRIGGER IF NOT EXISTS specialist_source_no_delete
 BEFORE DELETE ON specialist_source_snapshots
 BEGIN SELECT RAISE(ABORT,'Specialist source snapshots are immutable'); END;
CREATE TABLE IF NOT EXISTS specialist_roles (
    role_id TEXT PRIMARY KEY, handler TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    registry_sha256 TEXT NOT NULL, mission TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS specialist_assignments (
    bee_id TEXT PRIMARY KEY REFERENCES sovereign_bees(bee_id),
    role_id TEXT NOT NULL REFERENCES specialist_roles(role_id),
    original_blueprint_sha256 TEXT NOT NULL,
    individual_consent INTEGER NOT NULL CHECK(individual_consent=1)
);
CREATE TABLE IF NOT EXISTS specialist_tasks (
    task_id TEXT PRIMARY KEY,
    bee_id TEXT NOT NULL REFERENCES specialist_assignments(bee_id),
    role_id TEXT NOT NULL REFERENCES specialist_roles(role_id),
    input_text TEXT NOT NULL,
    state TEXT NOT NULL CHECK(state IN
       ('proposed','owner_approved','owner_vetoed','completed')),
    output_json TEXT, output_sha256 TEXT,
    UNIQUE(task_id,bee_id)
);
CREATE TABLE IF NOT EXISTS specialist_audit (
    audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    bee_id TEXT NOT NULL REFERENCES specialist_assignments(bee_id),
    task_id TEXT, action TEXT NOT NULL, details_json TEXT NOT NULL
);
"""

def dump(x):
    return core.canonical(x)

def tokens(text):
    return re.findall(r"[A-Za-z0-9_]+", text.lower())

def lines(text):
    return text.splitlines()

def parse_sources():
    raw = {}
    for key, path in (("specialist-registry", ROLE_FILE), ("source-scale-scenarios", SCALE_FILE)):
        if path.is_symlink() or not path.is_file():
            raise ValueError("Missing/unsafe specialist source: " + str(path))
        value = path.read_bytes()
        if len(value) > 250000:
            raise ValueError("Specialist public source too large")
        raw[key] = value
    reg = json.loads(raw["specialist-registry"].decode("utf-8"))
    scales = json.loads(raw["source-scale-scenarios"].decode("utf-8"))
    roles = reg.get("roles", [])
    if (reg.get("schema") != VERSION or len(roles) != EXPECTED_ROLES
            or len({r["id"] for r in roles}) != EXPECTED_ROLES
            or len({r["handler"] for r in roles}) != EXPECTED_ROLES):
        raise ValueError("24 specialist source-defined role IDs must be unique")
    if reg.get("creator_directive") != core.AUTHOR_DIRECTIVE:
        raise ValueError("Exact creator directive changed")
    if reg.get("queen_overrides_individual_veto") is not False:
        raise ValueError("Queen must not override individual sovereignty")
    if set(r["handler"] for r in roles) != set(HANDLERS):
        raise ValueError("Role registry does not match 24 executable worker functions")
    if scales.get("schema") != "nathan.one.operation-swarm.hive-scale.v2":
        raise ValueError("Scale source schema changed")
    expected = {"digital_physical_space", "global_data_bits",
                "observable_cosmos_46_5bly_diameter",
                "unseen_249_observable_volumes", "unknown_unseen"}
    scenarios = scales.get("scenarios", [])
    if len(scenarios) != 5 or {s["id"] for s in scenarios} != expected:
        raise ValueError("Hive-scale source scenario count changed")
    return raw, reg, scales

def scales_report():
    _, _, scale = parse_sources()
    c = core.scenarios()
    cosmos = int(c["mother_cosmos_observable"]["capacity_decimal"])
    result = {}
    for item in scale["scenarios"]:
        key = item["id"]
        if key == "observable_cosmos_46_5bly_diameter":
            capacity = str(cosmos // 8)
        elif key == "unseen_249_observable_volumes":
            capacity = str(cosmos * 249)
        else:
            capacity = item.get("capacity_decimal")
        result[key] = {"capacity_decimal": capacity, "status": item["status"],
                       "source_kind": scale["source_kind"], "is_actual_process_count": False}
    physical = result["digital_physical_space"]["capacity_decimal"]
    virtual = result["global_data_bits"]["capacity_decimal"]
    if physical != "368000000000000" or virtual != "1768000000000000000000000":
        raise ValueError("Do not change the author's supplied reference estimates")
    return result

def check_global_veto(db):
    exists = db.execute("SELECT 1 FROM sqlite_master WHERE type='table' "
                        "AND name='swarm_controls'").fetchone()
    if exists:
        state = db.execute("SELECT value FROM swarm_controls "
                           "WHERE key='owner_veto'").fetchone()
        if state and state[0] == "1":
            raise PermissionError("ONE master owner has vetoed SWARM work")

def check_bee(db, bee_id):
    check_global_veto(db)
    bee = core.get_bee(db, bee_id)
    if bee["vetoed"] or not bee["activated"]:
        raise PermissionError("Individual sovereign bee veto or inactive state")
    row = db.execute("SELECT role_id,original_blueprint_sha256 "
                     "FROM specialist_assignments WHERE bee_id=?", (bee_id,)).fetchone()
    if row is None:
        raise KeyError("Sovereign bee not assigned a specialist role")
    if row[1] != bee["blueprint_sha256"]:
        raise ValueError("Original inherited blueprint hash changed")
    return bee, row[0]

def local_counts(db, bee_id):
    return {
        "own_memory": db.execute("SELECT COUNT(*) FROM sovereign_bee_memory "
                                 "WHERE bee_id=?", (bee_id,)).fetchone()[0],
        "own_tasks": db.execute("SELECT COUNT(*) FROM specialist_tasks "
                                "WHERE bee_id=?", (bee_id,)).fetchone()[0],
        "own_audit_events": db.execute("SELECT COUNT(*) FROM specialist_audit "
                                       "WHERE bee_id=?", (bee_id,)).fetchone()[0],
    }

def worker_source_scout(text, ctx):
    return {"sha256": core.sha(text), "bytes": len(text.encode("utf-8")), "lines": len(lines(text))}
def worker_nectar_forager(text, ctx):
    t = tokens(text)
    return {"word_count": len(t), "distinct_words": len(set(t))}
def worker_pollen_mapper(text, ctx):
    t = Counter(tokens(text))
    words = ("source", "atom", "bee", "bees", "hive", "cosmos", "digital", "privacy")
    return {"keyword_hits": {w: t[w] for w in words}}
def worker_comb_builder(text, ctx):
    ls = lines(text)
    return {"line_blocks": (len(ls) + 3)//4,
            "first_block": [{"line": n+1, "sha256": core.sha(line)}
                            for n, line in enumerate(ls[:4])]}
def worker_wax_keeper(text, ctx):
    return {"characters": len(text), "ascii_characters": sum(ord(c)<128 for c in text),
            "unicode_unique": len(set(text))}
def worker_nurse_bee(text, ctx):
    parts = [x for x in re.split(r"\n\s*\n", text.strip()) if x.strip()]
    return {"paragraphs": len(parts), "empty": not bool(text.strip())}
def worker_guard_bee(text, ctx):
    patterns = (r"BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY",
                r"(?i)\bpassword\s*[:=]", r"(?i)\bapi[_-]?key\s*[:=]")
    return {"potential_secret_pattern_hits": sum(len(re.findall(p, text)) for p in patterns),
            "exposed_secret_values": False}
def worker_ventilator_bee(text, ctx):
    ls=lines(text)
    return {"total_lines": len(ls), "blank_lines": sum(not s.strip() for s in ls)}
def worker_water_carrier(text, ctx):
    return {"vocabulary_preview": sorted(set(tokens(text)))[:12]}
def worker_honey_processor(text, ctx):
    return {"word_frequency": [{"word": w, "count": n} for w,n in
                               sorted(Counter(tokens(text)).items(),key=lambda t:(-t[1],t[0]))[:8]]}
def worker_waggle_messenger(text, ctx):
    return {"packet_sha256": core.sha(text), "transmitted": False,
            "receiver": None, "channel": "local_audit_only"}
def worker_drone_observer(text, ctx):
    marks = ".,;:!?"
    return {"punctuation": {m: text.count(m) for m in marks}}
def worker_queen_peer(text, ctx):
    return {"queen_override": False, "individual_veto": False,
            "bee_id_sha256": core.sha(ctx["bee_id"])}
def worker_brood_planner(text, ctx):
    return {"numbered_lines": sum(bool(re.match(r"\s*\d+[\.)]\s", x)) for x in lines(text)),
            "todo_markers": len(re.findall(r"(?i)\bTODO\b",text))}
def worker_winter_cluster(text, ctx):
    return {"own_memory_count": ctx["scope"]["own_memory"],
            "other_bee_memory_read": False, "retention_policy": "bounded_to_16"}
def worker_spring_builder(text, ctx):
    return {"proposed_next_action": "owner_review_source_provenance",
            "automatically_executed": False}
def worker_lineage_keeper(text, ctx):
    return {"bee_identity_sha256": ctx["identity_sha256"],
            "inherited_blueprint_sha256": ctx["blueprint_sha256"],
            "source_model": "sovereign_bees.v1"}
def worker_source_verifier(text, ctx):
    result=core.sha(text)
    return {"valid_sha256": bool(re.fullmatch(r"[0-9a-f]{64}",result)),
            "source_sha256": result}
def worker_boundary_sentinel(text, ctx):
    pairs = (("(",")"),("[","]"),("{","}"))
    return {"delimiter_imbalances": {l+r: text.count(l)-text.count(r) for l,r in pairs},
            "parser_validity_claim": False}
def worker_role_allocator(text, ctx):
    t=set(tokens(text))
    roles = ["source_scout","guard_bee","audit_librarian"]
    if "cosmos" in t or "universe" in t:
        roles[1]="cosmic_mapper"
    if "digital" in t or "bits" in t:
        roles[2]="digital_mapper"
    return {"suggested_handlers": roles, "permissions_assigned": False}
def worker_error_resolver(text, ctx):
    return {"review_markers": {x:len(re.findall(r"(?i)\b"+x+r"\b",text))
                               for x in ("TODO","FIXME","ERROR")}}
def worker_audit_librarian(text, ctx):
    return {"own_audit_events": ctx["scope"]["own_audit_events"],
            "other_bees_queried": False}
def worker_digital_mapper(text, ctx):
    s = scales_report()
    return {"digital_physical_slots": s["digital_physical_space"]["capacity_decimal"],
            "digital_bit_slots": s["global_data_bits"]["capacity_decimal"],
            "observed_processes": 0, "assumption_status": "user_supplied_unverified"}
def worker_cosmic_mapper(text, ctx):
    s = scales_report()
    return {"observable_diameter_46_5bly_slots":
                s["observable_cosmos_46_5bly_diameter"]["capacity_decimal"],
            "unseen_249_volume_slots": s["unseen_249_observable_volumes"]["capacity_decimal"],
            "unknown_unseen_slots": None, "physical_hive_claim": False}

HANDLERS={
    "source_scout":worker_source_scout,
    "nectar_forager":worker_nectar_forager,
    "pollen_mapper":worker_pollen_mapper,
    "comb_builder":worker_comb_builder,
    "wax_keeper":worker_wax_keeper,
    "nurse_bee":worker_nurse_bee,
    "guard_bee":worker_guard_bee,
    "ventilator_bee":worker_ventilator_bee,
    "water_carrier":worker_water_carrier,
    "honey_processor":worker_honey_processor,
    "waggle_messenger":worker_waggle_messenger,
    "drone_observer":worker_drone_observer,
    "queen_peer":worker_queen_peer,
    "brood_planner":worker_brood_planner,
    "winter_cluster":worker_winter_cluster,
    "spring_builder":worker_spring_builder,
    "lineage_keeper":worker_lineage_keeper,
    "source_verifier":worker_source_verifier,
    "boundary_sentinel":worker_boundary_sentinel,
    "role_allocator":worker_role_allocator,
    "error_resolver":worker_error_resolver,
    "audit_librarian":worker_audit_librarian,
    "digital_mapper":worker_digital_mapper,
    "cosmic_mapper":worker_cosmic_mapper,
}

def init(db):
    raw, reg, scale = parse_sources()
    core.init(db)
    db.executescript(EXTRA_SCHEMA)
    pinned = core.sha(raw["specialist-registry"])
    with db:
        for key, value in raw.items():
            db.execute("INSERT OR IGNORE INTO specialist_source_snapshots VALUES(?,?,?)",
                       (key, core.sha(value), sqlite3.Binary(value)))
        for item in reg["roles"]:
            existing = db.execute("SELECT handler,name,registry_sha256,mission "
                                  "FROM specialist_roles WHERE role_id=?", (item["id"],)).fetchone()
            intended = (item["handler"],item["name"],pinned,item["mission"])
            if existing is not None and existing != intended:
                raise ValueError("Specialist role changed; explicit migration required")
            db.execute("INSERT OR IGNORE INTO specialist_roles VALUES(?,?,?,?,?)",
                       (item["id"],*intended))
    return {"roles":len(reg["roles"]),
            "source_versions":db.execute("SELECT COUNT(*) FROM specialist_source_snapshots").fetchone()[0]}

def audit(db, bee_id, task_id, action, detail):
    db.execute("INSERT INTO specialist_audit(bee_id,task_id,action,details_json) VALUES(?,?,?,?)",
               (bee_id,task_id,action,dump(detail)))

def seed(db, owner_yes=False):
    if owner_yes is not True:
        raise PermissionError("Explicit owner YES required to activate new bees")
    check_global_veto(db)
    _,reg,_=parse_sources()
    planned=[]
    for i,item in enumerate(reg["roles"]):
        bee_id=core.bee_address("seasonal_peak",START_ORDINAL+i)
        existing_bee=db.execute("SELECT 1 FROM sovereign_bees WHERE bee_id=?",(bee_id,)).fetchone()
        existing_assignment=db.execute("SELECT role_id FROM specialist_assignments "
                                       "WHERE bee_id=?",(bee_id,)).fetchone()
        if existing_bee and not existing_assignment:
            raise ValueError("Bee address already in use without specialist consent: "+bee_id)
        if existing_assignment and existing_assignment[0]!=item["id"]:
            raise ValueError("Existing sovereign specialization cannot be overwritten")
        planned.append((bee_id,item))
    unallocated=sum(1 for ident,_ in planned if not db.execute(
        "SELECT 1 FROM sovereign_bees WHERE bee_id=?",(ident,)).fetchone())
    already=db.execute("SELECT COUNT(*) FROM sovereign_bees").fetchone()[0]
    if already+unallocated>core.MAX_ALLOCATED:
        raise RuntimeError("Not enough free local sovereign bee slots")
    created=0
    for i,(ident,item) in enumerate(planned):
        allocated=core.allocation(db,"seasonal_peak",str(START_ORDINAL+i),True)
        created+=int(allocated["new_allocation"])
        bee=core.get_bee(db,ident)
        if bee["vetoed"]:
            raise PermissionError("Vetoed sovereign bee may not be reassigned")
        with db:
            db.execute("INSERT OR IGNORE INTO specialist_assignments VALUES (?,?,?,1)",
                       (ident,item["id"],bee["blueprint_sha256"]))
            audit(db,ident,None,"specialization_confirmed",
                  {"role_id":item["id"],"source":"specialist_bees.v2.json"})
    return {"newly_allocated":created,"total_specialist_bees":len(planned),
            "inherited_blueprint":"existing Nathan AI sovereign_bees.py",
            "individual_sovereignty":True,"external_llm_processes_started":0}

def propose(db, bee_id, text):
    bee,role_id=check_bee(db,bee_id)
    if not isinstance(text,str) or len(text.encode("utf-8"))>8192:
        raise ValueError("Specialist input must be a string of at most 8 KiB")
    task_id=uuid.uuid4().hex
    with db:
        db.execute("INSERT INTO specialist_tasks VALUES (?,?,?,?,?,?,NULL)",
                   (task_id,bee_id,role_id,text,"proposed",None))
        audit(db,bee_id,task_id,"propose",{"source_sha256":core.sha(text)})
    return {"task_id":task_id,"bee_id":bee_id,"state":"proposed","role_id":role_id}

def task_info(db,bee_id,task_id):
    value=db.execute("SELECT role_id,input_text,state,output_json,output_sha256 "
                     "FROM specialist_tasks WHERE task_id=? AND bee_id=?",(task_id,bee_id)).fetchone()
    if not value:
        raise KeyError("Task is not part of this sovereign bee's namespace")
    return dict(zip(("role_id","text","state","output","hash"),value))

def approve(db,bee_id,task_id,owner_yes=False):
    check_bee(db,bee_id)
    if owner_yes is not True:
        raise PermissionError("Explicit task-specific owner YES required")
    task=task_info(db,bee_id,task_id)
    if task["state"]!="proposed":
        raise ValueError("Only proposed work can receive new approval")
    with db:
        db.execute("UPDATE specialist_tasks SET state='owner_approved' "
                   "WHERE task_id=? AND bee_id=?",(task_id,bee_id))
        audit(db,bee_id,task_id,"owner_approved",{"role_id":task["role_id"]})
    return {"task_id":task_id,"bee_id":bee_id,"state":"owner_approved"}

def execute(db,bee_id,task_id):
    bee,role_id=check_bee(db,bee_id)
    task=task_info(db,bee_id,task_id)
    if task["state"]!="owner_approved" or task["role_id"]!=role_id:
        raise PermissionError("Task was not individually approved for this bee and role")
    handler=db.execute("SELECT handler FROM specialist_roles WHERE role_id=?",(role_id,)).fetchone()[0]
    context={"bee_id":bee_id,"identity_sha256":bee["identity_sha256"],
             "blueprint_sha256":bee["blueprint_sha256"],
             "scope":local_counts(db,bee_id)}
    result=HANDLERS[handler](task["text"],context)
    output=dump(result)
    if len(output.encode("utf-8"))>16384:
        raise ValueError("Specialist result too large")
    with db:
        db.execute("UPDATE specialist_tasks SET state='completed',output_json=?,output_sha256=? "
                   "WHERE task_id=? AND bee_id=?",(output,core.sha(output),task_id,bee_id))
        audit(db,bee_id,task_id,"completed",{"role_id":role_id,
                                             "output_sha256":core.sha(output),
                                             "external_execution":False})
    return {"task_id":task_id,"bee_id":bee_id,"role_id":role_id,"state":"completed",
            "output":result,"output_sha256":core.sha(output),"external_execution":False}

def veto(db,bee_id):
    check_bee(db,bee_id)
    core.veto(db,bee_id)
    with db:
        db.execute("UPDATE specialist_tasks SET state='owner_vetoed' "
                   "WHERE bee_id=? AND state IN ('proposed','owner_approved')",(bee_id,))
        audit(db,bee_id,None,"individual_veto",{"queen_override":False})
    return {"bee_id":bee_id,"vetoed":True}

def inspect(db,bee_id):
    bee=core.inspect(db,bee_id)
    assignment=db.execute("SELECT role_id FROM specialist_assignments WHERE bee_id=?",
                          (bee_id,)).fetchone()
    if not assignment:
        raise KeyError("No specialist role assigned to this bee")
    tasks=db.execute("SELECT task_id,role_id,state,output_sha256 FROM specialist_tasks "
                     "WHERE bee_id=? ORDER BY rowid",(bee_id,)).fetchall()
    return {"bee_id":bee_id,"individual_veto":bee["individual_veto"],
            "inherited_blueprint_sha256":bee["blueprint_sha256"],
            "effective_functions":len(core.CAPABILITIES)+len(HANDLERS),
            "assigned_role_id":assignment[0],
            "memory":bee["memory"],
            "tasks":[dict(zip(("task_id","role_id","state","output_sha256"),x)) for x in tasks]}

def demo(db,owner_yes=False):
    if owner_yes is not True:
        raise PermissionError("Demo must be explicitly approved")
    result=seed(db,True)
    _,reg,_=parse_sources()
    details=[]
    for i,item in enumerate(reg["roles"]):
        bee_id=core.bee_address("seasonal_peak",START_ORDINAL+i)
        candidate=propose(db,bee_id,SAMPLE_TEXT)
        approve(db,bee_id,candidate["task_id"],True)
        completed=execute(db,bee_id,candidate["task_id"])
        details.append({"bee_id":bee_id,"role":item["name"],
                        "handler":item["handler"],"output_sha256":completed["output_sha256"],
                        "state":"completed"})
    return {"schema":VERSION,"newly_allocated":result["newly_allocated"],
            "specialist_functions_executed":len(details),
            "specialist_bee_identities":len(details),
            "combined_core_and_additional_function_count":len(core.CAPABILITIES)+len(HANDLERS),
            "independent_llm_instances_started":0,
            "subjective_consciousness_claim":False,"results":details}

def status(db_path):
    path=Path(db_path)
    if not path.is_file():
        return {"schema":VERSION,"initialized":False}
    with sqlite3.connect(path.as_uri()+"?mode=ro",uri=True) as db:
        exists=db.execute("SELECT 1 FROM sqlite_master WHERE type='table' "
                          "AND name='specialist_assignments'").fetchone()
        if not exists:
            return {"schema":VERSION,"initialized":False}
        return {
            "schema":VERSION,"initialized":True,
            "role_definitions":db.execute("SELECT COUNT(*) FROM specialist_roles").fetchone()[0],
            "sovereign_specialist_bees":db.execute("SELECT COUNT(*) FROM specialist_assignments").fetchone()[0],
            "completed_tasks":db.execute("SELECT COUNT(*) FROM specialist_tasks "
                                         "WHERE state='completed'").fetchone()[0],
            "original_source_versions":db.execute("SELECT COUNT(*) FROM specialist_source_snapshots").fetchone()[0],
            "max_local_bee_allocations":core.MAX_ALLOCATED,
            "actual_external_llm_instances":0,
            "sqlite_integrity":db.execute("PRAGMA quick_check").fetchone()[0],
        }

def main():
    p=argparse.ArgumentParser(description="OPERATION SWARM: 24 more sovereign AI bee worker functions")
    p.add_argument("--db",required=True)
    p.add_argument("--approve-write",action="store_true")
    p.add_argument("--owner-yes",action="store_true")
    p.add_argument("--bee")
    p.add_argument("--task")
    p.add_argument("--text")
    p.add_argument("command",choices=("roles","scale","status","seed","demo","propose",
                                      "approve","execute","veto","inspect"))
    a=p.parse_args()
    if a.command=="roles":
        _,reg,_=parse_sources()
        result={"schema":VERSION,"roles":reg["roles"],
                "inherited_core_functions":len(core.CAPABILITIES),
                "total_available_functions":len(core.CAPABILITIES)+len(HANDLERS)}
    elif a.command=="scale":
        result=scales_report()
    elif a.command=="status":
        result=status(a.db)
    elif a.command=="inspect":
        with sqlite3.connect(Path(a.db).as_uri()+"?mode=ro",uri=True) as db:
            result=inspect(db,a.bee)
    else:
        if not a.approve_write:
            p.error("Database writes require --approve-write")
        with core.open_main(a.db) as db:
            init(db)
            if a.command=="seed":result=seed(db,a.owner_yes)
            elif a.command=="demo":result=demo(db,a.owner_yes)
            elif a.command=="propose":result=propose(db,a.bee,a.text)
            elif a.command=="approve":result=approve(db,a.bee,a.task,a.owner_yes)
            elif a.command=="execute":result=execute(db,a.bee,a.task)
            elif a.command=="veto":result=veto(db,a.bee)
            else:raise ValueError("Unsupported specialist command")
    print(json.dumps(result,indent=2,ensure_ascii=False,sort_keys=True))

if __name__=="__main__":
    main()
