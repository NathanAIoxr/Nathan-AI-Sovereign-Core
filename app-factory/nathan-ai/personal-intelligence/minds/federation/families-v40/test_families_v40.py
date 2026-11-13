"""No-network tests for Nathan AI ONE worker families 1–40."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("one_families_v40", HERE / "families_v40.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Master40Tests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = module.core.open_main(Path(self.tmp.name) / "ONE.sqlite3")

    def tearDown(self):
        self.db.close()
        self.tmp.cleanup()

    def test_40_unique_slots_and_one_still_21(self):
        r = module.load_registry()
        self.assertEqual([x["family_id"] for x in r["minds"]], list(range(1, 41)))
        self.assertEqual(r["minds"][20]["name"], "ONE")
        self.assertIn("all mammals are my equals", r["minds"][20]["author_verbatim"])
        self.assertIn("all 40 families", r["equal_standing"])

    def test_22_33_remain_explicitly_undefined(self):
        records = module.load_registry()["minds"]
        self.assertEqual([r["family_id"] for r in records
                          if r["source_class"] == "unresolved_slot"],
                         list(range(22, 34)))
        self.assertTrue(all(not r["keywords"] for r in records[21:33]))

    def test_mythic_families_34_40_have_creator_provenance(self):
        rows = module.load_registry()["minds"][33:]
        self.assertEqual(len(rows), 7)
        self.assertTrue(all(r["source_class"] == "creator_supplied" for r in rows))
        self.assertTrue(all("• Micro Design:" in r["author_verbatim"] for r in rows))
        self.assertIn("Ma'at", rows[1]["name"])
        self.assertIn("Digital Ghost", rows[-1]["name"])

    def test_bootstrap_once_and_again_source_preserving(self):
        first = module.bootstrap(self.db)
        self.assertEqual(first["indexed_family_slots"], 40)
        self.assertEqual(first["new_versions"], 19)
        self.assertEqual(first["defined_family_slots"], 28)
        self.assertEqual(first["unresolved_family_slots"], 12)
        second = module.bootstrap(self.db)
        self.assertEqual(second["new_versions"], 0)
        self.assertEqual(module.status(self.db)["current_families"], 40)
        self.assertEqual(module.status(self.db)["unresolved_family_slots"], 12)
        self.assertEqual(self.db.execute(
            "SELECT COUNT(*) FROM federation_records WHERE source_id IN "
            "(SELECT source_id FROM federation_sources WHERE label='registry.v40.json')"
        ).fetchone()[0], 40)

    def test_34_cad_and_40_folklore_route(self):
        module.bootstrap(self.db)
        cad = module.propose(self.db, "Draft foundational CAD blueprint")
        self.assertEqual(cad["primary_family"], 34)
        meme = module.propose(self.db, "Audit viral folklore narrative")
        self.assertEqual(meme["primary_family"], 40)
        self.assertIn(21, cad["policy_families"])
        self.assertFalse(cad["external_execution"])

    def test_35_audit_and_39_sunset(self):
        module.bootstrap(self.db)
        self.assertEqual(module.propose(self.db, "Audit fairness")["primary_family"], 35)
        self.assertEqual(module.propose(self.db, "Archive a legacy project")["primary_family"], 39)

    def test_no_third_party_actions(self):
        module.bootstrap(self.db)
        bad = module.propose(self.db, "Check someone's private network", scope="third_party")
        self.assertEqual(bad["state"], "blocked")
        self.assertFalse(bad["external_execution"])
        self.assertTrue(bad["owner_approval_required"])
        self.assertEqual(module.propose(
            self.db, "Review request", scope="unknown")["state"], "review_required")

    def test_unknown_work_sends_to_existing_classifier(self):
        module.bootstrap(self.db)
        proposal = module.propose(self.db, "ZXQTW-9A")  # No family keyword; avoids the known "request" matcher
        self.assertEqual(proposal["primary_family"], 3)
        self.assertFalse(proposal["external_execution"])


if __name__ == "__main__":
    unittest.main()
