#!/usr/bin/env python3
"""Deterministic regression tests for Nathan AI's 12 x 9 boundary contract."""
import copy
import json
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from boundary_contract import (
    BoundaryContractError, calendar_count, inclusive_count,
    sequence_after, simulate, validate_registry, verify_imported_db,
)


class TestTechnology108BoundaryContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.registry = json.loads((HERE / "registry.tech108.json").read_text(encoding="utf-8"))

    def test_12_families_108_roles_and_exact_bounds(self):
        self.assertEqual(validate_registry(self.registry)["registry_contract_compliance"], "108/108")
        self.assertEqual([u["technology_unit_id"] for u in self.registry["minds"]], list(range(1, 109)))
        self.assertEqual([f["unit_last"] for f in self.registry["families"]], list(range(9, 109, 9)))

    def test_family_namespace_does_not_renumber_original_one_families(self):
        self.assertTrue(all("family_id" not in u for u in self.registry["minds"]))
        self.assertEqual(self.registry["families"][0]["technology_family_id"], 1)

    def test_7_day_fixed_vs_bugs(self):
        result = simulate(self.registry, 7)["schedulers"]
        self.assertEqual(result["exclude_final"]["valid_unique_slots"], 672)
        self.assertEqual(result["exclude_final"]["omitted_valid_slots"], 84)
        self.assertEqual(result["include_extra"]["duplicate_valid_slots"], 77)
        self.assertEqual(result["include_extra"]["invalid_slots"], 7)
        self.assertEqual(result["fixed"]["total_generated"], 756)
        self.assertEqual(result["fixed"]["omitted_valid_slots"], 0)
        self.assertEqual(result["fixed"]["duplicate_valid_slots"], 0)
        self.assertEqual(result["fixed"]["invalid_slots"], 0)

    def test_6_7_8_calendar_distinctions(self):
        start, end = "2026-11-15", "2026-11-22"
        self.assertEqual(calendar_count(start, end, "interior_dates"), 6)
        self.assertEqual(calendar_count(start, end, "half_open"), 7)
        self.assertEqual(calendar_count(start, end, "inclusive_dates"), 8)
        self.assertEqual(calendar_count(start, start, "half_open"), 0)
        self.assertEqual(calendar_count(start, start, "inclusive_dates"), 1)
        self.assertEqual(calendar_count(start, start, "interior_dates"), 0)

    def test_64_plus_99_and_65_through_163(self):
        self.assertEqual(sequence_after(64, 99), list(range(65, 164)))
        self.assertEqual(inclusive_count(65, 163), 99)
        self.assertEqual(sequence_after(0, 0), [])
        self.assertEqual(inclusive_count(1, 108), 108)

    def test_one_based_ordinal_is_not_python_zero_based_index(self):
        for family in self.registry["families"]:
            ids = [u["technology_unit_id"] for u in self.registry["minds"]
                   if u["technology_family_id"] == family["technology_family_id"]]
            self.assertEqual(ids[0], family["unit_first"])
            self.assertEqual(ids[-1], family["unit_last"])
            self.assertEqual(len(ids), 9)

    def test_rejects_mutations_and_bad_endpoints(self):
        altered = copy.deepcopy(self.registry)
        altered["minds"].pop()
        with self.assertRaises(BoundaryContractError):
            validate_registry(altered)
        altered = copy.deepcopy(self.registry)
        altered["minds"][9]["technology_unit_id"] = 9
        with self.assertRaises(BoundaryContractError):
            validate_registry(altered)
        altered = copy.deepcopy(self.registry)
        altered["families"][-1]["unit_last"] = 109
        with self.assertRaises(BoundaryContractError):
            validate_registry(altered)
        altered = copy.deepcopy(self.registry)
        altered["minds"][-1]["external_action"] = "unapproved"
        with self.assertRaises(BoundaryContractError):
            validate_registry(altered)
        with self.assertRaises(BoundaryContractError):
            inclusive_count(9, 8)
        with self.assertRaises(BoundaryContractError):
            calendar_count("2026-11-22", "2026-11-15", "half_open")
        with self.assertRaises(BoundaryContractError):
            calendar_count("2026-11-15", "2026-11-22", "unspecified")

    def test_1_14_366_day_schedule_property(self):
        for days in (1, 14, 366):
            with self.subTest(days=days):
                results = simulate(self.registry, days)["schedulers"]
                self.assertEqual(results["fixed"]["valid_unique_slots"], 108 * days)
                self.assertEqual(results["fixed"]["omitted_valid_slots"], 0)
                self.assertEqual(results["fixed"]["duplicate_valid_slots"], 0)
                self.assertEqual(results["fixed"]["invalid_slots"], 0)
                self.assertEqual(results["exclude_final"]["omitted_valid_slots"], 12 * days)
                self.assertEqual(results["include_extra"]["duplicate_valid_slots"], 11 * days)
                self.assertEqual(results["include_extra"]["invalid_slots"], days)

    def test_read_only_master_coverage_gate(self):
        with tempfile.TemporaryDirectory() as tmp:
            db_path = Path(tmp) / "ONE_Federation_Master.sqlite3"
            with sqlite3.connect(db_path) as db:
                db.execute("CREATE TABLE federation_records(record_id TEXT NOT NULL)")
                db.executemany("INSERT INTO federation_records VALUES(?)",
                    [(f"mind:one-tech108-unit-{n:03}",) for n in range(1, 109)])
            self.assertEqual(verify_imported_db(db_path)["database_units_verified"], 108)
            with sqlite3.connect(db_path) as db:
                db.execute("DELETE FROM federation_records WHERE record_id = 'mind:one-tech108-unit-108'")
            with self.assertRaises(BoundaryContractError):
                verify_imported_db(db_path)


if __name__ == "__main__":
    unittest.main()
