#!/usr/bin/env python3
"""Check 1000 slot ownership without conflating logical slots and hardware."""
from pathlib import Path
from collections import Counter
import csv
root = Path(__file__).parent
def read(filename):
    with (root / filename).open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))
slots=read("slots.csv")
books=read("book-sets.csv")
tech=read("technology-sets.csv")
assert len(slots) == len(books) == len(tech) == 1000
assert len({r["node_id"] for r in slots}) == 1000
assert len({r["book_set_id"] for r in slots}) == 1000
assert len({r["technology_set_id"] for r in slots}) == 1000
assert {r["set_id"] for r in books} == {r["book_set_id"] for r in slots}
assert {r["set_id"] for r in tech} == {r["technology_set_id"] for r in slots}
assert Counter(r["assigned_app_id"] for r in slots) == {
  "bibletopia": 200,"tabor-world": 200,"grapple-it": 200,
  "hook-and-ring": 200,"tabor-tracker-ball": 200
}
assert all(r["allocation_kind"] == "logical" and r["deployment_state"] == "indexed_only" for r in slots)
assert [int(r["slot"]) for r in slots] == list(range(1,1001))
print("PASS: 1000 unique logical slot IDs, each with one app, one book set, one tech set.")
