import math
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import voicebox as v


class VoiceBoxTests(unittest.TestCase):
    def setUp(self):
        self.sr = 16000
        self.samples = [0.25 * math.sin(2 * math.pi * 400 * i / self.sr) for i in range(2048)]
        self.wav = v._wav_from_float(self.samples, self.sr)

    def test_12_band_energy_is_normalized(self):
        result = v.analyze(self.wav)
        self.assertEqual(len(result["band_energy_share"]), 12)
        self.assertAlmostEqual(sum(result["band_energy_share"]), 1, places=6)
        self.assertGreater(result["spectral_centroid_hz"], 0)
        self.assertTrue(0 <= result["entropy_12_normalized"] <= 1)

    def test_effects_are_deterministic_and_bounded(self):
        self.assertEqual(self.wav, v.process_macro(self.wav, "none"))
        for effect in ("cave", "echo", "wind"):
            out = v.process_macro(self.wav, effect)
            self.assertEqual(out, v.process_macro(self.wav, effect))
            samples, rate = v._wav_samples(out)
            self.assertEqual(rate, self.sr)
            self.assertLessEqual(max(abs(x) for x in samples), 0.961)

    def test_language_safety(self):
        self.assertEqual(v.language_code("ar"), "ar")
        self.assertEqual(v.language_code("en-US"), "en-US")
        with self.assertRaises(v.VoiceBoxError):
            v.language_code("../us")
        with self.assertRaises(v.VoiceBoxError):
            v.language_code("en US")

    def test_model_manifest_denied_by_default(self):
        with self.assertRaises(v.VoiceBoxError):
            v.load_pack("../outside")
        with self.assertRaises(v.VoiceBoxError):
            v.load_pack("no-such-pack")

    def test_no_uninstalled_engine_fallback(self):
        from unittest.mock import patch
        with patch.object(v.shutil, "which", return_value=None):
            with self.assertRaises(v.VoiceBoxError):
                v.speak("Hello", lang="en-US", voice="en-us")

    def test_empty_and_short_audio(self):
        with self.assertRaises(v.VoiceBoxError):
            v.analyze(v._wav_from_float([0.0]*4, self.sr))
        with self.assertRaises(v.VoiceBoxError):
            v.speak("", lang="en-US")

    def test_silence_spectrum(self):
        result = v.analyze(v._wav_from_float([0.0]*1024, self.sr))
        self.assertEqual(result["rms"], 0)
        self.assertEqual(result["entropy_12_normalized"], 0)


if __name__ == "__main__":
    unittest.main()