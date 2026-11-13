import hashlib
import sqlite3
import unittest
from worker_engine import initialize, ingest, drain, report, run_pipeline, base12

SAMPLE=("Old English blāc and blæc, Sanskrit nāraṅga, "
        "the 1500s, and Aristotelian versus optical frameworks.").encode("utf-8")

class MindOSReferenceTests(unittest.TestCase):
    def setUp(self):
        self.db=sqlite3.connect(":memory:")
        initialize(self.db)

    def tearDown(self):
        self.db.close()

    def test_exactly_14_tables(self):
        tables={x[0] for x in self.db.execute(
            "SELECT name FROM sqlite_master WHERE type='table'")}
        self.assertEqual(len(tables),14)
        self.assertIn("originals",tables)
        self.assertIn("embeddings",tables)

    def test_original_bytes_insert_only(self):
        source=ingest(self.db,SAMPLE,"fixture.txt","author source")
        original=self.db.execute(
            "SELECT original_bytes,sha256 FROM originals WHERE id=?",(source,)).fetchone()
        self.assertEqual(original[0],SAMPLE)
        self.assertEqual(original[1],hashlib.sha256(SAMPLE).hexdigest())
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("UPDATE originals SET filename='changed' WHERE id=?",(source,))
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("DELETE FROM originals WHERE id=?",(source,))

    def test_bounded_jobs_and_candidate_links(self):
        source=ingest(self.db,SAMPLE,"fixture.txt","author source")
        self.assertEqual(drain(self.db),6)
        summary=report(self.db,source,SAMPLE)
        self.assertTrue(summary["original_bytes_preserved"])
        self.assertEqual(summary["jobs_left_queued"],0)
        self.assertEqual(summary["independent_evidence_rows"],0)
        self.assertEqual(summary["embeddings_created"],0)
        self.assertEqual(summary["worker_slots_waiting_for_original_names"],4)
        self.assertEqual(len(summary["worker_runs"]),6)
        self.assertEqual(len(summary["relationships"]),1)
        self.assertEqual(summary["relationships"][0]["evidence_status"],"proposed")
        self.assertGreaterEqual(summary["claims_needing_review"],2)

    def test_base12_roundtrip(self):
        for value in (0,1,11,12,144,1200,1234567):
            self.assertEqual(int(base12(value),12),value)
            self.assertTrue(set(base12(value)) <= set("0123456789AB"))

    def test_pipeline_from_original_bytes(self):
        r=run_pipeline(SAMPLE,"fixture.txt")
        self.assertEqual(r["tables"],14)
        self.assertTrue(r["original_bytes_preserved"])
        self.assertTrue(all(x["outcome"]=="done" for x in r["worker_runs"]))

if __name__=="__main__":
    unittest.main()
