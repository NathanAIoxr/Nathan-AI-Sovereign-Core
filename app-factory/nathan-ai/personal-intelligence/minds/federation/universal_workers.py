#!/usr/bin/env python3
"""NATHAN AI — ONE DATABASE FEDERATION v074 / Universal Worker Invitation Runtime.

All source-defined identities and every AI/non-AI, node/non-node classification
are addressable through lazy ranges. The scheduled worker is a bounded,
source-preserving, deterministic audit. No billions of processes are spawned.
No remote system is accessed without a separately configured, authorized adapter.
"""
from __future__ import annotations
import argparse
from contextlib import closing
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sqlite3
import time

from federation import open_main, audit

VERSION = "nathan.one.federation.v074.universal-workers.v1"
NAMESPACES = (
    ("omni_god", 0, 125_999_999_999, "omni-god/engine.js; source-defined virtual address range"),
    ("supernodes", 1, 732_000_000, "supernodes/engine.js; NT-1..NT-732000000; distinct from catalog zero-based notation"),
)
CATEGORIES = ("ai_node", "non_ai_node", "node", "non_node")
SCOPES = ("system", "non_system", "database", "non_database")
MAX_BATCH = 64
MAX_CATALOG_BYTES = 8_000_000
MAX_DISCOVER = 10_000

SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS universal_namespaces (
 namespace TEXT PRIMARY KEY, first_id INTEGER NOT NULL, last_id INTEGER NOT NULL,
 origin TEXT NOT NULL, CHECK(last_id >= first_id), CHECK(first_id >= 0)
);
CREATE TABLE IF NOT EXISTS universal_invitations (
 namespace TEXT NOT NULL REFERENCES universal_namespaces(namespace),
 category TEXT NOT NULL, scope TEXT NOT NULL, cursor_id INTEGER NOT NULL,
 participation TEXT NOT NULL DEFAULT 'all_eligible',
 external_adapter TEXT NOT NULL DEFAULT 'not_connected',
 PRIMARY KEY(namespace,category,scope)
);
CREATE TABLE IF NOT EXISTS universal_catalog_snapshots (
 sha256 TEXT PRIMARY KEY, source_name TEXT NOT NULL, item_count INTEGER NOT NULL,
 byte_count INTEGER NOT NULL, indexed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS universal_role_templates (
 catalog_sha256 TEXT NOT NULL REFERENCES universal_catalog_snapshots(sha256),
 role_id TEXT NOT NULL, display_name TEXT NOT NULL, role_type TEXT NOT NULL,
 source_status TEXT NOT NULL, record_sha256 TEXT NOT NULL,
 PRIMARY KEY(catalog_sha256,role_id)
);
CREATE TABLE IF NOT EXISTS universal_public_modules (
 module_path TEXT PRIMARY KEY, content_sha256 TEXT NOT NULL, source_family TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS universal_control (
 id INTEGER PRIMARY KEY CHECK(id=1), paused INTEGER NOT NULL DEFAULT 0,
 next_invitation INTEGER NOT NULL DEFAULT 0,
 CHECK(paused IN(0,1)), CHECK(next_invitation>=0)
);
CREATE TABLE IF NOT EXISTS universal_cycles (
 id INTEGER PRIMARY KEY AUTOINCREMENT, started_at TEXT NOT NULL,
 completed_at TEXT, state TEXT NOT NULL, invited_groups INTEGER NOT NULL,
 roles_checked INTEGER NOT NULL, modules_indexed INTEGER NOT NULL,
 sampled_addresses INTEGER NOT NULL DEFAULT 0,
 source_hash_errors INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS universal_job_results (
 cycle_id INTEGER NOT NULL REFERENCES universal_cycles(id),
 namespace TEXT NOT NULL, category TEXT NOT NULL, scope TEXT NOT NULL,
 sampled_address INTEGER NOT NULL, operation TEXT NOT NULL,
 outcome TEXT NOT NULL, finished_at TEXT NOT NULL,
 PRIMARY KEY(cycle_id,namespace,category,scope)
);
CREATE INDEX IF NOT EXISTS universal_jobs_by_scope ON universal_job_results(scope,category);
"""

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def utc() -> str:
    return datetime.now(timezone.utc).isoformat()

def open_universal(db: str | Path) -> sqlite3.Connection:
    con = open_main(db)
    con.executescript(SCHEMA)
    con.execute("INSERT OR IGNORE INTO universal_control(id) VALUES(1)")
    con.commit()
    return con

def bootstrap(con: sqlite3.Connection) -> dict:
    """Every category is eligible at every logical address in every namespace."""
    with con:
        for name, first, last, source in NAMESPACES:
            con.execute("INSERT OR IGNORE INTO universal_namespaces VALUES(?,?,?,?)",
                        (name,first,last,source))
            current=con.execute("SELECT first_id,last_id FROM universal_namespaces WHERE namespace=?",(name,)).fetchone()
            if current != (first,last):
                raise ValueError("Original namespace bounds changed; manual provenance review required")
            for category in CATEGORIES:
                for scope in SCOPES:
                    con.execute("""INSERT OR IGNORE INTO universal_invitations
                      (namespace,category,scope,cursor_id) VALUES(?,?,?,?)""",
                      (name,category,scope,first))
        audit(con,"UniversalDispatcher","coverage_registered",{
            "namespaces":len(NAMESPACES),"categories":list(CATEGORIES),"scopes":list(SCOPES),
            "invitation_groups":len(NAMESPACES)*len(CATEGORIES)*len(SCOPES),
            "virtual_addresses":sum(last-first+1 for _,first,last,_ in NAMESPACES)})
    return stats(con)

def seed_roles(con: sqlite3.Connection, catalog: str | Path) -> dict:
    """Owner-selected PUBLIC catalog only; preserve source-digest editions."""
    path=Path(catalog)
    if path.is_symlink() or not path.is_file():
        raise ValueError("Catalog must be a regular non-symlink file")
    if path.stat().st_size>MAX_CATALOG_BYTES:
        raise ValueError("Catalog exceeds 8 MB")
    data=path.read_bytes()
    parsed=json.loads(data.decode("utf-8"))
    if not isinstance(parsed,dict) or not isinstance(parsed.get("minds"),list):
        raise ValueError("Catalog must be a source-defined minds array")
    minds=parsed["minds"]
    if len(minds)>MAX_DISCOVER:
        raise ValueError("More than 10,000 roles require an explicit expanded policy")
    seen=set()
    for m in minds:
        if not isinstance(m,dict) or any(not isinstance(m.get(k),str) or not m[k].strip() for k in ("id","name","type")):
            raise ValueError("Every role must preserve a nonblank id, name and type")
        if m["id"] in seen:
            raise ValueError("Duplicate mind ID in supplied catalog")
        seen.add(m["id"])
    source_sha=digest(data)
    with con:
        con.execute("""INSERT OR IGNORE INTO universal_catalog_snapshots VALUES(?,?,?,?,?)""",
            (source_sha,path.name,len(minds),len(data),utc()))
        for m in minds:
            original=json.dumps(m,sort_keys=True,ensure_ascii=False,separators=(",",":")).encode("utf-8")
            con.execute("""INSERT OR IGNORE INTO universal_role_templates VALUES(?,?,?,?,?,?)""",
                (source_sha,m["id"],m["name"],m["type"],str(m.get("status","source-defined")),digest(original)))
        audit(con,"UniversalDispatcher","role_catalog_invited",
              {"source_sha256":source_sha,"registered_roles":len(minds),"source_type":"public metadata"})
    return {"catalog_sha256":source_sha,"roles":len(minds),"original_catalog_untouched":path.read_bytes()==data}

def discover_public(con: sqlite3.Connection, root: str | Path) -> dict:
    """Index all owner-selected public app entry points, without executing code."""
    root=Path(root)
    if root.is_symlink() or not root.is_dir():
        raise ValueError("Public module root must be a regular directory")
    resolved=root.resolve(strict=True)
    entries=sorted(resolved.rglob("index.html"))
    if len(entries)>MAX_DISCOVER:
        raise ValueError("Public source discovery exceeds policy limit")
    inserted=0
    with con:
        for path in entries:
            if path.is_symlink() or not path.is_file() or path.stat().st_size>2_000_000:
                continue
            rel=path.relative_to(resolved).as_posix()
            if any(part.startswith(".") for part in Path(rel).parts):
                continue
            h=digest(path.read_bytes())
            before=con.total_changes
            con.execute("INSERT OR IGNORE INTO universal_public_modules VALUES(?,?,?)",
                        (rel,h,"public-app-entrypoint"))
            inserted+=int(con.total_changes>before)
        audit(con,"UniversalDispatcher","public_module_discovery",
              {"root_label":root.name,"discovered":len(entries),"new_entries":inserted})
    return {"candidate_entrypoints":len(entries),"added":inserted}

def inspect(con: sqlite3.Connection, namespace: str, address: str) -> dict:
    if not address.isdecimal() or len(address)>15:
        raise ValueError("Provide an ordinary whole-number virtual address")
    row=con.execute("SELECT first_id,last_id,origin FROM universal_namespaces WHERE namespace=?",(namespace,)).fetchone()
    if row is None: raise ValueError("Unknown namespace")
    n=int(address)
    if not row[0]<=n<=row[1]: raise ValueError("Virtual address outside source-defined bounds")
    return {"namespace":namespace,"address":n,"categories":list(CATEGORIES),
            "scopes":list(SCOPES),"all_invited":True,"physical_process_started":False,
            "source":row[2],"permission":"No remote access; owner authorizes each external adapter"}

def _integrity(con: sqlite3.Connection) -> tuple[int,int]:
    checked=0;bad=0
    for original,h in con.execute("SELECT exact_source_text,content_sha256 FROM federation_records"):
        checked+=1
        if digest(original.encode("utf-8"))!=h: bad+=1
    return checked,bad

def _role_count(con: sqlite3.Connection) -> int:
    row=con.execute("SELECT sha256 FROM universal_catalog_snapshots ORDER BY indexed_at DESC,sha256 DESC LIMIT 1").fetchone()
    if row is None:return 0
    rows=con.execute("SELECT role_id,display_name,role_type,source_status,record_sha256 "
                     "FROM universal_role_templates WHERE catalog_sha256=?",(row[0],)).fetchall()
    for role_id,name,role_type,source_status,source_hash in rows:
        if not all(isinstance(v,str) and v.strip() for v in (role_id,name,role_type,source_status)):
            raise ValueError("Registered role metadata is incomplete")
        if len(source_hash)!=64 or any(c not in "0123456789abcdef" for c in source_hash):
            raise ValueError("Registered source role digest invalid")
    return len(rows)

def stats(con: sqlite3.Connection) -> dict:
    n=con.execute("SELECT COUNT(*) FROM universal_invitations").fetchone()[0]
    latest=con.execute("SELECT id,started_at,sampled_addresses,source_hash_errors FROM universal_cycles ORDER BY id DESC LIMIT 1").fetchone()
    paused=con.execute("SELECT paused FROM universal_control WHERE id=1").fetchone()
    return {"schema":VERSION,
            "virtual_id_capacity":sum(last-first+1 for _,first,last,_ in NAMESPACES),
            "omni_virtual_ids":126_000_000_000,
            "supernode_virtual_ids":732_000_000,
            "coverage_groups":n,
            "expected_groups":len(NAMESPACES)*len(CATEGORIES)*len(SCOPES),
            "catalog_roles":_role_count(con),
            "public_app_entrypoints":con.execute("SELECT COUNT(*) FROM universal_public_modules").fetchone()[0],
            "sampled_worker_tasks_total":con.execute("SELECT COUNT(*) FROM universal_job_results").fetchone()[0],
            "paused":bool(paused[0]) if paused else False,
            "latest_cycle":latest[0] if latest else None,
            "latest_cycle_sampled":latest[2] if latest else 0,
            "latest_cycle_hash_errors":latest[3] if latest else 0,
            "operational_state":"bounded local tasks; virtual identities are not 126B active processes",
            "unconnected_scopes":["non_system","non_database","external providers"]}

def run_once(con: sqlite3.Connection, budget=32) -> dict:
    if not isinstance(budget,int) or not 1<=budget<=MAX_BATCH:
        raise ValueError("Cycle task budget must be between 1 and 64")
    bootstrap(con)
    if con.execute("SELECT paused FROM universal_control WHERE id=1").fetchone()[0]:
        return {"status":"paused",**stats(con)}
    # Owner-visible exception; never let a corrupt source silently look verified.
    checked,bad=_integrity(con)
    if bad: raise ValueError(f"Federation source integrity failures: {bad} / {checked}")
    invitations=con.execute(
      "SELECT i.namespace,i.category,i.scope,i.cursor_id,n.first_id,n.last_id "
      "FROM universal_invitations i JOIN universal_namespaces n ON n.namespace=i.namespace "
      "ORDER BY i.namespace,i.category,i.scope").fetchall()
    if not invitations: raise ValueError("No virtual invitation groups registered")
    offset=con.execute("SELECT next_invitation FROM universal_control WHERE id=1").fetchone()[0]
    selection=[invitations[(offset+j)%len(invitations)] for j in range(min(budget,len(invitations)))]
    count=0; roles=_role_count(con);modules=con.execute("SELECT COUNT(*) FROM universal_public_modules").fetchone()[0]
    with con:
        cur=con.execute("INSERT INTO universal_cycles(started_at,state,invited_groups,roles_checked,modules_indexed,source_hash_errors) "
                        "VALUES(?,?,?,?,?,?)",
                        (utc(),"running",len(invitations),roles,modules,bad))
        cycle_id=cur.lastrowid
        for ns,category,scope,position,first,last in selection:
            sampled=position
            con.execute("INSERT INTO universal_job_results VALUES(?,?,?,?,?,?,?,?)",
                        (cycle_id,ns,category,scope,sampled,"source-integrity-and-virtual-coverage",
                         "verified_local_metadata_only",utc()))
            con.execute(
               "UPDATE universal_invitations SET cursor_id=? WHERE namespace=? AND category=? AND scope=?",
               (first if position>=last else position+1,ns,category,scope))
            count+=1
        con.execute("UPDATE universal_control SET next_invitation=? WHERE id=1",((offset+count)%len(invitations),))
        con.execute("UPDATE universal_cycles SET completed_at=?,state=?,sampled_addresses=? WHERE id=?",
                    (utc(),"completed",count,cycle_id))
        audit(con,"UniversalDispatcher","bounded_cycle",{
            "cycle":cycle_id,"coverage_groups":len(invitations),"jobs":count,
            "catalog_roles_checked":roles,"public_modules":modules,
            "federation_records_sha256_checked":checked,"hash_failures":bad,
            "non_system_non_database":"logical participation only; external adapters not connected"})
    return {"status":"completed","cycle_id":cycle_id,"tasks":count,"roles_checked":roles,
            "modules_checked":modules,"federation_originals_checked":checked,
            "original_hash_failures":bad,"logical_coverage_groups":len(invitations),
            "billions_of_processes_started":False}

def serve(con: sqlite3.Connection, interval: int, max_cycles: int, budget: int) -> dict:
    if not 5<=interval<=86400 or max_cycles<0:
        raise ValueError("Interval 5..86400 seconds; max-cycles >= 0")
    n=0
    try:
        while max_cycles==0 or n<max_cycles:
            result=run_once(con,budget)
            if result.get("status")=="paused":break
            n+=1
            if max_cycles==0 or n<max_cycles:
                time.sleep(interval)
    except KeyboardInterrupt:
        return {"stopped":"operator interrupt","completed_cycles":n}
    return {"stopped":"paused or completed configured cycles","completed_cycles":n}

def main() -> None:
    p=argparse.ArgumentParser(description="NATHAN AI universal invitations + bounded worker runtime")
    p.add_argument("--db",default="ONE_Federation_Master.sqlite3")
    sub=p.add_subparsers(dest="command",required=True)
    init=sub.add_parser("bootstrap")
    init.add_argument("--catalog",default="")
    init.add_argument("--public-root",default="")
    once=sub.add_parser("once");once.add_argument("--budget",type=int,default=32)
    start=sub.add_parser("serve")
    start.add_argument("--interval",type=int,default=60)
    start.add_argument("--max-cycles",type=int,default=1)
    start.add_argument("--budget",type=int,default=32)
    view=sub.add_parser("inspect");view.add_argument("namespace");view.add_argument("address")
    sub.add_parser("status");sub.add_parser("pause");sub.add_parser("resume")
    a=p.parse_args()
    with closing(open_universal(a.db)) as con:
        if a.command=="bootstrap":
            res=bootstrap(con)
            if a.catalog:res["catalog_ingestion"]=seed_roles(con,a.catalog)
            if a.public_root:res["public_modules"]=discover_public(con,a.public_root)
            res=stats(con) | {"bootstrap":res}
        elif a.command=="once":res=run_once(con,a.budget)
        elif a.command=="serve":res=serve(con,a.interval,a.max_cycles,a.budget)
        elif a.command=="inspect":res=inspect(con,a.namespace,a.address)
        elif a.command in ("pause","resume"):
            with con:
                con.execute("UPDATE universal_control SET paused=? WHERE id=1",(int(a.command=="pause"),))
                audit(con,"Owner","runtime_"+a.command,{"all_invitations_remain_indexed":True})
            res=stats(con)
        else:res=stats(con)
        print(json.dumps(res,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
