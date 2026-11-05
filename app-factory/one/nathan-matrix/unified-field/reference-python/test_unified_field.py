"""Regression tests for the preserved reference Python 0–9 / 4×6 model."""
from __future__ import annotations
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("nathan_original_reference", HERE / "nathan_unified_field_sim.py")
module = importlib.util.module_from_spec(spec)
assert spec is not None and spec.loader is not None
spec.loader.exec_module(module)


class OriginalFieldReferenceTests(unittest.TestCase):
    def test_eight_operators_four_rows_six_channels(self):
        self.assertEqual([o["id"] for o in module.OPERATORS], list(range(1, 9)))
        self.assertEqual([r["operators"] for r in module.ROWS], [[1, 2], [3, 4], [5, 6], [7, 8]])
        self.assertEqual(len(module.CHANNELS), 6)

    def test_reference_field_values(self):
        seed = module.parse_bits("101100")
        self.assertEqual(
            ["".join(map(str, r)) for r in module.field(seed)],
            ["101100", "010110", "001101", "111001"],
        )

    def test_reference_cycle_and_release(self):
        report = module.build_report(module.parse_bits("101100"), 16)
        self.assertEqual(report["loop"]["states"], ["101100", "001111", "101100"])
        self.assertEqual(report["loop"]["detected_cycle"]["period"], 2)
        self.assertEqual(report["boundary_9"]["result"], "101100")

    def test_original_json_and_csv_fixtures_reproduce_exactly(self):
        report = module.build_report(module.parse_bits("101100"), 16)
        expected = json.loads((HERE / "nathan_unified_field_output.json").read_text(encoding="utf-8"))
        self.assertEqual(report, expected)
        with tempfile.TemporaryDirectory() as d:
            output = Path(d) / "field.csv"
            module.write_csv(output, report)
            self.assertEqual(output.read_bytes(), (HERE / "nathan_unified_field_matrix.csv").read_bytes())

    def test_bad_bit_sequences_fail(self):
        for sequence in ("", "101", "101102", "10110011"):
            with self.subTest(sequence=sequence):
                with self.assertRaises(ValueError):
                    module.parse_bits(sequence)


if __name__ == "__main__":
    unittest.main()
