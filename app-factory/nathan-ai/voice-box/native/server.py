#!/usr/bin/env python3
"""Nathan AI Voice Box — explicit, localhost-only native offline speech adapter.

Serves a narrow allowlist of public Voice Box assets. All user text/audio stays
on the user's own computer; no cloud provider, model downloads or logging of
user content. eSpeak NG + whisper.cpp must be installed separately.
"""
from __future__ import annotations

import argparse
import io
import json
import mimetypes
import os
from pathlib import Path
import re
import secrets
import shutil
import subprocess
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlsplit
import wave

VOICE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = VOICE_DIR.parents[2]
URL_PREFIX = "/app-factory/nathan-ai/voice-box/"
MIME = {".js": "text/javascript; charset=utf-8", ".md": "text/plain; charset=utf-8",
        ".webmanifest": "application/manifest+json"}
MAX_JSON = 12_000
MAX_AUDIO = 1_000_100
MAX_TEXT = 4096
MAX_WAV_RESPONSE = 3_000_000
MAX_RECORDING_FRAMES = 30 * 16000
VALID_VOICE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_+@.-]{0,71}$")
VALID_LANG = re.compile(r"^(?:auto|[a-z]{2,3})$")
STATIC = frozenset([
  *(f"app-factory/nathan-ai/voice-box/{n}" for n in
    ("index.html","app.js","policy.js","noise.js","macro.js","style.css",
     "sw.js","manifest.webmanifest","native-bridge.js","native-capture.js",
     "README.md","MODEL-ADAPTERS.md","NATIVE-RUNTIME.md")),
  *(f"app-factory/nathan-ai/{n}" for n in
    ("appearance/shared.css","appearance/engine.js","appearance/app.js",
     "launcher/shared.css","launcher/engine.js","launcher/app.js",
     "assistant/engine.js")),
])

class RequestError(Exception):
    def __init__(self, code: int, message: str):
        super().__init__(message)
        self.code = code
        self.message = message

def get_model_path(environ=None):
    env = environ or os.environ
    model = env.get("NATHAN_WHISPER_MODEL", "")
    if not model:
        return None
    p = Path(model).expanduser().resolve()
    return p if p.is_file() and p.stat().st_size > 0 else None

def get_engines(environ=None):
    env = environ or os.environ
    model = get_model_path(env)
    return {"espeak": bool(shutil.which("espeak-ng")),
            "whisper": bool(shutil.which("whisper-cli") and model),
            "whisperModelReady": bool(model),
            "synthesis": "eSpeak NG (installed separately)",
            "recognition": "whisper.cpp / whisper-cli (model installed separately)"}

def list_voices(executable=None):
    binary = executable or shutil.which("espeak-ng")
    if not binary:
        return []
    try:
        r = subprocess.run([binary,"--voices"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                           timeout=4, check=True)
    except (OSError, subprocess.TimeoutExpired, subprocess.CalledProcessError):
        return []
    out = []
    for line in r.stdout[:65000].decode("utf-8", "replace").splitlines()[1:]:
        cols = line.split()
        if len(cols)>=4 and VALID_VOICE.fullmatch(cols[1]) and cols[1] not in out:
            out.append(cols[1])
    return sorted(out)[:150]

def synthesize(text, voice, speed=175, pitch=50, executable=None):
    """Generate WAV bytes. Input text is via stdin, never process command line."""
    if not isinstance(text,str) or not text.strip() or len(text.encode("utf-8"))>MAX_TEXT:
        raise RequestError(422,"Enter 1 to 4096 UTF-8 bytes of original text")
    if not isinstance(voice,str) or not VALID_VOICE.fullmatch(voice):
        raise RequestError(422,"Invalid installed voice name")
    if type(speed) is not int or not 110<=speed<=260 or type(pitch) is not int or not 20<=pitch<=80:
        raise RequestError(422,"Speaking speed or pitch outside permitted bounds")
    binary=executable or shutil.which("espeak-ng")
    if not binary:
        raise RequestError(503,"eSpeak NG is not installed locally")
    with tempfile.TemporaryDirectory(prefix="nathan-voice-") as temp:
        target=Path(temp)/"synth.wav"
        argv=[binary,"-v",voice,"-s",str(speed),"-p",str(pitch),"-w",str(target),"--stdin"]
        try:
            subprocess.run(argv,input=text,encoding="utf-8",capture_output=True,check=True,timeout=30)
        except (OSError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
            raise RequestError(422,"Local speech engine did not produce an audio file") from exc
        if not target.is_file() or target.stat().st_size<44 or target.stat().st_size>MAX_WAV_RESPONSE:
            raise RequestError(422,"Local speech output invalid or too large")
        data=target.read_bytes()
        if not data.startswith(b"RIFF") or data[8:12]!=b"WAVE":
            raise RequestError(422,"Speech output is not valid WAV")
        return data

def inspect_wav(data):
    """Accept only explicit <=30s mono 16kHz PCM16, not arbitrary uploaded media."""
    if not isinstance(data,bytes) or len(data)>MAX_AUDIO or len(data)<44:
        raise RequestError(413,"PCM16 WAV input must fit the 1 MB / 30-second limit")
    try:
        with wave.open(io.BytesIO(data),"rb") as audio:
            frame_count=audio.getnframes()
            if (audio.getnchannels()!=1 or audio.getframerate()!=16000 or
                audio.getsampwidth()!=2 or audio.getcomptype()!="NONE" or
                frame_count<1 or frame_count>MAX_RECORDING_FRAMES):
                raise RequestError(422,"Expected mono 16 kHz PCM16 WAV, up to 30 seconds")
            raw=audio.readframes(frame_count)
            if len(raw)!=frame_count*2:
                raise RequestError(422,"Incomplete PCM16 WAV recording")
    except (wave.Error, EOFError) as exc:
        raise RequestError(422,"Malformed WAV audio") from exc
    return frame_count

def transcribe(data, language="auto", executable=None, model=None):
    inspect_wav(data)
    if not isinstance(language,str) or not VALID_LANG.fullmatch(language):
        raise RequestError(422,"Invalid recognition language code")
    binary=executable or shutil.which("whisper-cli")
    path=Path(model).resolve() if model is not None else get_model_path()
    if not binary or path is None or not path.is_file():
        raise RequestError(503,"Local whisper-cli and an installed model are required")
    with tempfile.TemporaryDirectory(prefix="nathan-whisper-") as temp:
        src=Path(temp)/"input.wav"
        target=Path(temp)/"transcript"
        src.write_bytes(data)
        argv=[binary,"-m",str(path),"-f",str(src),"-l",language,"-otxt","-of",str(target),
              "-np","-t","4","-d","30000"]
        try:
            subprocess.run(argv,capture_output=True,check=True,timeout=100)
        except (OSError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
            raise RequestError(422,"Local speech recognition failed") from exc
        transcript=target.with_suffix(".txt")
        if not transcript.is_file() or transcript.stat().st_size>80000:
            raise RequestError(422,"Local recognition did not produce a valid transcript")
        return transcript.read_text(encoding="utf-8",errors="replace")

def handler_factory(csrf, port):
    origin=f"http://127.0.0.1:{port}"
    class Handler(BaseHTTPRequestHandler):
        protocol_version="HTTP/1.1"
        server_version="NathanVoiceLocal/1.0"
        def log_message(self, fmt, *args):
            # No request URLs, text, filenames, audio or user information are logged.
            return

        def _headers(self,content_type,size,status=200):
            self.send_response(status)
            self.send_header("Content-Type",content_type)
            self.send_header("Content-Length",str(size))
            self.send_header("Cache-Control","no-store" if content_type.startswith("application/json") or content_type.startswith("audio/") else "public, max-age=60")
            self.send_header("X-Content-Type-Options","nosniff")
            self.send_header("Referrer-Policy","no-referrer")
            self.send_header("Cross-Origin-Resource-Policy","same-origin")
            self.send_header("X-Frame-Options","DENY")
            self.send_header("Content-Security-Policy",
              "default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
              "img-src 'self' data: blob:; media-src 'self' blob:; worker-src 'self'; object-src 'none'; frame-ancestors 'none'")
            self.end_headers()

        def _write(self,data,kind,status=200):
            self._headers(kind,len(data),status)
            self.wfile.write(data)

        def _json(self,obj,status=200):
            self._write(json.dumps(obj,ensure_ascii=False,separators=(",",":")).encode("utf-8"),
                        "application/json; charset=utf-8",status)

        def _error(self,exc):
            self._json({"error":exc.message},exc.code)

        def _check(self,mutating=False):
            if self.headers.get("Host","")!=f"127.0.0.1:{port}":
                raise RequestError(403,"Invalid local host")
            src=self.headers.get("Origin")
            if src and src!=origin:
                raise RequestError(403,"Cross-site requests forbidden")
            if mutating and (src!=origin or self.headers.get("X-Nathan-Voice-CSRF")!=csrf):
                raise RequestError(403,"Local-origin/CSRF authorization required")

        def do_GET(self):
            try:
                self._check()
                path=unquote(urlsplit(self.path).path)
                if path in ("/","/index.html"):
                    self.send_response(302)
                    self.send_header("Location",URL_PREFIX)
                    self.send_header("Content-Length","0")
                    self.end_headers()
                    return
                if path=="/api/voice/status":
                    self._json({"schema":"nathan.voice.native.v1","localOnly":True,
                                "csrf":csrf,"engines":get_engines(),"voices":list_voices(),
                                "limits":{"maxTextBytes":MAX_TEXT,"maxAudioBytes":MAX_AUDIO,
                                          "audioSeconds":30,"audioFormat":"PCM16 mono 16000 Hz"},
                                "disclosure":"Engines execute only when installed locally. No voice cloning or model downloads."})
                    return
                if path==URL_PREFIX.rstrip("/"):
                    self.send_response(308)
                    self.send_header("Location",URL_PREFIX)
                    self.send_header("Content-Length","0")
                    self.end_headers()
                    return
                if path==URL_PREFIX:
                    path+= "index.html"
                relative=path.lstrip("/")
                if relative not in STATIC or "%" in relative or ".." in relative or "/." in relative:
                    raise RequestError(404,"Resource unavailable")
                file=(REPO_ROOT/relative).resolve()
                if not file.is_file() or not file.is_relative_to(REPO_ROOT):
                    raise RequestError(404,"Resource unavailable")
                data=file.read_bytes()
                kind=MIME.get(file.suffix,mimetypes.guess_type(file.name)[0] or "application/octet-stream")
                self._write(data,kind)
            except RequestError as exc:
                self._error(exc)
            except (OSError,ValueError):
                self._error(RequestError(404,"Resource unavailable"))

        def do_POST(self):
            try:
                self._check(mutating=True)
                endpoint=urlsplit(self.path).path
                if endpoint not in ("/api/voice/synthesize","/api/voice/transcribe"):
                    raise RequestError(404,"Unknown local speech operation")
                try:
                    size=int(self.headers.get("Content-Length","-1"))
                except ValueError:
                    raise RequestError(411,"Content-Length required")
                limit=MAX_JSON if endpoint.endswith("/synthesize") else MAX_AUDIO
                if size<1 or size>limit:
                    raise RequestError(413,"Local request exceeds the input limit")
                media=self.headers.get("Content-Type","").split(";",1)[0].lower()
                expected="application/json" if endpoint.endswith("/synthesize") else "audio/wav"
                if media!=expected:
                    raise RequestError(415,"Unsupported input content type")
                if not self.server.voice_semaphore.acquire(blocking=False):
                    raise RequestError(429,"Local speech engine busy; stop or retry manually")
                try:
                    incoming=self.rfile.read(size)
                    if len(incoming)!=size: raise RequestError(400,"Incomplete local input")
                    if endpoint.endswith("/synthesize"):
                        try:
                            payload=json.loads(incoming.decode("utf-8"))
                            if not isinstance(payload,dict):
                                raise ValueError()
                        except (ValueError,UnicodeDecodeError):
                            raise RequestError(400,"Invalid JSON")
                        allowed={"text","voice","speed","pitch"}
                        if set(payload)-allowed:
                            raise RequestError(422,"Unexpected synthesis request field")
                        wav=synthesize(payload.get("text"),payload.get("voice"),
                                        payload.get("speed",175),payload.get("pitch",50))
                        self._write(wav,"audio/wav")
                    else:
                        lang=self.headers.get("X-Nathan-Language","auto")
                        words=transcribe(incoming,lang)
                        self._json({"transcript":words,"languageRequested":lang,
                                   "source":"local whisper.cpp; recognition output is fallible; confirm before reuse"})
                finally:
                    self.server.voice_semaphore.release()
            except RequestError as exc:
                self._error(exc)
            except (BrokenPipeError,ConnectionResetError):
                pass

        def do_OPTIONS(self):
            self._error(RequestError(403,"Cross-origin preflight denied"))

    return Handler

def build_server(port=8765):
    if not isinstance(port,int) or port<1024 or port>65535:
        raise ValueError("Choose a TCP port between 1024 and 65535")
    token=secrets.token_urlsafe(32)
    srv=ThreadingHTTPServer(("127.0.0.1",port),handler_factory(token,port))
    srv.daemon_threads=True
    srv.voice_semaphore=threading.BoundedSemaphore(1)
    return srv

def main():
    parser=argparse.ArgumentParser(description="Nathan AI local-only Voice Box")
    parser.add_argument("--port",type=int,default=8765,help="Loopback port (default: 8765)")
    args=parser.parse_args()
    try:
        server=build_server(args.port)
    except (OSError,ValueError) as exc:
        parser.error(str(exc))
    print(f"Nathan AI Voice Box — open http://127.0.0.1:{args.port}{URL_PREFIX}")
    print("Speech is local only. Install eSpeak NG or whisper.cpp + a model separately for native features.")
    try:server.serve_forever(poll_interval=0.2)
    except KeyboardInterrupt:pass
    finally:server.server_close()

if __name__=="__main__":
    main()
