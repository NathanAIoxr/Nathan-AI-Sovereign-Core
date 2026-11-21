from pathlib import Path
import tempfile
import threading
import unittest

from intent_compiler import CONTRACTS, compile_plan, localhost_client, run_plan
from node_x import Node, NodeServer, handler

TARGET = {"service": "demo.service", "repository": "owner/repo",
          "revision": "a" * 40, "change_digest": "b" * 64,
          "services": ["demo.service"], "audit_cid": "existing-01"}


class CompilerTests(unittest.TestCase):
    def test_five_contracts_preserve_words_dag_and_stable_ids(self):
        for phrase in CONTRACTS:
            with self.subTest(phrase=phrase):
                words = " " + phrase.upper() + " "
                plan = compile_plan(words, TARGET, declarations=["  Say EXACTLY this.  "])
                self.assertEqual(plan["original_words"], words)
                self.assertEqual(plan["say"], ["  Say EXACTLY this.  "])
                self.assertEqual(plan["do"], compile_plan(words, TARGET,
                                                          declarations=plan["say"])["do"])
                for step in plan["do"]:
                    self.assertEqual(step["after"], [] if step["id"] == 1 else [step["id"] - 1])
        with self.assertRaises(ValueError):
            compile_plan("build it", {})
        with self.assertRaises(ValueError):
            compile_plan("run arbitrary command", TARGET)

    def test_build_stops_when_the_proposal_is_awaiting_approval(self):
        plan = compile_plan("build it", TARGET)
        seen = []

        def call(method, path, body):
            seen.append(body["intent"])
            return {"cid": body["cid"], "lane": 5 if len(seen) == 1 else 2,
                    "state": "succeeded" if len(seen) == 1 else "awaiting_approval"}

        self.assertEqual(run_plan(plan, call)["state"], "awaiting_approval")
        self.assertEqual(seen, ["config.validate", "github.propose"])

    def test_ship_stops_at_ci_and_uses_the_provider_sha(self):
        plan = compile_plan("ship it", TARGET)
        seen = []

        def call(method, path, body):
            seen.append(body)
            return {"cid": body["cid"], "lane": 5 if len(seen) == 1 else 2,
                    "state": "awaiting_ci" if len(seen) == 3 else "succeeded",
                    "evidence": {"commit_sha": "c" * 40}}

        self.assertEqual(run_plan(plan, call)["state"], "awaiting_ci")
        self.assertEqual([item["intent"] for item in seen],
                         ["config.validate", "github.propose", "github.verify"])
        self.assertEqual(seen[2]["arguments"]["expected_sha"], "c" * 40)

    def test_unmatched_receipt_and_missing_commit_are_blocked(self):
        plan = compile_plan("build it", TARGET)
        def call(method, path, body):
            return {"cid": body["cid"], "lane": 5 if body["intent"] == "config.validate" else 2,
                    "state": "succeeded"}

        self.assertEqual(run_plan(plan, call)["reason"], "missing_provider_commit_sha")
        self.assertEqual(run_plan(plan, lambda *args: {"cid": "wrong-cid"})["reason"],
                         "adapter_or_receipt_error")

    def test_real_node_x_http_build_and_audit(self):
        with tempfile.TemporaryDirectory() as path:
            token = "o" * 32
            node = Node(str(Path(path) / "test.db"), {"operator": token}, "l" * 32,
                        units=["demo.service"], repo="owner/repo", probe=lambda *a: ("succeeded", {}))
            with NodeServer(("127.0.0.1", 0), handler(node)) as server:
                thread = threading.Thread(target=server.serve_forever)
                thread.start()
                try:
                    call = localhost_client(server.server_port, token)
                    build = compile_plan("build it", TARGET)
                    self.assertEqual(run_plan(build, call)["state"], "awaiting_approval")
                    audit = compile_plan("audit it", {"audit_cid": build["do"][1]["body"]["cid"]})
                    self.assertEqual(run_plan(audit, call)["state"], "succeeded")
                finally:
                    server.shutdown()
                    thread.join()
