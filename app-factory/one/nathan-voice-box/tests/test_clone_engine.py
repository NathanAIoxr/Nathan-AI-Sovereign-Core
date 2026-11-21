import base64
import io
import math
import struct
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
import wave

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import clone_engine
from voicebox import VoiceBoxError


def reference(hz=160, seconds=3):
    frames = (int(5000 * math.sin(2 * math.pi * hz * x / 16000))
              for x in range(seconds * 16000))
    with io.BytesIO() as buff:
        with wave.open(buff, "wb") as out:
            out.setnchannels(1)
            out.setsampwidth(2)
            out.setframerate(16000)
            out.writeframes(b"".join(struct.pack("<h", x) for x in frames))
        return base64.b64encode(buff.getvalue()).decode("ascii")


class OfflineCloneValidationTests(unittest.TestCase):
    def test_pcm_reference_roundtrip(self):
        data, sr = clone_engine._reference_pcm(reference())
        self.assertEqual(sr, 16000)
        self.assertEqual(len(data), 48000)

    def test_invalid_and_truncated_recording(self):
        with self.assertRaises(VoiceBoxError):
            clone_engine._reference_pcm("not-base64")
        with self.assertRaises(VoiceBoxError):
            clone_engine._reference_pcm(base64.b64encode(b"RIFFgarbage").decode())
        with self.assertRaises(VoiceBoxError):
            clone_engine._reference_pcm(reference(seconds=1))

    def test_self_authorization_required(self):
        with self.assertRaisesRegex(VoiceBoxError, "authorize"):
            clone_engine.clone_with_reference(
                "Hello", "en-US", "unused", reference(), "Test recording", False
            )

    def test_unsupported_language_rejected_before_loading_models(self):
        with patch.object(clone_engine, "load_pack", return_value={
            "runtime":"sherpa-onnx-zipvoice", "languages":["en-US","zh-CN"]
        }):
            with self.assertRaisesRegex(VoiceBoxError, "does not support"):
                clone_engine.clone_with_reference(
                    "Bonjour", "fr-FR", "unused", reference(), "Test recording", True
                )

    def test_non_cloning_pack_denied(self):
        with patch.object(clone_engine, "load_pack", return_value={
            "runtime":"sherpa-onnx-vits", "languages":["en-US"]
        }):
            with self.assertRaisesRegex(VoiceBoxError, "ZipVoice"):
                clone_engine.clone_with_reference(
                    "Hello", "en-US", "unused", reference(), "Test recording", True
                )

    def test_no_unlicensed_or_missing_pack(self):
        with self.assertRaises(VoiceBoxError):
            clone_engine.clone_with_reference(
                "Hello", "en-US", "../escape", reference(), "Test recording", True
            )


if __name__ == "__main__":
    unittest.main()
