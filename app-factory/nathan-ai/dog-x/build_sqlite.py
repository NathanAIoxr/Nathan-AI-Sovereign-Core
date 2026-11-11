#!/usr/bin/env python3
"""Build or verify an owner-local DOG-X SQLite database from source-locked JSON.

No network requests, executable human/animal augmentation, or external AI actions.
Usage:
  python3 build_sqlite.py --out DOG_X_Wolverine_Upgrade_Database.sqlite
  python3 build_sqlite.py --out DOG_X_Wolverine_Upgrade_Database.sqlite --verify
"""
from __future__ import annotations
import argparse
import json
import pathlib
import sqlite3
import sys

HERE = pathlib.Path(__file__).resolve().parent
EXPECTED_UPGRADES = 77
EXPECTED_METHODS = 20
SCHEMA = "nathan-ai.dog-x.upgrade-database.v1"
METHOD_SCHEMA = "nathan-ai.dog-x.digital-methods.v1"

def inputs():
    db = json.loads((HERE / "upgrades.json").read_text(encoding="utf-8"))
    methods = json.loads((HERE / "methods.json").read_text(encoding="utf-8"))
    if db.get("schema") != SCHEMA or methods.get("schema") != METHOD_SCHEMA:
        raise ValueError("Source schema changed: review before creating a database")
    items = db["upgrades"]
    specs = methods["methods"]
    if len(items) != EXPECTED_UPGRADES or len(specs) != EXPECTED_METHODS:
        raise ValueError("Source count differs from reviewed catalog")
    ids = set()
    sources = set()
    for x in items:
        if x["upgradeId"] in ids or x["parentConceptId"] in sources:
            raise ValueError("Duplicate upgrade / parent source")
        ids.add(x["upgradeId"]); sources.add(x["parentConceptId"])
        if x["methodId"] not in specs:
            raise ValueError("Method not defined for " + x["upgradeId"])
        if x["isVerifiedMedicalProcedure"] or x["requiresRealWorldBodyOrAnimalModification"]:
            raise ValueError("Unsafe physical procedure in source data")
        if x["executableMode"] != "SOFTWARE_KNOWLEDGE_MODEL_OR_LOCAL_OWNER_APPROVED_WORKFLOW_ONLY":
            raise ValueError("Unexpected executable mode")
    return db, methods

def create(out: pathlib.Path) -> dict:
    db, methods = inputs()
    if out.resolve() in {HERE / "upgrades.json", HERE / "methods.json", HERE / "schema.sql"}:
        raise ValueError("Never overwrite original source")
    if out.exists():
        raise FileExistsError("Output already exists: use a fresh filename or remove only your own old export")
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        with sqlite3.connect(out) as con:
            con.execute("PRAGMA foreign_keys=ON")
            con.executescript((HERE / "schema.sql").read_text(encoding="utf-8"))
            meta = {
                "schema": SCHEMA,
                "title": db["name"],
                "creator_universe": db["authorUniverse"],
                "source_policy": db["sourcePolicy"],
                "fiction_vs_implementation": db["classification"],
                "physical_or_animal_modifications": "0",
                "human_authority": "YES IS YES — NO IS NO"
            }
            con.executemany("INSERT INTO database_meta(key,value) VALUES (?,?)", sorted(meta.items()))
            for method_id, method in methods["methods"].items():
                con.execute("INSERT INTO methods(method_id,name) VALUES (?,?)",(method_id,method["name"]))
                for n,step in enumerate(method["steps"],1):
                    con.execute("INSERT INTO method_steps(method_id,step_number,description) VALUES (?,?,?)",
                                (method_id,n,step))
            for x in db["upgrades"]:
                con.execute("""INSERT INTO upgrades (
                    upgrade_id,parent_concept_id,source_reference,source_mechanism,dog_upgrade,
                    dog_implementation_goal,canine_avatar_interpretation,method_id,evidence_status,
                    primary_source_type,original_catalog_reference,executable_mode,
                    medical_procedure_verified,real_body_or_animal_modification,
                    human_consent_required,original_records_preserved
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", (
                    x["upgradeId"], x["parentConceptId"], x["sourceCharacterOrTradition"],
                    x["fictionalOrHistoricalMechanism"], x["dogAiUpgrade"],x["dogImplementationGoal"],
                    x["dogAvatarInterpretation"],x["methodId"],x["evidenceStatus"],
                    x["primarySourceType"],x["originalCatalogReference"],x["executableMode"],
                    0,0,1,1
                ))
                for i,url in enumerate(x["citedSourceUrls"],1):
                    con.execute("INSERT INTO upgrade_citations(upgrade_id,source_order,url) VALUES (?,?,?)",
                                (x["upgradeId"],i,url))
            con.commit()
        report=verify(out)
        return report
    except Exception:
        if out.exists():out.unlink()
        raise

def verify(path: pathlib.Path) -> dict:
    if not path.is_file():raise FileNotFoundError(path)
    with sqlite3.connect(f"file:{path.resolve()}?mode=ro",uri=True) as con:
        con.execute("PRAGMA foreign_keys=ON")
        counts=con.execute("SELECT * FROM safe_summary").fetchone()
        integrity=con.execute("PRAGMA integrity_check").fetchone()[0]
        foreign=con.execute("PRAGMA foreign_key_check").fetchall()
        meta=dict(con.execute("SELECT key,value FROM database_meta").fetchall())
        wolverine=con.execute("SELECT COUNT(*) FROM wolverine_core").fetchone()[0]
        if counts[0]!=EXPECTED_UPGRADES or counts[1]!=EXPECTED_METHODS or wolverine!=11:
            raise ValueError("Database counts differ from the original review")
        if counts[-1] != 0 or integrity!="ok" or foreign:
            raise ValueError("Database physical safety / integrity / foreign-key check failed")
        return {
            "database":str(path),
            "upgrades":counts[0],
            "methods":counts[1],
            "documented_steps":counts[2],
            "wolverine_core":counts[3],
            "original_dog_avatar_extensions":counts[4],
            "verified_source_links":counts[5],
            "physical_modifications":counts[6],
            "integrity":integrity,
            "source_schema":meta.get("schema")
        }

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--out",required=True,type=pathlib.Path)
    parser.add_argument("--verify",action="store_true",help="Only inspect an existing database")
    args=parser.parse_args()
    result=verify(args.out) if args.verify else create(args.out)
    print(json.dumps(result,indent=2,ensure_ascii=False))

if __name__=="__main__":
    main()
