import os
from pathlib import Path
import sqlite3
import stat
from tempfile import TemporaryDirectory
import unittest

from zero_one_workers import digest, open_one, candidate
from database_bit_snapshot import (
    audit_snapshot, capture, find_snapshot, read_snapshot_worker, snapshot_status,
)


class PhysicalSnapshotBitWorkersTests(unittest.TestCase):
    def setUp(self):
        self.tmp = TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.db = self.root / "ONE_Private.sqlite3"
        c = sqlite3.connect(str(self.db))
        c.execute("""CREATE TABLE federation_records(
            source_id TEXT,record_id TEXT,content_sha256 TEXT,exact_source_text TEXT,
            title TEXT,record_kind TEXT,tier TEXT,
            PRIMARY KEY(source_id,record_id,content_sha256))""")
        text = "A"
        self.hash = digest(text.encode())
        c.execute("INSERT INTO federation_records VALUES(?,?,?,?,?,?,?)",
                  ("source", "A", self.hash, text, "A", "original", "CERO"))
        # This source holds opaque binary data beyond federation_records.
        c.execute("CREATE TABLE private_blob(value BLOB)")
        c.execute("INSERT INTO private_blob VALUES(?)", (sqlite3.Binary(b"\x00\xff"),))
        c.commit()
        c.close()
        self.con = open_one(self.db)
        self.addCleanup(self.con.close)

    def test_all_sqlite_file_bytes_addressed_without_per_bit_allocation(self):
        snap = self.root / "private_copy.sqlite3"
        result = capture(self.con, snap)
        self.assertTrue(snap.is_file())
        self.assertEqual(stat.S_IMODE(snap.stat().st_mode), 0o600)
        self.assertEqual(result["zero_one_workers"], snap.stat().st_size * 8)
        self.assertEqual(result["per_bit_processes_started"], 0)
        self.assertFalse(result["snapshot_is_live_sync"])
        s = result["snapshot_sha256"]
        self.assertEqual(snapshot_status(self.con)["registered_snapshots"], 1)
        self.assertEqual(snapshot_status(self.con)["snapshot_virtual_bits_total"],
                         snap.stat().st_size * 8)
        # SQLite header begins with ASCII S (0x53 => 01010011).
        bits = [read_snapshot_worker(self.con, s, i)["bit"] for i in range(8)]
        self.assertEqual(bits, [0, 1, 0, 1, 0, 0, 1, 1])
        self.assertNotEqual(read_snapshot_worker(self.con, s, 0)["id"],
                            read_snapshot_worker(self.con, s, 1)["id"])
        counts = audit_snapshot(self.con, s)
        self.assertEqual(counts["zero_workers"] + counts["one_workers"],
                         result["zero_one_workers"])
        self.assertFalse(counts["external_execution"])
        self.assertEqual(candidate(self.con, read_snapshot_worker(self.con, s, 1),
                                   "external_call")["decision"],
                         "DENIED_OWNER_GRANT_REQUIRED")
        self.assertEqual(
            self.con.execute("SELECT exact_source_text,content_sha256 "
                             "FROM federation_records").fetchone(), ("A", self.hash))
        self.assertEqual(
            self.con.execute("SELECT COUNT(*) FROM zero_one_snapshots").fetchone()[0], 1)

    def test_reject_overwrite_missing_and_out_of_range(self):
        snap = self.root / "private_copy.sqlite3"
        s = capture(self.con, snap)["snapshot_sha256"]
        with self.assertRaisesRegex(ValueError, "replace"):
            capture(self.con, snap)
        with self.assertRaisesRegex(ValueError, "outside"):
            read_snapshot_worker(self.con, s, snap.stat().st_size * 8)
        with self.assertRaises(ValueError):
            read_snapshot_worker(self.con, s, -1)
        with self.assertRaises(ValueError):
            read_snapshot_worker(self.con, "0" * 64, 0)

    def test_tampered_snapshot_rejected(self):
        snap = self.root / "private_copy.sqlite3"
        s = capture(self.con, snap)["snapshot_sha256"]
        with open(snap, "r+b") as f:
            f.seek(200)
            original = f.read(1)
            f.seek(200)
            f.write(bytes([original[0] ^ 1]))
        with self.assertRaisesRegex(ValueError, "hash changed"):
            audit_snapshot(self.con, s)
        with self.assertRaisesRegex(ValueError, "hash changed"):
            read_snapshot_worker(self.con, s, 0)

    def test_requires_private_parent_and_source_is_not_overwritten(self):
        public_dir = self.root / "public"
        public_dir.mkdir(mode=0o755)
        os.chmod(public_dir, 0o755)
        with self.assertRaisesRegex(ValueError, "owner-only"):
            capture(self.con, public_dir / "copy.sqlite3")
        self.assertFalse((public_dir / "copy.sqlite3").exists())
        # A safe new snapshot is made by SQLite backup, not by editing originals.
        snap = self.root / "private_copy.sqlite3"
        capture(self.con, snap)
        self.assertEqual(
            self.con.execute("SELECT COUNT(*) FROM private_blob").fetchone()[0], 1)
        with sqlite3.connect(str(snap)) as copy:
            self.assertEqual(copy.execute("SELECT hex(value) FROM private_blob").fetchone()[0],
                             "00FF")


if __name__ == "__main__":
    unittest.main()
