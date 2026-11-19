import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from fundraising_ecosystem_core import *
class TierTests(unittest.TestCase):
 def test_tiers(self):
  self.assertEqual(calculate_settlement("TRUCK_DROP_PRODUCE_AND_PLANTS",18500)["church_cash_payout"],"7400.00")
  self.assertEqual(calculate_settlement("POD_CATALOG_AND_HOLIDAY_WRAP",4200,"SUPPLY_CREDIT")["total_supply_credit"],"2394.00")
  self.assertEqual(calculate_settlement("CHURCH_SUPPLIES_AND_SUNDAY_SCHOOL",3000,purchase_mode="DIRECT_CHURCH_BUY")["net_church_pays"],"2100.00")
 def test_edges(self):
  self.assertEqual(calculate_settlement("TRUCK_DROP_PRODUCE_AND_PLANTS",2500)["tier"],2)
  with self.assertRaises(ValueError): calculate_settlement("TRUCK_DROP_PRODUCE_AND_PLANTS",-1)
  with self.assertRaises(ValueError): calculate_settlement("TRUCK_DROP_PRODUCE_AND_PLANTS",float("inf"))
 def test_catalog(self):
  self.assertEqual([len(x) for x in MASTER_CATALOG.values()],[8,10,8])
if __name__=="__main__": unittest.main()
