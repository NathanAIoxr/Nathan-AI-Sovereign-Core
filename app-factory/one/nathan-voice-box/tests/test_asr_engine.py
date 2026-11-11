import sys
import unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import asr_engine
from voicebox import VoiceBoxError

class ASRValidation(unittest.TestCase):
    def test_unsupported_language_fails_before_audio_decode(self):
        with patch.object(asr_engine,"load_pack",return_value={
            "runtime":"sherpa-onnx-whisper-asr","languages":["en"]
        }):
            with self.assertRaisesRegex(VoiceBoxError,"does not support"):
                asr_engine.transcribe_reference("test","not audio","ar-EG")

    def test_non_asr_model_denied(self):
        with patch.object(asr_engine,"load_pack",return_value={
            "runtime":"sherpa-onnx-zipvoice","languages":["en"]
        }):
            with self.assertRaisesRegex(VoiceBoxError,"speech-recognition"):
                asr_engine.transcribe_reference("test","not audio","en-US")

    def test_pack_identifier_rejects_traversal(self):
        with self.assertRaises(VoiceBoxError):
            asr_engine.transcribe_reference("../escape","","en-US")

    def test_language_code_rejected(self):
        with self.assertRaises(VoiceBoxError):
            asr_engine.transcribe_reference("unused","","fr../../en")
if __name__=="__main__":
    unittest.main()
