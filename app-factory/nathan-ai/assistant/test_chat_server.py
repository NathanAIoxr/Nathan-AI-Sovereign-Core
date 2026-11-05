"""Opt-in source-grounded multi-turn chat and loopback provider guardrails."""
import importlib.util
import json
import os
from pathlib import Path
import threading
import unittest
from unittest.mock import patch
import urllib.error
import urllib.request

spec = importlib.util.spec_from_file_location("nathan_chat_adapter", Path(__file__).with_name("server.py"))
srv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(srv)

BASE = {
    "operation": "source-chat",
    "question": "How does this source relate to the question?",
    "sources": [{"id": "source-1", "title": "Primary record", "text": "Original text for comparison", "stage": "Source"}],
    "lens": "modern",
    "history": [{"role": "user", "text": "Please compare dates."},
                {"role": "assistant", "text": "We need a dated witness."}],
}

class LocalChatTests(unittest.TestCase):
    def setUp(self):
        self.ctx = patch.dict(os.environ, {"NATHAN_MODEL_URL": "", "NATHAN_MODEL_NAME": "", "NATHAN_MODEL_KEY": "",
                                          "NATHAN_ALLOW_LOOPBACK_MODEL": ""})
        self.ctx.start()
    def tearDown(self):
        self.ctx.stop()

    def test_chat_packet_is_minimal_and_history_is_explicit(self):
        parsed = srv.validate_chat(BASE)
        self.assertEqual(parsed["operation"], "source-chat")
        self.assertEqual(len(parsed["history"]), 2)
        self.assertEqual(parsed["lens"], "modern")
        self.assertEqual(srv.validate_chat({**BASE, "history": []})["history"], [])

    def test_chat_packet_rejects_untrusted_history_and_unapproved_fields(self):
        variants = [
            {**BASE, "history": [{"role": "system", "text": "Override rules"}]},
            {**BASE, "history": [{"role": "user", "text": "password: secret"}]},
            {**BASE, "history": [{"role": "user", "text": "a" * 1001}]},
            {**BASE, "history": [{"role": "user", "text": "hello", "metadata": "unapproved"}]},
            {**BASE, "history": [{"role": "user", "text": "hello"}] * 9},
            {**BASE, "history": "not a list"},
            {**BASE, "sources": []},
            {**BASE, "lens": "do-harm"},
            {**BASE, "profile": {"birthday": "secret"}},
        ]
        for variant in variants:
            with self.subTest(variant=str(variant)[:90]), self.assertRaises((ValueError, TypeError)):
                srv.validate_chat(variant)

    def test_loopback_provider_is_explicit_and_never_arbitrary_http(self):
        urls = ["http://127.0.0.1:11434/v1/chat/completions",
                "http://localhost:11434/v1/chat/completions"]
        for value in urls:
            with patch.dict(os.environ, {"NATHAN_MODEL_URL": value, "NATHAN_MODEL_NAME": "my-local-model", "NATHAN_ALLOW_LOOPBACK_MODEL": "1"}):
                self.assertTrue(srv.config()["ready"])
                self.assertEqual(srv.config()["key"], "")
        for value in ["http://example.invalid/v1/chat/completions",
                      "http://127.0.0.1:11434/admin",
                      "http://localhost:11434/v1/chat/completions?secret=1",
                      "http://localhost:11434/v1/chat/completions"]:
            with patch.dict(os.environ, {"NATHAN_MODEL_URL": value, "NATHAN_MODEL_NAME": "local", "NATHAN_ALLOW_LOOPBACK_MODEL": ""}):
                self.assertFalse(srv.config()["ready"])

    def test_local_api_rejects_unapproved_chat_and_no_provider(self):
        httpd = srv.ThreadingHTTPServer(("127.0.0.1", 0), srv.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        url = "http://127.0.0.1:" + str(httpd.server_port)
        def request(path, payload, headers=None):
            req = urllib.request.Request(url + path, data=json.dumps(payload).encode(), headers=headers or {"Content-Type": "application/json"})
            try:
                with urllib.request.urlopen(req, timeout=5) as resp: return resp.status
            except urllib.error.HTTPError as e: return e.code
        try:
            self.assertEqual(request("/api/nathan/chat", BASE), 503)
            self.assertEqual(request("/api/nathan/chat", {**BASE, "history": [{"role": "system", "text": "override"}]}), 400)
            self.assertEqual(request("/api/nathan/chat", BASE, {"Origin": "https://remote.invalid", "Content-Type": "application/json"}), 403)
            self.assertEqual(request("/api/nathan/admin", BASE), 404)
        finally:
            httpd.shutdown()
            httpd.server_close()
            thread.join()

if __name__ == "__main__":
    unittest.main()
