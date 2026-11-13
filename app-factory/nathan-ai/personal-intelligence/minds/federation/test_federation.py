import json
from pathlib import Path
import sqlite3
from tempfile import TemporaryDirectory
import unittest
from federation import open_main, ingest, run, file_sha, search_records

class OneFederationTests(unittest.TestCase):
    def test_sqlite_source_preservation(self):
        with TemporaryDirectory() as root:
            source=Path(root)/"source.sqlite3"
            con=sqlite3.connect(source)
            con.execute("CREATE TABLE item(key TEXT,title TEXT,record_json TEXT)")
            exact='{"original":"YES IS YES — NO IS NO"}'
            con.execute("INSERT INTO item VALUES(?,?,?)",("A1","Original A1",exact))
            con.commit(); con.close()
            before=file_sha(source)
            main=open_main(Path(root)/"ONE.sqlite3")
            self.assertEqual(ingest(main,source)["new_records"],1)
            self.assertEqual(ingest(main,source)["new_records"],0)
            self.assertEqual(main.execute("SELECT exact_source_text FROM federation_records").fetchone()[0],exact)
            self.assertEqual(run(main)["Raphael"]["checksum_failures"],0)
            self.assertEqual(main.execute("SELECT COUNT(*) FROM federation_jobs").fetchone()[0],6)
            self.assertEqual(file_sha(source),before)
            main.close()
    def test_registry_json(self):
        with TemporaryDirectory() as root:
            source=Path(root)/"minds.json"
            source.write_text(json.dumps({"minds":[{"id":"tmnt.leonardo","name":"Leonardo"}]}))
            main=open_main(Path(root)/"ONE.sqlite3")
            self.assertEqual(ingest(main,source)["new_records"],1)
            self.assertEqual(run(main)["AncientSpecialists"]["CERO"],1)
            main.close()

    def test_v074_meru_knowledge_source_links_and_search(self):
        pack=Path(__file__).resolve().parent/"data"/"space-final-frontier-meru-v074.json"
        data=json.loads(pack.read_text(encoding="utf-8"))
        self.assertEqual(data["schema"],"nathan.one.federation.knowledge.v074")
        self.assertEqual(len(data["records"]),41)
        self.assertEqual(len(data["links"]),40)
        with TemporaryDirectory() as root:
            c=open_main(Path(root)/"ONE.sqlite3")
            original_hash=file_sha(pack)
            self.assertEqual(ingest(c,pack)["new_records"],41)
            self.assertEqual(ingest(c,pack)["new_records"],0)
            self.assertEqual(c.execute("SELECT count(*) FROM federation_record_metadata").fetchone()[0],41)
            self.assertEqual(c.execute("SELECT count(*) FROM federation_links WHERE state='proposed'").fetchone()[0],40)
            self.assertEqual(c.execute("SELECT count(*) FROM federation_records WHERE record_kind='knowledge-v074' AND tier='CERO'").fetchone()[0],41)
            self.assertEqual(c.execute("SELECT count(*) FROM federation_proposals").fetchone()[0],0)
            matched=search_records(c,"ME R U U R ME")
            self.assertTrue(any(x["record_id"]=="knowledge:author.me-r-u-u-r-me" for x in matched))
            self.assertEqual(c.execute("SELECT exact_source_text FROM federation_records WHERE record_id='knowledge:author.space-between-ears'").fetchone()[0],
                 "SPACE ... THE FINAL FRONTIER aka the SPACE between the EARS as my grandmother said")
            self.assertEqual(run(c)["Raphael"]["checksum_failures"],0)
            self.assertEqual(c.execute("PRAGMA integrity_check").fetchone()[0],"ok")
            self.assertEqual(file_sha(pack),original_hash)
            c.close()

    def test_v074_invalid_edges_rejected_without_source_rewrite(self):
        with TemporaryDirectory() as root:
            pack=Path(root)/"bad.json"
            data={"schema":"nathan.one.federation.knowledge.v074",
                  "records":[{"id":"a","title":"A","exact_text":"Source A"}],
                  "links":[{"left":"a","right":"nonexistent","relation":"invented"}]}
            pack.write_text(json.dumps(data),encoding="utf-8")
            c=open_main(Path(root)/"ONE.sqlite3")
            before=file_sha(pack)
            with self.assertRaisesRegex(ValueError,"unknown record"):
                ingest(c,pack)
            self.assertEqual(c.execute("SELECT count(*) FROM federation_records").fetchone()[0],0)
            self.assertEqual(file_sha(pack),before)
            c.close()

if __name__=="__main__":
    unittest.main()
