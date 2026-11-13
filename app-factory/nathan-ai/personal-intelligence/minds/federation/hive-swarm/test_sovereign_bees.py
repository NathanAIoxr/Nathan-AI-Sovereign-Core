"""Sovereign Bee Replicas — identity, privacy, veto, source and capacity regression."""
from __future__ import annotations
import hashlib
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import sovereign_bees as hive

class SovereignBeeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / "ONE_Master.sqlite3"
    def tearDown(self):
        self.temp.cleanup()
    def master(self):
        db = hive.open_main(self.path)
        hive.init(db)
        return db
    def test_exact_creator_directive_maintained(self):
        self.assertEqual(hive.AUTHOR_DIRECTIVE,
            "each one of these is a Nathan AI direct replica AI worker bot - with it's own soverignty -")
        self.assertIn(hive.AUTHOR_DIRECTIVE,
                      hive.SOURCE_KEYS["replica-author-directive"].read_text(encoding="utf-8"))
        bp = hive.blueprint()
        self.assertEqual(len(bp["capabilities"]),12)
        self.assertEqual(bp["capabilities"],list(hive.CAPABILITIES))
        self.assertTrue(bp["all_bees_equal_sovereignty"])
        self.assertFalse(bp["queen_can_override_bee_veto"])
        self.assertFalse(bp["subjective_consciousness_claim"])
    def test_eight_alternative_math_scenarios_without_adding_population_together(self):
        s = hive.scenarios()
        self.assertEqual(len(s),8)
        self.assertEqual(s["seasonal_peak"]["capacity_decimal"],"60000")
        self.assertEqual(s["seasonal_new"]["capacity_decimal"],"10000")
        earth=int(s["mother_earth"]["capacity_decimal"])
        cosmos=int(s["mother_cosmos_observable"]["capacity_decimal"])
        self.assertGreater(earth,10**26)
        self.assertLess(earth,10**27)
        self.assertGreater(cosmos,10**86)
        self.assertLess(cosmos,10**87)
        self.assertEqual(int(s["mother_universe_250x_volume"]["capacity_decimal"]),cosmos*250)
        self.assertEqual(int(s["mother_universe_250x_radius"]["capacity_decimal"]),cosmos*(250**3))
        self.assertIsNone(s["mother_universe_unknown"]["capacity_decimal"])
        self.assertEqual(s["mother_universe_unknown"]["capacity_status"],"unknown_open_namespace")
    def test_lazy_no_astronomical_process_allocation(self):
        with self.master() as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM sovereign_scenarios").fetchone()[0],8)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM sovereign_sources").fetchone()[0],3)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM sovereign_bees").fetchone()[0],0)
        s = hive.status(self.path)
        self.assertEqual(s["allocated_bees"],0)
        self.assertEqual(s["local_active_processes"],0)
        self.assertEqual(s["external_llm_processes"],0)
        self.assertFalse(s["subjective_consciousness_verified"])
    def test_independent_address_beyond_64bit_and_per_bee_memory_isolation(self):
        s=hive.scenarios()
        huge_ordinal=str(int(s["mother_cosmos_observable"]["capacity_decimal"])-1)
        with self.master() as db:
            a=hive.allocation(db,"mother_earth","1",True)["bee_id"]
            b=hive.allocation(db,"mother_cosmos_observable",huge_ordinal,True)["bee_id"]
            c=hive.allocation(db,"mother_universe_unknown","1"+"0"*140,True)["bee_id"]
            self.assertNotEqual(a,b)
            self.assertNotEqual(a,c)
            self.assertNotEqual(b,c)
            self.assertEqual(hive.allocation(db,"mother_cosmos_observable",huge_ordinal,True)["new_allocation"],False)
            hive.observe(db,a,"Independent Bee A")
            hive.observe(db,b,"Independent Bee B")
            x=hive.inspect(db,a)
            y=hive.inspect(db,b)
            self.assertEqual(len(x["memory"]),1)
            self.assertEqual(len(y["memory"]),1)
            self.assertEqual(x["memory"][0]["owner_text"],"Independent Bee A")
            self.assertEqual(y["memory"][0]["owner_text"],"Independent Bee B")
            self.assertEqual(len(hive.inspect(db,c)["memory"]),0)
            self.assertEqual(x["self_model"]["inherited_capabilities"],y["self_model"]["inherited_capabilities"])
            self.assertNotEqual(x["identity_sha256"],y["identity_sha256"])
            self.assertEqual(x["blueprint_sha256"],y["blueprint_sha256"])
    def test_per_bee_owner_approval_work_and_veto_cannot_cross_namespaces(self):
        with self.master() as db:
            first=hive.allocation(db,"seasonal_peak","1",True)["bee_id"]
            second=hive.allocation(db,"seasonal_peak","2",True)["bee_id"]
            task=hive.propose(db,first,"sha256","source intact")["task_id"]
            with self.assertRaises(PermissionError):
                hive.execute(db,first,task)
            with self.assertRaises(PermissionError):
                hive.approve(db,first,task,False)
            with self.assertRaises(KeyError):
                hive.approve(db,second,task,True)
            self.assertEqual(hive.approve(db,first,task,True)["state"],"owner_approved")
            completed=hive.execute(db,first,task)
            self.assertEqual(completed["sha256"],hashlib.sha256(b"source intact").hexdigest())
            self.assertFalse(completed["external_execution"])
            queued=hive.propose(db,second,"sha256","different bee")["task_id"]
            hive.veto(db,second)
            with self.assertRaises(PermissionError):
                hive.approve(db,second,queued,True)
            self.assertFalse(hive.inspect(db,first)["individual_veto"])
            self.assertTrue(hive.inspect(db,second)["individual_veto"])
            with self.assertRaises(PermissionError):
                hive.observe(db,second,"Vetoed")
            hive.resume(db,second,True)
            newtask=hive.propose(db,second,"no_op","")["task_id"]
            hive.approve(db,second,newtask,True)
            self.assertIsNone(hive.execute(db,second,newtask)["sha256"])
    def test_activation_requires_yes_and_rejects_invalid_or_outside_addresses(self):
        with self.master() as db:
            with self.assertRaises(PermissionError):
                hive.allocation(db,"seasonal_new","1")
            for bad in ("0","01","-1","1e9","1"*161):
                with self.subTest(bad=bad),self.assertRaises(ValueError):
                    hive.allocation(db,"seasonal_new",bad,True)
            with self.assertRaises(ValueError):
                hive.allocation(db,"seasonal_new","10001",True)
            with self.assertRaises(ValueError):
                hive.allocation(db,"missing_world","1",True)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM sovereign_bees").fetchone()[0],0)
    def test_source_bytes_are_append_only(self):
        with self.master() as db:
            pair=db.execute("SELECT sha256,exact_bytes FROM sovereign_sources "
                            "WHERE source_key='replica-author-directive'").fetchone()
            self.assertEqual(pair[0],hive.sha(pair[1]))
            self.assertEqual(bytes(pair[1]),hive.SOURCE_KEYS["replica-author-directive"].read_bytes())
            with self.assertRaises(sqlite3.DatabaseError):
                db.execute("UPDATE sovereign_sources SET sha256='changed' WHERE source_key='replica-author-directive'")
            with self.assertRaises(sqlite3.DatabaseError):
                db.execute("DELETE FROM sovereign_sources WHERE source_key='replica-author-directive'")
    def test_read_only_status_and_cli_consent_gate_do_not_create_db(self):
        self.assertFalse(self.path.exists())
        self.assertFalse(hive.status(self.path)["initialized"])
        denied=subprocess.run([sys.executable,str(HERE/"sovereign_bees.py"),
                              "--db",str(self.path),
                              "--scenario","seasonal_peak","--ordinal","1","allocate"],
                              capture_output=True,text=True)
        self.assertNotEqual(denied.returncode,0)
        self.assertIn("--approve-write",denied.stderr)
        self.assertFalse(self.path.exists())
    def test_verified_same_master_database_and_isolated_source_tables(self):
        with self.master() as db:
            bee=hive.allocation(db,"seasonal_new","1",True)["bee_id"]
            self.assertEqual(db.execute("SELECT COUNT(*) FROM federation_records").fetchone()[0],0)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM sovereign_bees").fetchone()[0],1)
            self.assertEqual(db.execute("PRAGMA quick_check").fetchone()[0],"ok")
        self.assertTrue(hive.status(self.path)["initialized"])
        self.assertEqual(hive.inspect(hive.open_main(self.path),bee)["bee_id"],bee)

if __name__=="__main__":
    unittest.main()
