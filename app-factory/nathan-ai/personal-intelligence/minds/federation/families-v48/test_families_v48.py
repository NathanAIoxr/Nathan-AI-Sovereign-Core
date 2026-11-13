"""Source-preservation and proposal-routing checks for the ONE v48 codex."""
from pathlib import Path
import tempfile
import unittest
import importlib.util

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("one_families_v48",HERE/"families_v48.py")
model=importlib.util.module_from_spec(spec);spec.loader.exec_module(model)

class Family48Tests(unittest.TestCase):
    def setUp(self):
        self.root=tempfile.TemporaryDirectory()
        self.db=model.core.open_main(Path(self.root.name)/"one.sqlite3")
    def tearDown(self):
        self.db.close();self.root.cleanup()
    def test_count_unchanged_one_and_full_figurative_source(self):
        r=model.load_registry()
        self.assertEqual(len(r["minds"]),48)
        self.assertEqual([f["family_id"] for f in r["minds"]],list(range(1,49)))
        self.assertEqual(r["minds"][20]["name"],"ONE")
        self.assertIn("all mammals are my equals",r["minds"][20]["author_verbatim"])
        self.assertEqual(r["minds"][40]["source_class"],"user_supplied_prior_assistant_text")
        self.assertEqual(r["minds"][47]["family_id"],48)
    def test_source_excerpts_22_33_with_one_partial_29(self):
        rows=model.load_registry()["minds"]
        self.assertEqual({x["family_id"] for x in rows if x.get("source_class")=="source_excerpt_restored"},
                         {22,23,24,25,26,27,28,30,31,32,33})
        self.assertEqual([x["family_id"] for x in rows if x.get("source_class")=="partial_source_excerpt"],[29])
        self.assertIn("summary matrix",rows[28]["source_provenance"].lower())
    def test_original_v40_kept_and_bootstrap_is_idempotent(self):
        prior=model.previous.load_registry()
        before=(model.previous.REGISTRY.read_bytes(),model.core.REGISTRY.read_bytes())
        first=model.bootstrap(self.db)
        self.assertEqual(first["indexed_family_slots"],48)
        self.assertEqual(first["previous_edition_indexed"],40)
        self.assertEqual(first["new_versions"],20)
        second=model.bootstrap(self.db)
        self.assertEqual(second["new_versions"],0)
        self.assertEqual(model.status(self.db)["indexed_source_records"],48)
        self.assertEqual(model.status(self.db)["figurative_families"],8)
        self.assertEqual((model.previous.REGISTRY.read_bytes(),model.core.REGISTRY.read_bytes()),before)
    def test_metaphor_router_and_external_action_gate(self):
        model.bootstrap(self.db)
        out=model.propose(self.db,"Write a parable and fable")
        self.assertEqual(out["primary_family"],41)
        self.assertIn(21,out["policy_families"])
        self.assertFalse(out["external_execution"])
        inverse=model.propose(self.db,"Review an allegory and dashboard")
        self.assertEqual(inverse["primary_family"],42)
        self.assertEqual(model.propose(self.db,"Access a private bank",scope="third_party")["state"],"blocked")
    def test_48_workcards_are_real_files_without_remote_agent_execution(self):
        model.bootstrap(self.db)
        out=Path(self.root.name)/"packs"
        m=model.build_workpacks(self.db,out)
        self.assertEqual(m["family_workcards"],48)
        self.assertEqual(len(list(out.glob("FAMILY_*.json"))),48)
        self.assertEqual(m["outbound_external_actions"],0)

if __name__=="__main__":unittest.main()
