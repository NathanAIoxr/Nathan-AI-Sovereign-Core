"""Standard-library regression tests for the standalone local micro-engine."""
import unittest
from sovereign_unit import SovereignUnit, RETAIN, HOLD, CLEAR_CONFIRMATION


class SovereignUnitTests(unittest.TestCase):
    def test_whole_math(self):
        self.assertEqual(SovereignUnit.build(1, 1), 2)
        self.assertEqual(SovereignUnit.clear(1, 1), 0)
        with self.assertRaises(TypeError):
            SovereignUnit.build(1.5, 1)

    def test_reversible_text_is_not_truth(self):
        unit = SovereignUnit({"owner": "user"})
        result = unit.process_dual_axis("DATA")
        self.assertEqual(result.backward, "ATAD")
        self.assertEqual(result.restored, "DATA")
        self.assertEqual(result.structural_gate, RETAIN)
        self.assertEqual(result.review_gate, HOLD)
        self.assertIn("does not prove truth", result.note)

    def test_evidence_review_is_explicit_not_automatic(self):
        unit = SovereignUnit({})
        unreviewed = unit.process_dual_axis(
            "This is a claim", reference="archive:1", review_status="unreviewed"
        )
        reviewed = unit.process_dual_axis(
            "This is a claim", reference="archive:1", review_status="supported"
        )
        self.assertEqual(unreviewed.review_gate, HOLD)
        self.assertEqual(reviewed.review_gate, RETAIN)

    def test_word_deception_does_not_trigger_detection(self):
        unit = SovereignUnit({"keep": 1})
        result = unit.process_dual_axis("DECEPTION_DETECTED")
        self.assertEqual(result.structural_gate, RETAIN)
        self.assertEqual(unit.attributes["keep"], 1)

    def test_explicit_clear_returns_independent_new_unit(self):
        source = {"keep": "my data"}
        unit = SovereignUnit(source)
        with self.assertRaises(PermissionError):
            unit.execute_absolute_clearing("guess")
        clean = unit.execute_absolute_clearing(CLEAR_CONFIRMATION)
        self.assertEqual(clean.attributes, {})
        self.assertEqual(unit.attributes, {"keep": "my data"})
        self.assertEqual(source, {"keep": "my data"})

    def test_attrs_are_defensive_copy(self):
        unit = SovereignUnit({"key": 1})
        local = unit.attributes
        local.clear()
        self.assertEqual(unit.attributes, {"key": 1})


if __name__ == "__main__":
    unittest.main()
