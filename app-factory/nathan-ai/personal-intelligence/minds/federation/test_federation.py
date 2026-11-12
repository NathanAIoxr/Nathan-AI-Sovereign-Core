import json
from pathlib import Path
import sqlite3
from tempfile import TemporaryDirectory
import unittest
from federation import open_main, ingest, run, file_sha

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

if __name__=="__main__":
    unittest.main()
