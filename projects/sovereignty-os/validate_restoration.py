#!/usr/bin/env python3
"""Read-only validation of the sovereign restoration index."""
import csv
from collections import Counter
from pathlib import Path

root=Path(__file__).parent
with (root/"RESTORATION_MATRIX.csv").open(newline="",encoding="utf-8") as f:
    rows=list(csv.DictReader(f))
required={"id","family","project","kind","restore_action","source_state","cloudflare_state","priority"}
assert rows, "empty restoration matrix"
assert required.issubset(rows[0]), "missing required columns"
ids=[r["id"] for r in rows]
assert len(ids)==len(set(ids)), "duplicate IDs"
assert all(all(r[k].strip() for k in required) for r in rows), "empty required field"
assert all(r["priority"] in {"P0","P1","P2"} for r in rows)
assert all(r["source_state"] in {"verified_source","prior_record","registry_only"} for r in rows)
assert all(r["cloudflare_state"] in {"blocked_new_deploy","unverified","not_deployed","existing_pages"} for r in rows)
print("PASS: %s distinct projects" % len(rows))
print("Families:",dict(Counter(r["family"] for r in rows)))
print("Priorities:",dict(Counter(r["priority"] for r in rows)))
print("No deployment state inferred from project names.")
