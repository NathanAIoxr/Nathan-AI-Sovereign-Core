"""Synthetic-only tests; never publish owner-original source bytes via CI."""
import hashlib
from pathlib import Path
from tempfile import TemporaryDirectory
import sqlite3
import unittest

from federation import open_main
from ancient_minds_v074 import (
    VERSION, WORKERS, UNASSIGNED_SLOTS, TABLES, base12,
    ingest_source, initialize, drain, status,
)

SAMPLE = ("Old English blāc and blæc, Sanskrit nāraṅga; "
          "the 1500s; Aristotelian perspectives and modern optical analysis.")


class AncientMindsV074Tests(unittest.TestCase):
    def test_base12_and_full_14_family(self):
        self.assertEqual(base12(11869), "6A51")
        self.assertEqual(base12(0), "0")
        self.assertEqual(len(TABLES), 14)
        self.assertEqual(len(WORKERS), 6)
        self.assertEqual(UNASSIGNED_SLOTS, 4)
        with TemporaryDirectory() as root:
            conn=open_main(Path(root)/"one.sqlite3")
            initialize(conn)
            names={x[0] for x in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            for label in TABLES:
                self.assertIn("ancient_"+label,names)
            self.assertEqual(status(conn)["version"],VERSION)
            conn.close()

    def test_six_specialists_byte_identity_idempotent_and_isolated_tiers(self):
        with TemporaryDirectory() as root:
            root=Path(root)
            original=root/"source.txt"
            raw=SAMPLE.encode("utf-8")
            original.write_bytes(raw)
            before=hashlib.sha256(original.read_bytes()).hexdigest()
            conn=open_main(root/"ONE.sqlite3")
            x=ingest_source(conn,original)
            self.assertTrue(x["unchanged"])
            self.assertEqual(x["sha256"],before)
            self.assertEqual(ingest_source(conn,original)["source_id"],x["source_id"])
            self.assertEqual(conn.execute("SELECT COUNT(*) FROM ancient_originals").fetchone()[0],1)
            outcome=drain(conn,x["source_id"])
            self.assertEqual(outcome["worker_runs"],6)
            self.assertEqual(outcome["jobs_queued"],0)
            self.assertEqual(outcome["proposed_links"],1)
            self.assertEqual(outcome["claims_needing_review"],2)
            self.assertEqual(outcome["evidence"],0)
            self.assertEqual(outcome["embedding_rows"],0)
            self.assertEqual(outcome["unassigned_specialist_slots"],4)
            self.assertEqual(drain(conn,x["source_id"])["jobs_processed_this_run"],0)
            self.assertEqual(conn.execute("SELECT COUNT(*) FROM ancient_worker_runs").fetchone()[0],6)
            indexed=conn.execute("SELECT original_bytes,sha256 FROM ancient_originals").fetchone()
            self.assertEqual(bytes(indexed[0]),raw)
            self.assertEqual(indexed[1],before)
            self.assertEqual(original.read_bytes(),raw)
            with self.assertRaises(sqlite3.IntegrityError):
                conn.execute("UPDATE ancient_originals SET original_bytes=?",(b"changed",))
            with self.assertRaises(sqlite3.IntegrityError):
                conn.execute("DELETE FROM ancient_originals")
            self.assertEqual(conn.execute("SELECT COUNT(*) FROM ancient_cero_uno_dos WHERE tier='0.0'").fetchone()[0],1)
            self.assertGreater(conn.execute("SELECT COUNT(*) FROM ancient_cero_uno_dos WHERE tier='1.0'").fetchone()[0],0)
            self.assertEqual(conn.execute("SELECT COUNT(*) FROM ancient_cero_uno_dos WHERE tier='2.0'").fetchone()[0],1)
            conn.close()

    def test_new_source_version_keeps_prior_original(self):
        with TemporaryDirectory() as root:
            root=Path(root);source=root/"source.txt"
            conn=open_main(root/"one.sqlite3")
            source.write_text("first original")
            first=ingest_source(conn,source)
            source.write_text("second original")
            second=ingest_source(conn,source)
            self.assertNotEqual(first["source_id"],second["source_id"])
            self.assertEqual(status(conn)["originals"],2)
            values={bytes(x[0]) for x in conn.execute("SELECT original_bytes FROM ancient_originals")}
            self.assertEqual(values,{b"first original",b"second original"})
            conn.close()

    def test_no_source_mutation_and_validation(self):
        with TemporaryDirectory() as root:
            root=Path(root);source=root/"owner.txt"
            source.write_bytes(b"\xff")
            conn=open_main(root/"one.sqlite3")
            with self.assertRaises(UnicodeDecodeError):
                ingest_source(conn,source)
            self.assertEqual(status(conn)["originals"],0)
            source.write_text("x")
            self.assertEqual(drain(conn)["jobs_processed_this_run"],0)
            with self.assertRaises(ValueError):
                base12(-1)
            with self.assertRaises(ValueError):
                drain(conn,limit=1000)
            conn.close()

    def test_limited_dispatch_can_resume(self):
        with TemporaryDirectory() as root:
            root=Path(root);source=root/"owner.txt"
            source.write_text(SAMPLE)
            conn=open_main(root/"one.sqlite3")
            ref=ingest_source(conn,source)
            partial=drain(conn,ref["source_id"],limit=1)
            self.assertEqual(partial["worker_runs"],1)
            self.assertEqual(partial["jobs_queued"],5)
            final=drain(conn,ref["source_id"],limit=5)
            self.assertEqual(final["worker_runs"],6)
            self.assertEqual(final["jobs_queued"],0)
            conn.close()

if __name__=="__main__":
    unittest.main()
