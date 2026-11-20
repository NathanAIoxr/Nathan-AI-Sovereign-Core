import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

import ledger as L

VECTORS = json.loads((Path(__file__).resolve().parent.parent / "test" / "vectors.json").read_text(encoding="utf-8"))

BASE = dict(
    scroll_siglum="1QIsa-a", cave_or_site="Qumran Cave 1", medium="parchment",
    script_lang="Hebrew", epigraphic_status="extant_verified", raw_text="\u05d1\u05e8\u05d0\u05e9\u05d9\u05ea",
)


def fresh():
    d = tempfile.mkdtemp()
    return L.init_local_db(Path(d) / "t.sqlite")


class Parity(unittest.TestCase):
    def test_vectors_reproduce(self):
        for c in VECTORS["cases"]:
            rec = L.validate_record(c["input"])
            self.assertEqual(L.canonical_json(L.content_fields(rec)), c["canonical_content"])
            self.assertEqual(L.client_hash(rec), c["client_sha256"])
            self.assertEqual(L.payload_hash(rec, c["client_sha256"], c["prev"], c["ts"]), c["payload_sha256"])

    def test_hmac_vectors(self):
        for h in VECTORS["hmac"]:
            self.assertEqual(L.sign_request(h["secret"], h["ts"], h["method"], h["path"], h["body"]), h["signature"])

    def test_anchor(self):
        self.assertTrue(L.verify_anchor_frame())
        self.assertFalse(L.verify_anchor_frame("AA55"))
        self.assertFalse(L.verify_anchor_frame(L.FORMAT_ANCHOR[:8] + "32" + L.FORMAT_ANCHOR[10:]))


class Ledger(unittest.TestCase):
    def test_append_and_verify(self):
        c = fresh()
        a = L.append_record(c, **BASE)
        b = L.append_record(c, **{**BASE, "scroll_siglum": "4Q175", "raw_text": "second"})
        self.assertEqual(a["prev_chain_sha256"], L.GENESIS_HASH)
        self.assertEqual(b["prev_chain_sha256"], a["payload_sha256"])
        ok, msg = L.verify_chain(c)
        self.assertTrue(ok, msg)

    def test_update_and_delete_blocked_by_triggers(self):
        c = fresh()
        L.append_record(c, **BASE)
        with self.assertRaises(sqlite3.DatabaseError):
            c.execute("UPDATE artifact_scroll_ledger SET content_nfc='x'")
        with self.assertRaises(sqlite3.DatabaseError):
            c.execute("DELETE FROM artifact_scroll_ledger")

    def test_tamper_detected_when_triggers_bypassed(self):
        c = fresh()
        L.append_record(c, **BASE)
        L.append_record(c, **{**BASE, "raw_text": "two"})
        c.execute("DROP TRIGGER ledger_no_update")  # attacker with schema access
        c.execute("UPDATE artifact_scroll_ledger SET content_nfc='forged' WHERE id=1")
        ok, msg = L.verify_chain(c)
        self.assertFalse(ok)
        self.assertIn("id 1", msg)

    def test_chain_cannot_fork(self):
        c = fresh()
        a = L.append_record(c, **BASE)
        with self.assertRaises(sqlite3.IntegrityError):  # second child of the same parent
            c.execute(
                """INSERT INTO artifact_scroll_ledger (entry_type, format_anchor, scroll_siglum, cave_or_site,
                   medium, script_lang, epigraphic_status, unix_timestamp, iso_timestamp, content_nfc,
                   client_sha256, payload_sha256, prev_chain_sha256)
                   VALUES ('record', ?, 's', 'c', 'stone', 'Greek', 'reconstructed', 1, 'x', 't', ?, ?, ?)""",
                (L.FORMAT_ANCHOR, "1" * 64, "2" * 64, a["prev_chain_sha256"]),
            )

    def test_replay_rejected(self):
        c = fresh()
        L.append_record(c, **BASE)
        with self.assertRaises(sqlite3.IntegrityError):  # identical content -> identical client_sha256
            L.append_record(c, **BASE)

    def test_correction_requires_existing_reference(self):
        c = fresh()
        a = L.append_record(c, **BASE)
        corr = L.append_record(c, **{**BASE, "entry_type": "correction",
                                     "ref_client_sha256": a["client_sha256"], "raw_text": "fixed reading"})
        self.assertEqual(corr["entry_type"], "correction")
        with self.assertRaises(sqlite3.IntegrityError):  # dangling reference blocked by foreign key
            L.append_record(c, **{**BASE, "entry_type": "correction",
                                  "ref_client_sha256": "e" * 64, "raw_text": "ghost"})
        ok, msg = L.verify_chain(c)
        self.assertTrue(ok, msg)

    def test_check_constraints(self):
        c = fresh()
        with self.assertRaises(ValueError):
            L.append_record(c, **{**BASE, "medium": "wood"})
        with self.assertRaises(ValueError):
            L.append_record(c, **{**BASE, "raw_text": "   "})
        with self.assertRaises(ValueError):
            L.append_record(c, **{**BASE, "entry_type": "correction"})

    def test_nfc_normalization(self):
        c = fresh()
        a = L.append_record(c, **{**BASE, "raw_text": "e\u0301"})
        self.assertEqual(a["content_nfc"], "\u00e9")


if __name__ == "__main__":
    unittest.main()
