import unittest
from engine import MemoryMatrixEngine

class TestMemoryMatrix(unittest.TestCase):
    def test_split(self):
        m = MemoryMatrixEngine()
        self.assertEqual(m.split("100"), {"retained": "80.00", "shared": "20.00"})
        self.assertEqual(str(m.shared_total), "20.00")

    def test_anchor_and_export(self):
        m = MemoryMatrixEngine()
        m.add_anchor("Example", {"type": "fictional"}, 0, 0, "fiction")
        self.assertIn("Example", m.export_json())
        self.assertEqual(m.missing_sources(), [])

    def test_coordinates(self):
        m = MemoryMatrixEngine()
        with self.assertRaises(ValueError):
            m.add_anchor("Invalid", {}, 91, 0)

if __name__ == "__main__":
    unittest.main()
