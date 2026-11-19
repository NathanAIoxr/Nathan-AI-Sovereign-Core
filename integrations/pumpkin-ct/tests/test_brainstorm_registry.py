import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from brainstorm_registry import connect,record_source,record_idea,export_json

class RegistryTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.db=connect(str(Path(self.tmp.name)/"test.sqlite"))
    def tearDown(self):
        self.db.close()
        self.tmp.cleanup()
    def test_verbatim_unicode_and_idempotence(self):
        original='Diné, pumpkins, Collyn — “savages”'
        self.assertTrue(record_source(self.db,"msg-1",original))
        self.assertFalse(record_source(self.db,"msg-1",original))
        self.assertIn(original,export_json(self.db))
    def test_immutable_source(self):
        record_source(self.db,"msg-1","original")
        with self.assertRaises(ValueError):
            record_source(self.db,"msg-1","changed")
    def test_idea_links_to_source(self):
        record_source(self.db,"msg-1","Cookbooks")
        record_idea(self.db,"idea-1","msg-1","Cookbooks","food","Seasonal books")
        self.assertIn("UNDECIDED",export_json(self.db))
    def test_no_unlinked_idea(self):
        with self.assertRaises(ValueError):
            record_idea(self.db,"idea-1","missing","Title","category","text")

if __name__=="__main__": unittest.main()
