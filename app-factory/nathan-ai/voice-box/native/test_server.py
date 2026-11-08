"""Nathan AI local native bridge contract and privacy regression tests."""
import io
import json
import socket
import subprocess
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import wave

import server

def wav_bytes(seconds=1):
    b=io.BytesIO()
    with wave.open(b,"wb") as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(16000)
        w.writeframes(b"\x00\x00"*int(16000*seconds))
    return b.getvalue()

class NativeContractTests(unittest.TestCase):
    def test_audio_format_and_duration_checks(self):
        self.assertEqual(server.inspect_wav(wav_bytes()),16000)
        self.assertEqual(server.inspect_wav(wav_bytes(30)),480000)
        for raw in (b"123",b"\0"*60,wav_bytes(31)):
            with self.assertRaises(server.RequestError):server.inspect_wav(raw)
        b=io.BytesIO()
        with wave.open(b,"wb") as w:
            w.setnchannels(2);w.setsampwidth(2);w.setframerate(16000);w.writeframes(b"\0"*800)
        with self.assertRaises(server.RequestError):server.inspect_wav(b.getvalue())

    def test_synthesis_stdin_no_shell_persona_or_path_injection(self):
        with tempfile.TemporaryDirectory() as temp:
            def runner(argv,**kwargs):
                self.assertEqual(argv[0],"/local/espeak-ng")
                self.assertIn("--stdin",argv)
                self.assertNotIn("secret",argv)
                self.assertEqual(kwargs["input"],"secret")
                Path(argv[argv.index("-w")+1]).write_bytes(wav_bytes(.2))
                return subprocess.CompletedProcess(argv,0)
            with patch.object(server.subprocess,"run",side_effect=runner):
                result=server.synthesize("secret","en",executable="/local/espeak-ng")
                self.assertTrue(result.startswith(b"RIFF"))
            for voice in ("../other","--bad","bad;cmd"):
                with self.assertRaises(server.RequestError):server.synthesize("x",voice,executable="/local/espeak-ng")
            with self.assertRaises(server.RequestError):server.synthesize("x"*5000,"en",executable="/local/espeak-ng")

    def test_whisper_model_only_from_explicit_local_path_and_output_file(self):
        with tempfile.TemporaryDirectory() as temp:
            model=Path(temp)/"model.bin";model.write_bytes(b"test-model")
            def runner(argv,**kwargs):
                self.assertEqual(argv[0],"/local/whisper-cli")
                self.assertNotIn("private recording text",argv)
                Path(argv[argv.index("-of")+1]+".txt").write_text("recognized with permission",encoding="utf-8")
                return subprocess.CompletedProcess(argv,0)
            with patch.object(server.subprocess,"run",side_effect=runner):
                out=server.transcribe(wav_bytes(),"en",executable="/local/whisper-cli",model=model)
                self.assertEqual(out,"recognized with permission")
            with self.assertRaises(server.RequestError):server.transcribe(wav_bytes(),"en;rm",executable="/local/whisper-cli",model=model)

    def test_no_automatic_weights_or_remote_provider(self):
        self.assertIn("synthesis",server.get_engines())
        self.assertFalse(server.get_model_path({"NATHAN_WHISPER_MODEL":""}))
        self.assertNotIn("https",server.URL_PREFIX)
        self.assertNotIn("native/server.py",server.STATIC)

class HTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Pick a loopback port, then let server bind it. Never expose 0.0.0.0.
        for _ in range(10):
            with socket.socket() as sock:
                sock.bind(("127.0.0.1",0))
                port=sock.getsockname()[1]
            try:cls.http=server.build_server(port);break
            except OSError:continue
        else:raise RuntimeError("No test port available")
        cls.port=port
        cls.origin=f"http://127.0.0.1:{port}"
        cls.worker=threading.Thread(target=cls.http.serve_forever,daemon=True)
        cls.worker.start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown();cls.http.server_close();cls.worker.join(timeout=3)

    def req(self,path,method="GET",data=None,headers=None):
        req=Request(self.origin+path,data=data,method=method,headers=headers or {})
        try:
            with urlopen(req,timeout=5) as r:
                return r.status,r.read(),dict(r.headers)
        except HTTPError as e:return e.code,e.read(),dict(e.headers)

    def test_status_and_allowlist(self):
        code,body,_=self.req("/api/voice/status")
        self.assertEqual(code,200)
        d=json.loads(body)
        self.assertTrue(d["localOnly"])
        self.assertTrue(d["csrf"])
        self.assertEqual(d["limits"]["audioSeconds"],30)
        code,_,_=self.req("/app-factory/nathan-ai/voice-box/index.html")
        self.assertEqual(code,200)
        for denied in ("/app-factory/nathan-ai/voice-box/native/server.py",
                       "/.git/config","/app-factory/nathan-ai/voice-box/../../../../.git/config"):
            self.assertNotEqual(self.req(denied)[0],200)

    def test_csrf_and_origin_rejections(self):
        url="/api/voice/synthesize";payload=b'{"text":"hello","voice":"en"}'
        for headers in ({},{"Origin":"https://evil.invalid"},
                        {"Origin":self.origin,"Content-Type":"application/json"}):
            code,_,_=self.req(url,"POST",payload,headers)
            self.assertEqual(code,403)
        status=json.loads(self.req("/api/voice/status")[1])
        allowed={"Origin":self.origin,"X-Nathan-Voice-CSRF":status["csrf"],"Content-Type":"application/json"}
        code,body,_=self.req(url,"POST",b'{"text":"","voice":"en"}',allowed)
        self.assertEqual(code,422)
        self.assertIn("error",json.loads(body))

if __name__=="__main__":
    unittest.main()
