"""Tests for ONE 21-family additive database integration and no-action routing."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("one_families_v21", ROOT / "families_v21.py")
families = importlib.util.module_from_spec(spec)
spec.loader.exec_module(families)


class FamilyRegistryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = families.open_main(Path(self.tmp.name) / "private.sqlite3")

    def tearDown(self):
        self.db.close()
        self.tmp.cleanup()

    def test_all_21_are_distinct_and_one_is_last(self):
        root = families.load_registry()
        self.assertEqual(len(root["minds"]), 21)
        self.assertEqual(root["minds"][-1]["name"], "ONE")
        self.assertEqual([m["source_class"] for m in root["minds"]].count("creator_supplied"), 6)
        self.assertIn("I am a mammal and all mammals are my equals",
                      root["minds"][-1]["author_verbatim"])

    def test_existing_federation_ingest_and_idempotency(self):
        first = families.bootstrap(self.db)
        self.assertEqual(first["new_family_versions"], 21)
        self.assertEqual(first["federation"]["new_records"], 21)
        self.assertEqual(families.status(self.db)["current_families"], 21)
        second = families.bootstrap(self.db)
        self.assertEqual(second["new_family_versions"], 0)
        self.assertEqual(second["federation"]["new_records"], 0)
        self.assertEqual(self.db.execute(
            "SELECT COUNT(*) FROM federation_records "
            "WHERE record_id LIKE 'mind:one-worker-family-%'").fetchone()[0], 21)

    def test_anomaly_routes_to_unknown_but_keeps_one(self):
        families.bootstrap(self.db)
        result = families.propose(
            self.db, "Investigate physics anomaly", "unexplained noise",
            work_class="innovation")
        self.assertEqual(result["primary_family"], 16)
        self.assertEqual(result["policy_families"], [19, 20, 21])
        self.assertTrue(result["approval_required"])
        self.assertEqual(result["execution"], "none")

    def test_one_can_be_selected_for_equal_standing(self):
        families.bootstrap(self.db)
        result = families.propose(self.db, "Review equal standing and consent")
        self.assertEqual(result["primary_family"], 21)

    def test_unapproved_third_party_scope_is_blocked(self):
        families.bootstrap(self.db)
        result = families.propose(self.db, "Privacy relay check", scope="third_party")
        self.assertEqual(result["state"], "blocked")
        self.assertEqual(result["execution"], "none")
        unknown = families.propose(self.db, "Routing check", scope="unknown")
        self.assertEqual(unknown["state"], "review_required")

    def test_source_version_hashes_and_invalid_inputs(self):
        families.bootstrap(self.db)
        for raw, content_hash in self.db.execute(
                "SELECT exact_json,definition_sha256 FROM one_worker_family_versions"):
            self.assertEqual(families.digest(raw), content_hash)
        with self.assertRaises(ValueError):
            families.propose(self.db, "")
        with self.assertRaises(ValueError):
            families.propose(self.db, "Check", scope="unapproved")


if __name__ == "__main__":
    unittest.main()
