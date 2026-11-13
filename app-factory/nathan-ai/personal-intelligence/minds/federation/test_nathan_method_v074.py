"""Source-first tests for Nathan Tabor Method v074 public integration."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from federation import ingest, open_main, run, search_records

ROOT = Path(__file__).resolve().parent
PACK = ROOT / "data" / "nathan-method-integrated-v074.json"

class TestNathanMethodV074(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc = json.loads(PACK.read_text(encoding="utf-8"))

    def test_pack_counts_and_provenance(self):
        d = self.doc
        self.assertEqual(d["schema"], "nathan.one.federation.knowledge.v074")
        self.assertEqual(len(d["records"]), 522)
        self.assertEqual(len(d["links"]), 519)
        self.assertEqual(len(d["source_manifest"]), 11)
        ids = [r["id"] for r in d["records"]]
        self.assertEqual(len(set(ids)), len(ids))
        self.assertTrue(all(r["tier"] == "CERO" for r in d["records"]))
        self.assertTrue(all(r["exact_text"] and r["title"] for r in d["records"]))
        self.assertTrue(all(x["left"] in ids and x["right"] in ids for x in d["links"]))
        self.assertEqual(sum(x.startswith("history.root.") for x in ids), 101)
        self.assertEqual(sum(x.startswith("maxim.") for x in ids), 101)
        self.assertEqual(sum(x.startswith("anatomy.") for x in ids), 206)
        self.assertEqual(sum(x.startswith("pillar.") for x in ids), 40)

    def test_all_original_artifacts_match_sha256_and_size(self):
        for source in self.doc["source_manifest"]:
            p = ROOT / source["path"]
            self.assertTrue(p.is_file(), str(p))
            raw = p.read_bytes()
            self.assertEqual(len(raw), source["bytes"], str(p))
            self.assertEqual(hashlib.sha256(raw).hexdigest(), source["sha256"], str(p))

    def test_word_image_source_kept_exact_and_not_an_assumed_trigger(self):
        nodes = {r["id"]: r for r in self.doc["records"]}
        text = nodes["author.word-image-discovery-trail"]["exact_text"]
        self.assertIn('"word or image" that triggered where I went next', text)
        self.assertIn('"guiderails"', text)
        self.assertIn("i didn't come to stay", text)
        log = json.loads((ROOT / "data" / "word-image-discovery-trail-v074.json").read_text(encoding="utf-8"))
        self.assertEqual(text, log["author_exact"])
        self.assertTrue(all(event["trigger_exact"] is None for event in log["sample_routes"]))

    def test_same_internal_federation_and_idempotent_import(self):
        with tempfile.TemporaryDirectory() as d:
            c = open_main(Path(d) / "master.sqlite3")
            try:
                first = ingest(c, PACK)
                self.assertEqual(first["new_records"], 522)
                self.assertEqual(c.execute("SELECT COUNT(*) FROM federation_records").fetchone()[0], 522)
                self.assertEqual(c.execute("SELECT COUNT(*) FROM federation_links").fetchone()[0], 519)
                second = ingest(c, PACK)
                self.assertEqual(second["new_records"], 0)
                self.assertEqual(c.execute("SELECT COUNT(*) FROM federation_records").fetchone()[0], 522)
                self.assertEqual(c.execute("SELECT COUNT(*) FROM federation_links").fetchone()[0], 519)
                self.assertEqual(c.execute("SELECT COUNT(*) FROM federation_record_metadata").fetchone()[0], 522)
                self.assertEqual(c.execute("SELECT COUNT(*) FROM federation_links WHERE state='proposed'").fetchone()[0], 519)
                result = run(c)
                self.assertEqual(len(result), 6)
                self.assertEqual(result["Raphael"]["checksum_failures"], 0)
                self.assertTrue(search_records(c, "word or image"))
            finally:
                c.close()

if __name__ == "__main__":
    unittest.main()
