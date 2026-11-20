from contextlib import closing
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import time
import unittest
from unittest.mock import patch

import organism
from triage import make_packet


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
                payload = json.loads(req.data)[0]
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
