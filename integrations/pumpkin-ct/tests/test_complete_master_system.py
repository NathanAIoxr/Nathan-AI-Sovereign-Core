import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from complete_master_system import calculate_settlement,build_manifest,cents
class MasterTests(unittest.TestCase):
 def test_tier_boundary(self):
  self.assertEqual(calculate_settlement("TRUCK_DROP_PRODUCE_AND_PLANTS","2500.00")["tier"],2)
 def test_money_off(self):
  x=calculate_settlement("CHURCH_SUPPLIES_AND_SUNDAY_SCHOOL","3000.00","DIRECT_CHURCH_BUY")
  self.assertEqual(x["benefit_cents"],90000)
 def test_no_negative(self):
  with self.assertRaises(ValueError):cents(-1)
 def test_layers(self):
  x=build_manifest()
  self.assertIn("core_logistics",x)
  self.assertIn("fun_and_white_label",x)
if __name__=="__main__":unittest.main()
