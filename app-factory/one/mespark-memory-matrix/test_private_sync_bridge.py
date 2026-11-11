import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

from private_sync_bridge import build_export, write_export


class TestPrivateBridge(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.db = Path(self.tmp.name) / "private.sqlite3"
        with sqlite3.connect(self.db) as c:
            c.executescript("""
                CREATE TABLE source(id TEXT,sha256 TEXT);
                CREATE TABLE record(id TEXT,source_id TEXT,kind TEXT,title TEXT,
                  description TEXT,evidence_class TEXT,visibility TEXT,created_at TEXT);
            """)
            c.execute("INSERT INTO source VALUES (?,?)", ("s", "a" * 64))
            c.execute("INSERT INTO record VALUES (?,?,?,?,?,?,?,?)",
                      ("r1", "s", "timeline", "Fictional hometown", "private note",
                       "user_account", "private", "1985-01-01"))
            c.execute("INSERT INTO record VALUES (?,?,?,?,?,?,?,?)",
                      ("r2", "s", "story", "Public story", "created scene",
                       "fictional_canon", "public", "2026-01-01"))

    def test_public_default_and_stable_ids(self):
        a = build_export(self.db)
        b = build_export(self.db)
        self.assertEqual(a["schema"], "mespark-v1")
        self.assertEqual(len(a["nodes"]), 1)
        self.assertEqual(a["nodes"][0]["id"], b["nodes"][0]["id"])
        self.assertEqual(a["nodes"][0]["kind"], "fiction")
        self.assertNotIn("private note", json.dumps(a))

    def test_private_export_is_explicit_and_non_destructive(self):
        a = build_export(self.db, allow_private=True)
        self.assertEqual(len(a["nodes"]), 2)
        self.assertTrue(all(n["lat"] is None for n in a["nodes"]))
        self.assertTrue(all(n["source"].startswith("sha256:") for n in a["nodes"]))
        path = Path(self.tmp.name) / "export.json"
        self.assertEqual(write_export(self.db, path, allow_private=True), 2)
        with self.assertRaises(FileExistsError):
            write_export(self.db, path, allow_private=True)


if __name__ == "__main__":
    unittest.main()
