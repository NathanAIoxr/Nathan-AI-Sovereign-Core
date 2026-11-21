import hashlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import zipfile

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import pack_manager
from voicebox import VoiceBoxError


class OfflinePackTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name)
        self.model_root = self.path / "private-packs"
        self.patch_root = patch.object(pack_manager, "MODEL_ROOT", self.model_root)
        self.patch_root.start()
        self.addCleanup(self.patch_root.stop)

    def pack(self, change=None, extra=None):
        data = {
            "encoder":"local encoder test bytes",
            "decoder":"local decoder test bytes",
            "tokens":"local token text",
        }
        if extra:
            data.update(extra)
        manifest = {
            "id":"test-local-asr",
            "runtime":"sherpa-onnx-whisper-asr",
            "languages":["en-US"],
            "encoder":"encoder.onnx",
            "decoder":"decoder.onnx",
            "tokens":"tokens.txt",
            "authorized":True,
            "rights_basis":"licensed-synthetic",
            "license":"test fixture — no external model",
            "sha256":{
                "encoder.onnx":hashlib.sha256(data["encoder"].encode()).hexdigest(),
                "decoder.onnx":hashlib.sha256(data["decoder"].encode()).hexdigest(),
                "tokens.txt":hashlib.sha256(data["tokens"].encode()).hexdigest(),
            },
        }
        if change:
            change(manifest)
        file = self.path / "model.nvoicepack"
        with zipfile.ZipFile(file,"w",compression=zipfile.ZIP_DEFLATED) as z:
            z.writestr("manifest.json", json.dumps(manifest))
            z.writestr("encoder.onnx", data["encoder"])
            z.writestr("decoder.onnx", data["decoder"])
            z.writestr("tokens.txt", data["tokens"])
        return file

    def test_installs_valid_local_pack_without_network(self):
        path = self.pack()
        result = pack_manager.install_zip(path)
        self.assertEqual(result, "test-local-asr")
        self.assertTrue((self.model_root / result / "manifest.json").exists())
        with self.assertRaisesRegex(VoiceBoxError,"already installed"):
            pack_manager.install_zip(path)

    def test_checksum_rejects_modified_files_atomically(self):
        path = self.pack(lambda m: m["sha256"].__setitem__("encoder.onnx","0"*64))
        with self.assertRaisesRegex(VoiceBoxError,"SHA-256 mismatch"):
            pack_manager.install_zip(path)
        self.assertFalse((self.model_root / "test-local-asr").exists())
        self.assertEqual(list(self.model_root.iterdir()), [])

    def test_license_and_authorization_required(self):
        path = self.pack(lambda m: m.update(authorized=False))
        with self.assertRaisesRegex(VoiceBoxError,"rights attestation"):
            pack_manager.install_zip(path)
        path = self.pack(lambda m: m.update(license=""))
        with self.assertRaisesRegex(VoiceBoxError,"license"):
            pack_manager.install_zip(path)

    def test_prevents_zip_path_traversal(self):
        archive=self.path/"bad.nvoicepack"
        with zipfile.ZipFile(archive,"w") as z:
            z.writestr("manifest.json","{}")
            z.writestr("../outside.onnx","bad")
        with self.assertRaisesRegex(VoiceBoxError,"unsafe path"):
            pack_manager.install_zip(archive)
        self.assertFalse((self.path/"outside.onnx").exists())

    def test_rejects_archive_symlink(self):
        archive=self.path/"bad.nvoicepack"
        link=zipfile.ZipInfo("voice-model.onnx")
        link.create_system=3
        link.external_attr=(0o120777 << 16)
        with zipfile.ZipFile(archive,"w") as z:
            z.writestr("manifest.json","{}")
            z.writestr(link,"../../outside")
        with self.assertRaisesRegex(VoiceBoxError,"symlinks"):
            pack_manager.install_zip(archive)

    def test_declared_hashes_cover_every_file(self):
        path = self.pack(lambda m: m["sha256"].pop("tokens.txt"))
        with self.assertRaisesRegex(VoiceBoxError,"Checksums must cover"):
            pack_manager.install_zip(path)

    def test_rejects_wrong_languages_and_pack_id(self):
        path = self.pack(lambda m: m.update(languages=["not valid language"]))
        with self.assertRaisesRegex(VoiceBoxError,"supported languages"):
            pack_manager.install_zip(path)
        path = self.pack(lambda m: m.update(id="../../escape"))
        with self.assertRaisesRegex(VoiceBoxError,"Invalid model pack ID"):
            pack_manager.install_zip(path)


if __name__ == "__main__":
    unittest.main()
