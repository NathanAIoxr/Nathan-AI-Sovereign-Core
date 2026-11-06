"""Regression checks for the dependency-free deep-root numerical demonstrations."""
import math
import unittest
from advanced import (mirror_state_transfer, wave_packet_step, membrane_step,
                      synthetic_spectrum, anomaly_frobenius, receipt_digest)

class DeepRootTests(unittest.TestCase):
    def test_four_branches_and_perfect_ideal_fidelity(self):
        branches = mirror_state_transfer(.6, .8)
        self.assertEqual(len(branches),4)
        self.assertAlmostEqual(sum(x["probability"] for x in branches),1,places=10)
        for item in branches:
            self.assertAlmostEqual(item["fidelity"],1,places=10)
            self.assertAlmostEqual(item["probability"],.25,places=10)

    def test_complex_relative_phase(self):
        for item in mirror_state_transfer(1/math.sqrt(2),1j/math.sqrt(2)):
            self.assertAlmostEqual(item["fidelity"],1,places=10)

    def test_fourier_wave_step_preserves_norm(self):
        result=wave_packet_step()
        self.assertAlmostEqual(result["before_norm"],1,places=10)
        self.assertAlmostEqual(result["after_norm"],1,places=10)
        self.assertEqual(len(result["wave"]),32)

    def test_membrane_step_finite(self):
        result=membrane_step()
        self.assertEqual(set(result),{"voltage","m","h","n"})
        self.assertTrue(all(math.isfinite(v) for v in result.values()))

    def test_synthetic_signal_peak(self):
        self.assertAlmostEqual(synthetic_spectrum()["peak_hz"],8.0,places=8)

    def test_anomaly_and_stable_digest(self):
        self.assertAlmostEqual(anomaly_frobenius([[1,2],[3,4]],[[2,4],[3,4]]),math.sqrt(5))
        self.assertEqual(receipt_digest({"a":1,"b":2}),receipt_digest({"b":2,"a":1}))
        self.assertEqual(len(receipt_digest({})),64)

    def test_invalid_conditions(self):
        with self.assertRaises(ValueError):wave_packet_step(n=4)
        with self.assertRaises(ValueError):membrane_step(dt=.2)
        with self.assertRaises(ValueError):synthetic_spectrum(frequency_hz=40)
        with self.assertRaises(ValueError):anomaly_frobenius([[1,2]],[[1]])
if __name__ == "__main__":unittest.main()
