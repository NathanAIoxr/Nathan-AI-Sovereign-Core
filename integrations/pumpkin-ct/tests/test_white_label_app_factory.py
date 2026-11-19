import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from white_label_app_factory import *
from fun_and_community_layer import *
class FactoryTests(unittest.TestCase):
 def test_selected_only(self):
  x=provision_white_label_tenant("org1","Church","church.example.org","#ABCDEF",["APP-CHURCH-OPS"])
  self.assertEqual(len(x["enabled_apps"]),1)
  self.assertEqual(x["status"],"DRAFT_NOT_PROVISIONED")
 def test_unknown_rejected(self):
  with self.assertRaises(ValueError): provision_white_label_tenant("org1","Church","church.example.org","#ABCDEF",["UNKNOWN"])
 def test_fun_separate(self):
  m=build_complete_handoff_manifest()
  self.assertIn("optional_fun_layer",m)
  self.assertIn("core",m)
if __name__=="__main__":unittest.main()
