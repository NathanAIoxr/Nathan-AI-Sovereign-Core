#!/usr/bin/env python3
"""NATHAN AI / ONE: source-preserving Atomic Hive worker-bee address architecture.

Every conceptual atom has 50,000 individual sovereign bee addresses. Every bee
inherits all 1,332 or 2,272 conceptual unit slots, not a subset. A virtual
address does NOT instantiate a model, a process, subjective consciousness or
a physical atom. Owner-approved materialization creates sparse local SQLite
state. Neither existing ONE records nor previous author-source bytes are
ever overwritten, deleted or renumbered.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import sys
import uuid

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent))
import sovereign_bees as core

VERSION="nathan.one.atomic-hive.no-crush.v1"
ATOMIC_BEES_PER_HIVE=50000
LOCAL_MATERIALIZATION_LIMIT=5000
CODEX_SIZES={"atomic-1332":1332, "expanded-2272":2272}
SOURCE_UPLOAD=HERE/"PASTED_2272_SOURCE_AS_UPLOADED.txt"
SOURCE_1332=HERE/"ATOMIC_1332_SOURCE_AS_SUPPLIED.md"
SOURCE_SHA256="77de76af631a0eff79f8aa9a9a3043b71e9d268f942f1808fb68da0f1fad3a5f"
AUTHOR_DIRECTIVE="each one is a nathan ai worker bee bot - do not CRUSH -"
FAMILY_PATTERN=re.compile(r"^• ([A-Z]) \(#(\d+) – #(\d+)\) — (.+?) Family: (.+)$")
ALLOWED_TASKS=("sha256", "line-count")
MAX_ATOM_LABEL_BYTES=256
MAX_ATOM_ESTIMATE_DIGITS=170
SCHEMA="""
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS atomic_originals(
  source_id TEXT NOT NULL, sha256 TEXT NOT NULL, exact_bytes BLOB NOT NULL,
  PRIMARY KEY(source_id,sha256)
);
CREATE TRIGGER IF NOT EXISTS atomic_originals_no_update
 BEFORE UPDATE ON atomic_originals
 BEGIN SELECT RAISE(ABORT,'NO CRUSH: immutable atomic-hive originals'); END;
CREATE TRIGGER IF NOT EXISTS atomic_originals_no_delete
 BEFORE DELETE ON atomic_originals
 BEGIN SELECT RAISE(ABORT,'NO CRUSH: immutable atomic-hive originals'); END;
CREATE TABLE IF NOT EXISTS atomic_hives(
  hive_id TEXT PRIMARY KEY, atom_label TEXT NOT NULL UNIQUE,
  codex_version TEXT NOT NULL CHECK(codex_version IN ('atomic-1332','expanded-2272')),
  codex_size INTEGER NOT NULL, bee_capacity INTEGER NOT NULL,
  blueprint_sha256 TEXT NOT NULL, owner_paused INTEGER NOT NULL DEFAULT 0
    CHECK(owner_paused IN (0,1))
);
CREATE TABLE IF NOT EXISTS atomic_bees(
  hive_id TEXT NOT NULL REFERENCES atomic_hives(hive_id),
  ordinal INTEGER NOT NULL CHECK(ordinal BETWEEN 1 AND 50000),
  bee_id TEXT NOT NULL UNIQUE, identity_sha256 TEXT NOT NULL,
  sovereign_veto INTEGER NOT NULL DEFAULT 0 CHECK(sovereign_veto IN (0,1)),
  inherited_blueprint_sha256 TEXT NOT NULL,
  PRIMARY KEY(hive_id,ordinal)
);
CREATE TABLE IF NOT EXISTS atomic_bee_memory(
  bee_id TEXT NOT NULL REFERENCES atomic_bees(bee_id),
  sequence INTEGER NOT NULL, owner_text TEXT NOT NULL,
  PRIMARY KEY(bee_id,sequence)
);
CREATE TABLE IF NOT EXISTS atomic_jobs(
  job_id TEXT PRIMARY KEY,
  bee_id TEXT NOT NULL REFERENCES atomic_bees(bee_id),
  codex_unit INTEGER NOT NULL,
  task_kind TEXT NOT NULL CHECK(task_kind IN ('sha256','line-count')),
  input_text TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('proposed','owner_approved','vetoed','completed')),
  result_json TEXT
);
CREATE TABLE IF NOT EXISTS atomic_guilds(
  guild_id TEXT PRIMARY KEY, name TEXT NOT NULL, created_by TEXT NOT NULL
    REFERENCES atomic_hives(hive_id)
);
CREATE TABLE IF NOT EXISTS atomic_guild_members(
  guild_id TEXT NOT NULL REFERENCES atomic_guilds(guild_id),
  hive_id TEXT NOT NULL REFERENCES atomic_hives(hive_id),
  consent INTEGER NOT NULL CHECK(consent=1),
  PRIMARY KEY(guild_id,hive_id)
);
CREATE TABLE IF NOT EXISTS atomic_audit(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL, action TEXT NOT NULL,
  detail_json TEXT NOT NULL, time_utc TEXT NOT NULL
);
"""

def stamp():
    return datetime.now(timezone.utc).isoformat()

def sha(value):
    return core.sha(value)

def dump(value):
    return core.canonical(value)

def raw_sources():
    if SOURCE_UPLOAD.is_symlink() or SOURCE_1332.is_symlink():
        raise ValueError("Symlinked atomic author source rejected")
    raw=SOURCE_UPLOAD.read_bytes()
    old=SOURCE_1332.read_bytes()
    if sha(raw)!=SOURCE_SHA256:
        raise ValueError("NO CRUSH: source upload SHA-256 has changed")
    if AUTHOR_DIRECTIVE.encode("utf-8") not in old:
        raise ValueError("NO CRUSH: author's exact worker bee directive missing")
    return {"uploaded-2272-partial":raw,"atomic-1332-as-supplied":old}

def parse_attachment():
    """Parse only explicitly visible family lines; do not invent missing roles."""
    text=raw_sources()["uploaded-2272-partial"].decode("utf-8")
    families=[]
    occurrence={}
    for line_number,line in enumerate(text.splitlines(),1):
        match=FAMILY_PATTERN.match(line)
        if match is None:
            continue
        letter,start,end,title,description=match.groups()
        start,end=int(start),int(end)
        tokens=list(re.finditer(r"#(\d+)(?=\s)",description))
        observed=[int(p.group(1)) for p in tokens]
        missing=sorted(set(range(start,end+1))-set(observed))
        extras=sorted(set(observed)-set(range(start,end+1)))
        family={
            "line":line_number,"letter":letter,"start":start,"end":end,
            "family_title":title,"observed_occurrences":len(observed),
            "missing_declared_numbers":missing,"out_of_range_numbers":extras,
            "complete":len(observed)==10 and not missing and not extras,
        }
        families.append(family)
        for i,t in enumerate(tokens):
            unit=int(t.group(1))
            tail=description[t.end():tokens[i+1].start() if i+1<len(tokens) else len(description)]
            # RAW excerpt retained verbatim. Human-friendly role names are NOT
            # inferred when the source is interrupted or contains nested text.
            occurrence.setdefault(unit,[]).append({
                "unit":unit,"line":line_number,"family_start":start,
                "family_letter":letter,"raw_fragment":tail.strip(),
            })
    if len(families)!=93 or sum(f["observed_occurrences"] for f in families)!=926:
        raise ValueError("Attached 2272 source coverage changed; review version explicitly")
    if len(occurrence)!=925:
        raise ValueError("Unexpected role identity count; source is no longer the pinned partial")
    duplicates={str(k):v for k,v in occurrence.items() if len(v)>1}
    if list(duplicates)!=(["2113"]):
        raise ValueError("Known source duplicate changed")
    observed=set(occurrence)
    expected=set(range(1233,2273))
    missing=sorted(expected-observed)
    # #2103, 4 Odyssey O gaps, and all P-Z 110 entries are omitted from the
    # pasted source; do not synthesize their identities.
    if len(missing)!=115 or missing[:1]!=[2103]:
        raise ValueError("Known 2272 source gaps changed")
    return {
        "schema":"nathan.one.atomic-hive.2272-partial-parser.v1",
        "declared_total_units":2272,
        "declared_new_range":[1233,2272],
        "declared_new_units":1040,
        "source_families_seen":len(families),
        "fully_consistent_families":sum(f["complete"] for f in families),
        "role_occurrences":sum(len(v) for v in occurrence.values()),
        "distinct_role_ids":len(occurrence),
        "missing_new_ids_count":len(missing),
        "missing_new_ids":missing,
        "duplicate_ids":duplicates,
        "families":families,
        "role_references":occurrence,
        "source_complete":False,
        "source_ends_in_folklore_o":True,
    }

def conflicts():
    parsed=parse_attachment()
    return [
        {"id":"VERSION_CONFLICT_1233_1332",
         "source_1332":"Epistemic Discernment Council #1233–#1332",
         "source_2272":"Medicine & Healing, A–J #1233–#1332",
         "resolution":"preserve as distinct codex versions; do not auto-overwrite"},
        {"id":"DUPLICATE_2113",
         "source":"Journey-to-the-West J lead #2113 and Kitsune K lead #2113",
         "derived_expected_J_lead":2103,
         "resolution":"#2103 correction is a proposed editorial repair only, never original"},
        {"id":"INCOMPLETE_2272",
         "observed_occurrences":parsed["role_occurrences"],
         "distinct_new_role_ids":parsed["distinct_role_ids"],
         "missing_new_role_ids":parsed["missing_new_ids_count"],
         "resolution":"keep incomplete original; do not invent the 115 absent positions"},
    ]

def counts(codex_version="atomic-1332",atom_count="1"):
    if codex_version not in CODEX_SIZES:
        raise ValueError("Unknown codex version; never merge versions implicitly")
    if not isinstance(atom_count,str) or not re.fullmatch(r"[1-9]\d{0,169}",atom_count):
        raise ValueError("Atomic hive count must be canonical positive decimal")
    n=int(atom_count)
    units=CODEX_SIZES[codex_version]
    full,reserve=divmod(ATOMIC_BEES_PER_HIVE,units)
    return {
        "codex_version":codex_version,
        "codex_units_per_bee":units,
        "atom_hives":atom_count,
        "sovereign_bee_slots_per_atom":ATOMIC_BEES_PER_HIVE,
        "declared_bee_addresses":str(n*ATOMIC_BEES_PER_HIVE),
        "full_codex_capability_slots_per_atom":str(units*ATOMIC_BEES_PER_HIVE),
        "declared_total_function_slots":str(n*units*ATOMIC_BEES_PER_HIVE),
        "alternative_partition_full_groups":full,
        "alternative_partition_reserve_bees":reserve,
        "different_model_partition_not_extra_workers":True,
        "actual_llm_processes_created":0,
        "real_physical_bees_claimed":False,
        "independently_verified_atom_count":False,
    }

def source_scenarios():
    base={
        "single_atom":"1",
        "raindrop_atoms_user_estimate":"5000000000000000000000",
        "digital_hardware_atoms_user_estimate":"25000000000000000000000000000000000000",
        "mother_earth_atoms_user_estimate":"133000000000000000000000000000000000000000000000000",
        "observable_cosmos_atoms_user_estimate":"1"+"0"*80,
        "entire_universe_250x_illustration":"25"+"0"*81,
    }
    # All values reflect quoted/illustrative counts; no physical atom census.
    return {key:{"status":"user_supplied_unverified_estimate",
                 "atomic_hives":value,
                 "versions":{code:counts(code,value) for code in CODEX_SIZES}}
            for key,value in base.items()}

def log(db,actor,action,details):
    db.execute("INSERT INTO atomic_audit(actor,action,detail_json,time_utc) VALUES(?,?,?,?)",
               (actor,action,dump(details),stamp()))

def init(db):
    sources=raw_sources()
    db.executescript(SCHEMA)
    with db:
        for key,raw in sources.items():
            db.execute("INSERT OR IGNORE INTO atomic_originals VALUES(?,?,?)",
                       (key,sha(raw),sqlite3.Binary(raw)))
    return {"source_versions":db.execute("SELECT COUNT(*) FROM atomic_originals").fetchone()[0],
            "hives":db.execute("SELECT COUNT(*) FROM atomic_hives").fetchone()[0]}

def hive_key(atom_label):
    if not isinstance(atom_label,str) or not atom_label.strip() or len(atom_label.encode("utf-8"))>MAX_ATOM_LABEL_BYTES:
        raise ValueError("Atom label must be 1–256 UTF-8 bytes")
    return "NATHAN-ATOM-"+sha(atom_label)[:24]

def create_hive(db,atom_label,codex_version="atomic-1332",owner_yes=False):
    if owner_yes is not True:
        raise PermissionError("Owner YES required to add a sovereign atomic hive")
    if codex_version not in CODEX_SIZES:
        raise ValueError("Unknown source codex version")
    name=hive_key(atom_label)
    existing=db.execute("SELECT codex_version FROM atomic_hives WHERE hive_id=?", (name,)).fetchone()
    if existing:
        if existing[0]!=codex_version:
            raise ValueError("NO CRUSH: cannot replace a hive's original codex version")
        return {"hive_id":name,"created":False,"codex_version":codex_version}
    blueprint=core.blueprint()["blueprint_sha256"]
    root=sha(dump({"source_1332":sha(raw_sources()["atomic-1332-as-supplied"]),
                   "source_2272":sha(raw_sources()["uploaded-2272-partial"]),
                   "inherited_parent":blueprint,"codex_version":codex_version}))
    with db:
        db.execute("INSERT INTO atomic_hives VALUES(?,?,?,?,?,?,0)",
                   (name,atom_label,codex_version,CODEX_SIZES[codex_version],
                    ATOMIC_BEES_PER_HIVE,root))
        log(db,name,"hive_created",{"codex_version":codex_version,
                                    "bee_capacity":ATOMIC_BEES_PER_HIVE})
    return {"hive_id":name,"created":True,"codex_version":codex_version,
            "blueprint_sha256":root}

def hive_record(db,hive_id):
    row=db.execute("SELECT hive_id,codex_version,codex_size,bee_capacity,blueprint_sha256,owner_paused "
                   "FROM atomic_hives WHERE hive_id=?", (hive_id,)).fetchone()
    if not row:
        raise KeyError("Hive not created by owner")
    return dict(zip(("hive_id","codex_version","codex_size","bee_capacity",
                     "blueprint_sha256","owner_paused"),row))

def address(db,hive_id,bee_ordinal):
    hive=hive_record(db,hive_id)
    value=str(bee_ordinal)
    if not re.fullmatch(r"[1-9]\d{0,4}",value):
        raise ValueError("Bee ordinal must be canonical 1..50000")
    num=int(value)
    if num>ATOMIC_BEES_PER_HIVE:
        raise ValueError("No bee ordinal above 50000")
    ident=hive_id+"/BEE/"+str(num)
    return {
        "bee_id":ident,"hive_id":hive_id,"ordinal":num,
        "identity_sha256":sha(ident),
        "codex_version":hive["codex_version"],
        "complete_inherited_unit_addresses":hive["codex_size"],
        "blueprint_sha256":hive["blueprint_sha256"],
        "allocated_process":False,
        "individual_sovereignty":"owner-controlled state, independent veto, isolated namespace",
    }

def check_master_veto(db):
    if db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='swarm_controls'").fetchone():
        state=db.execute("SELECT value FROM swarm_controls WHERE key='owner_veto'").fetchone()
        if state and state[0]=="1":
            raise PermissionError("Master SWARM veto blocks atomic-hive work")

def activate(db,hive_id,ordinal,owner_yes=False):
    if owner_yes is not True:
        raise PermissionError("Explicit owner YES required for bee activation")
    check_master_veto(db)
    v=address(db,hive_id,ordinal)
    hive=hive_record(db,hive_id)
    if hive["owner_paused"]:
        raise PermissionError("The atomic hive is paused")
    original=db.execute("SELECT sovereign_veto FROM atomic_bees WHERE bee_id=?",
                        (v["bee_id"],)).fetchone()
    if original:
        return {**v,"activated":False,"individual_veto":bool(original[0])}
    if db.execute("SELECT COUNT(*) FROM atomic_bees").fetchone()[0]>=LOCAL_MATERIALIZATION_LIMIT:
        raise RuntimeError("Bounded local activation limit reached; addresses remain available")
    with db:
        db.execute("INSERT INTO atomic_bees VALUES(?,?,?,?,0,?)",
                   (hive_id,v["ordinal"],v["bee_id"],v["identity_sha256"],
                    v["blueprint_sha256"]))
        log(db,v["bee_id"],"bee_activated",{"owner_yes":True})
    return {**v,"activated":True,"individual_veto":False}

def get_bee(db,bee_id):
    row=db.execute("SELECT h.hive_id,h.codex_version,h.codex_size,h.blueprint_sha256,"
                   "h.owner_paused,b.sovereign_veto,b.identity_sha256,b.inherited_blueprint_sha256 "
                   "FROM atomic_bees b JOIN atomic_hives h ON h.hive_id=b.hive_id "
                   "WHERE b.bee_id=?", (bee_id,)).fetchone()
    if not row:
        raise KeyError("Bee has not been individually activated")
    b=dict(zip(("hive_id","codex_version","units","hive_blueprint","owner_paused",
                "individual_veto","identity_sha256","inherited_blueprint"),row))
    if b["hive_blueprint"]!=b["inherited_blueprint"]:
        raise ValueError("NO CRUSH: inherited bee blueprint changed")
    return b

def allow(db,bee_id):
    check_master_veto(db)
    b=get_bee(db,bee_id)
    if b["owner_paused"] or b["individual_veto"]:
        raise PermissionError("Hive owner pause or sovereign bee veto")
    return b

def capability(db,bee_id,unit):
    b=get_bee(db,bee_id)
    number=int(unit)
    if not 1<=number<=b["units"]:
        raise ValueError("Unit outside the chosen version; zero-slide boundary enforced")
    result={"bee_id":bee_id,"codex_version":b["codex_version"],"unit":number,
            "inherited_slot":True,
            "actual_independently_running_agent":False,
            "name_evidence":"not_in_current_source",
            "author_raw_name_fragments":[]}
    if b["codex_version"]=="expanded-2272":
        occurrences=parse_attachment()["role_references"].get(number,[])
        if occurrences:
            result["name_evidence"]="raw_number_occurrences_in_partial_attachment"
            result["author_raw_name_fragments"]=[x["raw_fragment"] for x in occurrences]
    if b["codex_version"]=="atomic-1332" and 1233<=number<=1332:
        result["source_named_block"]="Epistemic Discernment Council (author-supplied 1332 version)"
    return result

def observe(db,bee_id,text):
    allow(db,bee_id)
    if not isinstance(text,str) or not text.strip() or len(text.encode("utf-8"))>1024:
        raise ValueError("Observation must be 1–1024 UTF-8 bytes")
    with db:
        n=db.execute("SELECT COALESCE(MAX(sequence),0)+1 FROM atomic_bee_memory "
                     "WHERE bee_id=?", (bee_id,)).fetchone()[0]
        db.execute("INSERT INTO atomic_bee_memory VALUES(?,?,?)",(bee_id,n,text))
        db.execute("DELETE FROM atomic_bee_memory WHERE bee_id=? AND sequence<=?",
                   (bee_id,n-16))
        log(db,bee_id,"observe",{"sequence":n})
    return {"bee_id":bee_id,"observation_number":n}

def propose(db,bee_id,unit,task_kind,text):
    b=allow(db,bee_id)
    number=int(unit)
    if number<1 or number>b["units"]:
        raise ValueError("Unit outside chosen codex")
    if task_kind not in ALLOWED_TASKS:
        raise ValueError("Only bounded local deterministic tasks allowed")
    if not isinstance(text,str) or len(text.encode("utf-8"))>16384:
        raise ValueError("Task exceeds 16KB")
    ident=uuid.uuid4().hex
    with db:
        db.execute("INSERT INTO atomic_jobs VALUES(?,?,?,?,?,'proposed',NULL)",
                   (ident,bee_id,number,task_kind,text))
        log(db,bee_id,"propose",{"job":ident,"unit":number,"kind":task_kind})
    return {"job":ident,"bee_id":bee_id,"state":"proposed"}

def task(db,bee_id,job_id):
    row=db.execute("SELECT codex_unit,task_kind,input_text,state,result_json "
                   "FROM atomic_jobs WHERE job_id=? AND bee_id=?", (job_id,bee_id)).fetchone()
    if not row:
        raise KeyError("No task in this bee's independent namespace")
    return dict(zip(("unit","kind","text","state","result"),row))

def approve(db,bee_id,job_id,owner_yes=False):
    allow(db,bee_id)
    if owner_yes is not True:
        raise PermissionError("Individual task requires fresh owner YES")
    item=task(db,bee_id,job_id)
    if item["state"]!="proposed":
        raise ValueError("Task must be proposed before approval")
    with db:
        db.execute("UPDATE atomic_jobs SET state='owner_approved' "
                   "WHERE job_id=? AND bee_id=?", (job_id,bee_id))
        log(db,bee_id,"approve",{"job":job_id})
    return {"job":job_id,"state":"owner_approved"}

def execute(db,bee_id,job_id):
    allow(db,bee_id)
    item=task(db,bee_id,job_id)
    if item["state"]!="owner_approved":
        raise PermissionError("Owner approval required")
    if item["kind"]=="sha256":
        result={"sha256":sha(item["text"])}
    else:
        result={"line_count":len(item["text"].splitlines())}
    with db:
        db.execute("UPDATE atomic_jobs SET state='completed',result_json=? "
                   "WHERE job_id=? AND bee_id=?", (dump(result),job_id,bee_id))
        log(db,bee_id,"execute",{"job":job_id,"external_actions":0})
    return {"job":job_id,"bee_id":bee_id,"result":result,
            "state":"completed","independent_llm_processes_started":0}

def veto(db,bee_id):
    get_bee(db,bee_id)
    with db:
        db.execute("UPDATE atomic_bees SET sovereign_veto=1 WHERE bee_id=?", (bee_id,))
        db.execute("UPDATE atomic_jobs SET state='vetoed' "
                   "WHERE bee_id=? AND state IN ('proposed','owner_approved')",(bee_id,))
        log(db,bee_id,"veto",{"queen_override":False})
    return {"bee_id":bee_id,"individual_veto":True}

def inspect(db,bee_id):
    b=get_bee(db,bee_id)
    memories=db.execute("SELECT sequence,owner_text FROM atomic_bee_memory "
                        "WHERE bee_id=? ORDER BY sequence",(bee_id,)).fetchall()
    tasks=db.execute("SELECT job_id,codex_unit,state FROM atomic_jobs "
                     "WHERE bee_id=? ORDER BY rowid",(bee_id,)).fetchall()
    return {"bee_id":bee_id,
            "codex_version":b["codex_version"],
            "full_inherited_unit_count":b["units"],
            "identity_sha256":b["identity_sha256"],
            "individual_veto":bool(b["individual_veto"]),
            "memory":[{"sequence":n,"text":t} for n,t in memories],
            "tasks":[{"job":j,"unit":u,"state":state} for j,u,state in tasks]}

def create_guild(db,origin_hive,name,owner_yes=False):
    if owner_yes is not True:
        raise PermissionError("Explicit owner YES required for a local molecular guild")
    check_master_veto(db)
    hive_record(db,origin_hive)
    if not isinstance(name,str) or not name.strip() or len(name.encode("utf-8"))>100:
        raise ValueError("Guild name must be 1–100 bytes")
    guild_id="NATHAN-GUILD-"+uuid.uuid4().hex
    with db:
        db.execute("INSERT INTO atomic_guilds VALUES(?,?,?)",(guild_id,name,origin_hive))
        db.execute("INSERT INTO atomic_guild_members VALUES(?,?,1)",(guild_id,origin_hive))
        log(db,origin_hive,"guild_created",{"guild":guild_id,"consent":True})
    return {"guild_id":guild_id,"members":1,"physical_consensus_claim":False}

def join_guild(db,guild_id,hive_id,owner_yes=False):
    if owner_yes is not True:
        raise PermissionError("Explicit consent required for each joining hive")
    check_master_veto(db)
    hive_record(db,hive_id)
    if not db.execute("SELECT 1 FROM atomic_guilds WHERE guild_id=?",(guild_id,)).fetchone():
        raise KeyError("Guild does not exist")
    with db:
        db.execute("INSERT OR IGNORE INTO atomic_guild_members VALUES(?,?,1)",(guild_id,hive_id))
        log(db,hive_id,"guild_joined",{"guild":guild_id,"owner_yes":True})
    members=db.execute("SELECT COUNT(*) FROM atomic_guild_members WHERE guild_id=?",
                       (guild_id,)).fetchone()[0]
    return {"guild_id":guild_id,"members":members,
            "network_actions":0,"real_molecular_bond_detected":False}

def status(path):
    p=Path(path)
    if not p.is_file():
        return {"schema":VERSION,"initialized":False}
    with sqlite3.connect(p.as_uri()+"?mode=ro",uri=True) as db:
        if not db.execute("SELECT 1 FROM sqlite_master WHERE type='table' "
                          "AND name='atomic_hives'").fetchone():
            return {"schema":VERSION,"initialized":False}
        return {
            "schema":VERSION,"initialized":True,
            "source_original_versions":db.execute("SELECT COUNT(*) FROM atomic_originals").fetchone()[0],
            "atomic_hives_initialized":db.execute("SELECT COUNT(*) FROM atomic_hives").fetchone()[0],
            "individual_bees_activated":db.execute("SELECT COUNT(*) FROM atomic_bees").fetchone()[0],
            "tasks_completed":db.execute("SELECT COUNT(*) FROM atomic_jobs WHERE state='completed'").fetchone()[0],
            "guilds":db.execute("SELECT COUNT(*) FROM atomic_guilds").fetchone()[0],
            "actual_external_llm_agents":0,
            "hive_capacity_per_atom":ATOMIC_BEES_PER_HIVE,
            "no_crush_originals":True,
            "sqlite_integrity":db.execute("PRAGMA quick_check").fetchone()[0],
        }

def main():
    p=argparse.ArgumentParser(description="NATHAN AI ONE - no-crush Atomic Hive")
    p.add_argument("--db",required=True)
    p.add_argument("--approve-write",action="store_true")
    p.add_argument("--owner-yes",action="store_true")
    p.add_argument("--atom",help="Owner-chosen atom label")
    p.add_argument("--hive",help="Stable hive_id from create-hive")
    p.add_argument("--version",default="atomic-1332",choices=tuple(CODEX_SIZES))
    p.add_argument("--bee",help="1 through 50000 for bee address or activate; bee_id for work")
    p.add_argument("--unit",type=int)
    p.add_argument("--task",choices=ALLOWED_TASKS)
    p.add_argument("--text",default="")
    p.add_argument("--job")
    p.add_argument("--guild")
    p.add_argument("--atoms",default="1",help="Positive decimal count of hypothetical atom hives")
    p.add_argument("command",choices=(
        "summary","coverage","conflicts","scenarios","counts","status",
        "bootstrap","create-hive","address","activate","capability",
        "observe","propose","approve","execute","veto","inspect",
        "create-guild","join-guild"))
    args=p.parse_args()
    if args.command=="summary":
        data=parse_attachment()
        result={k:v for k,v in data.items() if k not in ("families","role_references","missing_new_ids")}
    elif args.command=="coverage":
        result=parse_attachment()
    elif args.command=="conflicts":
        result=conflicts()
    elif args.command=="scenarios":
        result=source_scenarios()
    elif args.command=="counts":
        result=counts(args.version,args.atoms)
    elif args.command=="status":
        result=status(args.db)
    elif args.command in ("address","capability","inspect"):
        with sqlite3.connect(Path(args.db).as_uri()+"?mode=ro",uri=True) as db:
            if args.command=="address":
                result=address(db,args.hive,args.bee)
            elif args.command=="capability":
                result=capability(db,args.bee,args.unit)
            else:
                result=inspect(db,args.bee)
    else:
        if not args.approve_write:
            p.error("NO CRUSH: database mutation requires --approve-write")
        with core.open_main(args.db) as db:
            init(db)
            if args.command=="bootstrap": result={"initialized":True,**status(args.db)}
            elif args.command=="create-hive":
                result=create_hive(db,args.atom,args.version,args.owner_yes)
            elif args.command=="activate":
                result=activate(db,args.hive,args.bee,args.owner_yes)
            elif args.command=="observe":result=observe(db,args.bee,args.text)
            elif args.command=="propose":
                result=propose(db,args.bee,args.unit,args.task,args.text)
            elif args.command=="approve":
                result=approve(db,args.bee,args.job,args.owner_yes)
            elif args.command=="execute":
                result=execute(db,args.bee,args.job)
            elif args.command=="veto":
                result=veto(db,args.bee)
            elif args.command=="create-guild":
                result=create_guild(db,args.hive,args.text,args.owner_yes)
            elif args.command=="join-guild":
                result=join_guild(db,args.guild,args.hive,args.owner_yes)
            else:raise ValueError("Unknown command")
    print(json.dumps(result,indent=2,ensure_ascii=False,sort_keys=True))

if __name__=="__main__":
    main()
