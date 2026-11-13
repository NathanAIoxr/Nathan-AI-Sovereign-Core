"""Regression checks for OPERATION SWARM's bounded database hive."""
import copy
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
import swarm

class HiveTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.db=Path(self.tmp.name)/"one.sqlite3"
    def tearDown(self):
        self.tmp.cleanup()
    def test_source_counts_and_original_seven_station_assignments(self):
        sources,records=swarm.public_sources()
        d=swarm.validate_stations(records["station-matrix"])
        self.assertEqual(len(sources),7)
        self.assertEqual(len(d["stations"]),7)
        self.assertEqual([s["assigned_hz"] for s in d["stations"]],[963,852,741,639,528,417,396])
        self.assertEqual([s["cervical"].split(" ")[0] for s in d["stations"]],
                         ["C1","C2","C3","C4","C5","C6","C7"])
        self.assertEqual([len(x.split()) for x in d["periodic_symbols"]],[2,8,8,18,18,32,32])
        self.assertEqual(d["pillars"]["total"],246)
        self.assertIn("Francium → Oganesson",sources["author-excerpt"].decode())
    def test_tamper_fails_closed(self):
        _,records=swarm.public_sources()
        for field,value in [("assigned_hz",999),("note","F"),("period",2),("cervical","C8")]:
            d=copy.deepcopy(records["station-matrix"])
            d["stations"][0][field]=value
            with self.subTest(field=field),self.assertRaises(ValueError):
                swarm.validate_stations(d)
    def test_launch_actual_workers_and_idempotent_source_index(self):
        one=swarm.launch(self.db)
        two=swarm.launch(self.db)
        self.assertEqual(one["worker_functions_executed"],12)
        self.assertEqual(one["roles_indexed"],1570)
        self.assertEqual(one["functional_self_models_exercised"],4)
        self.assertEqual(one["independent_conscious_beings_created"],0)
        self.assertEqual(one["external_actions"],0)
        self.assertEqual((one["source_versions"],one["nodes"],one["typed_edges"]),(7,168,153))
        self.assertEqual((two["source_versions"],two["nodes"],two["typed_edges"]),(7,168,153))
        s=swarm.inspect(self.db)
        self.assertEqual((s["runs"],s["jobs"],s["distinct_bees"]),(2,24,1570))
        self.assertEqual(s["database_integrity"],"ok")
        with sqlite3.connect(self.db) as c:
            counts=dict(c.execute("SELECT mode,COUNT(*) FROM swarm_bees GROUP BY mode"))
            self.assertEqual(counts,{"indexed_only":1558,"deterministic":11,"functional_self_model":1})
            self.assertEqual(c.execute("SELECT COUNT(*) FROM swarm_nodes WHERE node_id LIKE 'element:%'").fetchone()[0],118)
            self.assertEqual(c.execute("SELECT COUNT(*) FROM federation_records").fetchone()[0],0)
    def test_evidence_classification_never_confuses_station_symbolism_with_science(self):
        swarm.launch(self.db)
        with sqlite3.connect(self.db) as c:
            counts=dict(c.execute("SELECT relationship_type,COUNT(*) FROM swarm_edges GROUP BY relationship_type"))
            self.assertEqual(counts,{"scientifically_established":118,
                                     "historically_documented":7,"author_defined_symbolism":28})
            self.assertEqual(c.execute("SELECT COUNT(*) FROM swarm_edges WHERE left_id LIKE 'station:%' AND relationship_type!='author_defined_symbolism'").fetchone()[0],0)
            self.assertEqual(c.execute("SELECT COUNT(*) FROM swarm_edges WHERE right_id LIKE 'assigned_hz:%'").fetchone()[0],7)
    def test_author_original_bytes_are_immutable(self):
        swarm.launch(self.db)
        with sqlite3.connect(self.db) as c:
            item=c.execute("SELECT sha256,exact_bytes FROM swarm_originals WHERE source_id='author-excerpt'").fetchone()
            self.assertEqual(item[0],swarm.digest(item[1]))
            self.assertEqual(bytes(item[1]),swarm.SOURCE_FILES["author-excerpt"].read_bytes())
            with self.assertRaises(sqlite3.DatabaseError):
                c.execute("UPDATE swarm_originals SET sha256='tampered' WHERE source_id='author-excerpt'")
            with self.assertRaises(sqlite3.DatabaseError):
                c.execute("DELETE FROM swarm_originals WHERE source_id='author-excerpt'")
    def test_owner_veto_and_authorization(self):
        self.assertTrue(swarm.control(self.db,"1")["owner_veto"])
        with self.assertRaises(PermissionError):
            swarm.launch(self.db)
        self.assertEqual(swarm.inspect(self.db)["runs"],0)
        self.assertFalse(swarm.control(self.db,"0")["owner_veto"])
        self.assertEqual(swarm.launch(self.db)["worker_functions_executed"],12)
    def test_readonly_status_and_mutation_guard(self):
        self.assertFalse(swarm.inspect(self.db)["initialized"])
        self.assertFalse(self.db.exists())
        denied=subprocess.run([sys.executable,str(HERE/"swarm.py"),
                              "--db",str(self.db),"launch"],capture_output=True,text=True)
        self.assertNotEqual(denied.returncode,0)
        self.assertIn("--approve-write",denied.stderr)
        self.assertFalse(self.db.exists())

if __name__=="__main__":
    unittest.main()
