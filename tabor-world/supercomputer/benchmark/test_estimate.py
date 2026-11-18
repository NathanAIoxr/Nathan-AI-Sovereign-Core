import unittest
from estimate import estimate

class CapacityTests(unittest.TestCase):
    def test_target_math(self):
        self.assertEqual(estimate(4.396,1000,1)["estimated_nodes"],4396)
    def test_efficiency(self):
        self.assertEqual(estimate(4.396,1000,.5)["estimated_nodes"],8792)
    def test_invalid(self):
        with self.assertRaises(ValueError): estimate(4.396,1000,0)
if __name__=="__main__": unittest.main()
