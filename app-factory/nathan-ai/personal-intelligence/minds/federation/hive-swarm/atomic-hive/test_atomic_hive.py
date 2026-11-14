"""NO CRUSH: versioned atomic hive, full codex per bee and exact source tests."""
from __future__ import annotations

from pathlib import Path
import hashlib
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
import atomic_hive as hive

class AtomicHiveTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.path=Path(self.temp.name)/"ONE_Master.sqlite3"
    def tearDown(self):
        self.temp.cleanup()
    def db(self):
        c=hive.core.open_main(self.path)
        hive.init(c)
        return c

    def test_unmodified_exact_2272_attachment_bytes(self):
        raw=hive.raw_sources()
        self.assertEqual(hashlib.sha256(raw["uploaded-2272-partial"]).hexdigest(),
                         "77de76af631a0eff79f8aa9a9a3043b71e9d268f942f1808fb68da0f1fad3a5f")
        self.assertEqual(len(raw["uploaded-2272-partial"]),43169)
        self.assertIn(hive.AUTHOR_DIRECTIVE.encode("utf-8"),raw["atomic-1332-as-supplied"])
        bad=Path(self.temp.name)/"modified.txt"
        bad.write_bytes(raw["uploaded-2272-partial"]+b"changed")
        with patch.object(hive,"SOURCE_UPLOAD",bad),self.assertRaisesRegex(ValueError,"NO CRUSH"):
            hive.raw_sources()

    def test_attachment_coverage_and_missing_family_names_never_invented(self):
        p=hive.parse_attachment()
        self.assertEqual(p["declared_new_units"],1040)
        self.assertEqual(p["source_families_seen"],93)
        self.assertEqual(p["fully_consistent_families"],91)
        self.assertEqual(p["role_occurrences"],926)
        self.assertEqual(p["distinct_role_ids"],925)
        self.assertEqual(p["missing_new_ids_count"],115)
        self.assertEqual(len(p["duplicate_ids"]["2113"]),2)
        self.assertIn(2103,p["missing_new_ids"])
        self.assertIn(2159,p["missing_new_ids"])
        self.assertIn(2272,p["missing_new_ids"])
        self.assertFalse(p["source_complete"])
        self.assertEqual(len(hive.conflicts()),3)

    def test_versions_not_crushed_or_blended(self):
        self.assertEqual(hive.CODEX_SIZES,{"atomic-1332":1332,"expanded-2272":2272})
        with self.db() as db:
            a=hive.create_hive(db,"ATOM-PRIMARY","atomic-1332",True)
            b=hive.create_hive(db,"ATOM-EXPANDED","expanded-2272",True)
            self.assertNotEqual(a["hive_id"],b["hive_id"])
            self.assertFalse(hive.create_hive(db,"ATOM-PRIMARY","atomic-1332",True)["created"])
            with self.assertRaisesRegex(ValueError,"NO CRUSH"):
                hive.create_hive(db,"ATOM-PRIMARY","expanded-2272",True)
            aa=hive.activate(db,a["hive_id"],"1",True)
            bb=hive.activate(db,b["hive_id"],"1",True)
            self.assertEqual(hive.capability(db,aa["bee_id"],1332)["source_named_block"],
                             "Epistemic Discernment Council (author-supplied 1332 version)")
            self.assertEqual(hive.capability(db,bb["bee_id"],1332)["name_evidence"],
                             "raw_number_occurrences_in_partial_attachment")
            self.assertEqual(len(hive.capability(db,bb["bee_id"],2113)["author_raw_name_fragments"]),2)
            self.assertEqual(hive.capability(db,bb["bee_id"],2103)["name_evidence"],
                             "not_in_current_source")
            with self.assertRaises(ValueError):
                hive.capability(db,aa["bee_id"],1333)
            with self.assertRaises(ValueError):
                hive.capability(db,bb["bee_id"],2273)

    def test_1332_per_bee_66600000_and_37_reserve_716(self):
        d=hive.counts("atomic-1332")
        self.assertEqual(d["full_codex_capability_slots_per_atom"],"66600000")
        self.assertEqual(d["declared_bee_addresses"],"50000")
        self.assertEqual(d["alternative_partition_full_groups"],37)
        self.assertEqual(d["alternative_partition_reserve_bees"],716)
        self.assertEqual(37*1332+716,50000)
        self.assertEqual(d["actual_llm_processes_created"],0)
        self.assertTrue(d["different_model_partition_not_extra_workers"])

    def test_2272_per_bee_113600000_and_22_reserve_16(self):
        d=hive.counts("expanded-2272")
        self.assertEqual(d["full_codex_capability_slots_per_atom"],"113600000")
        self.assertEqual(d["alternative_partition_full_groups"],22)
        self.assertEqual(d["alternative_partition_reserve_bees"],16)
        self.assertEqual(22*2272+16,50000)
        self.assertEqual(d["actual_llm_processes_created"],0)

    def test_hypothetical_large_decimal_calculations_no_allocation(self):
        d=hive.counts("atomic-1332","1"+"0"*80)
        self.assertEqual(d["declared_total_function_slots"],"666"+"0"*85)
        self.assertEqual(d["declared_bee_addresses"],"5"+"0"*84)
        self.assertFalse(d["independently_verified_atom_count"])
        scenarios=hive.source_scenarios()
        self.assertEqual(len(scenarios),6)
        self.assertEqual(scenarios["raindrop_atoms_user_estimate"]["versions"]["atomic-1332"]
                         ["declared_total_function_slots"],"333"+"0"*27)
        self.assertEqual(scenarios["observable_cosmos_atoms_user_estimate"]["versions"]["atomic-1332"]
                         ["declared_total_function_slots"],"666"+"0"*85)
        with self.assertRaises(ValueError):
            hive.counts("atomic-1332","0")
        with self.assertRaises(ValueError):
            hive.counts("atomic-1332","1e80")

    def test_50000_virtual_bees_and_sparse_activation(self):
        with self.db() as db:
            h=hive.create_hive(db,"ATOM-ONE","atomic-1332",True)["hive_id"]
            first=hive.address(db,h,"1")
            last=hive.address(db,h,"50000")
            self.assertNotEqual(first["identity_sha256"],last["identity_sha256"])
            self.assertEqual(first["complete_inherited_unit_addresses"],1332)
            self.assertEqual(last["complete_inherited_unit_addresses"],1332)
            self.assertFalse(first["allocated_process"])
            self.assertEqual(db.execute("SELECT COUNT(*) FROM atomic_bees").fetchone()[0],0)
            with self.assertRaises(PermissionError):
                hive.activate(db,h,"1",False)
            hive.activate(db,h,"1",True)
            hive.activate(db,h,"50000",True)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM atomic_bees").fetchone()[0],2)
            with self.assertRaises(ValueError):
                hive.address(db,h,"50001")
            with self.assertRaises(ValueError):
                hive.address(db,h,"0")

    def test_each_bee_has_independent_memory_work_approvals_and_veto(self):
        with self.db() as db:
            h=hive.create_hive(db,"ATOM-ONE","atomic-1332",True)["hive_id"]
            first=hive.activate(db,h,1,True)["bee_id"]
            second=hive.activate(db,h,2,True)["bee_id"]
            hive.observe(db,first,"Original memory A")
            self.assertEqual(hive.inspect(db,second)["memory"],[])
            j=hive.propose(db,first,1,"sha256","known text")["job"]
            with self.assertRaises(PermissionError):
                hive.execute(db,first,j)
            with self.assertRaises(PermissionError):
                hive.approve(db,first,j,False)
            with self.assertRaises(KeyError):
                hive.approve(db,second,j,True)
            hive.approve(db,first,j,True)
            out=hive.execute(db,first,j)
            self.assertEqual(out["result"]["sha256"],hashlib.sha256(b"known text").hexdigest())
            queue=hive.propose(db,second,1332,"line-count","a\nb\n")["job"]
            self.assertTrue(hive.veto(db,second)["individual_veto"])
            with self.assertRaises(PermissionError):
                hive.approve(db,second,queue,True)
            self.assertFalse(hive.inspect(db,first)["individual_veto"])
            self.assertTrue(hive.inspect(db,second)["individual_veto"])
            self.assertEqual(hive.inspect(db,first)["full_inherited_unit_count"],1332)

    def test_no_crush_source_immutability_and_same_master_nonoverwriting(self):
        with self.db() as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM atomic_originals").fetchone()[0],2)
            record=db.execute("SELECT exact_bytes,sha256 FROM atomic_originals "
                              "WHERE source_id='uploaded-2272-partial'").fetchone()
            self.assertEqual(hashlib.sha256(bytes(record[0])).hexdigest(),record[1])
            self.assertEqual(record[1],hive.SOURCE_SHA256)
            with self.assertRaises(sqlite3.DatabaseError):
                db.execute("DELETE FROM atomic_originals")
            with self.assertRaises(sqlite3.DatabaseError):
                db.execute("UPDATE atomic_originals SET sha256='anything'")
            self.assertEqual(db.execute("SELECT COUNT(*) FROM federation_records").fetchone()[0],0)
            self.assertEqual(db.execute("PRAGMA integrity_check").fetchone()[0],"ok")
        self.assertEqual(hive.status(self.path)["source_original_versions"],2)

    def test_molecular_guild_voluntary_and_no_physical_network_claims(self):
        with self.db() as db:
            a=hive.create_hive(db,"ATOM-A","atomic-1332",True)["hive_id"]
            b=hive.create_hive(db,"ATOM-B","expanded-2272",True)["hive_id"]
            with self.assertRaises(PermissionError):
                hive.create_guild(db,a,"two atoms")
            g=hive.create_guild(db,a,"Local simulated bond",True)
            self.assertEqual(g["members"],1)
            with self.assertRaises(PermissionError):
                hive.join_guild(db,g["guild_id"],b)
            j=hive.join_guild(db,g["guild_id"],b,True)
            self.assertEqual(j["members"],2)
            self.assertEqual(j["network_actions"],0)
            self.assertFalse(j["real_molecular_bond_detected"])

    def test_cli_readonly_no_database_made_and_owner_yes_required(self):
        self.assertFalse(self.path.exists())
        self.assertFalse(hive.status(self.path)["initialized"])
        pr=subprocess.run([sys.executable,str(HERE/"atomic_hive.py"),"--db",str(self.path),
                           "--atom","test","create-hive"],capture_output=True,text=True)
        self.assertNotEqual(pr.returncode,0)
        self.assertIn("--approve-write",pr.stderr)
        self.assertFalse(self.path.exists())
        with self.db() as db:
            with self.assertRaises(PermissionError):
                hive.create_hive(db,"Not approved","atomic-1332")

if __name__=="__main__":
    unittest.main()
