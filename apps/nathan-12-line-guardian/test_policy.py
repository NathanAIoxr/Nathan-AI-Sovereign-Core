import unittest
from policy import decide

class TestPolicy(unittest.TestCase):
    def setUp(self):
        self.grants=[{"subject":"conductor","actions":["read","stage"],"resource":"repo:owned/*"}]
    def test_allowed(self):
        self.assertTrue(decide("conductor","stage","repo:owned/app",self.grants).allowed)
    def test_unauthorized_denied(self):
        self.assertFalse(decide("stranger","stage","repo:owned/app",self.grants).allowed)
    def test_lockdown(self):
        self.assertFalse(decide("conductor","read","repo:owned/app",self.grants,lockdown=True).allowed)
    def test_privileged_needs_approval(self):
        self.assertFalse(decide("conductor","production_deploy","repo:owned/app",self.grants).allowed)
    def test_no_grants(self):
        self.assertFalse(decide("conductor","stage","repo:owned/app",[]).allowed)

if __name__=="__main__":
    unittest.main()
