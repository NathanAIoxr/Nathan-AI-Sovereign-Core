"""Regression checks for the Handling Life v074 additive source pack and bots."""
import json
from pathlib import Path
import sqlite3
from tempfile import TemporaryDirectory
import unittest

from handling_life_worker import PACK, ROLES, process, validate_pack
from federation import file_sha, open_main, ingest, run

class HandlingLifeWorkerTests(unittest.TestCase):
    def test_public_safe_originals_and_links(self):
        original = file_sha(PACK)
        data = validate_pack()
        self.assertEqual(data["schema"], "nathan.one.federation.knowledge.v074")
        self.assertEqual(len(data["records"]), 36)
        self.assertEqual(len(data["links"]), 40)
        self.assertEqual(original, file_sha(PACK))
        by_id = {item["id"]: item for item in data["records"]}
        self.assertEqual(by_id["author.binary-digital-everything"]["exact_text"],
            "Protection of your digital image, digital everything - by protecting the binary code the algorithms everything’s that is assigned to you that you’re not even aware of")
        self.assertEqual(by_id["author.proactive-scan-video"]["exact_text"],
            "And it proactively scans to see if anyone’s trying to use your images or have used them if they’ve used them it removes them even if your face is used in video")
        self.assertTrue(all(r["tier"] == "CERO" and r["privacy"] == "public-design-only"
                            for r in data["records"]))
        self.assertFalse(any("private_key" in r or "biometric_data" in r for r in data["records"]))

    def test_ingest_idempotent_and_source_preserved(self):
        with TemporaryDirectory() as temp:
            db = Path(temp) / "ONE.sqlite3"
            con = open_main(db)
            try:
                before = file_sha(PACK)
                self.assertEqual(ingest(con, PACK)["new_records"], 36)
                self.assertEqual(ingest(con, PACK)["new_records"], 0)
                self.assertEqual(con.execute(
                    "SELECT COUNT(*) FROM federation_records").fetchone()[0], 36)
                self.assertEqual(con.execute(
                    "SELECT COUNT(*) FROM federation_links WHERE state='proposed'").fetchone()[0], 40)
                self.assertEqual(con.execute(
                    "SELECT COUNT(*) FROM federation_record_metadata").fetchone()[0], 36)
                self.assertEqual(list(run(con)), list(ROLES))
                self.assertEqual(con.execute("PRAGMA integrity_check").fetchone()[0], "ok")
                self.assertEqual(file_sha(PACK), before)
            finally:
                con.close()

    def test_six_workers_review_only_and_public_audit(self):
        with TemporaryDirectory() as temp:
            db = Path(temp) / "ONE.sqlite3"
            report = Path(temp) / "report.json"
            result = process(db, report, public_inputs=[PACK])
            self.assertEqual(result["federation_total_records"], 36)
            self.assertEqual(result["new_records_in_each_ingest"], [36])
            self.assertEqual(result["role_reports"]["Raphael"]["checksum_failures"], 0)
            self.assertEqual(result["existing_workers_executed"], list(ROLES))
            self.assertTrue(report.is_file())
            self.assertEqual(result["automated_actions"]["approved_takedowns_sent"], 0)
            self.assertEqual(result["automated_actions"]["external_sites_scanned"], 0)
            self.assertEqual(result["automated_actions"]["source_originals_modified"], 0)
            self.assertEqual(process(db, report, public_inputs=[PACK])["new_records_in_each_ingest"], [0])

    def test_private_pack_and_unknown_edges_are_rejected(self):
        with TemporaryDirectory() as temp:
            d = validate_pack()
            d["records"][0]["privacy"] = "private"
            invalid = Path(temp) / "invalid.json"
            invalid.write_text(json.dumps(d), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Private records"):
                validate_pack(invalid)
            d["records"][0]["privacy"] = "public-design-only"
            d["links"][0]["right"] = "nonexistent"
            invalid.write_text(json.dumps(d), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Unknown relationship"):
                validate_pack(invalid)

if __name__ == "__main__":
    unittest.main()
