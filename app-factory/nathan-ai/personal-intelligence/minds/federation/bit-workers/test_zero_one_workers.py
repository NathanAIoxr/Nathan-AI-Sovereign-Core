import hashlib
import os
from pathlib import Path
import sqlite3
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from zero_one_workers import (
    ACTIONS_REQUIRING_GRANT, audit_counts, authorize_handoff, candidate,
    coverage, digest, issue_owner_grant, open_one, set_paused, worker,
)


class ZeroOneWorkersTests(unittest.TestCase):
    def setUp(self):
        self.tmp = TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.db = Path(self.tmp.name) / "ONE_Private.sqlite3"
        con = sqlite3.connect(self.db)
        con.execute("""
          CREATE TABLE federation_records(
            source_id TEXT, record_id TEXT, content_sha256 TEXT,
            exact_source_text TEXT, title TEXT, record_kind TEXT,
            tier TEXT,
            PRIMARY KEY(source_id,record_id,content_sha256))
        """)
        self.original = "A"  # 01000001, one ZERO and ONE worker per bit
        self.h = digest(self.original.encode("utf-8"))
        con.execute("INSERT INTO federation_records VALUES(?,?,?,?,?,?,?)",
                    ("source", "A1", self.h, self.original, "record", "original", "CERO"))
        con.commit()
        con.close()
        self.con = open_one(self.db)
        self.addCleanup(self.con.close)

    def w(self, index=0):
        return worker(self.con, "source", "A1", self.h, index)

    def test_every_bit_addressable_without_materialization(self):
        self.assertEqual(coverage(self.con)["logical_zero_one_workers"], 8)
        bits = [self.w(i)["bit"] for i in range(8)]
        self.assertEqual(bits, [0, 1, 0, 0, 0, 0, 0, 1])
        self.assertEqual(audit_counts(self.con)["zero_workers"], 6)
        self.assertEqual(audit_counts(self.con)["one_workers"], 2)
        self.assertEqual(coverage(self.con)["materialized_per_bit_processes"], 0)
        self.assertNotIn("exact_source_text", repr(self.w(0)))
        self.assertEqual(self.w(1)["role"], "ONE / propose-and-build")
        self.assertEqual(self.w(0)["role"], "ZERO / guard-and-hold")

    def test_utf8_counts_bytes_not_characters(self):
        text = "é"  # two UTF-8 bytes and therefore 16 addressable bits
        h = digest(text.encode("utf-8"))
        self.con.execute("INSERT INTO federation_records VALUES(?,?,?,?,?,?,?)",
                         ("source", "unicode", h, text, "unicode", "original", "UNO"))
        self.con.commit()
        self.assertEqual(coverage(self.con)["logical_zero_one_workers"], 24)
        self.assertEqual(worker(self.con, "source", "unicode", h, 15)["bit"],
                         text.encode("utf-8")[1] & 1)
        self.assertEqual(audit_counts(self.con)["total_workers"], 24)

    def test_revision_and_identity_stable(self):
        self.assertEqual(self.w(0)["id"], self.w(0)["id"])
        self.assertNotEqual(self.w(0)["id"], self.w(1)["id"])
        changed = "B"
        h = digest(changed.encode())
        self.con.execute("INSERT INTO federation_records VALUES(?,?,?,?,?,?,?)",
                         ("source", "A1", h, changed, "revision", "original", "CERO"))
        self.con.commit()
        self.assertNotEqual(self.w(0)["id"],
                            worker(self.con, "source", "A1", h, 0)["id"])

    def test_invalid_offsets_and_tampering_rejected(self):
        for ix in (-1, 8, True):
            with self.assertRaises(ValueError):
                self.w(ix)
        with self.assertRaises(ValueError):
            worker(self.con, "source", "A1", "0" * 64, 0)
        self.con.execute("UPDATE federation_records SET exact_source_text='X'")
        with self.assertRaisesRegex(ValueError, "SHA-256"):
            self.w(0)
        with self.assertRaisesRegex(ValueError, "SHA-256"):
            audit_counts(self.con)

    def test_both_values_are_non_executing_and_need_grants(self):
        for ix in (0, 1):
            w = self.w(ix)
            self.assertEqual(candidate(self.con, w)["decision"],
                             "PROPOSAL_ONLY_NO_EXECUTION")
            for action in ACTIONS_REQUIRING_GRANT:
                gate = candidate(self.con, w, action)
                self.assertEqual(gate["decision"], "DENIED_OWNER_GRANT_REQUIRED")
                self.assertFalse(gate["executed"])

    def test_owner_veto_precedence(self):
        self.assertTrue(set_paused(self.con, True)["paused"])
        self.assertEqual(candidate(self.con, self.w(1))["decision"],
                         "DENIED_OWNER_PAUSE")
        self.assertEqual(candidate(self.con, self.w(0), "database_write")["decision"],
                         "DENIED_OWNER_PAUSE")
        self.assertFalse(set_paused(self.con, False)["paused"])

    def test_signed_one_use_owner_grant_protects_scopes(self):
        with patch.dict(os.environ, {"NATHAN_ONE_OWNER_SIGNING_KEY": "a" * 40}):
            one = self.w(1)
            zero = self.w(0)
            token = issue_owner_grant(one, "database_write")
            with self.assertRaisesRegex(ValueError, "Invalid or expired"):
                authorize_handoff(self.con, zero, "database_write", token)
            with self.assertRaisesRegex(ValueError, "Invalid or expired"):
                authorize_handoff(self.con, one, "export", token)
            result = authorize_handoff(self.con, one, "database_write", token)
            self.assertEqual(result["decision"], "AUTHORIZED_HANDOFF_ONLY_NO_EXECUTION")
            self.assertFalse(result["executed"])
            with self.assertRaisesRegex(ValueError, "replay"):
                authorize_handoff(self.con, one, "database_write", token)
            self.assertEqual(
                self.con.execute("SELECT COUNT(*) FROM zero_one_grant_uses").fetchone()[0], 1)
            self.assertEqual(
                self.con.execute("SELECT COUNT(*) FROM zero_one_audit "
                                 "WHERE event='owner_grant_checked'").fetchone()[0], 1)

    def test_owner_pause_blocks_signed_token_and_does_not_consume_it(self):
        with patch.dict(os.environ, {"NATHAN_ONE_OWNER_SIGNING_KEY": "z" * 40}):
            w = self.w(0)
            token = issue_owner_grant(w, "export")
            set_paused(self.con, True)
            self.assertEqual(
                authorize_handoff(self.con, w, "export", token)["decision"],
                "DENIED_OWNER_PAUSE")
            self.assertEqual(
                self.con.execute("SELECT COUNT(*) FROM zero_one_grant_uses").fetchone()[0], 0)
            set_paused(self.con, False)
            self.assertFalse(authorize_handoff(self.con, w, "export", token)["executed"])

    def test_wrong_key_and_tampered_token_rejected(self):
        with patch.dict(os.environ, {"NATHAN_ONE_OWNER_SIGNING_KEY": "k" * 40}):
            t = issue_owner_grant(self.w(1), "export")
        with patch.dict(os.environ, {"NATHAN_ONE_OWNER_SIGNING_KEY": "t" * 40}):
            with self.assertRaisesRegex(ValueError, "Invalid or expired"):
                authorize_handoff(self.con, self.w(1), "export", t)
        with patch.dict(os.environ, {"NATHAN_ONE_OWNER_SIGNING_KEY": "k" * 40}):
            with self.assertRaisesRegex(ValueError, "Invalid or expired"):
                authorize_handoff(self.con, self.w(1), "export", t[:-1] + "x")

    def test_source_record_never_overwritten(self):
        original = self.con.execute(
            "SELECT exact_source_text,content_sha256 FROM federation_records").fetchone()
        audit_counts(self.con)
        candidate(self.con, self.w(0), "database_write")
        set_paused(self.con, True)
        self.assertEqual(
            self.con.execute(
                "SELECT exact_source_text,content_sha256 FROM federation_records").fetchone(),
            original)

    def test_existing_file_required(self):
        with self.assertRaisesRegex(ValueError, "Existing private master"):
            open_one(Path(self.tmp.name) / "absent.sqlite3")


if __name__ == "__main__":
    unittest.main()
