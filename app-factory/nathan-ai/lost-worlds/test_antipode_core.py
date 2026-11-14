import unittest
from antipode_core import antipode, great_circle_km, candidate_links
class TestAntipode(unittest.TestCase):
    def test_equator(self): self.assertEqual(antipode(0,0),(0,-180))
    def test_athens(self): self.assertEqual(antipode(37.9838,23.7275),(-37.9838,-156.2725))
    def test_new_zealand(self): self.assertEqual(antipode(-37.69,176.11),(37.69,-3.89))
    def test_round_trip(self):
        for p in [(20,-50),(37.1,4.1),(-40,170)]:
            self.assertEqual(antipode(*antipode(*p)),p)
    def test_distance(self): self.assertEqual(great_circle_km((0,0),(0,0)),0)
    def test_candidates(self): self.assertGreater(len(candidate_links((37.9838,23.7275))),0)
if __name__=="__main__":unittest.main()
