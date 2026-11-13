"""ONE v074 A–Z ↔ Z–A builder: source-safe tests on synthetic public fixtures."""
import hashlib
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from az_builder import LETTERS, DIRECTIONS, VERSION, build, first_letter, tokens
from universal_workers import open_universal


class BuildAZTests(unittest.TestCase):
    def fixture(self, root: Path):
        catalog=root/"minds.json"
        source={"schema":"test","minds":[
            {"id":"dog.ai","name":"DOG AI","type":"source-lens","status":"recorded"},
            {"id":"god.ai","name":"GOD AI","type":"source-lens","status":"recorded"},
            {"id":"bee.x","name":"Bee","type":"source-lens"},
            {"id":"num.01","name":"12345","type":"source-lens"},
            {"id":"zulu","name":"Zulu","type":"source-lens"}
        ]}
        catalog.write_text(json.dumps(source,ensure_ascii=False),encoding="utf-8")
        public=root/"app-factory"
        for module in ("dog","god","zeta","42-node"):
            loc=public/module
            loc.mkdir(parents=True)
            (loc/"index.html").write_text("<title>"+module+"</title>",encoding="utf-8")
        (public/"dog"/"README.md").write_text("# DOG")
        (public/"dog"/"engine.js").write_text("const dog = 1;")
        (public/"dog"/"engine.test.cjs").write_text("const assert = require('node:assert');")
        (public/"god"/"engine.js").write_text("const god = 1;")
        return catalog,public

    def test_52_executed_jobs_preserving_sources_and_reverse_equality(self):
        with TemporaryDirectory() as temp:
            root=Path(temp)
            catalog,public=self.fixture(root)
            original_files=list(public.rglob("*"))
            file_before={p:p.read_bytes() for p in original_files if p.is_file()}
            catalog_bytes=catalog.read_bytes()
            db=root/"ONE.sqlite3"
            with open_universal(db) as con:
                result=build(con,catalog,public,root/"reports")
                self.assertEqual(result["schema"],VERSION)
                self.assertEqual(result["unique_source_roles"],5)
                self.assertEqual(result["unique_public_modules"],4)
                self.assertEqual(result["forward_roles_checked"],5)
                self.assertEqual(result["reverse_roles_checked"],5)
                self.assertEqual(result["forward_modules_checked"],4)
                self.assertEqual(result["reverse_modules_checked"],4)
                self.assertEqual(result["letter_tasks_completed"],52)
                self.assertEqual(result["source_mutations"],0)
                self.assertEqual(result["all_registered_virtual_groups_invited"],32)
                self.assertGreater(result["proposed_work_items"],0)
                self.assertEqual(con.execute("SELECT COUNT(*) FROM az_build_tasks").fetchone()[0],52)
                self.assertEqual(con.execute("SELECT status FROM az_build_cycles").fetchone()[0],"completed")
                self.assertEqual(con.execute("SELECT COUNT(*) FROM universal_invitations").fetchone()[0],32)
                self.assertEqual(con.execute("SELECT COUNT(*) FROM universal_role_templates").fetchone()[0],5)
            reports=root/"reports"
            self.assertTrue((reports/"BUILD_LEDGER.md").is_file())
            tasks=json.loads((reports/"letter-tasks.json").read_text())
            self.assertEqual([t["letter"] for t in tasks if t["direction"]=="forward"],list(LETTERS))
            self.assertEqual([t["letter"] for t in tasks if t["direction"]=="reverse"],list(LETTERS[::-1]))
            self.assertEqual(len(list((reports/"forward").glob("*.json"))),26)
            self.assertEqual(len(list((reports/"reverse").glob("*.json"))),26)
            mirrors=json.loads((reports/"mechanical-mirrors.json").read_text())
            self.assertTrue(any(x["left"]=="DOG" and x["right"]=="GOD" for x in mirrors))
            self.assertTrue(all(x["historical_or_semantic_equivalence_established"] is False for x in mirrors))
            self.assertEqual(catalog.read_bytes(),catalog_bytes)
            self.assertEqual({p:p.read_bytes() for p in file_before},file_before)

    def test_all_names_invited_even_numeric_only(self):
        letter,fallback=first_letter("2345","890")
        self.assertTrue(fallback)
        self.assertIn(letter,LETTERS)
        letter,fallback=first_letter("DOG AI","123")
        self.assertEqual(letter,"D")
        self.assertFalse(fallback)
        self.assertEqual(tokens("DOG—GOD dog"),{"DOG","GOD"})

    def test_rejects_output_overwriting_original_tree_and_duplicate_role_ids(self):
        with TemporaryDirectory() as temp:
            root=Path(temp)
            catalog,public=self.fixture(root)
            with open_universal(root/"one.sqlite3") as con:
                with self.assertRaisesRegex(ValueError,"outside"):
                    build(con,catalog,public,public/"reports")
                data=json.loads(catalog.read_text())
                data["minds"].append(data["minds"][0])
                catalog.write_text(json.dumps(data))
                with self.assertRaisesRegex(ValueError,"duplicate"):
                    build(con,catalog,public,root/"output")

    def test_real_763_mind_catalog_no_exclusions(self):
        original=Path(__file__).resolve().parent.parent/"mind-of-minds"/"catalog.json"
        self.assertTrue(original.is_file())
        source=json.loads(original.read_text())
        self.assertEqual(len(source["minds"]),763)
        self.assertEqual(len({x["id"] for x in source["minds"]}),763)
        self.assertEqual(len([x for x in source["minds"] if x["id"].startswith("omni.")]),20)


if __name__=="__main__":
    unittest.main()
