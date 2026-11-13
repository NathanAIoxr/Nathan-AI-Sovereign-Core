#!/usr/bin/env python3
"""Regression checks for a source-disciplined River/Spark + ONE compilation."""
import copy
import json
from pathlib import Path
import unittest

from validate_master import (
    CompilationError, SOURCE_SHA, load, validate_all,
    validate_crosswalk, validate_existing_repo, validate_pack,
    validate_reflex,
)

HERE = Path(__file__).resolve().parent


class TestCompiledMaster(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cross = load("master_crosswalk.json")
        cls.reflex = load("NEW_REFLEX_POINT_DRAFTS_40.json")
        cls.pack = load("knowledge_pack.v074.json")

    def test_every_implemented_namespace_has_distinct_count(self):
        validate_crosswalk(self.cross)
        m = {n["id"]: n for n in self.cross["machine"]}
        n = {x["id"]: x for x in self.cross["manuscript"]}
        self.assertEqual(m["one-v496"]["verified_new_count"], 333)
        self.assertEqual(n["editorial"]["count"], 246)
        self.assertEqual(n["himalayan14"]["count"], 14)
        self.assertEqual(n["isha114"]["count"], 114)

    def test_246_is_editorial_not_246_bones(self):
        man = {x["id"]: x for x in self.cross["manuscript"]}
        self.assertEqual(man["bones"]["count"], 206)
        self.assertEqual(man["spinal"]["parts"], {"segment_studies": 33, "extra_cervical_editorial_reflections": 7})
        self.assertEqual(man["editorial"]["count"], 206 + 33 + 7)

    def test_no_silent_108_identity_equivalence(self):
        self.assertIn("never establishes common identity", self.cross["rule"])
        ids = [x["id"] for x in self.cross["machine"]]
        self.assertIn("tech108", ids)
        ids2 = [x["id"] for x in self.cross["manuscript"]]
        self.assertIn("isha114", ids2)
        self.assertNotEqual(ids, ids2)

    def test_40_drafts_distinct_and_unattributed_as_origins(self):
        validate_reflex(self.reflex)
        self.assertEqual(len(self.reflex["entries"]), 40)
        self.assertEqual(self.reflex["source_excerpt_original_examples_count"], 6)
        self.assertEqual(self.reflex["entries"][0]["proposal_id"], "XR-C1")
        self.assertEqual(self.reflex["entries"][-1]["proposal_id"], "XR-NR7")

    def test_not_fabricated_originals(self):
        r = copy.deepcopy(self.reflex)
        r["entries"][0]["source_status"] = "recovered_original_user_authored"
        with self.assertRaises(CompilationError):
            validate_reflex(r)

    def test_source_link_integrity_and_distinctions(self):
        validate_pack(self.pack, self.cross)
        self.assertEqual(len(self.pack["records"]), 25)
        self.assertEqual(len(self.pack["links"]), 27)
        self.assertTrue(all(e["state"] == "proposed" for e in self.pack["links"]))
        self.assertTrue(all(r["privacy"] == "public" for r in self.pack["records"]))

    def test_missing_or_duplicate_links_fail(self):
        p = copy.deepcopy(self.pack)
        p["links"][0]["right"] = "nonexistent"
        with self.assertRaises(CompilationError):
            validate_pack(p, self.cross)
        p = copy.deepcopy(self.pack)
        p["links"].append(p["links"][0])
        with self.assertRaises(CompilationError):
            validate_pack(p, self.cross)

    def test_existing_code_registries_not_replaced(self):
        r = validate_existing_repo()
        self.assertEqual(r["new_master_ids"], 333)
        self.assertEqual(r["technological_names_checked"], 108)
        self.assertEqual(r["root13_roles_checked"], 13)

    def test_global_contract_change_fails(self):
        c = copy.deepcopy(self.cross)
        c["machine"][0]["verified_new_last"] = 497
        with self.assertRaises(CompilationError):
            validate_crosswalk(c)
        c = copy.deepcopy(self.cross)
        c["manuscript"][2]["count"] = 245
        with self.assertRaises(CompilationError):
            validate_crosswalk(c)

    def test_manuscript_not_misrepresented_as_preexisting_file(self):
        c = (HERE / "THE_RIVER_AND_THE_SPARK_MASTER_EXPANSION.md").read_text(encoding="utf-8")
        self.assertIn("Not a verbatim reconstruction", c)
        self.assertIn("BOOK III — THE MIRROR", c)
        self.assertIn("PART X — THE SOUND, SILENCE & INNER SPEECH LABORATORY", c)
        self.assertIn("PART XI — THE MIRROR ENGINE", c)
        self.assertIn("PART XII — THE LIVING INDEX", c)
        for exact in (
            "Every question begins when something is noticed.",
            "The pause belongs to the rhythm.",
            "A written note can preserve what attention cannot hold.",
            "The strength of a claim depends on what supports it.",
            "A mirror reflects a surface; interpretation asks what the image means.",
            "Capture first; interpretation can follow.",
        ):
            self.assertIn(exact, c)

    def test_attached_file_hash_recorded_without_publishing_it(self):
        self.assertEqual(SOURCE_SHA, self.cross["source_upload_sha256"])
        self.assertEqual(SOURCE_SHA, self.pack["uploaded_file_sha256"])
        self.assertTrue((HERE / "PROVENANCE_AND_GAPS.md").is_file())
        self.assertFalse((HERE / "Pasted markdown.md").exists())
        self.assertIn("not copied into this public GitHub repository",
                      (HERE / "PROVENANCE_AND_GAPS.md").read_text(encoding="utf-8"))

    def test_complete_report_is_bounded_and_auditable(self):
        out = validate_all()
        self.assertEqual(out["status"], "pass_for_declared_scope_only")
        self.assertEqual(out["reproduced_existing_reflex_examples"], 6)
        self.assertEqual(out["new_reflex_drafts_checked"], 40)
        self.assertEqual(out["knowledge_records_checked"], 25)
        self.assertEqual(out["cross_references_checked"], 27)
        self.assertFalse(out["source_attachment_bytes_present_in_repository"])


if __name__ == "__main__":
    unittest.main()
