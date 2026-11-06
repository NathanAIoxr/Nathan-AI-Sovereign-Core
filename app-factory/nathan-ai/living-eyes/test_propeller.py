import unittest
from propeller_extended import (
    NathanAIExtendedPropellerEngine, COUNTS, flip_vertical, flip_mirror, half_turn
)
from originals.nathan_24_axis_propeller_original import NathanAI24AxisPropellerEngine

class LivingEyesTests(unittest.TestCase):
    def test_unmodified_author_class(self):
        engine = NathanAI24AxisPropellerEngine()
        self.assertEqual(len(engine.update_propeller_matrix(15, inversion_active=False)), 24)

    def test_48_96_192_384_views(self):
        for mode, expected in COUNTS.items():
            engine = NathanAIExtendedPropellerEngine()
            result = engine.next_frame(7, mode=mode)
            self.assertEqual(result["view_count"], expected)
            self.assertEqual(len({p["id"] for p in result["points"]}), expected)
            self.assertEqual(result["primary_tracks"], 24)

    def test_24_plus_24_inverted(self):
        points = NathanAIExtendedPropellerEngine().next_frame(2, mode="canonical")["points"]
        self.assertEqual(sum(not p["inverted"] for p in points), 24)
        self.assertEqual(sum(p["inverted"] for p in points), 24)

    def test_separate_geometric_operations(self):
        p = (2.0, 7.0)
        self.assertEqual(flip_vertical(p), (2.0, -7.0))
        self.assertEqual(flip_mirror(p), (-2.0, 7.0))
        self.assertEqual(half_turn(p), (-2.0, -7.0))

    def test_convergence_all_modes(self):
        for mode in COUNTS:
            engine = NathanAIExtendedPropellerEngine()
            self.assertTrue(engine.next_frame(3, mode=mode, lock=True)["converged"])
            engine = NathanAIExtendedPropellerEngine()
            for _ in range(89):
                engine.next_frame(3, mode=mode)
            self.assertTrue(engine.next_frame(3, mode=mode)["converged"])

if __name__ == "__main__":
    unittest.main()
