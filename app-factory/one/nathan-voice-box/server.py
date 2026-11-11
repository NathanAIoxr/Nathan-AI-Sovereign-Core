#!/usr/bin/env python3
"""Loopback-only offline UI; no telemetry, cloud inference or model downloads."""
from __future__ import annotations
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import threading
from pathlib import Path
import secrets
from urllib.parse import urlsplit

from voicebox import VoiceBoxError, ROOT, EFFECTS, PERSONAS, PERMITTED_BASES, list_espeak_voices, speak, analyze, load_pack
from clone_engine import clone_with_reference
from asr_engine import transcribe_reference

MAX_BODY = 16000
MAX_CLONE_BODY = 740000


def serve(port=8765):
    if not 1024 <= port <= 65535:
        raise VoiceBoxError("Use an unprivileged port from 1024 to 65535")
    session_token = secrets.token_urlsafe(32)
    synthesis_lock = threading.Lock()
    origin = f"http://127.0.0.1:{port}"

    host = f"127.0.0.1:{port}"

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
            self.send_header("Cross-Origin-Resource-Policy", "same-origin")
            self.send_header("Permissions-Policy", "microphone=(self), camera=()")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Content-Security-Policy",
                             "default-src 'none'; script-src 'self'; style-src 'self'; "
                             "connect-src 'self'; media-src 'self' blob:; worker-src 'self'; "
                             "base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
            self.end_headers()

        def _send(self, code, body, mime="application/json; charset=utf-8"):
            if isinstance(body, dict):
                body = json.dumps(body, ensure_ascii=False).encode("utf-8")
            self._headers(code, mime, len(body))
            self.wfile.write(body)

        def _is_local_host(self):
            return self.headers.get("Host", "") == host

        def do_GET(self):
            if not self._is_local_host():
                return self._send(403, {"error": "Local host only"})
            path = urlsplit(self.path).path
            if path == "/":
                template = (ROOT / "index.html").read_text(encoding="utf-8")
                html = template.replace("__SESSION_TOKEN__", session_token)
                self._send(200, html.encode("utf-8"), "text/html; charset=utf-8")
            elif path in (
                "/style.css", "/app.js", "/voice-store.js", "/voice-recorder.js",
                "/voice-mapper-core.js", "/language-catalog.js", "/mapper-worker.js"
            ):
                filename = path[1:]
                mimetype = "text/css; charset=utf-8" if filename.endswith(".css") else "text/javascript; charset=utf-8"
                self._send(200, (ROOT / filename).read_bytes(), mimetype)
            elif path == "/voices":
                self._send(200, {"voices": list_espeak_voices(), "effects": EFFECTS,
                                 "personas": PERSONAS, "local_only": True})
            elif path == "/packs":
                packs = []
                folder = ROOT / "private-packs"
                for manifest in folder.glob("*/manifest.json"):
                    try:
                        pack = load_pack(manifest.parent.name)
                        packs.append({"id": pack["id"], "runtime": pack["runtime"],
                                      "languages": pack.get("languages", [pack.get("language", "")])})
                    except (ValueError, KeyError, VoiceBoxError, OSError):
                        continue
                self._send(200, {"packs": packs, "offline": True})
            elif path == "/health":
                self._send(200, {"status": "ready", "network": "loopback only",
                                 "engine": "espeak-ng or authorized ONNX pack"})
            else:
                self._send(404, {"error": "Not found"})

        def do_POST(self):
            if not self._is_local_host():
                return self._send(403, {"error": "Local host only"})
            if urlsplit(self.path).path not in ("/speak", "/analyze", "/clone", "/transcribe"):
                return self._send(404, {"error": "Not found"})
            # Browser never needs a network-facing endpoint or third-party origin.
            if self.headers.get("Origin") != origin:
                return self._send(403, {"error": "Origin rejected"})
            if not secrets.compare_digest(self.headers.get("X-Local-Session", ""), session_token):
                return self._send(403, {"error": "Session rejected"})
            if self.headers.get("Content-Type", "").split(";")[0].strip().lower() != "application/json":
                return self._send(415, {"error": "Only JSON requests are supported"})
            size = self.headers.get("Content-Length", "")
            limit = MAX_CLONE_BODY if urlsplit(self.path).path in ("/clone", "/transcribe") else MAX_BODY
            if not size.isdigit() or int(size) > limit or int(size) < 2:
                return self._send(413, {"error": "Invalid request size"})
            try:
                obj = json.loads(self.rfile.read(int(size)).decode("utf-8"))
                if not isinstance(obj, dict):
                    raise VoiceBoxError("Request must be a JSON object")
                if urlsplit(self.path).path == "/transcribe":
                    if obj.get("speaker_authorized") is not True:
                        raise VoiceBoxError("Record and transcribe only with the speaker's permission")
                    if not synthesis_lock.acquire(blocking=False):
                        return self._send(409, {"error": "Local speech engine busy"})
                    try:
                        result = transcribe_reference(
                            pack_id=obj.get("pack", ""),
                            reference_wav_base64=obj.get("reference_wav_base64", ""),
                            language=obj.get("lang", "en-US")
                        )
                    finally:
                        synthesis_lock.release()
                    return self._send(200, result)
                if urlsplit(self.path).path == "/clone":
                    if not synthesis_lock.acquire(blocking=False):
                        return self._send(409, {"error": "Speech engine is busy"})
                    try:
                        wav = clone_with_reference(
                            text=obj.get("text", ""), lang=obj.get("lang", "en-US"),
                            pack_id=obj.get("pack", ""),
                            reference_wav_base64=obj.get("reference_wav_base64", ""),
                            reference_text=obj.get("reference_text", ""),
                            speaker_authorized=obj.get("speaker_authorized", False),
                            rights_basis=obj.get("rights_basis", "self")
                        )
                    finally:
                        synthesis_lock.release()
                    return self._send(200, wav, "audio/wav")
                if urlsplit(self.path).path == "/speak":
                    if not synthesis_lock.acquire(blocking=False):
                        return self._send(409, {"error": "Local speech engine busy"})
                    try:
                        wav = speak(text=obj.get("text", ""), lang=obj.get("lang", "en-US"),
                                    voice=obj.get("voice", "en-us"),
                                    persona=obj.get("persona", "neutral"),
                                    effect=obj.get("effect", "none"),
                                    pack_id=obj.get("pack"))
                    finally:
                        synthesis_lock.release()
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
