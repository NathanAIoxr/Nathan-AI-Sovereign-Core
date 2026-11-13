#!/usr/bin/env python3
"""NATHAN AI — ONE DATABASE FEDERATION v074 / Ancient Minds internal adapter.

Ingest all 14 native SQLite families without mutating the source. Keep original
BLOBs and derived JSON in separate append-only tables in the private master.
"""
from __future__ import annotations
import argparse
from contextlib import closing
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
from tempfile import TemporaryDirectory
import zipfile
from federation import open_main, audit, file_sha, sha

VERSION = "NATHAN AI — ONE DATABASE FEDERATION v074"
ARCHIVE_NAME = "Nathan_Mind_OS_Ancient_Minds_Reference_Build.zip"
ARCHIVE_SHA256 = "aff51aed098892281f51ec991638ffe2a7cf585c861bfdcf85bfdcda98de4e8d"
EXPECTED_TABLES = frozenset({
    "originals","source_references","languages","phonetics","timelines",
    "knowledge_records","claims","evidence","relationships","cero_uno_dos",
    "duo_codes","worker_jobs","worker_runs","embeddings"
})
MAX_SOURCE_BYTES=100_000_000
MAX_ARCHIVE_BYTES=5_000_000
MAX_IMPORT_ROWS=200_000

ANCIENT_SCHEMA = """
CREATE TABLE IF NOT EXISTS federation_ancient_originals (
 source_id TEXT NOT NULL REFERENCES federation_sources(source_id),
 original_id TEXT NOT NULL, original_sha256 TEXT NOT NULL,
 exact_bytes BLOB NOT NULL, filename TEXT NOT NULL, provenance TEXT NOT NULL,
 imported_at TEXT NOT NULL,
 PRIMARY KEY(source_id,original_id,original_sha256)
);
CREATE TRIGGER IF NOT EXISTS federation_ancient_originals_no_update
 BEFORE UPDATE ON federation_ancient_originals
 BEGIN SELECT RAISE(ABORT,'Federated original bytes are append-only'); END;
CREATE TRIGGER IF NOT EXISTS federation_ancient_originals_no_delete
 BEFORE DELETE ON federation_ancient_originals
 BEGIN SELECT RAISE(ABORT,'Federated original bytes are append-only'); END;
CREATE TABLE IF NOT EXISTS federation_ancient_rows (
 source_id TEXT NOT NULL REFERENCES federation_sources(source_id),
 table_name TEXT NOT NULL, row_id TEXT NOT NULL, content_sha256 TEXT NOT NULL,
 exact_json TEXT NOT NULL, original_id TEXT, imported_at TEXT NOT NULL,
 PRIMARY KEY(source_id,table_name,row_id,content_sha256)
);
CREATE INDEX IF NOT EXISTS ix_federation_ancient_table
 ON federation_ancient_rows(table_name,source_id);
CREATE TABLE IF NOT EXISTS federation_ancient_snapshots (
 source_id TEXT NOT NULL REFERENCES federation_sources(source_id),
 file_sha256 TEXT NOT NULL, at TEXT NOT NULL,
 originals_count INTEGER NOT NULL, derived_rows_count INTEGER NOT NULL,
 table_counts_json TEXT NOT NULL,
 PRIMARY KEY(source_id,file_sha256)
);
"""

def _now():
    return datetime.now(timezone.utc).isoformat()

def _regular(file,allowed):
    p=Path(file).expanduser()
    if p.is_symlink(): raise ValueError("Symlink input is not permitted")
    p=p.resolve(strict=True)
    if not p.is_file() or p.suffix.lower() not in allowed:
        raise ValueError("Expected regular file with allowed extension")
    return p

def _tier(table):
    if table in ("source_references","worker_jobs","worker_runs"): return "CERO"
    if table in ("relationships","embeddings"): return "DOS"
    return "UNO"

def _title(table,row):
    for key in ("title","written_form","claim_text","event_description",
                "worker_name","label","language_name","relation_type"):
        if row.get(key) not in (None,""):
            return "Ancient Minds / "+table+": "+str(row[key])[:170]
    return "Ancient Minds / "+table+" / "+str(row.get("id","unidentified"))

def ingest_ancient(main,source_file,source_id_override=None,source_path_override=None):
    """Import all 14 native families, originals as BLOBs, all revisions append-only."""
    path=_regular(source_file,(".sqlite",".sqlite3",".db"))
    if path.stat().st_size>MAX_SOURCE_BYTES: raise ValueError("Source database exceeds 100 MB")
    source_id=source_id_override or sha(str(path).encode("utf-8"))[:20]
    if len(source_id)!=20 or any(c not in "0123456789abcdef" for c in source_id):
        raise ValueError("Invalid stable source ID")
    before_file=file_sha(path)
    with closing(sqlite3.connect(path.as_uri()+"?mode=ro&immutable=1",uri=True)) as source:
        source.row_factory=sqlite3.Row
        if source.execute("PRAGMA quick_check").fetchone()[0]!="ok":
            raise ValueError("Ancient Minds source SQLite quick_check failed")
        names={r[0] for r in source.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")}
        if not EXPECTED_TABLES.issubset(names):
            raise ValueError("Missing Ancient Minds tables: "+", ".join(sorted(EXPECTED_TABLES-names)))
        counts={name:source.execute('SELECT COUNT(*) FROM "'+name+'"').fetchone()[0]
                for name in EXPECTED_TABLES}
        total=sum(counts.values())
        if total>MAX_IMPORT_ROWS: raise ValueError("Ancient Minds import exceeds 200,000 rows")
        originals=[]
        for r in source.execute("SELECT id,filename,source_provenance,original_bytes,sha256 FROM originals"):
            raw=bytes(r["original_bytes"])
            digest=hashlib.sha256(raw).hexdigest()
            if digest!=r["sha256"]:
                raise ValueError("Original checksum mismatch: "+str(r["id"]))
            originals.append((str(r["id"]),digest,raw,str(r["filename"]),str(r["source_provenance"])))
        derived=[]
        for table in sorted(EXPECTED_TABLES-{"originals"}):
            for row in source.execute('SELECT * FROM "'+table+'"'):
                data=dict(row)
                if any(isinstance(v,(bytes,memoryview)) for v in data.values()):
                    raise ValueError("Unexpected binary field in derived source table")
                key=str(data.get("id",""))
                if not key: raise ValueError("Derived table has no stable ID: "+table)
                exact=json.dumps(data,sort_keys=True,ensure_ascii=False,separators=(",",":"))
                derived.append((table,key,sha(exact.encode("utf-8")),exact,
                                str(data.get("original_id") or ""),data))
    if file_sha(path)!=before_file: raise ValueError("Source changed during import")
    main.executescript(ANCIENT_SCHEMA)
    n_original=n_derived=n_links=0
    with main:
        locator=str(source_path_override or path)
        main.execute(
            "INSERT INTO federation_sources(source_id,label,source_path,source_type,file_sha256,bytes,indexed_at) "
            "VALUES(?,?,?,?,?,?,?) ON CONFLICT(source_id) DO UPDATE SET "
            "file_sha256=excluded.file_sha256,bytes=excluded.bytes,indexed_at=excluded.indexed_at",
            (source_id,Path(locator).name,locator,"ancient-mind-os-14-table",
             before_file,path.stat().st_size,_now()))
        for table,count in sorted(counts.items()):
            main.execute("INSERT OR REPLACE INTO federation_tables VALUES(?,?,?)",
                         (source_id,"ancient."+table,count))
        for key,digest,raw,filename,provenance in originals:
            prev=main.total_changes
            main.execute("INSERT OR IGNORE INTO federation_ancient_originals VALUES(?,?,?,?,?,?,?)",
                         (source_id,key,digest,raw,filename,provenance,_now()))
            n_original+=int(main.total_changes>prev)
        for table,key,digest,exact,original_id,data in derived:
            prev=main.total_changes
            main.execute("INSERT OR IGNORE INTO federation_ancient_rows VALUES(?,?,?,?,?,?,?)",
                         (source_id,table,key,digest,exact,original_id,_now()))
            n_derived+=int(main.total_changes>prev)
            main.execute("INSERT OR IGNORE INTO federation_records("
                         "source_id,record_id,content_sha256,exact_source_text,title,record_kind,tier) "
                         "VALUES(?,?,?,?,?,?,?)",
                         (source_id,f"ancient:{table}:{key}",digest,exact,_title(table,data),
                          "ancient-derived:"+table,_tier(table)))
            if table=="relationships":
                prev=main.total_changes
                main.execute("INSERT OR IGNORE INTO federation_links VALUES(?,?,?,?,?,?)",
                             (source_id,f"ancient:knowledge_records:{data['from_record_id']}",
                              source_id,f"ancient:knowledge_records:{data['to_record_id']}",
                              "ancient:"+str(data["relation_type"]),
                              str(data.get("evidence_status") or "proposed")))
                n_links+=int(main.total_changes>prev)
        main.execute("INSERT OR IGNORE INTO federation_ancient_snapshots VALUES(?,?,?,?,?,?)",
                     (source_id,before_file,_now(),counts["originals"],total-counts["originals"],
                      json.dumps(counts,sort_keys=True)))
        audit(main,"AncientSpecialists","v074_ancient_minds_import",{
            "source_id":source_id,"file_sha256":before_file,
            "originals_added":n_original,"derived_added":n_derived,
            "candidate_links_added":n_links,"native_families":14,
            "source_untouched":True})
    return {"federation":VERSION,"source_id":source_id,"file_sha256":before_file,
            "originals_verified":counts["originals"],"originals_new":n_original,
            "derived_rows_seen":total-counts["originals"],"derived_rows_new":n_derived,
            "relationships_new":n_links,"native_tables":14,
            "source_preserved":file_sha(path)==before_file}

VENDORED_WORKER_GIT_BLOB_SHA = "3a34845af966054884fb1cbc98f474250c371e44"

def _trusted_worker_bytes(archive_file=None):
    """Use the pinned, reviewable in-repository worker, or the original supplied ZIP."""
    if archive_file:
        archive=_regular(archive_file,(".zip",))
        if archive.stat().st_size>MAX_ARCHIVE_BYTES:
            raise ValueError("Engine archive exceeds 5 MB")
        if file_sha(archive)!=ARCHIVE_SHA256:
            raise ValueError("Engine archive SHA-256 mismatch; execution blocked")
        with zipfile.ZipFile(archive) as z:
            info=z.getinfo("nathan_mind_os/worker_engine.py")
            if info.file_size>2_000_000: raise ValueError("Archive worker too large")
            raw=z.read(info.filename)
            if len(raw)!=info.file_size: raise ValueError("Archive worker size mismatch")
            return raw
    worker=Path(__file__).with_name("ancient_minds_reference")/"worker_engine.py"
    if worker.is_symlink() or not worker.is_file():
        raise ValueError("Vendored Ancient Minds worker missing or symlink")
    raw=worker.read_bytes()
    blob_id=hashlib.sha1(b"blob "+str(len(raw)).encode("ascii")+b"\0"+raw).hexdigest()
    if blob_id!=VENDORED_WORKER_GIT_BLOB_SHA:
        raise ValueError("Vendored Ancient Minds worker version mismatch")
    return raw

def run_source(main,source_file,archive_file=None):
    """Execute the bounded reference on local owner text, merge original BLOBs into ONE."""
    source=_regular(source_file,(".txt",".md"))
    if source.stat().st_size>2_000_000:
        raise ValueError("Owner source exceeds the reference engine's 2 MB limit")
    raw_worker=_trusted_worker_bytes(archive_file)
    with TemporaryDirectory(prefix="nathan-ancient-v074-") as tmp:
        tmp=Path(tmp)
        (tmp/"worker_engine.py").write_bytes(raw_worker)
        db_path=tmp/"run.sqlite3"
        out_path=tmp/"report.json"
        proc=subprocess.run([sys.executable,"-B",str(tmp/"worker_engine.py"),
                             "--source",str(source),"--db",str(db_path),
                             "--output",str(out_path)],text=True,capture_output=True,
                            timeout=40,check=False)
        if proc.returncode:
            raise RuntimeError("Ancient reference worker failed: "+proc.stderr[-1500:])
        outcome=json.loads(out_path.read_text(encoding="utf-8"))
        if not outcome.get("original_bytes_preserved") or outcome.get("jobs_left_queued")!=0:
            raise ValueError("Ancient workers did not verify source integrity and completion")
        stable=sha(("ancient-mind-os:source-sha256:"+file_sha(source)).encode("ascii"))[:20]
        merged=ingest_ancient(main,db_path,stable,str(source))
        return {"pipeline":{"runs":len(outcome.get("worker_runs",[])),
                            "claims_needing_review":outcome.get("claims_needing_review",0),
                            "proposed_links":len(outcome.get("relationships",[])),
                            "original_sha256":outcome.get("sha256")},
                "federation":merged}

def status(main):
    main.executescript(ANCIENT_SCHEMA)
    return {"federation":VERSION,
            "ancient_snapshots":main.execute(
                "SELECT COUNT(*) FROM federation_ancient_snapshots").fetchone()[0],
            "native_originals":main.execute(
                "SELECT COUNT(*) FROM federation_ancient_originals").fetchone()[0],
            "native_derived_rows":main.execute(
                "SELECT COUNT(*) FROM federation_ancient_rows").fetchone()[0],
            "originals_append_only":True,
            "scope":"Local/private ONE Federation; not PostgreSQL or external AI sync"}

def main_cli():
    p=argparse.ArgumentParser(description=VERSION+" internal Ancient Minds bridge")
    p.add_argument("--db",default="ONE_Federation_Master.sqlite3")
    subs=p.add_subparsers(dest="command",required=True)
    subs.add_parser("status")
    subs.add_parser("ingest-ancient").add_argument("sqlite_source")
    run=subs.add_parser("run-source")
    run.add_argument("text_source")
    run.add_argument("--archive",default="",help="Optional original ZIP; built-in pinned worker is default")
    a=p.parse_args()
    with closing(open_main(a.db)) as db:
        if a.command=="status": result=status(db)
        elif a.command=="ingest-ancient": result=ingest_ancient(db,a.sqlite_source)
        else: result=run_source(db,a.text_source,a.archive or None)
        print(json.dumps(result,indent=2,ensure_ascii=False))

if __name__=="__main__": main_cli()
