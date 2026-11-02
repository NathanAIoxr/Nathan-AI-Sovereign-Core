import unittest
from copy import deepcopy
from decimal import Decimal
from coin_audit import load_registry, validate_registry, create_report, audit_ledger, efficiency, LEDGER_SCHEMA


class SovereignCoinAuditTests(unittest.TestCase):
    def setUp(self):
        self.registry = load_registry()

    def test_all_21_source_rings_and_2_million_source_units(self):
        self.assertEqual(len(self.registry["coins"]), 21)
        self.assertEqual(self.registry["coins"][0]["name"], "Sovereign Invariant Network")
        self.assertEqual(self.registry["coins"][-1]["ticker"], "LFB")
        self.assertEqual(sum(x["initial_design_units"] for x in self.registry["coins"]), 2_000_000)

    def test_source_changes_rejected(self):
        altered = deepcopy(self.registry)
        altered["coins"][0]["ticker"] = "FAK"
        with self.assertRaises(AssertionError):
            validate_registry(altered)

    def test_no_fake_onchain_balances(self):
        report = create_report(self.registry)
        self.assertEqual(report["ring_count"], 21)
        self.assertEqual(report["rings"][0]["source_design_allocation_units"], 1_000_000)
        self.assertEqual(report["rings"][0]["local_demo_units"], 0)
        self.assertIsNone(report["rings"][0]["verified_onchain_units"])
        self.assertFalse(report["network_mining_confirmed"])

    def test_local_demo_balances_and_overdraft(self):
        ledger = {"schema": LEDGER_SCHEMA, "entries": [
            {"sequence": 1, "ticker": "SIN", "delta_units": 20, "description": "demo", "created_at": "2026-11-02T00:00:00Z"},
            {"sequence": 2, "ticker": "SIN", "delta_units": -5, "description": "demo debit", "created_at": "2026-11-02T00:01:00Z"},
        ]}
        self.assertEqual(audit_ledger(self.registry, ledger)["demo_balances"]["SIN"], 15)
        altered = deepcopy(ledger)
        altered["entries"][1]["delta_units"] = -21
        with self.assertRaises(ValueError):
            audit_ledger(self.registry, altered)

    def test_cost_target_is_only_entered_values(self):
        result = efficiency("1", "16", "2")
        self.assertEqual(result["entered_ratio"], "16")
        self.assertTrue(result["target_met_in_entered_numbers"])
        self.assertEqual(Decimal(result["cost_per_kwh"]), Decimal("0.5"))
        self.assertEqual(result["verification"], "user_entered_not_network_verified")
        self.assertIsNone(efficiency("0", "16")["entered_ratio"])
        with self.assertRaises(ValueError):
            efficiency("-1", "16")


if __name__ == "__main__":
    unittest.main()
