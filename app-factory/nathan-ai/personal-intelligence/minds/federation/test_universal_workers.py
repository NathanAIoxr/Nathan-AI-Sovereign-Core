"""Deterministic tests for the source-preserving universal invitation system."""
from pathlib import Path
from tempfile import TemporaryDirectory
import json
import sqlite3
import unittest

from universal_workers import (
    NAMESPACES, CATEGORIES, SCOPES, VERSION, MAX_BATCH,
    bootstrap, seed_roles, discover_public, inspect, open_universal,
    run_once, serve, stats,
)
from federation import sha

CATALOG=Path(__file__).resolve().parents[1]/"mind-of-minds"/"catalog.json"

class UniversalV074Tests(unittest.TestCase):
    def test_every_name_class_and_scope_invited_without_enumerating_billions(self):
        with TemporaryDirectory() as tmp:
            con=open_universal(Path(tmp)/"one.sqlite3")
            a=bootstrap(con);b=bootstrap(con)
            self.assertEqual(a["coverage_groups"],32)
            self.assertEqual(b["coverage_groups"],32)
            self.assertEqual(a["virtual_id_capacity"],126_732_000_000)
            self.assertEqual(a["sampled_worker_tasks_total"],0)
            self.assertEqual(CATEGORIES,("ai_node","non_ai_node","node","non_node"))
            self.assertEqual(SCOPES,("system","non_system","database","non_database"))
            self.assertEqual(inspect(con,"omni_god","125999999999")["all_invited"],True)
            self.assertEqual(inspect(con,"supernodes","732000000")["physical_process_started"],False)
            self.assertEqual(inspect(con,"omni_god","0")["categories"],list(CATEGORIES))
            self.assertRaises(ValueError,inspect,con,"omni_god","126000000000")
            self.assertRaises(ValueError,inspect,con,"supernodes","0")
            self.assertRaises(ValueError,inspect,con,"omni_god","1e12")
            con.close()

    def test_real_public_catalog_preserves_763_unique_roles_including_full_pantheon(self):
        with TemporaryDirectory() as tmp:
            db=Path(tmp)/"one.sqlite3"
            con=open_universal(db)
            before=CATALOG.read_bytes()
            a=seed_roles(con,CATALOG);b=seed_roles(con,CATALOG)
            self.assertEqual(a["roles"],763)
            self.assertEqual(a["catalog_sha256"],b["catalog_sha256"])
            self.assertEqual(stats(con)["catalog_roles"],763)
            self.assertEqual(con.execute("SELECT COUNT(*) FROM universal_role_templates").fetchone()[0],763)
            self.assertEqual(con.execute("SELECT COUNT(*) FROM universal_role_templates WHERE role_id LIKE 'omni.%'").fetchone()[0],20)
            for role in ("omni.jesus-ai","omni.buddha-ai","omni.dog-ai","omni.reaper-ai"):
                self.assertIsNotNone(con.execute("SELECT role_id FROM universal_role_templates WHERE role_id=?",(role,)).fetchone())
            self.assertEqual(CATALOG.read_bytes(),before)
            self.assertEqual(run_once(con)["roles_checked"],763)
            con.close()

    def test_public_module_discovery_and_fair_bounded_dispatch(self):
        with TemporaryDirectory() as tmp:
            tmp=Path(tmp);root=tmp/"apps";root.mkdir()
            for loc in ("one/index.html","nathan-ai/index.html","other/sub/index.html"):
                f=root/loc;f.parent.mkdir(parents=True,exist_ok=True);f.write_text("<!doctype html>hello")
            con=open_universal(tmp/"one.sqlite3")
            self.assertEqual(discover_public(con,root)["added"],3)
            self.assertEqual(discover_public(con,root)["added"],0)
            self.assertEqual(stats(con)["public_app_entrypoints"],3)
            for _ in range(5):
                run_once(con,budget=7)
            self.assertEqual(stats(con)["sampled_worker_tasks_total"],35)
            self.assertEqual(con.execute("SELECT COUNT(DISTINCT namespace || ':' || category || ':' || scope) FROM universal_job_results").fetchone()[0],32)
            self.assertEqual(con.execute("SELECT COUNT(*) FROM universal_cycles WHERE state='completed'").fetchone()[0],5)
            self.assertEqual(con.execute("SELECT COUNT(*) FROM universal_invitations WHERE cursor_id>0").fetchone()[0],32)
            self.assertEqual(run_once(con,budget=32)["tasks"],32)
            self.assertRaises(ValueError,run_once,con,65)
            self.assertRaises(ValueError,run_once,con,0)
            con.close()

    def test_pause_resume_and_explicit_operator_bound(self):
        with TemporaryDirectory() as tmp:
            con=open_universal(Path(tmp)/"one.sqlite3")
            bootstrap(con)
            con.execute("UPDATE universal_control SET paused=1 WHERE id=1")
            con.commit()
            self.assertEqual(run_once(con)["status"],"paused")
            self.assertEqual(stats(con)["sampled_worker_tasks_total"],0)
            con.execute("UPDATE universal_control SET paused=0 WHERE id=1")
            con.commit()
            self.assertEqual(serve(con,interval=5,max_cycles=1,budget=2)["completed_cycles"],1)
            self.assertEqual(stats(con)["sampled_worker_tasks_total"],2)
            con.close()

    def test_corrupted_original_blocks_cycle_without_modifying_source(self):
        with TemporaryDirectory() as tmp:
            con=open_universal(Path(tmp)/"one.sqlite3")
            bootstrap(con)
            con.execute("INSERT INTO federation_sources VALUES(?,?,?,?,?,?,?)",
                        ("s","s","none","synthetic","0"*64,4,"now"))
            con.execute("INSERT INTO federation_records VALUES(?,?,?,?,?,?,?)",
                        ("s","r","0"*64,"owner original","synthetic","working","CERO"))
            con.commit()
            with self.assertRaisesRegex(ValueError,"source integrity failures"):
                run_once(con)
            self.assertEqual(stats(con)["sampled_worker_tasks_total"],0)
            self.assertEqual(con.execute("SELECT exact_source_text FROM federation_records").fetchone()[0],"owner original")
            con.close()

if __name__=="__main__":
    unittest.main()
