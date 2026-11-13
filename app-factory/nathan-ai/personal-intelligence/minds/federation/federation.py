#!/usr/bin/env python3
"""ONE Federation: additive, read-only source ingestion and six auditable workers.

Nathan Tabor / Nathan AI. The main database is local/private by default.
Never commit a generated SQLite database or imported private source content.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sqlite3

def now():
    return datetime.now(timezone.utc).isoformat()

def sha(b):
    return hashlib.sha256(b).hexdigest()

def file_sha(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        while chunk := f.read(1024 * 1024):
            h.update(chunk)
    return h.hexdigest()

SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS federation_sources(
  source_id TEXT PRIMARY KEY, label TEXT NOT NULL, source_path TEXT NOT NULL,
  source_type TEXT NOT NULL, file_sha256 TEXT NOT NULL, bytes INTEGER NOT NULL,
  indexed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS federation_tables(
  source_id TEXT NOT NULL REFERENCES federation_sources(source_id),
  table_name TEXT NOT NULL, rows_count INTEGER NOT NULL,
  PRIMARY KEY(source_id,table_name)
);
CREATE TABLE IF NOT EXISTS federation_records(
  source_id TEXT NOT NULL REFERENCES federation_sources(source_id),
  record_id TEXT NOT NULL, content_sha256 TEXT NOT NULL,
  exact_source_text TEXT NOT NULL, title TEXT NOT NULL, record_kind TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'CERO' CHECK(tier IN ('CERO','UNO','DOS')),
  PRIMARY KEY(source_id,record_id,content_sha256)
);
CREATE INDEX IF NOT EXISTS ix_federation_title ON federation_records(title);
CREATE TABLE IF NOT EXISTS federation_record_metadata(
  source_id TEXT NOT NULL, record_id TEXT NOT NULL, content_sha256 TEXT NOT NULL,
  source_locator TEXT NOT NULL, provenance TEXT NOT NULL, evidence_status TEXT NOT NULL,
  kind TEXT NOT NULL, tags_json TEXT NOT NULL, privacy TEXT NOT NULL,
  definition_json TEXT NOT NULL,
  PRIMARY KEY(source_id,record_id,content_sha256),
  FOREIGN KEY(source_id,record_id,content_sha256)
    REFERENCES federation_records(source_id,record_id,content_sha256)
);
CREATE TABLE IF NOT EXISTS federation_proposals(
  source_id TEXT NOT NULL, record_id TEXT NOT NULL, content_sha256 TEXT NOT NULL,
  system TEXT NOT NULL, proposed_code TEXT NOT NULL,
  review_state TEXT NOT NULL, rationale TEXT NOT NULL,
  PRIMARY KEY(source_id,record_id,content_sha256,system)
);
CREATE TABLE IF NOT EXISTS federation_links(
  left_source TEXT NOT NULL, left_record TEXT NOT NULL,
  right_source TEXT NOT NULL, right_record TEXT NOT NULL,
  relation TEXT NOT NULL, state TEXT NOT NULL,
  PRIMARY KEY(left_source,left_record,right_source,right_record,relation)
);
CREATE TABLE IF NOT EXISTS federation_jobs(
  id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT NOT NULL,
  started_at TEXT NOT NULL, ended_at TEXT,
  state TEXT NOT NULL, report_json TEXT
);
CREATE TABLE IF NOT EXISTS federation_audit(
  id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL,
  role TEXT NOT NULL, action TEXT NOT NULL, details_json TEXT NOT NULL
);
"""

def open_main(path):
    c=sqlite3.connect(str(path))
    c.executescript(SCHEMA)
    c.execute("PRAGMA foreign_keys=ON")
    return c

def audit(c, role, action, payload):
    c.execute("INSERT INTO federation_audit(at,role,action,details_json) VALUES(?,?,?,?)",
              (now(), role, action, json.dumps(payload, ensure_ascii=False)))

def ingest(c, filename):
    path=Path(filename).expanduser().resolve(strict=True)
    if not path.is_file() or path.is_symlink():
        raise ValueError("Source must be a regular non-symlink file")
    if path.suffix.lower() not in (".sqlite", ".sqlite3", ".db", ".json"):
        raise ValueError("Allowed sources: SQLite or JSON Mind of Minds catalog")
    source_id=sha(str(path).encode())[:20]
    kind="json" if path.suffix.lower()==".json" else "sqlite"
    # Preflight known Tech108 schema before writing any database metadata.
    # Other legacy source formats remain unchanged and are not declared
    # universally clean merely because this adapter exists.
    if kind=="json":
        preflight=json.loads(path.read_text(encoding="utf-8"))
        if isinstance(preflight,dict) and preflight.get("schema")=="nathan.one.federation.technology-worker-codex.v108":
            import sys
            sys.path.insert(0,str(Path(__file__).resolve().parent / "technology-v108"))
            from boundary_contract import validate_registry
            validate_registry(preflight)
    c.execute("""INSERT INTO federation_sources VALUES(?,?,?,?,?,?,?)
       ON CONFLICT(source_id) DO UPDATE SET file_sha256=excluded.file_sha256,
       bytes=excluded.bytes,indexed_at=excluded.indexed_at""",
       (source_id,path.name,str(path),kind,file_sha(path),path.stat().st_size,now()))
    added=0
    tables=0
    def record(key,title,exact,record_kind):
        nonlocal added
        if not isinstance(exact,str): raise ValueError("Expected a text original")
        before=c.total_changes
        c.execute("INSERT OR IGNORE INTO federation_records(source_id,record_id,content_sha256,exact_source_text,title,record_kind) VALUES(?,?,?,?,?,?)",
          (source_id,str(key),sha(exact.encode("utf-8")),exact,str(title),record_kind))
        added+=int(c.total_changes>before)
        return sha(exact.encode("utf-8"))
    if kind=="sqlite":
        # URI read-only + immutable: never modify a source database.
        source=sqlite3.connect(f"file:{path.as_posix()}?mode=ro&immutable=1",uri=True)
        try:
            if source.execute("PRAGMA quick_check").fetchone()[0]!="ok":
                raise ValueError("Source failed SQLite quick_check")
            names=[x[0] for x in source.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
            for name in names:
                if name.startswith(("item_fts","master_catalog_fts","mind_search_")):
                    continue
                safe='"'+name.replace('"','""')+'"'
                count=source.execute("SELECT COUNT(*) FROM "+safe).fetchone()[0]
                c.execute("INSERT OR REPLACE INTO federation_tables VALUES(?,?,?)",(source_id,name,count))
                tables+=1
            if "item" in names:
                for key,title,raw in source.execute("SELECT key,title,record_json FROM item"):
                    record("item:"+key,title,raw,"original-item")
            if "master_catalog" in names:
                for cat,key,title,raw in source.execute("SELECT kind,id,title,raw_record_json FROM master_catalog"):
                    record("catalog:"+cat+":"+key,title,raw,"catalog-entry")
            if "mind_definitions" in names:
                for key,title,raw in source.execute("SELECT mind_id,name,definition_json FROM mind_definitions"):
                    record("mind:"+key,title,raw,"mind-registry")
        finally:
            source.close()
    else:
        data=json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data,dict) and data.get("schema") == "nathan.one.federation.knowledge.v074":
            items=data.get("records")
            edges=data.get("links")
            if not isinstance(items,list) or not isinstance(edges,list):
                raise ValueError("Knowledge v074 input requires records and links arrays")
            ids=set()
            for item in items:
                if not isinstance(item,dict) or not isinstance(item.get("id"),str) or not isinstance(item.get("exact_text"),str) or not isinstance(item.get("title"),str):
                    raise ValueError("Every knowledge record needs id, title and exact_text strings")
                if not item["id"] or not item["title"] or not item["exact_text"]:
                    raise ValueError("Knowledge records must not have blank ids, titles, or source text")
                if item["id"] in ids:
                    raise ValueError("Duplicate knowledge record id: "+item["id"])
                ids.add(item["id"])
            for edge in edges:
                if not isinstance(edge,dict) or edge.get("left") not in ids or edge.get("right") not in ids or not isinstance(edge.get("relation"),str):
                    raise ValueError("Knowledge link refers to an unknown record id")
            for item in items:
                key="knowledge:"+item["id"]
                digest=record(key,item["title"],item["exact_text"],"knowledge-v074")
                c.execute("""INSERT OR IGNORE INTO federation_record_metadata
                    (source_id,record_id,content_sha256,source_locator,provenance,evidence_status,kind,tags_json,privacy,definition_json)
                    VALUES(?,?,?,?,?,?,?,?,?,?)""",
                  (source_id,key,digest,item.get("source_locator",""),item.get("provenance",""),
                   item.get("evidence_status","unreviewed"),item.get("kind","knowledge"),
                   json.dumps(item.get("tags",[]),ensure_ascii=False),item.get("privacy","private"),
                   json.dumps(item,ensure_ascii=False,sort_keys=True)))
            for edge in edges:
                c.execute("""INSERT OR IGNORE INTO federation_links
                    (left_source,left_record,right_source,right_record,relation,state)
                    VALUES(?,?,?,?,?,?)""",
                  (source_id,"knowledge:"+edge["left"],source_id,"knowledge:"+edge["right"],
                   edge["relation"],"proposed"))
            c.execute("INSERT OR REPLACE INTO federation_tables VALUES(?,?,?)",
                      (source_id,"v074_knowledge",len(items)))
            tables+=1
        else:
            if not isinstance(data,dict) or not isinstance(data.get("minds"),list):
                raise ValueError("JSON input must contain a 'minds' array or v074 knowledge pack")
            for item in data["minds"]:
                if isinstance(item,dict) and "id" in item:
                    record("mind:"+str(item["id"]),item.get("name",item["id"]),
                           json.dumps(item,sort_keys=True,ensure_ascii=False),"mind-registry")
            c.execute("INSERT OR REPLACE INTO federation_tables VALUES(?,?,?)",
                      (source_id,"minds",len(data["minds"])))
            tables+=1
    report={"source_id":source_id,"new_records":added,"tables":tables}
    audit(c,"Leonardo","ingested",report)
    c.commit()
    return report

def job(c,role,fn):
    cur=c.execute("INSERT INTO federation_jobs(role,started_at,state) VALUES(?,?,?)",
                  (role,now(),"running"))
    try:
        report=fn()
        c.execute("UPDATE federation_jobs SET ended_at=?,state=?,report_json=? WHERE id=?",
                  (now(),"completed",json.dumps(report),cur.lastrowid))
        audit(c,role,"completed",report)
        c.commit()
        return report
    except Exception as error:
        c.execute("UPDATE federation_jobs SET ended_at=?,state=?,report_json=? WHERE id=?",
                  (now(),"failed",json.dumps({"error":str(error)}),cur.lastrowid))
        c.commit()
        raise

def run(c):
    result={}
    result["Leonardo"]=job(c,"Leonardo",lambda:{
        "sources":c.execute("SELECT COUNT(*) FROM federation_sources").fetchone()[0],
        "records":c.execute("SELECT COUNT(*) FROM federation_records").fetchone()[0]})
    def donatello():
        added=0
        for s,r,h,kind in c.execute("SELECT source_id,record_id,content_sha256,record_kind FROM federation_records"):
            system="Dewey-broad-proposed" if kind=="mind-registry" else "Duo-12-proposed"
            code="000" if kind=="mind-registry" else "unassigned"
            before=c.total_changes
            c.execute("INSERT OR IGNORE INTO federation_proposals VALUES(?,?,?,?,?,?,?)",
                      (s,r,h,system,code,"needs-owner-review","Not an official classification"))
            added+=int(c.total_changes>before)
        return {"new_review_proposals":added}
    result["Donatello"]=job(c,"Donatello",donatello)
    def raphael():
        count=0
        for original,h in c.execute("SELECT exact_source_text,content_sha256 FROM federation_records"):
            count+=1
            if sha(original.encode("utf-8"))!=h:
                raise ValueError("Original checksum mismatch")
        return {"checked":count,"checksum_failures":0}
    result["Raphael"]=job(c,"Raphael",raphael)
    def michelangelo():
        added=0
        previous=None
        for s,r,h in c.execute(
            "SELECT source_id,record_id,content_sha256 FROM federation_records ORDER BY content_sha256,source_id,record_id"):
            if previous and previous[2]==h and (s,r)!=(previous[0],previous[1]):
                before=c.total_changes
                c.execute("INSERT OR IGNORE INTO federation_links VALUES(?,?,?,?,?,?)",
                          (previous[0],previous[1],s,r,"exact-original-SHA256","machine-verified"))
                added+=int(c.total_changes>before)
            previous=(s,r,h)
        return {"new_exact_content_links":added}
    result["Michelangelo"]=job(c,"Michelangelo",michelangelo)
    result["DaVinci"]=job(c,"DaVinci",lambda:{
        "indexed_records":c.execute("SELECT COUNT(*) FROM federation_records").fetchone()[0],
        "provenance_links":c.execute("SELECT COUNT(*) FROM federation_links").fetchone()[0]})
    result["AncientSpecialists"]=job(c,"AncientSpecialists",lambda:{
        "CERO":c.execute("SELECT COUNT(*) FROM federation_records WHERE tier='CERO'").fetchone()[0],
        "UNO":c.execute("SELECT COUNT(*) FROM federation_records WHERE tier='UNO'").fetchone()[0],
        "DOS":c.execute("SELECT COUNT(*) FROM federation_records WHERE tier='DOS'").fetchone()[0],
        "classification":"owner review required; LoC/Dewey/Duo not claimed as official"})
    return result

def search_records(c,query,limit=20):
    """Search indexed titles, record IDs and exact source text; do not rewrite originals."""
    pattern="%"+str(query).replace("\\","\\\\").replace("%","\\%").replace("_","\\_")+"%"
    limit=max(1,min(int(limit),100))
    return [
        dict(source_id=s,record_id=r,title=t,record_kind=k,evidence_status=status)
        for s,r,t,k,status in c.execute(
            """SELECT f.source_id,f.record_id,f.title,f.record_kind,
                      COALESCE(m.evidence_status,'not-individually-reviewed')
               FROM federation_records f
               LEFT JOIN federation_record_metadata m
                 ON f.source_id=m.source_id
                AND f.record_id=m.record_id
                AND f.content_sha256=m.content_sha256
               WHERE f.title LIKE ? ESCAPE '\\'
                  OR f.record_id LIKE ? ESCAPE '\\'
                  OR f.exact_source_text LIKE ? ESCAPE '\\'
               ORDER BY f.title,f.source_id LIMIT ?""",
            (pattern,pattern,pattern,limit))
    ]

def main():
    p=argparse.ArgumentParser(description="Nathan AI ONE local, private federation")
    p.add_argument("--db",default="ONE_Federation_Master.sqlite3")
    sub=p.add_subparsers(dest="cmd",required=True)
    sub.add_parser("init")
    boundary=sub.add_parser("validate-boundaries")
    boundary.add_argument("payload",help="JSON object to validate; never imported by this command")
    boundary.add_argument("contract",help="JSON field-to-type mapping")
    i=sub.add_parser("ingest");i.add_argument("sources",nargs="+")
    sub.add_parser("run");sub.add_parser("status")
    q=sub.add_parser("search");q.add_argument("query");q.add_argument("--limit",type=int,default=20)
    a=p.parse_args()
    if a.cmd == "validate-boundaries":
        # Read-only, owner-selected validation: never open or create a master DB.
        import sys
        sys.path.insert(0,str(Path(__file__).resolve().parent / "fencepost-error-syndrome"))
        from core_primitives import sanitize_json
        raw=json.loads(Path(a.payload).read_text(encoding="utf-8"))
        contract=json.loads(Path(a.contract).read_text(encoding="utf-8"))
        result=sanitize_json(raw,contract)
        print(json.dumps({"valid":True,"validated_fields":len(result),
                          "contract":"nathan.one.root13.boundary.v1"},indent=2))
        return
    c=open_main(a.db)
    if a.cmd=="init":out={"status":"ready","db":a.db}
    elif a.cmd=="ingest":out=[ingest(c,x) for x in a.sources]
    elif a.cmd=="run":out=run(c)
    elif a.cmd=="status":out={
        "sources":c.execute("SELECT COUNT(*) FROM federation_sources").fetchone()[0],
        "records":c.execute("SELECT COUNT(*) FROM federation_records").fetchone()[0],
        "tables":c.execute("SELECT COUNT(*) FROM federation_tables").fetchone()[0],
        "integrity":c.execute("PRAGMA quick_check").fetchone()[0]}
    else:
        out=search_records(c,a.query,a.limit)
    print(json.dumps(out,indent=2,ensure_ascii=False))
    c.close()

if __name__=="__main__":
    main()
