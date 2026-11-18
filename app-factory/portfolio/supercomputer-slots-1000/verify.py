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

# Validate the *additive* D1 migration offline, including idempotent seeding.
import sqlite3
connection = sqlite3.connect(":memory:")
connection.execute("PRAGMA foreign_keys = ON")
migration=(root / "migration.sql").read_text(encoding="utf-8")
for pass_no in range(2):
    connection.executescript(migration)
    for table, expected in (
        ("virtual_app_v1",5),
        ("virtual_supercomputer_slot_v1",1000),
        ("virtual_book_set_v1",1000),
        ("virtual_technology_set_v1",1000),
    ):
        actual = connection.execute("SELECT COUNT(*) FROM " + table).fetchone()[0]
        assert actual == expected, (pass_no, table, actual)
    assert connection.execute("PRAGMA foreign_key_check").fetchall() == []
    group_sizes=connection.execute(
        "SELECT app_id,COUNT(*) FROM virtual_supercomputer_slot_v1 GROUP BY app_id"
    ).fetchall()
    assert len(group_sizes)==5 and all(count==200 for _,count in group_sizes)
print("PASS: additive migration runs twice and maintains 5 apps + 1000 slots/book-sets/tech-sets.")
