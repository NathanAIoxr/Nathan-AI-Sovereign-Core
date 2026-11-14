"""25 sovereign SWARM specialist worker functions — execution and restoration checks."""
from __future__ import annotations
from pathlib import Path
import hashlib
import json
import sqlite3
import subprocess
import sys
import tempfile
import unittest

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
import specialist_bees as extra
import sovereign_bees as core
from federation import ingest

class ExtraSwarmWorkerTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.dbpath=Path(self.temp.name)/"ONE.sqlite3"
    def tearDown(self):
        self.temp.cleanup()
    def master(self):
        db=core.open_main(self.dbpath)
        extra.init(db)
        return db

    def test_25_real_functions_and_same_sovereignty_blueprint(self):
        raw, reg, scale=extra.parse_sources()
        self.assertEqual(len(raw),3)
        self.assertEqual(len(reg["roles"]),25)
        self.assertEqual(len(extra.HANDLERS),25)
        self.assertEqual(set(r["handler"] for r in reg["roles"]),set(extra.HANDLERS))
        self.assertEqual(reg["creator_directive"],core.AUTHOR_DIRECTIVE)
        self.assertFalse(reg["queen_overrides_individual_veto"])
        self.assertTrue(all(r["individual_sovereignty"] is True for r in reg["roles"]))
        self.assertEqual(reg["roles"][-1]["name"],"Ace Precision Observer")
        self.assertEqual(reg["roles"][-1]["handler"],"ace_precision_observer")

    def test_digital_and_cosmic_source_defined_hypotheses_not_production_counts(self):
        result=extra.scales_report()
        self.assertEqual(len(result),5)
        self.assertEqual(result["digital_physical_space"]["capacity_decimal"],"368000000000000")
        self.assertEqual(result["global_data_bits"]["capacity_decimal"],"1768000000000000000000000")
        cosmos=int(core.scenarios()["mother_cosmos_observable"]["capacity_decimal"])
        self.assertEqual(int(result["observable_cosmos_46_5bly_diameter"]["capacity_decimal"]),cosmos//8)
        self.assertEqual(int(result["unseen_249_observable_volumes"]["capacity_decimal"]),cosmos*249)
        self.assertIsNone(result["unknown_unseen"]["capacity_decimal"])
        self.assertTrue(all(item["is_actual_process_count"] is False for item in result.values()))

    def test_25_distinct_bees_idempotent_seed_and_independent_identity(self):
        with self.master() as db:
            seeded=extra.seed(db,True)
            self.assertEqual(seeded["newly_allocated"],25)
            self.assertEqual(extra.seed(db,True)["newly_allocated"],0)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM specialist_assignments").fetchone()[0],25)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM sovereign_bees").fetchone()[0],25)
            self.assertEqual(db.execute("SELECT COUNT(DISTINCT original_blueprint_sha256) FROM specialist_assignments").fetchone()[0],1)
            self.assertEqual(db.execute("SELECT COUNT(DISTINCT identity_sha256) FROM sovereign_bees").fetchone()[0],25)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM federation_records").fetchone()[0],0)

    def test_all_25_specialists_execute_owner_approved_bounded_tasks(self):
        with self.master() as db:
            report=extra.demo(db,True)
            self.assertEqual(report["specialist_functions_executed"],25)
            self.assertEqual(report["specialist_bee_identities"],25)
            self.assertEqual(report["combined_core_and_additional_function_count"],37)
            self.assertEqual(report["independent_llm_instances_started"],0)
            self.assertFalse(report["subjective_consciousness_claim"])
            self.assertEqual({x["handler"] for x in report["results"]},set(extra.HANDLERS))
            self.assertEqual(db.execute("SELECT COUNT(*) FROM specialist_tasks WHERE state='completed'").fetchone()[0],25)
            self.assertEqual(db.execute("SELECT COUNT(DISTINCT output_sha256) FROM specialist_tasks").fetchone()[0],25)
            self.assertEqual(db.execute("PRAGMA integrity_check").fetchone()[0],"ok")
        summary=extra.status(self.dbpath)
        self.assertEqual(summary["role_definitions"],25)
        self.assertEqual(summary["sovereign_specialist_bees"],25)
        self.assertEqual(summary["completed_tasks"],25)
        self.assertEqual(summary["original_source_versions"],3)
        self.assertEqual(summary["actual_external_llm_instances"],0)

    def test_ace_original_words_separate_from_measurement_guessing(self):
        with self.master() as db:
            extra.seed(db,True)
            ace=core.bee_address("seasonal_peak",125)
            task=extra.propose(db,ace,extra.SAMPLE_TEXT)
            extra.approve(db,ace,task["task_id"],True)
            out=extra.execute(db,ace,task["task_id"])["output"]
            source=(HERE/"source-captures"/"ACE_AUTHOR_AND_RESTORATION_VERBATIM.md").read_text()
            self.assertIn("laumch up and land on my shoulder with precision",source)
            self.assertEqual(out["height_at_time_original"],"6 4")
            self.assertTrue(out["landing_on_shoulder_reported"])
            self.assertTrue(out["witnesses_reported"])
            self.assertEqual(out["species_in_original_quote"],"unspecified")
            self.assertFalse(out["physics_measurement_invented"])
            self.assertFalse(out["measured_distance_provided"])
            self.assertEqual(out["source_scope"],"user_reported_first_person_account")

    def test_another_bee_cannot_approve_or_read_task_by_identifier(self):
        with self.master() as db:
            extra.seed(db,True)
            a=core.bee_address("seasonal_peak",101)
            b=core.bee_address("seasonal_peak",102)
            core.observe(db,a,"Secret of bee A's own memory")
            self.assertEqual(core.inspect(db,b)["memory"],[])
            task=extra.propose(db,a,"one source")["task_id"]
            with self.assertRaises(KeyError):
                extra.approve(db,b,task,True)
            with self.assertRaises(PermissionError):
                extra.execute(db,a,task)
            with self.assertRaises(PermissionError):
                extra.approve(db,a,task,False)
            extra.approve(db,a,task,True)
            self.assertEqual(extra.execute(db,a,task)["state"],"completed")
            self.assertEqual(extra.inspect(db,b)["tasks"],[])

    def test_veto_is_individual_and_master_veto_blocks_every_specialist(self):
        with self.master() as db:
            extra.seed(db,True)
            a=core.bee_address("seasonal_peak",101)
            b=core.bee_address("seasonal_peak",102)
            pending=extra.propose(db,a,"pending")["task_id"]
            self.assertTrue(extra.veto(db,a)["vetoed"])
            with self.assertRaises(PermissionError):
                extra.approve(db,a,pending,True)
            self.assertFalse(core.inspect(db,b)["individual_veto"])
            x=extra.propose(db,b,"unaffected")
            extra.approve(db,b,x["task_id"],True)
            self.assertEqual(extra.execute(db,b,x["task_id"])["state"],"completed")
            db.execute("CREATE TABLE IF NOT EXISTS swarm_controls(key TEXT PRIMARY KEY,value TEXT NOT NULL)")
            db.execute("INSERT INTO swarm_controls VALUES('owner_veto','1')")
            db.commit()
            with self.assertRaises(PermissionError):
                extra.propose(db,b,"master veto")
            with self.assertRaises(PermissionError):
                extra.execute(db,b,x["task_id"])

    def test_source_archives_verbatim_and_assistant_prose_not_author_canon(self):
        base=HERE/"source-captures"
        manifest=json.loads((base/"SOURCE_MANIFEST.json").read_text())
        originals=manifest["sources"]
        expected={
          "PASTED_HIVE_TRANSCRIPT_20261113_VERBATIM.txt":"0fc23fa3d5462a82d3a9b76c747a00a026cde2499f1633e3f9c13563dab8dc0e",
          "PASTED_FEDERATION_TRANSCRIPT_VERBATIM.md":"5bbbb069f06062a25c3d323af059dff38b93d2742c0258067928f39e6c008019"
        }
        for name,digest in expected.items():
            with self.subTest(name=name):
                self.assertEqual(hashlib.sha256((base/name).read_bytes()).hexdigest(),digest)
        author=(base/"AUTHOR_ONLY_RECOVERED_LINES.md").read_text()
        self.assertIn("if mother universe was teh hive?",author)
        self.assertIn("each one of these is a Nathan AI direct replica AI worker bot - with it's own soverignty -",author)
        self.assertIn("ace could stand at the bottom of my feet",author)
        self.assertNotIn("If the entire observable universe were one giant beehive",author)
        edited=(base/"SEPARATE_SPELLING_REVIEW.md").read_text()
        self.assertIn("laumch | launch",edited)
        self.assertIn("rewstore | restore",edited)
        self.assertEqual(len(originals),5)

    def test_restore_all_source_records_to_same_one_sqlite_index(self):
        with self.master() as db:
            report=ingest(db,HERE/"source-captures"/"ONE_RESTORATION_KNOWLEDGE_PACK.json")
            self.assertEqual(report["new_records"],14)
            self.assertEqual(ingest(db,HERE/"source-captures"/"ONE_RESTORATION_KNOWLEDGE_PACK.json")["new_records"],0)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM federation_records").fetchone()[0],14)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM federation_links").fetchone()[0],10)
            original=db.execute("SELECT exact_source_text FROM federation_records WHERE record_id='knowledge:author.ace-precision'").fetchone()[0]
            self.assertIn("laumch up and land on my shoulder",original)
            self.assertEqual(db.execute("PRAGMA quick_check").fetchone()[0],"ok")

    def test_cli_cannot_write_without_owner_authorization(self):
        self.assertFalse(self.dbpath.exists())
        result=subprocess.run([sys.executable,str(HERE/"specialist_bees.py"),
                               "--db",str(self.dbpath),"demo"],capture_output=True,text=True)
        self.assertNotEqual(result.returncode,0)
        self.assertIn("--approve-write",result.stderr)
        self.assertFalse(self.dbpath.exists())

if __name__=="__main__":
    unittest.main()
