"""v074 Ancient Minds integration tests. All sources and databases are temporary."""
import hashlib
from pathlib import Path
import sqlite3
from tempfile import TemporaryDirectory
import unittest
from zipfile import ZipFile
from ancient_bridge import (VERSION, ARCHIVE_NAME, ingest_ancient, run_source, status)
from federation import open_main

class AncientFederationBridgeTests(unittest.TestCase):
    def test_roundtrip_all_14_families_and_repeated_source(self):
        with TemporaryDirectory() as root:
            root=Path(root)
            source=root/"source.txt"
            original=("Old English blāc and blæc, Sanskrit nāraṅga, "
                      "the 1500s, and Aristotelian versus optical frameworks.").encode()
            source.write_bytes(original)
            db=open_main(root/"ONE_Federation_v074.sqlite3")
            archive=Path(__file__).with_name(ARCHIVE_NAME)
            first=run_source(db,source,archive)
            self.assertEqual(first["pipeline"]["runs"],6)
            self.assertEqual(first["pipeline"]["proposed_links"],1)
            result=first["federation"]
            self.assertEqual(result["federation"],VERSION)
            self.assertEqual(result["native_tables"],14)
            self.assertEqual(result["originals_verified"],1)
            self.assertTrue(result["source_preserved"])
            self.assertEqual(db.execute(
                "SELECT COUNT(*) FROM federation_tables").fetchone()[0],14)
            self.assertEqual(db.execute(
                "SELECT COUNT(*) FROM federation_links WHERE state='proposed'").fetchone()[0],1)
            saved=db.execute(
                "SELECT exact_bytes,original_sha256 FROM federation_ancient_originals").fetchone()
            self.assertEqual(saved[0],original)
            self.assertEqual(hashlib.sha256(original).hexdigest(),saved[1])
            with self.assertRaises(sqlite3.IntegrityError):
                db.execute("DELETE FROM federation_ancient_originals")
            self.assertEqual(source.read_bytes(),original)
            second=run_source(db,source,archive)["federation"]
            self.assertEqual(second["source_id"],result["source_id"])
            self.assertEqual(second["originals_new"],0)
            self.assertEqual(second["derived_rows_new"],0)
            self.assertEqual(status(db)["native_originals"],1)
            self.assertEqual(db.execute(
                "SELECT COUNT(*) FROM federation_ancient_snapshots").fetchone()[0],1)
            self.assertGreaterEqual(db.execute(
                "SELECT COUNT(*) FROM federation_ancient_rows "
                "WHERE table_name='cero_uno_dos'").fetchone()[0],1)
            db.close()

    def test_unverified_worker_archive_is_not_executed(self):
        with TemporaryDirectory() as root:
            root=Path(root)
            source=root/"source.txt"
            source.write_text("Owner original")
            archive=root/"bad.zip"
            archive.write_bytes(b"not the pinned archive")
            db=open_main(root/"master.sqlite3")
            with self.assertRaisesRegex(ValueError,"archive SHA-256 mismatch"):
                run_source(db,source,archive)
            self.assertEqual(status(db)["native_originals"],0)
            db.close()

    def test_tampered_source_has_no_federation_side_effects(self):
        with TemporaryDirectory() as root:
            root=Path(root)
            archive=Path(__file__).with_name(ARCHIVE_NAME)
            worker=root/"worker_engine.py"
            with ZipFile(archive) as z:
                worker.write_bytes(z.read("nathan_mind_os/worker_engine.py"))
            import importlib.util
            spec=importlib.util.spec_from_file_location("ancient_workers",worker)
            module=importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            source=root/"unverified.sqlite3"
            existing=sqlite3.connect(source)
            module.initialize(existing)
            source_id=module.ingest(existing,b"Original bytes","source.txt","owner")
            existing.execute("DROP TRIGGER originals_no_update")
            existing.execute("UPDATE originals SET original_bytes=? WHERE id=?",
                             (b"tampered bytes",source_id))
            existing.commit()
            existing.close()
            db=open_main(root/"master.sqlite3")
            with self.assertRaisesRegex(ValueError,"checksum mismatch"):
                ingest_ancient(db,source)
            self.assertEqual(db.execute(
                "SELECT COUNT(*) FROM federation_sources").fetchone()[0],0)
            db.close()

    def test_existing_one_federation_workers_remain_available(self):
        from federation import run
        with TemporaryDirectory() as root:
            root=Path(root)
            db=open_main(root/"ONE.sqlite3")
            source=root/"brief.txt"
            source.write_text("Owner original")
            result=run_source(db,source,Path(__file__).with_name(ARCHIVE_NAME))
            self.assertTrue(result["federation"]["source_preserved"])
            statuses=run(db)
            self.assertEqual(len(statuses),6)
            self.assertEqual(statuses["Raphael"]["checksum_failures"],0)
            self.assertEqual(source.read_text(),"Owner original")
            db.close()

if __name__=="__main__":
    unittest.main()
