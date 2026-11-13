#!/usr/bin/env python3
"""Nathan AI / ONE: strict fencepost-boundary contract for technology-v108.

Pure standard-library validation. No external workers, networks, hardware, or
private database are contacted unless the owner explicitly supplies a local
database path with --verify-db; that check is read-only.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import date
import json
from pathlib import Path
import sqlite3


HERE = Path(__file__).resolve().parent
DEFAULT_REGISTRY = HERE / "registry.tech108.json"


class BoundaryContractError(ValueError):
    """Reject ambiguous, skipped, duplicated or out-of-bounds assignments."""


def require_int(value: object, label: str, minimum: int = 0) -> int:
    if type(value) is not int or value < minimum:
        raise BoundaryContractError(f"{label} must be an integer >= {minimum}")
    return value


def inclusive_count(first: int, last: int) -> int:
    require_int(first, "first")
    require_int(last, "last")
    if last < first:
        raise BoundaryContractError("last cannot precede first")
    return last - first + 1


def sequence_after(previous_count: int, incoming_count: int) -> list[int]:
    """One-based new positions after N pre-existing items."""
    require_int(previous_count, "previous_count")
    require_int(incoming_count, "incoming_count")
    return list(range(previous_count + 1, previous_count + incoming_count + 1))


def calendar_count(start: str, end: str, convention: str) -> int:
    """Count dates, not elapsed 24-hour durations; [start,end) is the default policy.

    For precise elapsed hours across timezone changes, use aware datetime
    instants, not date arithmetic or assumptions about daylight-saving days.
    """
    first, last = date.fromisoformat(start), date.fromisoformat(end)
    distance = (last - first).days
    if distance < 0:
        raise BoundaryContractError("end date must not precede start")
    modes = {
        "half_open": distance,
        "inclusive_dates": distance + 1,
        "interior_dates": max(0, distance - 1),
    }
    if convention not in modes:
        raise BoundaryContractError("convention must be explicitly declared")
    return modes[convention]


def validate_registry(data: dict) -> dict:
    if not isinstance(data, dict):
        raise BoundaryContractError("registry must be an object")
    families, units = data.get("families"), data.get("minds")
    if not isinstance(families, list) or not isinstance(units, list):
        raise BoundaryContractError("families and minds must both be arrays")
    if len(families) != 12 or len(units) != 108:
        raise BoundaryContractError("exactly 12 families and 108 units are required")
    counts = data.get("counts", {})
    if any(counts.get(k) != v for k, v in {
        "families": 12, "units_per_family": 9, "units": 108,
        "first_unit": 1, "last_unit": 108
    }.items()):
        raise BoundaryContractError("declared totals do not match 12 x 9")
    if [f.get("technology_family_id") for f in families] != list(range(1, 13)):
        raise BoundaryContractError("family numbering is not contiguous 1..12")
    if [u.get("technology_unit_id") for u in units] != list(range(1, 109)):
        raise BoundaryContractError("unit numbering is not contiguous 1..108")
    if len({u.get("id") for u in units}) != 108:
        raise BoundaryContractError("duplicate unit key")
    for family in families:
        family_id = family["technology_family_id"]
        first = (family_id - 1) * 9 + 1
        last = first + 8
        if (family.get("unit_first"), family.get("unit_last"),
            family.get("unit_count")) != (first, last, 9):
            raise BoundaryContractError(f"incorrect bounds for family {family_id}")
        members = [u for u in units
                   if u.get("technology_family_id") == family_id]
        if [u["technology_unit_id"] for u in members] != list(range(first, last + 1)):
            raise BoundaryContractError(f"missing/duplicated family {family_id} unit")
        if [u.get("family_position") for u in members] != list(range(1, 10)):
            raise BoundaryContractError(f"invalid one-based positions in family {family_id}")
        for unit in members:
            if not unit.get("name") or unit.get("runtime_status") != "indexed_only":
                raise BoundaryContractError("undefined or falsely deployed technology unit")
            if unit.get("external_action") != "none":
                raise BoundaryContractError("technology specification cannot authorize external actions")
    if calendar_count("2026-11-15", "2026-11-22", "half_open") != 7:
        raise BoundaryContractError("broken seven-day contract")
    return {"families_validated": 12, "units_validated": 108,
            "boundary_violations": 0, "registry_contract_compliance": "108/108"}


def summarize(assignments: list[tuple[int, int]],
              expected: set[tuple[int, int]]) -> dict:
    counter = Counter(assignments)
    accepted = {key for key in counter if key in expected}
    return {
        "total_generated": len(assignments),
        "valid_unique_slots": len(accepted),
        "omitted_valid_slots": len(expected - accepted),
        "duplicate_valid_slots": sum(n - 1 for key, n in counter.items()
                                     if key in expected and n > 1),
        "invalid_slots": sum(n for key, n in counter.items() if key not in expected),
    }


def simulate(data: dict, days: int = 7) -> dict:
    gate = validate_registry(data)
    require_int(days, "days", minimum=1)
    families = data["families"]
    expected = {(day, uid) for day in range(days) for uid in range(1, 109)}
    strategies = {"exclude_final": [], "include_extra": [], "fixed": []}
    for day in range(days):
        for fam in families:
            first, last = fam["unit_first"], fam["unit_last"]
            strategies["exclude_final"].extend((day, n) for n in range(first, last))
            strategies["include_extra"].extend((day, n) for n in range(first, last + 2))
            strategies["fixed"].extend((day, n) for n in range(first, last + 1))
    results = {name: summarize(rows, expected) for name, rows in strategies.items()}
    if results["fixed"] != {
        "total_generated": days * 108,
        "valid_unique_slots": days * 108,
        "omitted_valid_slots": 0,
        "duplicate_valid_slots": 0,
        "invalid_slots": 0,
    }:
        raise BoundaryContractError("fixed scheduler failed its integrity gate")
    return {
        "mode": "synthetic_role_slot_simulation_only",
        "days": days,
        "contract": gate,
        "date_example": {
            "half_open_days": calendar_count("2026-11-15", "2026-11-22", "half_open"),
            "inclusive_calendar_dates": calendar_count("2026-11-15", "2026-11-22", "inclusive_dates"),
            "interior_dates": calendar_count("2026-11-15", "2026-11-22", "interior_dates"),
        },
        "schedulers": results,
        "deployment_status": "no worker processes or third-party systems launched",
    }


def verify_imported_db(db_path: Path) -> dict:
    """Verify the owner's already-imported master, never import or alter data."""
    if not db_path.is_file():
        raise BoundaryContractError("master database not present")
    uri = db_path.resolve().as_uri() + "?mode=ro"
    with sqlite3.connect(uri, uri=True) as db:
        actual = {row[0] for row in db.execute(
            "SELECT DISTINCT record_id FROM federation_records "
            "WHERE record_id LIKE 'mind:one-tech108-unit-%'"
        )}
    expected = {f"mind:one-tech108-unit-{n:03}" for n in range(1, 109)}
    missing, extra = sorted(expected - actual), sorted(actual - expected)
    if missing or extra:
        raise BoundaryContractError(f"database coverage incomplete: missing={missing} extra={extra}")
    return {"database_units_verified": 108, "missing": 0, "extra": 0,
            "note": "read-only record coverage, not live software correctness"}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--registry", type=Path, default=DEFAULT_REGISTRY)
    parser.add_argument("--days", type=int, default=7)
    parser.add_argument("--verify-db", type=Path, default=None)
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args()
    data = json.loads(args.registry.read_text(encoding="utf-8"))
    report = simulate(data, args.days)
    if args.verify_db is not None:
        report["imported_db"] = verify_imported_db(args.verify_db)
    rendered = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
    if args.out is not None:
        args.out.write_text(rendered, encoding="utf-8")
    print(rendered, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
