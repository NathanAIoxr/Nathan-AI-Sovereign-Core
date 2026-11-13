#!/usr/bin/env python3
"""ANCIENT MINDS — source-preserving no-network SQLite worker reference.

Fourteen table families, six named specialists, an intentionally bounded queue.
This is not PostgreSQL deployment, autonomous AI inference or a scientific proof
that atoms have minds. Original files remain owner-held.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import sqlite3
from pathlib import Path

KNOWN_WORKERS = (
    "Sumerian Scribe",
    "Babylonian Mathematician",
    "Egyptian Keeper of Names",
    "Indian Grammarian",
    "Chronologist",
    "House of Wisdom Scholar",
)
UNASSIGNED_WORKER_SLOTS = 4
CERO_CANON = {
    "0.0": "0 · LA · AL",
    "1.0": "1 · EL · LE",
    "2.0": "2 (derived/connected state)"
}
SQLITE_DDL = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS originals(
 id INTEGER PRIMARY KEY, filename TEXT NOT NULL, media_type TEXT NOT NULL,
 source_provenance TEXT NOT NULL, original_bytes BLOB NOT NULL, sha256 TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS originals_no_update BEFORE UPDATE ON originals
 BEGIN SELECT RAISE(ABORT,'ORIGINALS are append-only'); END;
CREATE TRIGGER IF NOT EXISTS originals_no_delete BEFORE DELETE ON originals
 BEGIN SELECT RAISE(ABORT,'ORIGINALS are append-only'); END;
CREATE TABLE IF NOT EXISTS source_references(
 id INTEGER PRIMARY KEY, original_id INTEGER NOT NULL REFERENCES originals(id),
 title TEXT NOT NULL, locator TEXT, source_kind TEXT NOT NULL, reviewed INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS languages(
 id INTEGER PRIMARY KEY, language_code TEXT UNIQUE NOT NULL,
 language_name TEXT NOT NULL, reconstruction_status TEXT NOT NULL DEFAULT 'attested'
);
CREATE TABLE IF NOT EXISTS phonetics(
 id INTEGER PRIMARY KEY, original_id INTEGER NOT NULL REFERENCES originals(id),
 language_id INTEGER REFERENCES languages(id), written_form TEXT NOT NULL, ipa TEXT,
 annotation TEXT NOT NULL, evidence_status TEXT NOT NULL DEFAULT 'unverified'
);
CREATE TABLE IF NOT EXISTS timelines(
 id INTEGER PRIMARY KEY, original_id INTEGER NOT NULL REFERENCES originals(id),
 event_description TEXT NOT NULL, period_label TEXT,
 evidence_status TEXT NOT NULL DEFAULT 'unverified'
);
CREATE TABLE IF NOT EXISTS knowledge_records(
 id INTEGER PRIMARY KEY, original_id INTEGER NOT NULL REFERENCES originals(id),
 title TEXT NOT NULL, body TEXT NOT NULL, record_kind TEXT NOT NULL,
 created_by TEXT NOT NULL, reviewed INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS claims(
 id INTEGER PRIMARY KEY, original_id INTEGER NOT NULL REFERENCES originals(id),
 claim_text TEXT NOT NULL, evidence_status TEXT NOT NULL DEFAULT 'unverified'
);
CREATE TABLE IF NOT EXISTS evidence(
 id INTEGER PRIMARY KEY, claim_id INTEGER NOT NULL REFERENCES claims(id),
 source_reference_id INTEGER NOT NULL REFERENCES source_references(id),
 excerpt TEXT, assessment TEXT NOT NULL DEFAULT 'not_reviewed'
);
CREATE TABLE IF NOT EXISTS relationships(
 id INTEGER PRIMARY KEY, from_record_id INTEGER NOT NULL REFERENCES knowledge_records(id),
 to_record_id INTEGER NOT NULL REFERENCES knowledge_records(id),
 relation_type TEXT NOT NULL, evidence_status TEXT NOT NULL DEFAULT 'proposed',
 rationale TEXT NOT NULL, CHECK(from_record_id<>to_record_id)
);
CREATE TABLE IF NOT EXISTS cero_uno_dos(
 id INTEGER PRIMARY KEY, original_id INTEGER NOT NULL REFERENCES originals(id),
 knowledge_record_id INTEGER REFERENCES knowledge_records(id),
 tier TEXT NOT NULL CHECK(tier IN ('0.0','1.0','2.0')),
 label TEXT NOT NULL, owner_reviewed INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS duo_codes(
 id INTEGER PRIMARY KEY, original_id INTEGER NOT NULL REFERENCES originals(id),
 decimal_value INTEGER NOT NULL CHECK(decimal_value>=0),
 base INTEGER NOT NULL DEFAULT 12 CHECK(base=12),
 duodecimal_representation TEXT NOT NULL, meaning TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS worker_jobs(
 id INTEGER PRIMARY KEY, original_id INTEGER NOT NULL REFERENCES originals(id),
 worker_name TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('queued','running','done','failed','needs_review')),
 attempts INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS worker_runs(
 id INTEGER PRIMARY KEY, worker_job_id INTEGER NOT NULL REFERENCES worker_jobs(id),
 worker_name TEXT NOT NULL, outcome TEXT NOT NULL,
 derived_count INTEGER NOT NULL, summary TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS embeddings(
 id INTEGER PRIMARY KEY, knowledge_record_id INTEGER NOT NULL REFERENCES knowledge_records(id),
 model_name TEXT NOT NULL, embedding_json TEXT NOT NULL
);
"""

def initialize(db: sqlite3.Connection) -> None:
    db.executescript(SQLITE_DDL)

def base12(value: int) -> str:
    if value<0: raise ValueError("base-12 requires a nonnegative integer")
    alphabet="0123456789AB"
    if value==0: return "0"
    digits=[]
    while value:
        value,rem=divmod(value,12)
        digits.append(alphabet[rem])
    return "".join(reversed(digits))

def ingest(db: sqlite3.Connection, payload: bytes, filename: str, provenance: str) -> int:
    if not isinstance(payload,bytes) or not payload:
        raise ValueError("A non-empty original byte string is required")
    if len(payload)>2_000_000: raise ValueError("Reference input limited to 2 MB")
    digest=hashlib.sha256(payload).hexdigest()
    with db:
        source=db.execute(
            "INSERT INTO originals(filename,media_type,source_provenance,original_bytes,sha256) "
            "VALUES(?,'text/plain',?,?,?)",
            (filename[:200],provenance[:300],payload,digest)).lastrowid
        db.execute("INSERT INTO source_references(original_id,title,locator,source_kind) "
                   "VALUES(?,?,?,?)",
                   (source,filename[:200],
                    "owner-supplied input; not independent verification","owner_original"))
        db.execute("INSERT INTO worker_jobs(original_id,worker_name,status) "
                   "VALUES(?,'Sumerian Scribe','queued')",(source,))
    return source

def knowledge(db,source,title,body,worker,tier,kind="working"):
    record=db.execute("INSERT INTO knowledge_records("
                      "original_id,title,body,record_kind,created_by) VALUES(?,?,?,?,?)",
                      (source,title,body,kind,worker)).lastrowid
    db.execute("INSERT INTO cero_uno_dos(original_id,knowledge_record_id,tier,label) "
               "VALUES(?,?,?,?)",(source,record,tier,title))
    return record

def work(db: sqlite3.Connection, source: int, worker: str) -> tuple[int,str]:
    item=db.execute("SELECT original_bytes,sha256 FROM originals WHERE id=?",(source,)).fetchone()
    if item is None: raise ValueError("Original missing")
    raw,digest=item
    if hashlib.sha256(raw).hexdigest()!=digest:
        raise ValueError("Original SHA-256 mismatch")
    text=raw.decode("utf-8")
    if worker=="Sumerian Scribe":
        knowledge(db,source,"Original indexed (unchanged)",
                  f"Indexed source ID {source}; SHA-256 {digest}. Truth claims not validated.",
                  worker,"0.0","source_index")
        for name in KNOWN_WORKERS[1:]:
            db.execute("INSERT INTO worker_jobs(original_id,worker_name,status) "
                       "VALUES(?,?,'queued')",(source,name))
        return 1,"Source indexed; five bounded specialist jobs queued"
    if worker=="Babylonian Mathematician":
        amount=len(raw)
        db.execute("INSERT INTO duo_codes("
                   "original_id,decimal_value,base,duodecimal_representation,meaning) "
                   "VALUES(?,?,?,?,?)",
                   (source,amount,12,base12(amount),"UTF-8 source byte length"))
        knowledge(db,source,"Duo/base-12 source-length index",
                  f"UTF-8 source length: {amount} bytes = {base12(amount)} (base 12). "
                  "Not a linguistic proof.",worker,"1.0")
        return 1,"Converted source byte length to base 12"
    if worker=="Egyptian Keeper of Names":
        if all(term in text for term in ("blāc","blæc")):
            left=knowledge(db,source,"Form: blāc",
                "Source mentions blāc as pale; verify with historical dictionaries.",
                worker,"1.0")
            right=knowledge(db,source,"Form: blæc",
                "Source mentions blæc as black; verify with historical dictionaries.",
                worker,"1.0")
            for form in ("blāc","blæc"):
                db.execute("INSERT INTO phonetics(original_id,written_form,annotation) "
                           "VALUES(?,?,?)",(source,form,
                             "Owner-supplied candidate; historical etymology unverified"))
            db.execute("INSERT INTO relationships("
                       "from_record_id,to_record_id,relation_type,rationale) VALUES(?,?,?,?)",
                       (left,right,"proposed_orthographic_similarity",
                        "Related-looking spellings; historical derivation has not been established"))
            db.execute("INSERT INTO claims(original_id,claim_text) VALUES(?,?)",
                       (source,"Proposed historical/phonetic relationship between "
                        "blāc and blæc needs external references"))
            return 2,"Proposed form link; added unverified claim for evidence review"
        return 0,"No blāc/blæc pair in original"
    if worker=="Indian Grammarian":
        if "nāraṅga" in text:
            db.execute("INSERT INTO phonetics(original_id,written_form,annotation) "
                       "VALUES(?,?,?)",(source,"nāraṅga",
                         "Owner-supplied Sanskrit candidate; source verification required"))
            knowledge(db,source,"Candidate Sanskrit nāraṅga",
                      "Compare historical forms of orange without asserting a proven "
                      "borrowing chain from this source alone.",worker,"1.0")
            db.execute("INSERT INTO claims(original_id,claim_text) VALUES(?,?)",
                       (source,"Proposed route from nāraṅga to later orange words needs source verification"))
            return 1,"Indexed candidate form and evidence question"
        return 0,"No nāraṅga occurrence"
    if worker=="Chronologist":
        labels=[term for term in ("Old English","1500s")
                if term.lower() in text.lower()]
        for label in labels:
            db.execute("INSERT INTO timelines(original_id,event_description,period_label) "
                       "VALUES(?,?,?)",(source,
                         "Source mentions historical time label; chronology unverified",label))
        if labels:
            knowledge(db,source,"Historical labels for verification",
                      "Source time labels: "+", ".join(labels)+". Dates require review.",
                      worker,"1.0")
            return 1,"Captured source time labels, marked unverified"
        return 0,"No time labels found"
    if worker=="House of Wisdom Scholar":
        if "Aristotelian" in text and "optical" in text:
            knowledge(db,source,"Comparison of interpretive frameworks",
                      "Source juxtaposes Aristotelian elemental categories and modern "
                      "optics. Research comparison, not a single verified history.",
                      worker,"2.0","interpretation")
            return 1,"Created source-attributed, reviewable comparison"
        return 0,"Comparison pattern absent"
    raise ValueError("Unknown specialist worker: "+worker)

def drain(db: sqlite3.Connection,max_jobs: int=12) -> int:
    processed=0
    while processed<max_jobs:
        row=db.execute("SELECT id,original_id,worker_name,attempts FROM worker_jobs "
                       "WHERE status='queued' ORDER BY id LIMIT 1").fetchone()
        if row is None: break
        job_id,source,worker,attempts=row
        with db:
            db.execute("UPDATE worker_jobs SET status='running',attempts=? WHERE id=?",
                       (attempts+1,job_id))
        try:
            with db:
                count,message=work(db,source,worker)
                db.execute("UPDATE worker_jobs SET status='done' WHERE id=?",(job_id,))
                db.execute("INSERT INTO worker_runs("
                           "worker_job_id,worker_name,outcome,derived_count,summary) "
                           "VALUES(?,?,?,?,?)",(job_id,worker,"done",count,message))
        except Exception as e:
            with db:
                db.execute("UPDATE worker_jobs SET status='failed' WHERE id=?",(job_id,))
                db.execute("INSERT INTO worker_runs("
                           "worker_job_id,worker_name,outcome,derived_count,summary) "
                           "VALUES(?,?,?,?,?)",(job_id,worker,"failed",0,str(e)))
        processed+=1
    return processed

def report(db: sqlite3.Connection, source: int, expected_bytes: bytes) -> dict:
    db.row_factory=sqlite3.Row
    item=db.execute("SELECT * FROM originals WHERE id=?",(source,)).fetchone()
    tables=[x["name"] for x in db.execute("SELECT name FROM sqlite_master "
        "WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
    runs=[dict(x) for x in db.execute("SELECT worker_name,outcome,derived_count,summary "
                                       "FROM worker_runs ORDER BY id")]
    links=[dict(x) for x in db.execute("SELECT relation_type,evidence_status,rationale "
                                        "FROM relationships ORDER BY id")]
    duo=[dict(x) for x in db.execute("SELECT decimal_value,base,duodecimal_representation,meaning "
                                      "FROM duo_codes ORDER BY id")]
    tiers=[dict(x) for x in db.execute("SELECT tier,COUNT(*) AS count "
                                        "FROM cero_uno_dos GROUP BY tier ORDER BY tier")]
    return {"schema":"nathan.mind-os.local-demo.v1","original_id":source,
            "sha256":item["sha256"],
            "original_bytes_preserved":bytes(item["original_bytes"])==expected_bytes,
            "source_provenance":item["source_provenance"],
            "tables":len(tables),"table_names":sorted(tables),
            "workers_defined":list(KNOWN_WORKERS),
            "worker_slots_waiting_for_original_names":UNASSIGNED_WORKER_SLOTS,
            "worker_runs":runs,"cero_uno_dos":tiers,
            "cero_uno_dos_author_labels":CERO_CANON,"duo_codes":duo,
            "relationships":links,
            "claims_needing_review":db.execute("SELECT COUNT(*) FROM claims "
                "WHERE evidence_status='unverified'").fetchone()[0],
            "independent_evidence_rows":db.execute("SELECT COUNT(*) FROM evidence").fetchone()[0],
            "embeddings_created":db.execute("SELECT COUNT(*) FROM embeddings").fetchone()[0],
            "jobs_left_queued":db.execute("SELECT COUNT(*) FROM worker_jobs "
                                           "WHERE status='queued'").fetchone()[0],
            "scope":"Local reference pipeline; no model, provider, PostgreSQL or pgvector deployment"}

def run_pipeline(payload: bytes,filename: str="sample_input.txt",
                 db_path: str=":memory:") -> dict:
    db=sqlite3.connect(db_path)
    try:
        initialize(db)
        source=ingest(db,payload,filename,"owner-supplied source; assertions unverified")
        drain(db)
        return report(db,source,payload)
    finally:
        db.close()

def main() -> None:
    p=argparse.ArgumentParser(description="Ancient Minds no-network SQLite reference")
    p.add_argument("--source",default=str(Path(__file__).with_name("sample_input.txt")))
    p.add_argument("--db",default=":memory:")
    p.add_argument("--output",default="")
    a=p.parse_args()
    path=Path(a.source)
    result=run_pipeline(path.read_bytes(),path.name,a.db)
    result_json=json.dumps(result,indent=2,ensure_ascii=False)
    if a.output:
        Path(a.output).write_text(result_json+"\n",encoding="utf-8")
    else:
        print(result_json)

if __name__=="__main__":
    main()
