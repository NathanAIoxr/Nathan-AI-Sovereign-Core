import csv
from pathlib import Path
import tempfile
import unittest
import reconcile_local as R

class LocalReconcileTests(unittest.TestCase):
    def setUp(self):
        self.catalog={"records":[
            {"id":"h:1","name":"NATHAN AI Hack D Hack / Glyphstream Breach Engine","job":"defense","kind":"historical-title","status":"locate-original","nextTask":"Find original"},
            {"id":"h:2","name":"Hall of Mirrors","job":"defense","kind":"branch-only-source","status":"review-build","nextTask":"Test it"},
            {"id":"h:3","name":"Unrelated original source","job":"triage","kind":"historical-title","status":"locate-original","nextTask":"Find original"}]}
    def test_matching_keeps_uncertain_candidate_status(self):
        records=[{"path":"Backups/Hack_D_Hack_Glyphstream/source.py","project_hint":"Hack D Hack Glyphstream","tags":"defense","kind":"source_code","origin":"filesystem","sha256":"a"*64},
                 {"path":"notes/random.txt","project_hint":"random","tags":"","kind":"other","origin":"filesystem"},
                 {"path":"Backups/Hall_of_Mirrors/engine.js","project_hint":"Hall of Mirrors","tags":"defense","kind":"source_code","origin":"filesystem"}]
        matches,unmatched=R.candidate_matches(self.catalog,records)
        self.assertEqual(len(matches),2)
        self.assertTrue(all(x["result"]=="CANDIDATE_NOT_VERIFIED" for x in matches))
        self.assertEqual({x["catalog_id"] for x in matches},{"h:1","h:2"})
        self.assertEqual([r["id"] for r in unmatched],["h:3"])
    def test_no_match_from_generic_program_words(self):
        records=[{"path":"Nathan_AI_Core_App/file.txt","project_hint":"Nathan AI Core","tags":"","kind":"other","origin":"filesystem"}]
        matches,unmatched=R.candidate_matches(self.catalog,records)
        self.assertEqual(len(matches),0)
        self.assertEqual(len(unmatched),3)
    def test_csv_escapes_formula_cells(self):
        with tempfile.TemporaryDirectory() as d:
            file=Path(d)/"report.csv"
            R.safe_csv_write(file,["candidate_path"],[{"candidate_path":'=cmd(1)'}])
            with file.open(newline="") as f:
                row=next(csv.DictReader(f))
            self.assertEqual(row["candidate_path"],"'=cmd(1)")

if __name__ == "__main__":
    unittest.main()
