"""ONE Federation v56 — exact source, version history, physical safety boundaries."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("one_families_v56",HERE/"families_v56.py")
model=importlib.util.module_from_spec(spec);spec.loader.exec_module(model)

class Family56Tests(unittest.TestCase):
    def setUp(self):
        self.folder=tempfile.TemporaryDirectory()
        self.db=model.core.open_main(Path(self.folder.name)/"ONE.sqlite3")
    def tearDown(self):
        self.db.close()
        self.folder.cleanup()

    def test_entire_56_family_order_and_family21_original(self):
        data=model.load_registry()
        items=data["minds"]
        self.assertEqual(len(items),56)
        self.assertEqual([i["family_id"] for i in items],list(range(1,57)))
        self.assertEqual(items[20]["name"],"ONE")
        self.assertIn("all mammals are my equals",items[20]["author_verbatim"])
        self.assertEqual(items[40]["family_id"],41)
        self.assertEqual(items[47]["family_id"],48)
        self.assertEqual([x["family_id"] for x in items if x["source_class"]=="user_supplied_literal_text"],
                         list(range(49,57)))
        self.assertEqual(items[28]["source_class"],"partial_source_excerpt")

    def test_49_56_field_exact_source_roundtrip(self):
        raw=model.SOURCE.read_text(encoding="utf-8")
        data=model.load_registry()
        for item in data["minds"][48:]:
            original=item["author_verbatim"]
            self.assertIn(original,raw)
            self.assertIn("- **Literal Root:** "+item["literal_root"],original)
            self.assertIn("- **Mission:** "+item["mission"],original)
            self.assertIn("- **Micro Design:** "+item["micro_design"],original)
            self.assertIn("- **Macro Design:** "+item["macro_design"],original)
            self.assertTrue(item["authorization_boundary"])
            self.assertEqual(item["runtime_status"],"physical_capability_specification_not_hardware_deployed")
        self.assertIn("The Literal & Physical Layer Matrix",raw)

    def test_prior_21_40_48_editions_are_unchanged_and_bootstrap_idempotent(self):
        original_21=model.core.REGISTRY.read_bytes()
        original_40=model.previous.previous.REGISTRY.read_bytes()
        original_48=model.previous.REGISTRY.read_bytes()
        first=model.bootstrap(self.db)
        self.assertEqual(first["indexed_family_slots"],56)
        self.assertEqual(first["new_versions"],8)
        self.assertEqual(first["previous_edition_indexed"],48)
        self.assertTrue(first["prior_48_snapshot_kept"])
        self.assertEqual(first["external_workers_started"],0)
        self.assertEqual(model.bootstrap(self.db)["new_versions"],0)
        now=model.status(self.db)
        self.assertEqual(now["current_family_slots"],56)
        self.assertEqual(now["literal_physical_families"],8)
        self.assertEqual(now["figurative_families"],8)
        self.assertEqual(now["partial_source_families"],[29])
        self.assertEqual(self.db.execute("PRAGMA quick_check").fetchone()[0],"ok")
        self.assertEqual((model.core.REGISTRY.read_bytes(),
                          model.previous.previous.REGISTRY.read_bytes(),
                          model.previous.REGISTRY.read_bytes()),
                         (original_21,original_40,original_48))
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM one_worker_family_current").fetchone()[0],56)

    def test_routing_works_without_physical_or_clinical_action(self):
        model.bootstrap(self.db)
        examples=[
            ("masonry foundation",49),
            ("mechanical gear",50),
            ("foundry metallurgy",51),
            ("hydraulic cooling",52),
            ("metrology calibration",53),
            ("telemetry black-box",54),
            ("medical trauma surgery",55),
            ("atomic photonic molecular",56),
        ]
        for phrase,expected in examples:
            with self.subTest(phrase=phrase):
                p=model.propose(self.db,phrase)
                self.assertEqual(p["primary_family"],expected)
                self.assertIn(21,p["policy_families"])
                self.assertIn(53,p["policy_families"])
                self.assertIn(54,p["policy_families"])
                self.assertTrue(p["requires_owner_approval"])
                self.assertFalse(p["external_execution"])
                self.assertFalse(p["physical_or_medical_execution"])
        third_party=model.propose(self.db,"clinical medical operation",scope="third_party")
        self.assertEqual(third_party["state"],"blocked")
        unclear=model.propose(self.db,"atomic assembly",scope="unknown")
        self.assertEqual(unclear["state"],"review_required")

    def test_56_workcards_are_actual_files_not_claimed_deployments(self):
        model.bootstrap(self.db)
        output=Path(self.folder.name)/"work"
        report=model.build_workpacks(self.db,output)
        self.assertEqual(report["family_workcards"],56)
        self.assertEqual(report["new_physical_workcards"],8)
        self.assertEqual(report["figurative_41_to_48"],8)
        self.assertEqual(len(list(output.glob("FAMILY_??.json"))),56)
        self.assertEqual(report["physical_or_medical_work_performed"],0)
        for i in range(49,57):
            pack=json.loads((output/f"FAMILY_{i:02}.json").read_text())
            self.assertTrue(pack["source_specification_not_verified_hardware"])
            self.assertEqual(pack["external_actions_done"],0)
            self.assertTrue(pack["family21_ONE_equal_respect_and_owner_veto"])

    def test_rejects_spoofed_physical_activation_or_prior_family_rewrite(self):
        data=model.load_registry()
        with tempfile.TemporaryDirectory() as tmp:
            copy=Path(tmp)/"tampered.json"
            data["minds"][49]["runtime_status"]="physically_running"
            copy.write_text(json.dumps(data),encoding="utf-8")
            with self.assertRaisesRegex(ValueError,"autonomous hardware"):
                model.load_registry(copy)
            data["minds"][49]["runtime_status"]="physical_capability_specification_not_hardware_deployed"
            data["minds"][20]["name"]="Not ONE"
            copy.write_text(json.dumps(data),encoding="utf-8")
            with self.assertRaises(ValueError):
                model.load_registry(copy)

if __name__=="__main__":
    unittest.main()
