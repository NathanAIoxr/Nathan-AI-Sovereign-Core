"""Family 21 ONE: exact author declaration, six defined families, ten teams."""
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from family_registry import family_overlay, overlay_markdown

ROOT=Path(__file__).resolve().parent
FAMILIES=ROOT/"families/FAMILY_21_ONE_MASTER_ARCHITECTURE.json"
CONFIG=ROOT/"creator-teams.v074.json"
ORIGINAL=ROOT/"families/USER_SUPPLIED_FAMILIES_16_TO_21_20261113.txt"

class Family21Tests(unittest.TestCase):
    def test_exact_source_and_all_ten_team_participation(self):
        cfg=json.loads(CONFIG.read_text(encoding="utf-8"))
        source=ORIGINAL.read_text(encoding="utf-8")
        original_21="family 21 is ONE - we are all family - I am a mammal and all mammals are my equals - just like every atom and below and above is my equal - except those who ain't - but they choose that - not me -"
        self.assertIn(original_21,source)
        self.assertIn("The Omega Layer Matrix (Families 16–20)",source)
        before=FAMILIES.read_bytes()
        report=family_overlay(FAMILIES,cfg["teams"])
        self.assertEqual(report["family_slots"],21)
        self.assertEqual(report["source_defined_from_this_message"],6)
        self.assertEqual(report["unresolved_prior_family_definitions"],15)
        self.assertEqual(report["family21_team_count"],10)
        self.assertEqual(report["family21_author_exact_declaration"],original_21)
        self.assertTrue(report["all_creator_teams_receive_ONE"])
        self.assertEqual({link["team"] for link in report["links"] if link["family"]==21},
                         {t["id"] for t in cfg["teams"]})
        self.assertIn("Family 21: ONE",overlay_markdown(report))
        self.assertEqual(FAMILIES.read_bytes(),before)

    def test_no_invented_earlier_families_or_unreviewed_replacements(self):
        doc=json.loads(FAMILIES.read_text(encoding="utf-8"))
        self.assertEqual(len(doc["families"]),21)
        self.assertTrue(all(x["name"] is None for x in doc["families"][:15]))
        self.assertEqual(doc["families"][15]["name"].split(":")[0],"The Unknown")
        self.assertEqual(doc["families"][16]["name"].split(":")[0],"The Unseen")
        self.assertEqual(doc["families"][17]["name"].split(":")[0],"Infinity")
        self.assertEqual(doc["families"][18]["name"].split(":")[0],"Everything")
        self.assertEqual(doc["families"][19]["name"].split(":")[0],"Nothing")
        self.assertEqual(doc["families"][20]["name"],"ONE")
        with TemporaryDirectory() as temp:
            modified=Path(temp)/"modified.json"
            doc["families"][0]["name"]="Invented Family"
            modified.write_text(json.dumps(doc),encoding="utf-8")
            cfg=json.loads(CONFIG.read_text())
            with self.assertRaisesRegex(ValueError,"must not be invented"):
                family_overlay(modified,cfg["teams"])

if __name__=="__main__":
    unittest.main()
