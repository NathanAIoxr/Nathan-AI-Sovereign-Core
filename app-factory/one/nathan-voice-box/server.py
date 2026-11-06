#!/usr/bin/env python3
"""Loopback-only offline UI; no telemetry, cloud inference or model downloads."""
from __future__ import annotations
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import secrets
from urllib.parse import urlsplit

from voicebox import VoiceBoxError, ROOT, EFFECTS, PERSONAS, list_espeak_voices, speak, analyze

MAX_BODY = 16000


def serve(port=8765):
    if not 1024 <= port <= 65535:
        raise VoiceBoxError("Use an unprivileged port from 1024 to 65535")
    session_token = secrets.token_urlsafe(32)
    origin = f"http://127.0.0.1:{port}"

    class Handler(BaseHTTPRequestHandler):
        server_version = "NathanVoiceBox/0.1"

        def log_message(self, format, *args):
            # Do not record user text, file names, requests, or source IPs.
            return

        def _headers(self, code, mime, n):
            self.send_response(code)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(n))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "DENY")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Content-Security-Policy",
                             "default-src 'none'; script-src 'self'; style-src 'self'; "
                             "connect-src 'self'; media-src 'self' blob:; "
                             "base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
            self.end_headers()

        def _send(self, code, body, mime="application/json; charset=utf-8"):
            if isinstance(body, dict):
                body = json.dumps(body, ensure_ascii=False).encode("utf-8")
            self._headers(code, mime, len(body))
            self.wfile.write(body)

        def do_GET(self):
            path = urlsplit(self.path).path
            if path == "/":
                template = (ROOT / "index.html").read_text(encoding="utf-8")
                html = template.replace("__SESSION_TOKEN__", session_token)
                self._send(200, html.encode("utf-8"), "text/html; charset=utf-8")
            elif path == "/app.js":
                self._send(200, (ROOT / "app.js").read_bytes(), "text/javascript; charset=utf-8")
            elif path == "/voices":
                self._send(200, {"voices": list_espeak_voices(), "effects": EFFECTS,
                                 "personas": PERSONAS, "local_only": True})
            elif path == "/health":
                self._send(200, {"status": "ready", "network": "loopback only",
                                 "engine": "espeak-ng or authorized ONNX pack"})
            else:
                self._send(404, {"error": "Not found"})

        def do_POST(self):
            if urlsplit(self.path).path not in ("/speak", "/analyze"):
                return self._send(404, {"error": "Not found"})
            # Browser never needs a network-facing endpoint or third-party origin.
            if self.headers.get("Origin") != origin:
                return self._send(403, {"error": "Origin rejected"})
            if not secrets.compare_digest(self.headers.get("X-Local-Session", ""), session_token):
                return self._send(403, {"error": "Session rejected"})
            size = self.headers.get("Content-Length", "")
            if not size.isdigit() or int(size) > MAX_BODY or int(size) < 2:
                return self._send(413, {"error": "Invalid request size"})
            try:
                obj = json.loads(self.rfile.read(int(size)).decode("utf-8"))
                if not isinstance(obj, dict):
                    raise VoiceBoxError("Request must be a JSON object")
                if urlsplit(self.path).path == "/speak":
                    wav = speak(text=obj.get("text", ""), lang=obj.get("lang", "en-US"),
                                voice=obj.get("voice", "en-us"),
                                persona=obj.get("persona", "neutral"),
                                effect=obj.get("effect", "none"),
                                pack_id=obj.get("pack"))
                    return self._send(200, wav, "audio/wav")
                return self._send(400, {"error": "Audio analysis accepts local CLI WAV files only"})
            except (ValueError, VoiceBoxError, OSError) as exc:
                return self._send(400, {"error": str(exc)})

    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Nathan AI Voice Box — offline local panel: {origin}")
    print("Speech is performed by a local engine. No cloud fallback is configured.")
    try:
        server.serve_forever(poll_interval=0.4)
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    serve()
