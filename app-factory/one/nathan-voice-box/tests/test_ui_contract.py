"""Static UI wiring checks: catch missing field IDs and accidental remote scripts."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
JS = ["app.js", "voice-recorder.js", "language-catalog.js"]
ALL_LOCAL_JS = ["app.js", "voice-recorder.js", "language-catalog.js",
                "voice-store.js", "voice-mapper-core.js", "mapper-worker.js"]


class VoiceBoxUIContract(unittest.TestCase):
    def test_all_ui_field_references_exist(self):
        html = (ROOT / "index.html").read_text("utf-8")
        available = set(re.findall(r'\bid="([^"]+)"', html))
        missing = []
        for jsfile in JS:
            source = (ROOT / jsfile).read_text("utf-8")
            for target in re.findall(r'\$\("([^"]+)"\)', source):
                if target not in available:
                    missing.append(f"{jsfile}: #{target}")
        self.assertEqual(missing, [])

    def test_no_remote_script_dependencies_or_faces(self):
        html = (ROOT / "index.html").read_text("utf-8")
        script_urls = re.findall(r'<script\s+src="([^"]+)"', html)
        self.assertGreaterEqual(len(script_urls), 5)
        for src in script_urls:
            self.assertTrue(src.startswith("/") and "//" not in src, src)
            self.assertTrue((ROOT / src.lstrip("/")).is_file(), src)
        for source in ALL_LOCAL_JS:
            body = (ROOT / source).read_text("utf-8")
            self.assertNotIn("https://", body)
            self.assertNotIn("http://", body)
        self.assertNotIn("<img ",html.lower())

    def test_archive_and_self_consent_are_separate(self):
        html = (ROOT / "index.html").read_text("utf-8")
        for name in ("consent-self", "archive-rights", "archive-rights-basis",
                     "archive-map", "reference-transcript", "asr-pack"):
            self.assertIn('id="'+name+'"', html)


if __name__=="__main__":
    unittest.main()
