"""NATHAN AI · 70-Dimensions / 630-Units × 11-Families / 99-Members tests."""
from contextlib import closing
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from dimension_builder import (
    FAMILY_REGISTRY, FAMILY_SOURCE, REGISTRY, SOURCE,
    TEAM_MAP, read_registry, run, status, digest,
)
from universal_workers import open_universal

class Dimension70Tests(unittest.TestCase):
    def test_exact_author_uploads_and_all_original_member_names(self):
        doc, family, text, source_families=read_registry()
        self.assertEqual(digest(SOURCE.read_bytes()),
                         "50079c3e2561c466f18dadc2470edb3247b645a5bb215c978926337fcda05712")
        self.assertEqual(digest(FAMILY_SOURCE.read_bytes()),
                         "36162325e03447a1420b003ba59e853dd23ffb10977aa063b47ca8df5eada95d")
        self.assertEqual(doc["source_sha256"],digest(SOURCE.read_bytes()))
        self.assertEqual(family["source_sha256"],digest(FAMILY_SOURCE.read_bytes()))
        self.assertEqual(len(doc["tiers"]),7)
        self.assertEqual(len(doc["dimensions"]),70)
        self.assertEqual(len(doc["categories"]),9)
        self.assertEqual(len(doc["units"]),630)
        self.assertEqual(len(family["families"]),11)
        self.assertEqual(len(family["minds"]),99)
        self.assertEqual([f["family_id"] for f in family["families"]],list(range(65,76)))
        self.assertEqual([x["member_id"] for x in family["minds"]],list(range(65,164)))
        self.assertIn("Try without personalization",text)
        self.assertIn("Master Count Verification",source_families)
        for unit in doc["units"]:
            self.assertTrue(unit["source_line"] in text)
            self.assertEqual(unit["runtime_status"],"indexed_only")
            self.assertEqual(unit["namespace"],"one.dimensions.0_69")

    def test_independent_namespaces_avoid_family65_dimension65_collision(self):
        doc, family, _, _=read_registry()
        self.assertEqual(doc["dimensions"][65]["dimension_id"],65)
        self.assertEqual(family["families"][0]["family_id"],65)
        self.assertEqual(doc["units"][65*9]["id"],"DIM-65-01")
        self.assertEqual(family["minds"][0]["id"],"one-v75-member-065")
        self.assertNotEqual(doc["units"][65*9]["id"],family["minds"][0]["id"])
        self.assertEqual(len(set(u["id"] for u in doc["units"])),630)

    def test_630_real_generated_workcards_and_99_family_role_records(self):
        before=(SOURCE.read_bytes(),FAMILY_SOURCE.read_bytes(),
                REGISTRY.read_bytes(),FAMILY_REGISTRY.read_bytes())
        with TemporaryDirectory() as tmp:
            out=Path(tmp)/"build"
            with closing(open_universal(Path(tmp)/"ONE.sqlite3")) as db:
                a=run(db,out)
                self.assertEqual(a["dimensional_workcards"],630)
                self.assertEqual(a["total_independent_labelled_units"],729)
                self.assertEqual(a["source_member65_to163_count"],99)
                self.assertEqual(a["tier_count"],7)
                self.assertEqual(a["family21_ONE_governance_applies"],True)
                self.assertEqual(a["real_world_operations"],0)
                self.assertEqual(a["active_external_model_instances_created"],0)
                self.assertTrue(a["family_archetype_and_dimensional_unit_namespaces_distinct"])
                self.assertEqual(len(list((out/"units").glob("DIM-??-??.json"))),630)
                self.assertEqual(len(list((out/"tiers").glob("TIER_*.json"))),7)
                self.assertEqual(status(db)["unit_records"],630)
                self.assertEqual(status(db)["dimension_records"],70)
                self.assertEqual(status(db)["family65_to75_members"],99)
                self.assertEqual(db.execute("SELECT COUNT(*) FROM dimension70_unit_workcards").fetchone()[0],630)
                second=run(db,out)
                self.assertEqual(second["run_id"],a["run_id"]+1)
                self.assertEqual(status(db)["unit_records"],630)
                self.assertEqual(status(db)["dimension_records"],70)
                self.assertEqual(status(db)["family65_to75_members"],99)
                self.assertEqual(db.execute("SELECT COUNT(*) FROM dimension70_unit_workcards").fetchone()[0],1260)
                self.assertEqual(status(db)["integrity"],"ok")
            card=json.loads((out/"units"/"DIM-00-01.json").read_text())
            self.assertEqual(card["source_name"],"Point-Anchor")
            self.assertEqual(card["assigned_creator_team"],TEAM_MAP[0])
            self.assertEqual(card["implementation_status"],"proposal_only")
            ending=json.loads((out/"units"/"DIM-69-09.json").read_text())
            self.assertEqual(ending["source_name"],"1 - 1 = 0 Pure-Void Reset")
            self.assertEqual(ending["external_models_launched"],0)
        self.assertEqual((SOURCE.read_bytes(),FAMILY_SOURCE.read_bytes(),
                          REGISTRY.read_bytes(),FAMILY_REGISTRY.read_bytes()),before)

    def test_corrupted_source_and_registry_fail_closed(self):
        doc, family, text, _=read_registry()
        with TemporaryDirectory() as tmp:
            t=Path(tmp)
            spoof=t/"source.txt"
            spoof.write_text(text.replace("Point-Anchor","Point-Attacker"),encoding="utf-8")
            with self.assertRaisesRegex(ValueError,"Source hash mismatch"):
                read_registry(source=spoof)
            changed=t/"registry.json"
            doc["units"][0]["name"]="Not in source"
            changed.write_text(json.dumps(doc),encoding="utf-8")
            with self.assertRaisesRegex(ValueError,"Source-derived member name differs"):
                read_registry(registry=changed)

    def test_third_party_and_physical_claims_not_in_workcards(self):
        doc, family, text, _=read_registry()
        for u in doc["units"]:
            self.assertFalse(u["real_world_execution"])
            self.assertFalse(u["physical_measurement_verified"])
            self.assertEqual(u["runtime_status"],"indexed_only")
        for member in family["minds"]:
            self.assertEqual(member["runtime_status"],"indexed_only")

if __name__=="__main__":
    unittest.main()
