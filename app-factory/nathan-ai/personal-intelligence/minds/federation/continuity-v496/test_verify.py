#!/usr/bin/env python3
"""Regression tests for the user-authored Nathan AI 1..496 continuity ledger."""
import copy
from pathlib import Path
import json
import sys
import unittest

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from verify import ContinuityError, source_entries, validate, simulation


class TestContinuity496(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((HERE / "registry.v496.json").read_text(encoding="utf-8"))
        cls.source = (HERE / "USER_SUPPLIED_2026-11-13.txt").read_text(encoding="utf-8")
        cls.tech = json.loads((HERE.parent / "technology-v108" / "registry.tech108.json").read_text(encoding="utf-8"))

    def test_exact_author_source_sha256_and_333_roles(self):
        result = validate(self.data, self.source, self.tech)
        self.assertEqual(result["creator_positions_verified"], 333)
        self.assertEqual(result["source_sha256"], "df17e25d45407f5a75a5c914525692b6501abe16cf8cd4d8d863f62fdf766b4a")
        self.assertEqual(result["next_available"], 497)
        self.assertFalse(result["baseline_1_to_163_verified"])

    def test_9_108_108_108_segments_and_full_496_continuity(self):
        blocks = self.data["blocks"]
        self.assertEqual([(x["first_global_id"], x["last_global_id"], x["count"]) for x in blocks],
                         [(1,163,163),(164,172,9),(173,280,108),(281,388,108),(389,496,108)])
        self.assertEqual(sum(x["count"] for x in blocks), 496)
        self.assertEqual([x["global_id"] for x in self.data["minds"]], list(range(164,497)))
        self.assertEqual(496 - 164 + 1, 333)

    def test_source_has_exactly_all_creator_labels(self):
        rows = source_entries(self.source)
        self.assertEqual(len(rows), 333)
        self.assertEqual([x[1] for x in rows], [x["name"] for x in self.data["minds"]])
        self.assertEqual(rows[0][:2], (164, "The Code Sentinel (Loop & Array Guard)"))
        self.assertEqual(rows[-1][:2], (496, "Quench-Safety Vent"))

    def test_tech108_local_names_preserved(self):
        old = self.tech["minds"]
        new = [r for r in self.data["minds"] if r["layer"] == "technology"]
        self.assertEqual([r["name"] for r in new], [r["name"] for r in old])
        self.assertEqual(new[0]["global_id"],173)
        self.assertEqual(new[-1]["global_id"],280)
        self.assertEqual(old[0]["technology_unit_id"],1)
        self.assertEqual(old[-1]["technology_unit_id"],108)

    def test_108_positional_stack_triplets(self):
        triples=self.data["full_stack_alignment"]
        self.assertEqual(len(triples),108)
        self.assertEqual((triples[0]["technology_global_id"],triples[0]["software_global_id"],triples[0]["hardware_global_id"]),(173,281,389))
        self.assertEqual((triples[-1]["technology_global_id"],triples[-1]["software_global_id"],triples[-1]["hardware_global_id"]),(280,388,496))

    def test_duplicate_missing_added_id_rejected(self):
        for idx,replacement in ((1,164),(100,999)):
            with self.subTest(index=idx):
                item=copy.deepcopy(self.data)
                item["minds"][idx]["global_id"]=replacement
                with self.assertRaises(ContinuityError):
                    validate(item,self.source,self.tech)
        item=copy.deepcopy(self.data)
        item["minds"].pop()
        with self.assertRaises(ContinuityError):
            validate(item,self.source,self.tech)

    def test_incorrect_role_name_and_family_rejected(self):
        item=copy.deepcopy(self.data)
        item["minds"][0]["name"]="Rewritten name"
        with self.assertRaises(ContinuityError):
            validate(item,self.source,self.tech)
        item=copy.deepcopy(self.data)
        item["families"][-1]["last_global_id"]=497
        with self.assertRaises(ContinuityError):
            validate(item,self.source,self.tech)

    def test_original_source_mutation_rejected(self):
        with self.assertRaises(ContinuityError):
            validate(self.data,self.source + "\nmodified",self.tech)

    def test_7_day_simulation(self):
        outcomes=simulation(self.data,7)["scenarios"]
        self.assertEqual(outcomes["fixed"], {"generated":2331,"valid_unique":2331,"omitted":0,"duplicate":0,"invalid":0})
        self.assertEqual(outcomes["omit_final"]["omitted"],259)
        self.assertEqual(outcomes["include_extra"]["duplicate"],252)
        self.assertEqual(outcomes["include_extra"]["invalid"],7)

    def test_1_and_366_days(self):
        for days in (1, 366):
            with self.subTest(days=days):
                scenarios=simulation(self.data,days)["scenarios"]
                self.assertEqual(scenarios["fixed"]["generated"],333*days)
                self.assertEqual(scenarios["fixed"]["omitted"],0)
                self.assertEqual(scenarios["omit_final"]["omitted"],37*days)
                self.assertEqual(scenarios["include_extra"]["duplicate"],36*days)
                self.assertEqual(scenarios["include_extra"]["invalid"],days)
        with self.assertRaises(ContinuityError):
            simulation(self.data,0)

    def test_no_automatic_external_action(self):
        self.assertTrue(all(r["external_action"]=="none" for r in self.data["minds"]))
        self.assertTrue(all(r["runtime_status"]=="indexed_only" for r in self.data["minds"]))


if __name__ == "__main__":
    unittest.main()
