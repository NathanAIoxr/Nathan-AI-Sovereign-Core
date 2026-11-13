#!/usr/bin/env python3
"""Handling Life source-safe worker integration for ONE Database Federation v074.

Existing worker roles perform deterministic indexing, proposals, hash checks and
audits. This is NOT a remote crawler, deepfake classifier or auto-takedown service.
Owner-private SQLite data never belongs in public GitHub Actions.
"""
import argparse
from collections import Counter
import json
from pathlib import Path
import sqlite3
from federation import file_sha, ingest, open_main, run

HERE = Path(__file__).resolve().parent
PACK = HERE / "data" / "handling-life-root-identity-v074.json"
DEFAULT_INPUTS = (
    HERE.parent / "mind-of-minds" / "catalog.json",
    HERE / "data" / "space-final-frontier-meru-v074.json",
    HERE / "data" / "nathan-method-integrated-v074.json",
    PACK,
)
ROLES = ("Leonardo", "Donatello", "Raphael", "Michelangelo", "DaVinci", "AncientSpecialists")

def validate_pack(path=PACK):
    """Reject invalid records without altering the original pack."""
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    if raw.get("schema") != "nathan.one.federation.knowledge.v074":
        raise ValueError("Unexpected ONE v074 source schema")
    records, links = raw.get("records"), raw.get("links")
    if not isinstance(records, list) or not isinstance(links, list):
        raise ValueError("Missing records or links")
    ids = set()
    for rec in records:
        if not isinstance(rec, dict) or not all(
            isinstance(rec.get(key), str) and rec[key].strip()
            for key in ("id", "title", "exact_text", "kind", "provenance", "source_locator",
                        "evidence_status", "privacy", "tier")
        ):
            raise ValueError("Invalid provenance or source record")
        if rec["id"] in ids:
            raise ValueError("Duplicate record ID")
        ids.add(rec["id"])
        if rec["tier"] != "CERO":
            raise ValueError("Unreviewed sources must stay CERO")
        if rec["privacy"] != "public-design-only":
            raise ValueError("Private records cannot be processed by public workers")
    for edge in links:
        if not isinstance(edge, dict) or edge.get("left") not in ids or edge.get("right") not in ids:
            raise ValueError("Unknown relationship endpoint")
        if not isinstance(edge.get("relation"), str) or not edge["relation"]:
            raise ValueError("Missing relationship label")
    return raw

def process(db_path, report_path, public_inputs=DEFAULT_INPUTS):
    source = validate_pack()
    master = open_main(db_path)
    reports = []
    try:
        for f in public_inputs:
            reports.append(ingest(master, f))
        result = run(master)
        if tuple(result.keys()) != ROLES:
            raise ValueError("Missing or reordered federation workers")
        if result["Raphael"]["checksum_failures"] != 0:
            raise ValueError("Root-original hash validation failed")
        if master.execute("PRAGMA quick_check").fetchone()[0] != "ok":
            raise ValueError("ONE Federation integrity failure")
        source_rows = master.execute(
            "SELECT COUNT(*) FROM federation_records").fetchone()[0]
        meta_rows = master.execute(
            "SELECT COUNT(*) FROM federation_record_metadata").fetchone()[0]
        pack_statuses = Counter(x["evidence_status"] for x in source["records"])
        pending = sorted(
            r["id"] for r in source["records"]
            if r["kind"] not in ("creator-exact", "creator-exact-excerpt")
        )
        output = {
            "system": "NATHAN AI — ONE DATABASE FEDERATION v074",
            "module": "Handling Life Root Digital Identity / Digital Defense",
            "mode": "public-safe ephemeral or owner-controlled local; no remote agents",
            "pack_sha256": file_sha(PACK),
            "source_pack_records": len(source["records"]),
            "source_pack_proposed_links": len(source["links"]),
            "source_statuses": dict(sorted(pack_statuses.items())),
            "new_records_in_each_ingest": [r["new_records"] for r in reports],
            "federation_total_records": source_rows,
            "federation_metadata_rows": meta_rows,
            "existing_workers_executed": list(result),
            "role_reports": result,
            "handling_life_owner_review_ids": pending,
            "automated_actions": {
                "approved_takedowns_sent": 0,
                "external_sites_scanned": 0,
                "private_databases_synchronized": 0,
                "source_originals_modified": 0
            },
            "claims": "Proposed technical architecture only; human authorization is required for enforcement."
        }
        Path(report_path).parent.mkdir(parents=True, exist_ok=True)
        Path(report_path).write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return output
    finally:
        master.close()

def main():
    parser = argparse.ArgumentParser(description="Run Handling Life public-safe workers in ONE federation")
    parser.add_argument("--db", required=True, help="Owner-controlled or ephemeral SQLite output")
    parser.add_argument("--report", required=True, help="Local JSON audit output; not raw private source")
    args = parser.parse_args()
    result = process(args.db, args.report)
    print(json.dumps({
        "records": result["federation_total_records"],
        "handling_life_records": result["source_pack_records"],
        "workers": result["existing_workers_executed"],
        "checksum_failures": result["role_reports"]["Raphael"]["checksum_failures"],
        "owner_reviews": len(result["handling_life_owner_review_ids"])
    }, ensure_ascii=False, sort_keys=True))

if __name__ == "__main__":
    main()
