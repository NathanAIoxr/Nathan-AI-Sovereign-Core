#!/usr/bin/env python3
"""NATHAN AI — ONE DATABASE FEDERATION v074 · Ancient Minds adapter.

Additive, offline, owner-directed reference implementation. Exact source bytes
are stored in a separate, append-only internal SQLite family; derived analysis
is review-only. No model calls, PostgreSQL deployment or private cloud access.
"""
from __future__ import annotations

import argparse
from contextlib import closing
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sqlite3

from federation import open_main, audit

VERSION = "NATHAN AI — ONE DATABASE FEDERATION v074"
WORKERS = (
    "Sumerian Scribe", "Babylonian Mathematician", "Egyptian Keeper of Names",
    "Indian Grammarian", "Chronologist", "House of Wisdom Scholar",
)
UNASSIGNED_SLOTS = 4
CERO = {"0.0": "0 · LA · AL", "1.0": "1 · EL · LE", "2.0": "2 · proposed connection"}
TABLES = (
    "originals", "source_references", "languages", "phonetics", "timelines",
    "knowledge_records", "claims", "evidence", "relationships", "cero_uno_dos",
    "duo_codes", "worker_jobs", "worker_runs", "embeddings",
)
DDL = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS ancient_originals (
 source_id TEXT PRIMARY KEY REFERENCES federation_sources(source_id),
 original_bytes BLOB NOT NULL, sha256 TEXT NOT NULL, filename TEXT NOT NULL,
 provenance TEXT NOT NULL, imported_at TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS ancient_originals_no_update BEFORE UPDATE ON ancient_originals
 BEGIN SELECT RAISE(ABORT,'Ancient original bytes are append-only'); END;
CREATE TRIGGER IF NOT EXISTS ancient_originals_no_delete BEFORE DELETE ON ancient_originals
 BEGIN SELECT RAISE(ABORT,'Ancient original bytes are append-only'); END;
CREATE TABLE IF NOT EXISTS ancient_source_references (
 id INTEGER PRIMARY KEY, source_id TEXT NOT NULL REFERENCES ancient_originals(source_id),
 title TEXT NOT NULL, locator TEXT NOT NULL, reviewed INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS ancient_languages (
 id INTEGER PRIMARY KEY, language_code TEXT UNIQUE NOT NULL,
 language_name TEXT NOT NULL, status TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ancient_phonetics (
 id INTEGER PRIMARY KEY, source_id TEXT NOT NULL REFERENCES ancient_originals(source_id),
 written_form TEXT NOT NULL, language_code TEXT, ipa TEXT,
 annotation TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'unverified',
 UNIQUE(source_id,written_form)
);
CREATE TABLE IF NOT EXISTS ancient_timelines (
 id INTEGER PRIMARY KEY, source_id TEXT NOT NULL REFERENCES ancient_originals(source_id),
 period_label TEXT NOT NULL, assertion TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'unverified', UNIQUE(source_id,period_label)
);
CREATE TABLE IF NOT EXISTS ancient_knowledge_records (
 id INTEGER PRIMARY KEY, source_id TEXT NOT NULL REFERENCES ancient_originals(source_id),
 role TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
 kind TEXT NOT NULL, reviewed INTEGER NOT NULL DEFAULT 0,
 UNIQUE(source_id,role,title)
);
CREATE TABLE IF NOT EXISTS ancient_claims (
 id INTEGER PRIMARY KEY, source_id TEXT NOT NULL REFERENCES ancient_originals(source_id),
 claim_text TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'unverified',
 UNIQUE(source_id,claim_text)
);
CREATE TABLE IF NOT EXISTS ancient_evidence (
 id INTEGER PRIMARY KEY, claim_id INTEGER NOT NULL REFERENCES ancient_claims(id),
 reference_id INTEGER NOT NULL REFERENCES ancient_source_references(id),
 quote TEXT, assessment TEXT NOT NULL DEFAULT 'needs_review'
);
CREATE TABLE IF NOT EXISTS ancient_relationships (
 id INTEGER PRIMARY KEY, source_id TEXT NOT NULL REFERENCES ancient_originals(source_id),
 left_record_id INTEGER NOT NULL REFERENCES ancient_knowledge_records(id),
 right_record_id INTEGER NOT NULL REFERENCES ancient_knowledge_records(id),
 relation_type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'proposed',
 rationale TEXT NOT NULL, CHECK(left_record_id <> right_record_id),
 UNIQUE(source_id,left_record_id,right_record_id,relation_type)
);
CREATE TABLE IF NOT EXISTS ancient_cero_uno_dos (
 id INTEGER PRIMARY KEY, source_id TEXT NOT NULL REFERENCES ancient_originals(source_id),
 knowledge_id INTEGER REFERENCES ancient_knowledge_records(id),
 tier TEXT NOT NULL CHECK(tier IN ('0.0','1.0','2.0')),
 label TEXT NOT NULL, owner_reviewed INTEGER NOT NULL DEFAULT 0,
 UNIQUE(source_id,knowledge_id,tier)
);
CREATE TABLE IF NOT EXISTS ancient_duo_codes (
 id INTEGER PRIMARY KEY, source_id TEXT NOT NULL REFERENCES ancient_originals(source_id),
 decimal_value INTEGER NOT NULL CHECK(decimal_value >= 0), base INTEGER NOT NULL DEFAULT 12 CHECK(base=12),
 code TEXT NOT NULL, meaning TEXT NOT NULL, UNIQUE(source_id,decimal_value,meaning)
);
CREATE TABLE IF NOT EXISTS ancient_worker_jobs (
 id INTEGER PRIMARY KEY, source_id TEXT NOT NULL REFERENCES ancient_originals(source_id),
 name TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('queued','running','done','failed')),
 attempts INTEGER NOT NULL DEFAULT 0, UNIQUE(source_id,name)
);
CREATE TABLE IF NOT EXISTS ancient_worker_runs (
 id INTEGER PRIMARY KEY, job_id INTEGER NOT NULL REFERENCES ancient_worker_jobs(id),
 name TEXT NOT NULL, status TEXT NOT NULL, output_count INTEGER NOT NULL, note TEXT NOT NULL,
 finished_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ancient_embeddings (
 id INTEGER PRIMARY KEY, knowledge_id INTEGER NOT NULL REFERENCES ancient_knowledge_records(id),
 model TEXT NOT NULL, embedding_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_ancient_knowledge_title ON ancient_knowledge_records(title);
CREATE INDEX IF NOT EXISTS ix_ancient_claim_status ON ancient_claims(status);
"""


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def initialize(conn: sqlite3.Connection) -> None:
    conn.executescript(DDL)


def base12(n: int) -> str:
    if n < 0:
        raise ValueError("Base-12 requires a nonnegative integer")
    out = ""
    while n:
        n, d = divmod(n, 12)
        out = "0123456789AB"[d] + out
    return out or "0"


def _record(conn, sid: str, worker: str, title: str, body: str, tier: str, kind="working") -> int:
    conn.execute(
        "INSERT OR IGNORE INTO ancient_knowledge_records(source_id,role,title,body,kind) VALUES(?,?,?,?,?)",
        (sid, worker, title, body, kind))
    kid = conn.execute(
        "SELECT id FROM ancient_knowledge_records WHERE source_id=? AND role=? AND title=?",
        (sid, worker, title)).fetchone()[0]
    conn.execute(
        "INSERT OR IGNORE INTO ancient_cero_uno_dos(source_id,knowledge_id,tier,label) VALUES(?,?,?,?)",
        (sid, kid, tier, title))
    return kid


def ingest_source(conn: sqlite3.Connection, name: str | Path, provenance="owner-selected original") -> dict:
    source = Path(name).expanduser()
    if source.is_symlink():
        raise ValueError("Symlinks are not accepted as source files")
    source = source.resolve(strict=True)
    if not source.is_file() or source.suffix.lower() not in (".txt",".md"):
        raise ValueError("Select a regular .txt or .md source")
    if source.stat().st_size > 2_000_000:
        raise ValueError("Ancient Minds source exceeds 2 MB")
    data = source.read_bytes()
    if not data:
        raise ValueError("Ancient Minds source is empty")
    data.decode("utf-8",errors="strict")
    content_sha = digest(data)
    sid = digest(("ancient-mind-os:"+content_sha).encode())[:20]
    initialize(conn)
    # Explicit database transaction: originals and indexing are one local operation.
    with conn:
        conn.execute(
            "INSERT OR IGNORE INTO federation_sources(source_id,label,source_path,source_type,file_sha256,bytes,indexed_at) "
            "VALUES(?,?,?,?,?,?,?)",
            (sid,source.name,str(source),"ancient-mind-os-v074",content_sha,len(data),utc()))
        conn.execute(
            "INSERT OR IGNORE INTO ancient_originals VALUES(?,?,?,?,?,?)",
            (sid,data,content_sha,source.name,provenance,utc()))
        conn.execute(
            "INSERT OR IGNORE INTO ancient_source_references(source_id,title,locator) VALUES(?,?,?)",
            (sid,source.name,"owner-supplied; not independently verified"))
        conn.execute(
            "INSERT OR IGNORE INTO ancient_worker_jobs(source_id,name,status) VALUES(?,?,'queued')",
            (sid,WORKERS[0]))
        # The existing searchable ONE table is a derived text view; BLOB originals stay separate.
        conn.execute(
            "INSERT OR IGNORE INTO federation_records(source_id,record_id,content_sha256,exact_source_text,title,record_kind,tier) "
            "VALUES(?,?,?,?,?,?,?)",
            (sid,"ancient:original",content_sha,data.decode("utf-8"),source.name,"ancient-raw-source","CERO"))
        conn.execute("INSERT OR IGNORE INTO federation_tables VALUES(?,?,?)",(sid,"ancient.originals",1))
        audit(conn,"Sumerian Scribe","ancient_original_ingested",{"source_id":sid,"sha256":content_sha,"length":len(data)})
    return {"source_id":sid,"sha256":content_sha,"bytes":len(data),"unchanged":source.read_bytes()==data}


def _run_one(conn: sqlite3.Connection, sid: str, worker: str, data: bytes) -> tuple[int,str]:
    source = data.decode("utf-8")
    if worker == "Sumerian Scribe":
        _record(conn,sid,worker,"Original source indexed",
                "Original unchanged; SHA-256 "+digest(data)+"; no historical claim verified","0.0","source-index")
        for name in WORKERS[1:]:
            conn.execute("INSERT OR IGNORE INTO ancient_worker_jobs(source_id,name,status) VALUES(?,?,'queued')",(sid,name))
        return 1,"Indexed original and queued five named specialists"
    if worker == "Babylonian Mathematician":
        n=len(data)
        conn.execute(
            "INSERT OR IGNORE INTO ancient_duo_codes(source_id,decimal_value,code,meaning) VALUES(?,?,?,?)",
            (sid,n,base12(n),"Source UTF-8 byte length"))
        _record(conn,sid,worker,"Duo/base-12 byte index",
                f"Decimal bytes {n}; base-12 {base12(n)}. Not a historical proof.","1.0")
        return 1,"Converted exact byte count to base 12"
    if worker == "Egyptian Keeper of Names":
        if "blāc" not in source or "blæc" not in source:
            return 0,"Phonetic pair not found"
        for form in ("blāc","blæc"):
            conn.execute(
                "INSERT OR IGNORE INTO ancient_phonetics(source_id,written_form,annotation) VALUES(?,?,?)",
                (sid,form,"Source-proposed spelling similarity; historical etymology unverified"))
        left=_record(conn,sid,worker,"Form: blāc","Source form; verify with a dated dictionary.","1.0")
        right=_record(conn,sid,worker,"Form: blæc","Source form; verify with a dated dictionary.","1.0")
        conn.execute(
            "INSERT OR IGNORE INTO ancient_relationships(source_id,left_record_id,right_record_id,relation_type,rationale) "
            "VALUES(?,?,?,?,?)",(sid,left,right,"orthographic-candidate","Visual similarity alone does not establish derivation"))
        conn.execute(
            "INSERT OR IGNORE INTO ancient_claims(source_id,claim_text) VALUES(?,?)",
            (sid,"blāc and blæc phonetic/historical relationship requires outside evidence"))
        return 2,"Created a proposed, unverified phonetic cross-reference"
    if worker == "Indian Grammarian":
        if "nāraṅga" not in source:
            return 0,"Sanskrit candidate not present"
        conn.execute(
            "INSERT OR IGNORE INTO ancient_phonetics(source_id,written_form,annotation) VALUES(?,?,?)",
            (sid,"nāraṅga","Candidate borrowing history; original lexicographic evidence required"))
        conn.execute(
            "INSERT OR IGNORE INTO ancient_claims(source_id,claim_text) VALUES(?,?)",
            (sid,"nāraṅga borrowing route requires historical source verification"))
        _record(conn,sid,worker,"Candidate Sanskrit nāraṅga",
                "Compare attested historical forms; no borrowing chain certified.","1.0")
        return 1,"Indexed an unverified language-root candidate"
    if worker == "Chronologist":
        labels=[x for x in ("Old English","1500s") if x.lower() in source.lower()]
        if not labels:
            return 0,"No fixed period labels in this source"
        for label in labels:
            conn.execute(
                "INSERT OR IGNORE INTO ancient_timelines(source_id,period_label,assertion) VALUES(?,?,?)",
                (sid,label,"Period mentioned by source; independent chronology not established"))
        _record(conn,sid,worker,"Chronology candidates",", ".join(labels)+"; dates require evidence review.","1.0")
        return 1,"Captured source-supplied time labels"
    if worker == "House of Wisdom Scholar":
        if "Aristotelian" not in source or "optical" not in source:
            return 0,"Specified comparative concepts not found"
        _record(conn,sid,worker,"Aristotelian and optical comparison",
                "A comparative research lens, not a proven single historical transition.","2.0","interpretation")
        return 1,"Created reviewed-later interpretation"
    raise ValueError("Unregistered worker: "+worker)


def drain(conn: sqlite3.Connection, source_id: str | None=None, limit=12) -> dict:
    initialize(conn)
    if not isinstance(limit,int) or limit<1 or limit>100:
        raise ValueError("Worker dispatch limit must be 1..100")
    completed=0
    for _ in range(limit):
        if source_id:
            job=conn.execute("SELECT id,source_id,name FROM ancient_worker_jobs WHERE status='queued' AND source_id=? ORDER BY id LIMIT 1",
                             (source_id,)).fetchone()
        else:
            job=conn.execute("SELECT id,source_id,name FROM ancient_worker_jobs WHERE status='queued' ORDER BY id LIMIT 1").fetchone()
        if job is None:
            break
        job_id,sid,name=job
        payload=conn.execute("SELECT original_bytes,sha256 FROM ancient_originals WHERE source_id=?",(sid,)).fetchone()
        if payload is None or digest(bytes(payload[0]))!=payload[1]:
            raise ValueError("Source checksum mismatch — worker cannot run")
        with conn:
            conn.execute("UPDATE ancient_worker_jobs SET status='running',attempts=attempts+1 WHERE id=?",(job_id,))
            try:
                count,note=_run_one(conn,sid,name,bytes(payload[0]))
                state="done"
            except Exception as err:
                count,note,state=0,str(err),"failed"
            conn.execute("UPDATE ancient_worker_jobs SET status=? WHERE id=?",(state,job_id))
            conn.execute(
                "INSERT INTO ancient_worker_runs(job_id,name,status,output_count,note,finished_at) VALUES(?,?,?,?,?,?)",
                (job_id,name,state,count,note,utc()))
            audit(conn,name,"v074_worker_"+state,{"source_id":sid,"derived":count,"note":note})
        completed+=1
    return status(conn,source_id=source_id) | {"jobs_processed_this_run":completed}


def status(conn: sqlite3.Connection, source_id: str | None=None) -> dict:
    initialize(conn)
    where=" WHERE source_id=?" if source_id else ""
    args=(source_id,) if source_id else ()
    def count(table):
        if table == "ancient_embeddings" and source_id:
            return conn.execute("SELECT COUNT(*) FROM ancient_embeddings e JOIN ancient_knowledge_records k ON e.knowledge_id=k.id WHERE k.source_id=?",args).fetchone()[0]
        return conn.execute("SELECT COUNT(*) FROM "+table+where,args).fetchone()[0]
    # worker_runs are linked by job ID rather than containing source_id
    runs=conn.execute("SELECT COUNT(*) FROM ancient_worker_runs r JOIN ancient_worker_jobs j ON j.id=r.job_id"
                      + (" WHERE j.source_id=?" if source_id else ""),args).fetchone()[0]
    return {"version":VERSION,"native_tables":len(TABLES),"originals":count("ancient_originals"),
            "derived_records":count("ancient_knowledge_records"),"proposed_links":count("ancient_relationships"),
            "claims_needing_review":count("ancient_claims"),"evidence":count("ancient_evidence"),
            "embedding_rows":count("ancient_embeddings"),"worker_runs":runs,
            "jobs_queued":conn.execute("SELECT COUNT(*) FROM ancient_worker_jobs WHERE status='queued'"
                                      + (" AND source_id=?" if source_id else ""),args).fetchone()[0],
            "unassigned_specialist_slots":UNASSIGNED_SLOTS,
            "mode":"local/private; no live AI calls or PostgreSQL server"}


def main() -> None:
    parser=argparse.ArgumentParser(description=VERSION+" internal worker system")
    parser.add_argument("--db",default="ONE_Federation_Master.sqlite3",help="Private local ONE SQLite database")
    sub=parser.add_subparsers(dest="command",required=True)
    sub.add_parser("init")
    add=sub.add_parser("ingest-ancient")
    add.add_argument("source")
    add.add_argument("--provenance",default="owner-selected source")
    run=sub.add_parser("run-ancient")
    run.add_argument("--source-id")
    run.add_argument("--limit",type=int,default=12)
    peek=sub.add_parser("ancient-status")
    peek.add_argument("--source-id")
    args=parser.parse_args()
    with closing(open_main(args.db)) as conn:
        initialize(conn)
        if args.command=="init": result={"version":VERSION,"status":"schema ready","native_tables":len(TABLES)}
        elif args.command=="ingest-ancient": result=ingest_source(conn,args.source,args.provenance)
        elif args.command=="run-ancient": result=drain(conn,args.source_id,args.limit)
        else: result=status(conn,args.source_id)
        print(json.dumps(result,indent=2,ensure_ascii=False))


if __name__=="__main__":
    main()
