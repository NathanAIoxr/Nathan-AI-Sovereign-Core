from concurrent.futures import ThreadPoolExecutor
import hashlib
import hmac
import json
from pathlib import Path
import sqlite3
import tempfile
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from node_x import Node, NodeServer, Problem, canonical, handler, merkle

TOKENS = {role: letter * 32 for role, letter in
          zip(("operator", "ci", "alert", "edge", "pulse", "drift"), "abcdef")}
KEY = "z" * 32
REPO = "NathanAIoxr/Nathan-AI-Sovereign-Core"


class NodeTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.path = str(Path(directory.name) / "ledger.sqlite3")
        self.node = self.open()

    def open(self):
        return Node(self.path, TOKENS, KEY, ["demo.service"], REPO, "https://health.example.test/",
                    probe=lambda *args: ("failed", {"exit_code": 3}))

    def test_no_default_or_shared_tokens(self):
        with self.assertRaises(ValueError):
            Node(self.path, {"operator": "replace-with-strong-token"}, KEY)
        with self.assertRaises(ValueError):
            Node(self.path, {"operator": KEY}, KEY)

    def test_forward_retry_failure_and_reopen(self):
        p = {"cid": "status-01", "intent": "service.status", "target": "demo.service"}
        with ThreadPoolExecutor(max_workers=4) as pool:
            outcomes = list(pool.map(lambda _: self.node.drive("operator", p), range(8)))
        self.assertTrue(all(outcome == outcomes[0] for outcome in outcomes))
        self.assertEqual(outcomes[0]["state"], "failed")
        self.assertEqual(self.open().drive("operator", p), outcomes[0])
        self.assertEqual([e["kind"] for e in self.node.entries("operator", 0, 10, p["cid"])["events"]],
                         ["forward_hit_x", "forward_audit", "return_hit_x"])
        with self.assertRaises(Problem) as error:
            self.node.drive("operator", dict(p, intent="service.restart"))
        self.assertEqual(error.exception.status, 409)

    def test_mutations_wait_and_cli_arguments_are_allowlisted(self):
        result = self.node.drive("operator", {"cid": "restart-01", "intent": "service.restart",
                                             "target": "demo.service"})
        self.assertEqual(result["state"], "awaiting_approval")
        with self.assertRaises(Problem):
            self.node.drive("operator", {"cid": "restart-02", "intent": "service.restart",
                                         "target": "--help"})

    def test_ci_only_resolves_matching_verification_and_preserves_failure(self):
        p = {"cid": "verify-0001", "intent": "github.verify", "target": REPO,
             "arguments": {"expected_sha": "a" * 40}}
        self.assertEqual(self.node.drive("operator", p)["state"], "awaiting_ci")
        event = {"event_id": "github-run-1", "cid": p["cid"],
                 "data": {"sha": "a" * 40, "run_id": 123, "conclusion": "failure"}}
        with self.assertRaises(Problem):
            self.node.ingest("ci", dict(event, data=dict(event["data"], sha="b" * 40)))
        first = self.node.ingest("ci", event)
        self.assertEqual(self.open().ingest("ci", event), first)
        self.assertEqual(self.node.drive("operator", p)["state"], "failed")

    def test_scoped_reverse_lanes_and_checkpoint(self):
        inputs = {"alert": {"code": "disk_low", "severity": "critical"},
                  "edge": {"colo": "IAD", "status": 503, "duration_ms": 18},
                  "pulse": {"host": "conductor", "uptime_seconds": 10, "disk_free_bytes": 90},
                  "drift": {"repository": REPO, "action": "opened", "number": 129}}
        for role, data in inputs.items():
            self.node.ingest(role, {"event_id": "event-" + role, "data": data})
        events = self.node.entries("operator", 0, 10)["events"]
        self.assertEqual([e["lane"] for e in events], [7, 9, 10, 11])
        cp = self.node.checkpoint("operator")
        summary = {key: cp[key] for key in ("first_seq", "last_seq", "root")}
        self.assertEqual(summary["root"], merkle([x["sha256"] for x in events]))
        self.assertEqual(cp["signature"], hmac.new(KEY.encode(), canonical(summary).encode(),
                                                   hashlib.sha256).hexdigest())
        self.assertEqual(self.open().checkpoint("operator")["state"], "no_new_events")
        with self.node.db(write=True) as db, self.assertRaises(sqlite3.IntegrityError):
            db.execute("DELETE FROM ulcas_events")

    def test_http_hit_and_miss_paths(self):
        with NodeServer(("127.0.0.1", 0), handler(self.node)) as server:
            worker = threading.Thread(target=server.serve_forever)
            worker.start()
            base = f"http://127.0.0.1:{server.server_port}"

            def call(path, role=None, data=None):
                headers = {"Authorization": "Bearer " + TOKENS[role]} if role else {}
                if data is not None:
                    headers["Content-Type"] = "application/json"
                request = Request(base + path, json.dumps(data).encode() if data is not None else None, headers)
                try:
                    with urlopen(request, timeout=4) as response:
                        return response.status, json.load(response)
                except HTTPError as error:
                    with error:
                        return error.code, json.load(error)

            try:
                self.assertEqual(call("/x/reverse_egress", data={})[0], 401)
                status, reject = call("/x/drive", "alert", {})
                self.assertEqual((status, reject["disposition"]), (403, "discarded"))
                status, reject = call("/x/drive", "operator", {"cid": "sample-01", "intent": "bad"})
                self.assertEqual((status, reject["disposition"]), (400, "fix_and_resubmit"))
                args = {"revision": "a" * 40, "services": ["demo.service"]}
                result = call("/x/drive", "operator", {"cid": "sample-02", "intent": "config.validate",
                                                      "target": "node-x", "arguments": args})
                self.assertEqual(result[1]["state"], "succeeded")
                self.assertEqual(call("/x/ledger?cid=sample-02", "operator")[0], 200)
            finally:
                server.shutdown()
                worker.join()


if __name__ == "__main__":
    unittest.main()
