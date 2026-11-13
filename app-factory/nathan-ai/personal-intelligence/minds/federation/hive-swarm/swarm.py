#!/usr/bin/env python3
"""OPERATION SWARM — bounded, source-preserving ONE SQLite database hive.

All "bees" are role records. Twelve local worker functions execute; the
consciouness role additionally runs an owner-controlled functional self-model
in a bounded Node subprocess. No subjective consciousness is asserted.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import uuid

HERE = Path(__file__).resolve().parent
FED = HERE.parent
REPO = HERE.parents[5]
sys.path.insert(0, str(FED))
from federation import open_main

VERSION = "nathan.one.operation-swarm.hive.v1"
MODES = ("deterministic", "functional_self_model", "indexed_only")
RELATIONS = (
    "scientifically_established",
    "historically_documented",
    "author_defined_symbolism",
    "hypothesis_requires_research",
)
WORKERS = (
    "queen", "forager", "scribe", "chemist", "alchemist",
    "harmonizer", "cartographer", "librarian", "examiner",
    "sentinel", "consciouness", "auditor",
)
SOURCE_FILES = {
    "author-excerpt": HERE / "SEVEN_STATIONS_AUTHOR_EXCERPT.md",
    "station-matrix": HERE / "stations.v1.json",
    "catalog": REPO / "app-factory/nathan-ai/personal-intelligence/minds/mind-of-minds/catalog.json",
    "families56": FED / "families-v56/registry.v56.json",
    "dimensions70": FED / "dimensions-v70/registry.v70.json",
    "families75": FED / "families-v75/registry.v75.json",
    "creator-teams": FED / "creator-teams.v074.json",
}

SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS swarm_controls(
  key TEXT PRIMARY KEY, value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS swarm_originals(
  source_id TEXT NOT NULL, sha256 TEXT NOT NULL,
  exact_bytes BLOB NOT NULL, indexed_at TEXT NOT NULL,
  PRIMARY KEY(source_id,sha256)
);
CREATE TRIGGER IF NOT EXISTS swarm_originals_no_update
 BEFORE UPDATE ON swarm_originals
 BEGIN SELECT RAISE(ABORT,'SWARM original bytes are immutable'); END;
CREATE TRIGGER IF NOT EXISTS swarm_originals_no_delete
 BEFORE DELETE ON swarm_originals
 BEGIN SELECT RAISE(ABORT,'SWARM original bytes are immutable'); END;
CREATE TABLE IF NOT EXISTS swarm_bees(
  bee_id TEXT NOT NULL, source_sha256 TEXT NOT NULL,
  name TEXT NOT NULL, mode TEXT NOT NULL
    CHECK(mode IN ('deterministic','functional_self_model','indexed_only')),
  execution TEXT NOT NULL CHECK(execution IN ('bounded_local','not_launched')),
  PRIMARY KEY(bee_id,source_sha256)
);
CREATE TABLE IF NOT EXISTS swarm_nodes(
  node_id TEXT NOT NULL, sha256 TEXT NOT NULL,
  label TEXT NOT NULL, source_class TEXT NOT NULL,
  exact_json TEXT NOT NULL, PRIMARY KEY(node_id,sha256)
);
CREATE TABLE IF NOT EXISTS swarm_edges(
  left_id TEXT NOT NULL, right_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL CHECK(relationship_type IN
   ('scientifically_established','historically_documented',
    'author_defined_symbolism','hypothesis_requires_research')),
  source_sha256 TEXT NOT NULL,
  PRIMARY KEY(left_id,right_id,relationship_type,source_sha256)
);
CREATE TABLE IF NOT EXISTS swarm_runs(
  run_id TEXT PRIMARY KEY, started_at TEXT NOT NULL,
  ended_at TEXT, state TEXT NOT NULL, summary_json TEXT
);
CREATE TABLE IF NOT EXISTS swarm_jobs(
  run_id TEXT NOT NULL REFERENCES swarm_runs(run_id),
  worker TEXT NOT NULL, state TEXT NOT NULL,
  started_at TEXT, ended_at TEXT, result_json TEXT,
  PRIMARY KEY(run_id,worker)
);
CREATE TABLE IF NOT EXISTS swarm_audit(
  id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT NOT NULL,
  worker TEXT NOT NULL, action TEXT NOT NULL,
  detail_json TEXT NOT NULL, recorded_at TEXT NOT NULL
);
"""
def utc():
    return datetime.now(timezone.utc).isoformat()

def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

def digest(raw):
    if isinstance(raw, str):
        raw = raw.encode("utf-8")
    return hashlib.sha256(raw).hexdigest()

def load_source(path):
    if path.is_symlink() or not path.is_file():
        raise ValueError("Missing or symlinked public source: " + str(path))
    raw = path.read_bytes()
    if len(raw) > 5_000_000:
        raise ValueError("Public hive source too large: " + str(path))
    if path.read_bytes() != raw:
        raise ValueError("Source changed during hive read")
    return raw

def validate_stations(data):
    if data.get("schema") != "nathan.one.operation-swarm.seven-stations.v1":
        raise ValueError("Unrecognized Seven Stations author matrix")
    if data.get("author") != "John Nathan Tabor":
        raise ValueError("Authorship changed")
    stations = data["stations"]
    if len(stations) != 7 or [s["station"] for s in stations] != list(range(7, 0, -1)):
        raise ValueError("Seven stations must stay in original Crown-to-Root order")
    if [s["period"] for s in stations] != list(range(1, 8)):
        raise ValueError("Author station-to-period sequence changed")
    if [s["assigned_hz"] for s in stations] != [963, 852, 741, 639, 528, 417, 396]:
        raise ValueError("Assigned frequency sequence changed")
    if [s["note"] for s in stations] != list("BAGFEDC"):
        raise ValueError("Original musical-note sequence changed")
    if [s["cervical"].split(" ")[0] for s in stations] != ["C1", "C2", "C3", "C4", "C5", "C6", "C7"]:
        raise ValueError("Original C1–C7 symbolic labels changed")
    periods = [(1, 2), (3, 10), (11, 18), (19, 36),
               (37, 54), (55, 86), (87, 118)]
    symbols = data["periodic_symbols"]
    if len(symbols) != 7 or [len(p.split()) for p in symbols] != [2, 8, 8, 18, 18, 32, 32]:
        raise ValueError("Periodic-table period counts differ from 118")
    all_symbols = " ".join(symbols).split()
    if len(all_symbols) != 118 or len(set(all_symbols)) != 118:
        raise ValueError("Expected 118 distinct element symbols")
    if all_symbols[:2] != ["H", "He"] or all_symbols[-1] != "Og":
        raise ValueError("First or last element symbol changed")
    if any((s["first_element"], s["last_element"]) != periods[i] for i, s in enumerate(stations)):
        raise ValueError("Original period boundary changed")
    if data["pillars"] != {"spinal": 33, "question_neck": 7, "skeletal": 206, "total": 246}:
        raise ValueError("The existing 246 pillar counts were changed")
    metals = data["classical_planetary_metals"]
    if len(metals) != 7 or len({x[0] for x in metals}) != 7 or len({x[2] for x in metals}) != 7:
        raise ValueError("Classical planet-metal correspondence must contain seven pairs")
    if data.get("relationship_types") != list(RELATIONS):
        raise ValueError("Evidence taxonomy changed")
    return data

def public_sources():
    sources = {name: load_source(path) for name, path in SOURCE_FILES.items()}
    structured = {name: json.loads(raw.decode("utf-8")) for name, raw in sources.items()
                  if name not in ("author-excerpt",)}
    validate_stations(structured["station-matrix"])
    excerpt = sources["author-excerpt"].decode("utf-8")
    for station in structured["station-matrix"]["stations"]:
        keys = (str(station["station"]) + ". " + station["name"], station["cervical"],
                station["chakra"], station["gland"], station["designation"],
                station["start"] + " → " + station["end"])
        if not all(key in excerpt for key in keys):
            raise ValueError("Station transcription missing exact author excerpt phrase")
    counts = [len(structured["catalog"]["minds"]),
              len(structured["families56"]["minds"]),
              len(structured["dimensions70"]["units"]),
              len(structured["families75"]["minds"]),
              len(structured["creator-teams"]["teams"])]
    if counts != [763, 56, 630, 99, 10]:
        raise ValueError("Existing ONE namespace counts changed: " + str(counts))
    return sources, structured

def init(db):
    db.executescript(SCHEMA)
    db.execute("INSERT OR IGNORE INTO swarm_controls VALUES ('owner_veto','0')")
    db.commit()

def log(db, run_id, role, action, detail):
    db.execute("INSERT INTO swarm_audit(run_id,worker,action,detail_json,recorded_at) VALUES (?,?,?,?,?)",
               (run_id, role, action, canonical(detail), utc()))

def pin(db, name, raw):
    sha = digest(raw)
    db.execute("INSERT OR IGNORE INTO swarm_originals VALUES (?,?,?,?)",
               (name, sha, sqlite3.Binary(raw), utc()))
    return sha

def node(db, key, label, source_class, value):
    exact = canonical(value)
    h = digest(exact)
    db.execute("INSERT OR IGNORE INTO swarm_nodes VALUES (?,?,?,?,?)",
               (key, h, label, source_class, exact))
    return key

def edge(db, left, right, kind, source_hash):
    if kind not in RELATIONS:
        raise ValueError("Unsupported evidence type")
    db.execute("INSERT OR IGNORE INTO swarm_edges VALUES (?,?,?,?)",
               (left, right, kind, source_hash))

def bee(db, ident, name, mode, source_sha):
    if mode not in MODES:
        raise ValueError("Unknown worker mode")
    execution = "bounded_local" if mode != "indexed_only" else "not_launched"
    db.execute("INSERT OR IGNORE INTO swarm_bees VALUES (?,?,?,?,?)",
               (ident, source_sha, name, mode, execution))

def worker_queen(db, ctx):
    return {"dispatch": len(WORKERS), "policy": "owner-veto, bounded local workers"}

def worker_forager(db, ctx):
    for key, raw in ctx["sources"].items():
        pin(db, key, raw)
    return {"preserved_source_versions": len(ctx["sources"]), "source_mutations": 0}

def worker_scribe(db, ctx):
    for s in ctx["doc"]["stations"]:
        node(db, "station:" + str(s["station"]), s["name"], "author_defined_symbolism", s)
        node(db, "cervical:" + s["cervical"].split(" ")[0], s["cervical"],
             "author_defined_symbolism", {"author_cervical": s["cervical"]})
    node(db, "pillars:246", "Original 246-pillar count", "author_defined_symbolism",
         ctx["doc"]["pillars"])
    return {"station_records": 7, "cervical_labels": 7, "existing_pillar_ids_renumbered": 0}

def worker_chemist(db, ctx):
    number = 0
    for p, symbols in enumerate(ctx["doc"]["periodic_symbols"], 1):
        node(db, "period:" + str(p), "Period " + str(p),
             "scientifically_established", {"period": p, "size": len(symbols.split())})
        for symbol in symbols.split():
            number += 1
            node(db, "element:" + f"{number:03}", symbol,
                 "scientifically_established",
                 {"atomic_number": number, "symbol": symbol, "period": p})
    if number != 118:
        raise ValueError("Incomplete elemental range")
    return {"element_records": number, "period_records": 7}

def worker_alchemist(db, ctx):
    for planet, metal, symbol in ctx["doc"]["classical_planetary_metals"]:
        node(db, "planet:" + planet, planet, "historically_documented",
             {"historical_body": planet})
        node(db, "metal:" + symbol, metal, "scientifically_established",
             {"element_symbol": symbol, "metal_name": metal})
        edge(db, "planet:" + planet, "metal:" + symbol,
             "historically_documented", ctx["hashes"]["station-matrix"])
    return {"historical_planet_metal_pairs": 7, "magic_claims": 0}

def worker_harmonizer(db, ctx):
    for s in ctx["doc"]["stations"]:
        note, hz = s["note"], s["assigned_hz"]
        node(db, "note:" + note, note, "scientifically_established",
             {"note_label": note, "pitch_frequency_claim": "not_assumed"})
        node(db, "assigned_hz:" + str(hz), str(hz) + " Hz",
             "author_defined_symbolism",
             {"hz_label": hz, "not_equated_to_note_pitch": True})
        edge(db, "station:" + str(s["station"]), "note:" + note,
             "author_defined_symbolism", ctx["hashes"]["station-matrix"])
        edge(db, "station:" + str(s["station"]), "assigned_hz:" + str(hz),
             "author_defined_symbolism", ctx["hashes"]["station-matrix"])
    return {"notes": 7, "assigned_frequencies": 7, "claimed_endocrine_resonances": 0}

def worker_cartographer(db, ctx):
    for s in ctx["doc"]["stations"]:
        n = "station:" + str(s["station"])
        edge(db, n, "period:" + str(s["period"]),
             "author_defined_symbolism", ctx["hashes"]["station-matrix"])
        edge(db, n, "cervical:" + s["cervical"].split(" ")[0],
             "author_defined_symbolism", ctx["hashes"]["station-matrix"])
    number = 0
    for period, symbols in enumerate(ctx["doc"]["periodic_symbols"], 1):
        for _ in symbols.split():
            number += 1
            edge(db, "element:" + f"{number:03}", "period:" + str(period),
                 "scientifically_established", ctx["hashes"]["station-matrix"])
    return {"scientific_element_period_links": 118, "symbolic_station_links": 14}

def worker_librarian(db, ctx):
    doc, hashes = ctx["structured"], ctx["hashes"]
    for x in doc["catalog"]["minds"]:
        bee(db, "mind:" + x["id"], x["name"], "indexed_only", hashes["catalog"])
    for x in doc["families56"]["minds"]:
        bee(db, "family:" + str(x["family_id"]), x["name"], "indexed_only", hashes["families56"])
    for x in doc["dimensions70"]["units"]:
        bee(db, "dimension:" + x["id"], x["name"], "indexed_only", hashes["dimensions70"])
    for x in doc["families75"]["minds"]:
        bee(db, "archetype:" + x["id"], x["name"], "indexed_only", hashes["families75"])
    for x in doc["creator-teams"]["teams"]:
        bee(db, "team:" + x["id"], x["name"], "indexed_only", hashes["creator-teams"])
    for x in WORKERS:
        bee(db, "hive:" + x, x, "functional_self_model" if x == "consciouness"
            else "deterministic", hashes["station-matrix"])
    total = db.execute("SELECT COUNT(DISTINCT bee_id) FROM swarm_bees").fetchone()[0]
    if total != 1570:
        raise ValueError("Hive role census expected 1,570 distinct source-defined identities")
    return {"logical_role_identities": total, "actual_worker_functions": 12, "independent_llm_sessions": 0}

def worker_examiner(db, ctx):
    rows = db.execute("SELECT relationship_type,COUNT(*) FROM swarm_edges GROUP BY relationship_type").fetchall()
    groups = dict(rows)
    if groups.get("scientifically_established") != 118 or groups.get("historically_documented") != 7 or groups.get("author_defined_symbolism") != 28:
        raise ValueError("Evidence-labeled graph did not match expected 118/7/28")
    if db.execute("SELECT COUNT(*) FROM swarm_edges WHERE left_id LIKE 'station:%' AND relationship_type != 'author_defined_symbolism'").fetchone()[0] != 0:
        raise ValueError("Station symbolism was incorrectly asserted as scientific")
    return {"edges_by_class": groups, "unsupported_station_science_claims": 0}

def worker_sentinel(db, ctx):
    veto = db.execute("SELECT value FROM swarm_controls WHERE key='owner_veto'").fetchone()[0]
    if veto != "0":
        raise PermissionError("Owner has vetoed SWARM launch")
    if db.execute("PRAGMA quick_check").fetchone()[0] != "ok":
        raise ValueError("ONE master database quick_check failed")
    return {"owner_veto": False, "outbound_api_calls": 0, "private_database_export": False}

def worker_consciouness(db, ctx):
    bridge = HERE / "consciouness_bridge.cjs"
    result = subprocess.run(["node", str(bridge), "4"], capture_output=True,
                            text=True, timeout=15, check=True)
    data = json.loads(result.stdout)
    if (data["functional_nodes"] != 4 or data["external_execution"] is not False
            or data["subjective_consciousness_claim"] is not False):
        raise ValueError("Functional self-model bridge violated boundaries")
    return {"functional_self_models_exercised": 4,
            "existing_consciouness_core": data["module"],
            "subjective_consciousness_claim": False,
            "external_execution": False}

def worker_auditor(db, ctx):
    counts = status_counts(db)
    if (counts["distinct_bees"] != 1570 or counts["nodes"] != 168 or
            counts["edges"] != 153 or counts["source_versions"] != 7):
        raise ValueError("Hive source inventory or relationship graph incomplete: " + str(counts))
    if db.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
        raise ValueError("ONE master SQLite integrity check failed")
    return {"database_integrity": "ok", "indexed_bees": counts["distinct_bees"],
            "nodes": counts["nodes"], "edges": counts["edges"]}

FUNCTIONS = {
    "queen": worker_queen, "forager": worker_forager,
    "scribe": worker_scribe, "chemist": worker_chemist,
    "alchemist": worker_alchemist, "harmonizer": worker_harmonizer,
    "cartographer": worker_cartographer, "librarian": worker_librarian,
    "examiner": worker_examiner, "sentinel": worker_sentinel,
    "consciouness": worker_consciouness, "auditor": worker_auditor,
}

def status_counts(db):
    names = {
        "source_versions": "swarm_originals",
        "distinct_bees": "swarm_bees",
        "nodes": "swarm_nodes",
        "edges": "swarm_edges",
        "runs": "swarm_runs",
        "jobs": "swarm_jobs",
    }
    output = {}
    for field, table in names.items():
        selector = "COUNT(DISTINCT bee_id)" if field == "distinct_bees" else "COUNT(*)"
        output[field] = db.execute(f"SELECT {selector} FROM {table}").fetchone()[0]
    return output

def launch(db_path):
    sources, documents = public_sources()  # Read and validate before database mutation.
    with open_main(db_path) as db:
        init(db)
        if db.execute("SELECT value FROM swarm_controls WHERE key='owner_veto'").fetchone()[0] == "1":
            raise PermissionError("Owner veto is active: hive did not launch")
        run_id = uuid.uuid4().hex
        hashes = {key: digest(raw) for key, raw in sources.items()}
        ctx = {"sources": sources, "structured": documents,
               "doc": documents["station-matrix"], "hashes": hashes}
        with db:
            db.execute("INSERT INTO swarm_runs VALUES (?,?,?,?,?)",
                       (run_id, utc(), None, "running", None))
            for name in WORKERS:
                db.execute("INSERT INTO swarm_jobs VALUES (?,?,?,?,?,?)",
                           (run_id, name, "queued", None, None, None))
        outcomes = {}
        for name in WORKERS:
            try:
                with db:
                    db.execute("UPDATE swarm_jobs SET state='running',started_at=? WHERE run_id=? AND worker=? AND state='queued'",
                               (utc(), run_id, name))
                    result = FUNCTIONS[name](db, ctx)
                    outcomes[name] = result
                    db.execute("UPDATE swarm_jobs SET state='completed',ended_at=?,result_json=? WHERE run_id=? AND worker=?",
                               (utc(), canonical(result), run_id, name))
                    log(db, run_id, name, "completed", result)
            except Exception as exc:
                with db:
                    db.execute("UPDATE swarm_jobs SET state='failed',ended_at=?,result_json=? WHERE run_id=? AND worker=?",
                               (utc(), canonical({"error": str(exc)}), run_id, name))
                    db.execute("UPDATE swarm_runs SET state='failed',ended_at=? WHERE run_id=?",
                               (utc(), run_id))
                    log(db, run_id, name, "failed", {"error": str(exc)})
                raise
        counts = status_counts(db)
        report = {"schema": VERSION, "run_id": run_id, "state": "completed",
                  "roles_indexed": counts["distinct_bees"], "worker_functions_executed": len(outcomes),
                  "functional_self_models_exercised": 4,
                  "independent_conscious_beings_created": 0,
                  "external_llm_processes_started": 0, "external_actions": 0,
                  "source_versions": counts["source_versions"],
                  "nodes": counts["nodes"], "typed_edges": counts["edges"],
                  "workers": outcomes, "database": "existing ONE SQLite file; not external synchronization"}
        with db:
            db.execute("UPDATE swarm_runs SET state='completed',ended_at=?,summary_json=? WHERE run_id=?",
                       (utc(), canonical(report), run_id))
        return report

def control(db_path, value):
    with open_main(db_path) as db:
        init(db)
        with db:
            db.execute("UPDATE swarm_controls SET value=? WHERE key='owner_veto'", (value,))
        return {"owner_veto": value == "1", "owner_control": "explicit"}

def inspect(db_path):
    path = Path(db_path)
    if not path.is_file():
        return {"schema": VERSION, "initialized": False, "reason": "database file not found"}
    db = sqlite3.connect(path.as_uri() + "?mode=ro", uri=True)
    try:
        table = db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='swarm_runs'").fetchone()
        if not table:
            return {"schema": VERSION, "initialized": False,
                    "reason": "ONE master exists but hive is not installed"}
        counts = status_counts(db)
        last = db.execute("SELECT run_id,state,ended_at FROM swarm_runs ORDER BY started_at DESC LIMIT 1").fetchone()
        veto = db.execute("SELECT value FROM swarm_controls WHERE key='owner_veto'").fetchone()
        return {"schema": VERSION, "initialized": True, **counts,
                "owner_veto": bool(veto and veto[0] == "1"),
                "last_run": dict(zip(("run_id", "state", "ended_at"), last)) if last else None,
                "database_integrity": db.execute("PRAGMA quick_check").fetchone()[0]}
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="NATHAN AI · OPERATION SWARM · ONE DB hive")
    parser.add_argument("--db", required=True, help="Explicit existing ONE SQLite path or disposable local CI file")
    parser.add_argument("--approve-write", action="store_true",
                        help="Explicit authorization for locally mutating the supplied ONE SQLite file")
    parser.add_argument("command", choices=("launch", "status", "veto", "approve"))
    args = parser.parse_args()
    if args.command != "status" and not args.approve_write:
        parser.error("Mutation requires the explicit --approve-write flag")
    if args.command == "launch":
        result = launch(args.db)
    elif args.command == "veto":
        result = control(args.db, "1")
    elif args.command == "approve":
        result = control(args.db, "0")
    else:
        result = inspect(args.db)
    print(json.dumps(result, indent=2, ensure_ascii=False, sort_keys=True))

if __name__ == "__main__":
    main()
