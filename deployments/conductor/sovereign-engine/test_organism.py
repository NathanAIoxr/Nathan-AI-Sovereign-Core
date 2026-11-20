from contextlib import closing
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import time
import unittest
from unittest.mock import patch

import organism
from verify_144bit_anchor import ANCHOR_FRAME, verify_frame
from triage import make_packet


class AnchorTests(unittest.TestCase):
    def test_master_frame_and_every_single_bit_change(self):
        frame = bytes.fromhex("AA55FF01312B313D327E312D313D300400F0")
        self.assertEqual(ANCHOR_FRAME, frame)
        self.assertTrue(verify_frame(frame))
        for bit in range(144):
            changed = bytearray(frame)
            changed[bit // 8] ^= 1 << (bit % 8)
            self.assertFalse(verify_frame(changed), bit)
        self.assertFalse(verify_frame(frame[::-1]))
        self.assertFalse(verify_frame(frame + b"\0"))


class IntakeTests(unittest.TestCase):
    def setUp(self):
        tmp = self.enterContext(TemporaryDirectory())
        self.db = self.enterContext(closing(organism.connect(Path(tmp) / "jobs.sqlite")))

    def test_enqueue_claim_expiry_and_receipt(self):
        first = organism.enqueue(self.db, "voice-box", "Voice π\n".encode())
        self.assertEqual(first, organism.enqueue(self.db, "voice-box", "Voice π\n".encode()))
        now = int(time.time())
        claim = organism.claim(self.db, now)
        self.assertEqual(claim["content"], "Voice π\n")
        self.assertIsNone(organism.claim(self.db, now))
        retry = organism.claim(self.db, now + 901)
        self.assertEqual(retry["attempts"], 2)
        with self.assertRaisesRegex(ValueError, "Lease expired"):
            organism.finish(self.db, first["id"], claim["lease"], "verified", b"evidence", now + 901)
        organism.finish(self.db, first["id"], retry["lease"], "verified", b"evidence", now + 901)
        self.assertIsNone(organism.claim(self.db, now + 1802))

    def test_only_final_receipts_clear_the_outbox(self):
        job = organism.enqueue(self.db, "hop-in", b"Owner-only raw content")
        now = int(time.time())
        lease = organism.claim(self.db, now)["lease"]
        organism.finish(self.db, job["id"], lease, "rejected", b"Owner-only evidence", now)

        def endpoint(state):
            def respond(req, **_):
                from io import BytesIO
                self.assertNotIn(b"Owner-only", req.data)
                self.assertEqual(req.get_header("Content-type"), "application/octet-stream")
                self.assertTrue(verify_frame(req.data[:18]))
                payload = json.loads(req.data[18:])[0]
                seal = organism.digest(json.dumps(payload, separators=(",", ":")).encode())
                return BytesIO(json.dumps({"receipts": [{"seal": seal, "state": state}]}).encode())
            return respond

        with patch.object(organism.request.OpenerDirector, "open", side_effect=endpoint("buffered")):
            self.assertEqual(organism.flush(self.db, "token")["pending_in_batch"], 1)
        with patch.object(organism.request.OpenerDirector, "open", side_effect=endpoint("already_committed")):
            self.assertEqual(organism.flush(self.db, "token")["acknowledged"], 1)
        self.assertEqual(organism.flush(self.db, "token")["acknowledged"], 0)

    def test_triage_contains_only_allowlisted_failure_details(self):
        repository = "NathanAIoxr/Nathan-AI-Sovereign-Core"
        run = {"name": "Nathan AI Six Dogs CI", "head_sha": "a" * 40, "id": 11, "run_attempt": 2,
               "head_repository": {"full_name": repository}, "head_branch": "main",
               "event": "push", "conclusion": "failure"}
        report = make_packet({"workflow_run": run}, repository, [
            {"id": 55, "conclusion": "failure", "log": "private log"}, {"id": 25, "conclusion": "success"},
        ])
        self.assertEqual(report["evidence"]["failed_job_ids"], [55])
        self.assertNotIn("private log", json.dumps(report))
        run["head_branch"] = "fork"
        with self.assertRaises(ValueError):
            make_packet({"workflow_run": run}, repository, [])
