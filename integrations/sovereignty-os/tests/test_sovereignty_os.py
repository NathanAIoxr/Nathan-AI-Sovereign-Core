import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from sovereignty_os_dine_universe import SovereigntyOS,antipode
class EngineTests(unittest.TestCase):
 def test_antipode(self):
  self.assertEqual(antipode(36,-109),(-36,71))
  self.assertEqual(antipode(54.5,2),(-54.5,-178))
 def test_seed(self):
  e=SovereigntyOS();e.seed_all_data();s=e.export_full_snapshot()
  self.assertEqual(len(s["landmarks"]),5)
  self.assertEqual(len(s["submerged_lands"]),5)
  self.assertEqual(len(s["linguistic_concordance"]),6)
  self.assertEqual(len(s["three_sisters_agronomy"]),3)
  self.assertEqual(len(s["ke_clans"]),4)
  self.assertEqual(len(s["dine_lunar_months"]),12)
  self.assertEqual(len(s["community_projects"]),4)
  e.seed_all_data()
  self.assertEqual(len(e.export_full_snapshot()["landmarks"]),5)
  e.close()
if __name__=="__main__":unittest.main()
