"""Run with: python3 linear_hox_patterns_test.py"""
import itertools
import math
import unittest
from linear_hox_patterns import LinearHoxFamilyPipeline


class LinearPatternTests(unittest.TestCase):
    def setUp(self):
        self.engine = LinearHoxFamilyPipeline()

    def test_gradient_boundaries_and_falloff(self):
        self.assertEqual(self.engine.gradient_strength(0), 1.0)
        self.assertEqual(self.engine.gradient_strength(100, decay=0), 1.0)
        self.assertEqual(self.engine.gradient_strength(3, amplitude=0), 0.0)
        self.assertAlmostEqual(self.engine.gradient_strength(3), math.exp(-0.39))
        strengths = [self.engine.gradient_strength(i) for i in range(100)]
        self.assertTrue(all(a >= b >= 0 for a, b in zip(strengths, strengths[1:])))

    def test_invalid_gradient_inputs(self):
        for bad in (-1, True, "3", None, float("nan"), float("inf"), 10**400):
            for parameter in ("distance", "decay", "amplitude"):
                args = dict(distance=3, decay=0.13, amplitude=1)
                args[parameter] = bad
                with self.subTest(parameter=parameter, bad=repr(bad)):
                    with self.assertRaises(ValueError):
                        self.engine.gradient_strength(**args)

    def test_finite_combinatorial_catalogues(self):
        profiles = {self.engine.assemble_profile(v, j, d)
                    for v, d, j in itertools.product(range(3), range(2), range(2))}
        self.assertEqual(len(profiles), 12)
        self.assertEqual(self.engine.assemble_profile(1, 1, 0), ("V2", "D1", "J2"))
        light = {self.engine.assemble_profile(v, j)
                 for v, j in itertools.product(range(3), range(2))}
        self.assertEqual(len(light), 6)
        self.assertEqual(self.engine.assemble_profile(0, 0), ("V1", "J1"))

    def test_invalid_indices(self):
        for args in ((-1, 0), (3, 0), (0, 2), (True, 0),
                     (0, 0, 2), (0, 0, False), (0.0, 0)):
            with self.subTest(args=args), self.assertRaises(ValueError):
                self.engine.assemble_profile(*args)

    def test_map_positions_and_bounds(self):
        self.assertEqual(self.engine.map_positions(3, 2, -1), (-1.0, 1.0, 3.0))
        self.assertEqual(self.engine.map_positions(0), ())
        for args in ((True,), (4097,), (2, 0), (2, -1), (2, 1, float("nan")),
                     (3, 1e308), (2, 1, 1e308)):
            with self.subTest(args=args), self.assertRaises(ValueError):
                self.engine.map_positions(*args)


if __name__ == "__main__":
    unittest.main()
