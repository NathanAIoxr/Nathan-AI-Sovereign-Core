"""Real loopback HTTP smoke/security checks, using only Python standard library."""
import http.client
import json
import re
import socket
import subprocess
import sys
import time
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class LocalHTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind(("127.0.0.1", 0))
            cls.port = sock.getsockname()[1]
        cls.host = "127.0.0.1:%d" % cls.port
        cls.proc = subprocess.Popen(
            [sys.executable, "-c", "from server import serve; serve(%d)" % cls.port],
            cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        for _ in range(100):
            if cls.proc.poll() is not None:
                raise RuntimeError("Local HTTP process exited unexpectedly")
            try:
                with socket.create_connection(("127.0.0.1", cls.port), timeout=0.25):
                    break
            except OSError:
                time.sleep(0.05)
        else:
            cls.proc.kill()
            raise RuntimeError("Local HTTP server startup timed out")
        status, _, html = cls.request("GET", "/")
        if status != 200:
            raise RuntimeError("Unable to load local panel")
        match = re.search('name="local-session" content="([^"]+)"', html.decode("utf-8"))
        if not match:
            raise RuntimeError("No per-session CSRF token in local panel")
        cls.token = match.group(1)

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()
        try:
            cls.proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            cls.proc.kill()
            cls.proc.wait(timeout=3)

    @classmethod
    def request(cls, method, path, payload=None, headers=None):
        conn = http.client.HTTPConnection("127.0.0.1", cls.port, timeout=12)
        try:
            conn.request(method, path, body=payload, headers=headers or {})
            response = conn.getresponse()
            status, resp_headers, data = response.status, dict(response.getheaders()), response.read()
            return status, resp_headers, data
        finally:
            conn.close()

    def test_only_local_host_is_accepted(self):
        status, _, body = self.request("GET", "/",
                       headers={"Host":"outsider.example"})
        self.assertEqual(status, 403)
        self.assertIn(b"Local host only", body)

    def test_local_assets_and_csp(self):
        for path in ("/", "/app.js", "/voice-mapper-core.js", "/mapper-worker.js",
                     "/language-catalog.js", "/voice-recorder.js", "/style.css"):
            status, headers, _ = self.request("GET", path)
            self.assertEqual(status, 200, path)
            self.assertEqual(headers.get("Cache-Control"), "no-store")
            self.assertIn("default-src 'none'", headers.get("Content-Security-Policy", ""))
        status, _, _ = self.request("GET", "/../../README.md")
        self.assertEqual(status, 404)

    def test_csrf_and_origin(self):
        body = json.dumps({"text":"Hello"}).encode()
        h = {"Content-Type":"application/json", "Origin":"http://evil.invalid"}
        status, _, _ = self.request("POST", "/speak", body, h)
        self.assertEqual(status, 403)
        h["Origin"] = "http://"+self.host
        status, _, _ = self.request("POST", "/speak", body, h)
        self.assertEqual(status, 403)
        h["X-Local-Session"] = self.token
        h["Content-Type"] = "text/plain"
        status, _, _ = self.request("POST", "/speak", body, h)
        self.assertEqual(status, 415)

    def test_unauthorized_transcribe_and_empty_pack(self):
        body = json.dumps({"speaker_authorized":False,"pack":"missing","lang":"en",
                           "reference_wav_base64":""}).encode()
        h = {"Content-Type":"application/json",
             "Origin":"http://"+self.host,"X-Local-Session":self.token}
        status, _, data = self.request("POST", "/transcribe", body, h)
        self.assertEqual(status, 400)
        self.assertIn(b"permission", data)

    def test_packs_does_not_leak_absolute_paths(self):
        status, _, data = self.request("GET", "/packs")
        self.assertEqual(status, 200)
        obj = json.loads(data)
        self.assertIn("packs", obj)
        self.assertTrue(obj.get("offline"))
        self.assertNotIn("private-packs/", data.decode("utf-8"))


if __name__ == "__main__":
    unittest.main()
