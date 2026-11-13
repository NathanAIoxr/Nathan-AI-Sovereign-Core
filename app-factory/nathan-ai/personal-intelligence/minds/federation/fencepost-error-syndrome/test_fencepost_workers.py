import unittest
from fencepost_workers import (
    RosterSentinel, CodeSentinel, CalendarSynchronizer,
    SubscriptionGuard, HotelStayGuard, MaterialCountGuard,
    ArrayIndexGuard, FamilyONEGate, invariant_tests, demo_families,
    simulate, receipt
)

class FencepostWorkerTests(unittest.TestCase):
    def test_families_audited(self):
        self.assertTrue(RosterSentinel.audit(demo_families())['passed'])
    def test_omission(self):
        self.assertEqual(RosterSentinel.schedule(demo_families(),7,0)['omitted_role_days'],77)
    def test_overrun(self):
        r=RosterSentinel.schedule(demo_families(),7,2)
        self.assertEqual((r['duplicate_role_days'],r['invalid_role_days']),(70,7))
    def test_fixed(self):
        r=RosterSentinel.schedule(demo_families(),7,1)
        self.assertEqual((r['valid_unique_role_days'],r['duplicate_role_days'],r['invalid_role_days']),(693,0,0))
    def test_duplicate_rejected(self):
        f=demo_families()
        f[1]['members'][0]['member_id']=73
        self.assertFalse(RosterSentinel.audit(f)['passed'])
    def test_code_sentinel_detects_exclusive_end(self):
        r=CodeSentinel.scan_python('for m in range(65, 163): pass',65,163)
        self.assertEqual(r['issues'][0]['corrected_suggestion'],'range(65, 164)')
    def test_code_sentinel_leaves_good_code(self):
        self.assertEqual(CodeSentinel.scan_python('for m in range(65, 164): pass',65,163)['issues'],[])
    def test_code_sentinel_detects_overrun(self):
        self.assertEqual(CodeSentinel.scan_python('for m in range(65, 165): pass',65,163)['issues'][0]['type'],'one_past_required_end')
    def test_calendar(self):
        r=CalendarSynchronizer.summarize('2026-11-15','2026-11-22')
        self.assertEqual((r['scheduled_dates'],r['named_dates_inclusive_of_both_endpoints'],r['named_dates_strictly_between']),(7,8,6))
    def test_calendar_invalid(self):
        with self.assertRaises(ValueError): CalendarSynchronizer.summarize('2026-11-22','2026-11-15')
    def test_billing(self):
        self.assertEqual(SubscriptionGuard.expire('2026-11-15',7)['expiry_exclusive'],'2026-11-22')
    def test_hotel(self):
        self.assertEqual(HotelStayGuard.nights('2026-11-15','2026-11-22')['nights'],7)
    def test_open_fence(self):
        self.assertEqual(MaterialCountGuard.fence('70','10')['required_posts'],8)
    def test_closed_fence(self):
        self.assertEqual(MaterialCountGuard.fence('70','10','closed')['required_posts'],7)
    def test_fractional_bad_spacing(self):
        with self.assertRaises(ValueError): MaterialCountGuard.fence(71,10)
    def test_array(self):
        self.assertFalse(ArrayIndexGuard.inspect(64,64)['valid'])
        self.assertTrue(ArrayIndexGuard.inspect(64,63)['valid'])
    def test_owner_approval(self):
        self.assertFalse(FamilyONEGate.evaluate('external_patch')['approved'])
        self.assertFalse(FamilyONEGate.evaluate('external_patch')['action_executed'])
    def test_10000_property_checks(self):
        self.assertTrue(invariant_tests()['passed'])
    def test_report(self):
        r=simulate()
        self.assertEqual(r['roster']['recovered_role_days'],77)
        self.assertEqual(r['construction']['missing_posts_before'],25)
        self.assertEqual(len(receipt(r)),64)

if __name__=='__main__': unittest.main()
