"""Regression tests for ONE v75 member numbering, calendar intervals and no-action model."""
import unittest
from datetime import date
from simulate_indexing import load, simulate, property_tests

class BoundarySimulationTests(unittest.TestCase):
    def test_family_member_ranges(self):
        families, members=load()
        self.assertEqual([f["family_id"] for f in families], list(range(65,76)))
        self.assertEqual([m["member_id"] for m in members], list(range(65,164)))
        self.assertEqual(len(members),11*9)
        self.assertEqual(len(set(m["id"] for m in members)),99)

    def test_fencepost_error_has_measurable_drop(self):
        r=simulate()
        self.assertEqual(r["scheduled_role_slots_expected"],693)
        self.assertEqual(r["cases"]["off_by_one_omission"]["unique_valid_role_slots"],616)
        self.assertEqual(r["cases"]["off_by_one_omission"]["missed_valid_role_slots"],77)
        self.assertEqual(r["cases"]["off_by_one_omission"]["first_day_examples"]["omitted"],
                         [73,82,91,100,109,118,127,136,145,154,163])

    def test_overrun_has_duplicates_and_nonexistent_member(self):
        r=simulate()
        bug=r["cases"]["off_by_one_overrun"]
        self.assertEqual(bug["unique_valid_role_slots"],693)
        self.assertEqual(bug["duplicate_slots"],70)
        self.assertEqual(bug["invalid_slots"],7)
        self.assertEqual(bug["first_day_examples"]["invalid"],[164])

    def test_fixed_range_no_missing_duplicate_or_phantom(self):
        r=simulate()
        fixed=r["cases"]["fixed_inclusive_range"]
        self.assertEqual(fixed["unique_valid_role_slots"],693)
        for field in ("missed_valid_role_slots","duplicate_slots","invalid_slots"):
            self.assertEqual(fixed[field],0)

    def test_calendar_durations_and_boundary_invariant(self):
        r=simulate(7,date(2026,11,15))
        self.assertEqual(r["first_day"],"2026-11-15")
        self.assertEqual(r["last_scheduled_day"],"2026-11-21")
        self.assertEqual(r["exclusive_end_day"],"2026-11-22")
        self.assertEqual(r["endpoint_dates_if_counted_inclusively"],8)
        self.assertEqual(r["strictly_between_dates"],6)
        self.assertTrue(property_tests(10000,1973)["all_passed"])

    def test_one_day_boundary(self):
        r=simulate(days=1)
        self.assertEqual(r["scheduled_role_slots_expected"],99)
        self.assertEqual(r["cases"]["off_by_one_omission"]["missed_valid_role_slots"],11)

if __name__ == "__main__":
    unittest.main()
