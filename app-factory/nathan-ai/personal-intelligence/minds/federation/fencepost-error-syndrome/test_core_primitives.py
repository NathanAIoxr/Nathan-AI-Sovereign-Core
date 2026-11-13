#!/usr/bin/env python3
"""13 explicit root-case tests + defensive edge cases for Nathan AI / ONE."""
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from fractions import Fraction
import json
from pathlib import Path
import random
import sqlite3
import tempfile
import unittest
import uuid
from zoneinfo import ZoneInfo

from core_primitives import (
    AUTHOR_ANCHORS, ROOT_IDS, Bitemporal, ContractViolation, EventStore,
    HalfOpen, Money, Observation, Quantity, Rate, canonical_uuid,
    exact_int, inverse_scale, iso_utc, local_to_utc, monotonic_tick_ns,
    one_to_zero, parse_iso_utc, pooled_rate, sanitize_json, scale_exact,
    strict_iso_date, utc_instant, validate_distinct_ids, zero_to_one,
)


class ThirteenRootControls(unittest.TestCase):
    def test_root_01_half_open_boundaries(self):
        r = HalfOpen(0, 7)
        self.assertEqual(r.length, 7)
        self.assertEqual(list(range(r.start, r.stop)), list(range(7)))
        self.assertTrue(r.contains(6))
        self.assertFalse(r.contains(7))
        self.assertEqual(HalfOpen.inclusive(65, 163).length, 99)
        self.assertEqual(HalfOpen(0, 0).length, 0)
        with self.assertRaises(ContractViolation):
            HalfOpen(7, 6)
        with self.assertRaises(ContractViolation):
            HalfOpen.inclusive(3, 2)
        with self.assertRaises(ContractViolation):
            HalfOpen(True, 3)
        generator = random.Random(1973)
        for _ in range(1000):
            start = generator.randint(0, 100000)
            span = generator.randint(0, 100)
            self.assertEqual(HalfOpen(start, start + span).length, span)

    def test_root_02_index_origin(self):
        self.assertEqual(one_to_zero(1), 0)
        self.assertEqual(zero_to_one(0), 1)
        self.assertEqual(zero_to_one(one_to_zero(108)), 108)
        with self.assertRaises(ContractViolation):
            one_to_zero(0)
        with self.assertRaises(ContractViolation):
            zero_to_one(-1)
        with self.assertRaises(ContractViolation):
            one_to_zero(1.0)

    def test_root_03_ids_and_duplicates(self):
        a, b = str(uuid.uuid4()), str(uuid.uuid4())
        self.assertEqual(validate_distinct_ids([a, b]), 2)
        self.assertEqual(canonical_uuid(a), a)
        with self.assertRaises(ContractViolation):
            validate_distinct_ids([a, a])
        with self.assertRaises(ContractViolation):
            canonical_uuid(a.upper())
        with self.assertRaises(ContractViolation):
            canonical_uuid("legacy-123")

    def test_root_04_weighted_raw_rates(self):
        # 1/2 and 9/100: naive 50/50 average is not the true pooled rate.
        r = pooled_rate([Rate(1, 2), Rate(9, 100)])
        self.assertEqual(r, Fraction(10, 102))
        self.assertNotEqual(r, Fraction(1, 2) / 2 + Fraction(9, 100) / 2)
        with self.assertRaises(ContractViolation):
            Rate(0, 0).value()
        with self.assertRaises(ContractViolation):
            pooled_rate([])

    def test_root_05_money_precision(self):
        a = Money.from_decimal_text("0.10", "USD", 2)
        b = Money.from_decimal_text("0.20", "USD", 2)
        self.assertEqual((a + b).amount_minor, 30)
        self.assertEqual(Money.from_decimal_text("100", "JPY", 0).amount_minor, 100)
        self.assertEqual(Money.from_decimal_text("0.001", "KWD", 3).amount_minor, 1)
        with self.assertRaises(ContractViolation):
            Money.from_decimal_text("0.001", "USD", 2)
        with self.assertRaises(ContractViolation):
            Money.from_decimal_text(0.1, "USD", 2)
        with self.assertRaises(ContractViolation):
            a + Money.from_decimal_text("0.01", "EUR", 2)
        with self.assertRaises(ContractViolation):
            Money(True, "USD", 2)

    def test_root_06_unit_type_integrity(self):
        self.assertEqual(Quantity("100", "cm").convert("m").amount, 1)
        self.assertEqual(Quantity("1", "ft").convert("m").amount, Fraction(381, 1250))
        self.assertEqual((Quantity("1", "m") + Quantity("100", "cm")).amount, 2)
        self.assertEqual(Quantity("1000", "ms").convert("s").amount, 1)
        with self.assertRaises(ContractViolation):
            Quantity("1", "m") + Quantity("1", "s")
        with self.assertRaises(ContractViolation):
            Quantity(1.1, "m")
        with self.assertRaises(ContractViolation):
            Quantity(1, "banana")

    def test_root_07_exact_multiplicative_inverse(self):
        self.assertEqual(scale_exact(100, 3, 2), 150)
        self.assertEqual(inverse_scale(150, 3, 2), 100)
        self.assertEqual(scale_exact(150, 1, 2), 75)
        with self.assertRaises(ContractViolation):
            inverse_scale(100, 0, 1)
        with self.assertRaises(ContractViolation):
            scale_exact(1, 1, 0)

    def test_root_08_utc_not_monotonic(self):
        before = monotonic_tick_ns()
        after = monotonic_tick_ns()
        self.assertGreaterEqual(after, before)
        dt = datetime(2026, 11, 1, 6, 30, tzinfo=timezone.utc)
        self.assertEqual(utc_instant(dt), dt)
        self.assertEqual(utc_instant(dt.astimezone(ZoneInfo("America/New_York"))), dt)
        with self.assertRaises(ContractViolation):
            utc_instant(datetime(2026, 11, 1, 1, 30))
        with self.assertRaises(ContractViolation):
            local_to_utc(datetime(2026, 11, 1, 1, 30), "America/New_York")
        early = local_to_utc(datetime(2026, 11, 1, 1, 30), "America/New_York", 0)
        late = local_to_utc(datetime(2026, 11, 1, 1, 30), "America/New_York", 1)
        self.assertEqual(late - early, timedelta(hours=1))
        with self.assertRaises(ContractViolation):
            local_to_utc(datetime(2026, 3, 8, 2, 30), "America/New_York", 0)
        with self.assertRaises(ContractViolation):
            local_to_utc(datetime(2026, 3, 8, 2, 30), "America/New_York", 1)

    def test_root_09_strict_iso_date_time(self):
        self.assertEqual(strict_iso_date("2026-11-13"), date(2026, 11, 13))
        self.assertEqual(strict_iso_date("2028-02-29"), date(2028, 2, 29))
        for ambiguous in ("11/13/2026", "2026-11-13Z", "2026-2-3", "20260203", "2026-02-29"):
            with self.subTest(ambiguous=ambiguous), self.assertRaises(ContractViolation):
                strict_iso_date(ambiguous)
        d = datetime(2026, 11, 13, 17, 30, 22, 1234, tzinfo=timezone.utc)
        self.assertEqual(parse_iso_utc(iso_utc(d)), d)
        with self.assertRaises(ContractViolation):
            parse_iso_utc("2026-11-13T17:30:22-05:00")
        with self.assertRaises(ContractViolation):
            parse_iso_utc("2026-11-13T17:30:22Z")

    def test_root_10_bitemporal_events(self):
        happened = datetime(2026, 11, 12, tzinfo=timezone.utc)
        recorded = datetime(2026, 11, 13, tzinfo=timezone.utc)
        record = Bitemporal(happened, recorded)
        self.assertLess(record.valid_at, record.recorded_at)
        with self.assertRaises(ContractViolation):
            Bitemporal(happened.replace(tzinfo=None), recorded)

    def test_root_11_zero_is_not_missing(self):
        zero = Observation("measured", 0)
        missing = Observation("missing", None, "not collected")
        failed = Observation("failed", None, "sensor offline")
        self.assertEqual(zero.value, 0)
        self.assertIsNone(missing.value)
        self.assertNotEqual(missing.state, failed.state)
        with self.assertRaises(ContractViolation):
            Observation("measured", None)
        with self.assertRaises(ContractViolation):
            Observation("missing", 0, "not collected")
        with self.assertRaises(ContractViolation):
            Observation("failed", None, None)

    def test_root_12_append_only_transactions(self):
        with sqlite3.connect(":memory:") as db:
            store = EventStore(db)
            store.initialize()
            valid = datetime(2026, 11, 12, tzinfo=timezone.utc)
            eid = str(uuid.uuid4())
            self.assertTrue(store.append("one-owner", eid, "job-001", 10, valid))
            self.assertEqual(store.total("one-owner"), 10)
            self.assertEqual(len(store.records("one-owner")), 1)
            with self.assertRaises(sqlite3.DatabaseError):
                db.execute("UPDATE one_root13_events SET delta=1")
            db.rollback()
            with self.assertRaises(sqlite3.DatabaseError):
                db.execute("DELETE FROM one_root13_events")
            db.rollback()
            self.assertEqual(store.total("one-owner"), 10)
            self.assertEqual(store.records("one-owner")[0]["valid_at"], iso_utc(valid))

    def test_root_13_single_owner_idempotency(self):
        with sqlite3.connect(":memory:") as db:
            store = EventStore(db)
            store.initialize()
            valid = datetime(2026, 11, 12, tzinfo=timezone.utc)
            eid = str(uuid.uuid4())
            self.assertTrue(store.append("one-owner", eid, "same-request", 5, valid))
            self.assertFalse(store.append("one-owner", eid, "same-request", 5, valid))
            self.assertEqual(store.total("one-owner"), 5)
            with self.assertRaises(ContractViolation):
                store.append("one-owner", str(uuid.uuid4()), "same-request", 999, valid)
            self.assertEqual(store.total("one-owner"), 5)
            self.assertTrue(store.append("other-owner", str(uuid.uuid4()), "same-request", 2, valid))
            self.assertEqual(store.total("other-owner"), 2)

    def test_adapter_contract_rejects_undeclared_data(self):
        d = datetime(2026, 11, 13, tzinfo=timezone.utc)
        uid = str(uuid.uuid4())
        payload = {"n":0,"as_of":"2026-11-13","at":iso_utc(d),"id":uid,
                   "owner":"ONE","sample":{"state":"measured","value":0,"reason":None}}
        contract = {"n":"integer","as_of":"iso_date","at":"utc_instant","id":"uuid",
                    "owner":"text","sample":"measured_or_missing"}
        self.assertEqual(sanitize_json(payload, contract), payload)
        with self.assertRaises(ContractViolation):
            sanitize_json({**payload, "unknown": 1}, contract)
        with self.assertRaises(ContractViolation):
            sanitize_json(payload, {**contract, "owner":"unsupported"})
        with self.assertRaises(ContractViolation):
            sanitize_json({**payload, "sample":{"state":"missing","value":0,"reason":"bad"}}, contract)

    def test_anchors_are_verbatim_not_false_arithmetic(self):
        self.assertEqual(AUTHOR_ANCHORS, ("1+1=2", "1-2+0"))
        self.assertEqual(ROOT_IDS, tuple(range(1, 14)))
        self.assertEqual(1 + 1, 2)
        self.assertEqual(1 - 2 + 0, -1)


    def test_root13_worker_roster_and_universal_targets(self):
        registry = json.loads((Path(__file__).resolve().parent / "root13-workers.json").read_text(encoding="utf-8"))
        self.assertEqual(registry["root_count"], 13)
        self.assertEqual(len(registry["minds"]), 13)
        self.assertEqual([m["root_number"] for m in registry["minds"]], list(range(1, 14)))
        self.assertEqual(len({m["id"] for m in registry["minds"]}), 13)
        self.assertEqual(len(registry["adoption_targets"]), 12)
        self.assertEqual(registry["anchors_verbatim"], ["1+1=2", "1-2+0"])
        self.assertTrue(all(m["external_action"] == "none" for m in registry["minds"]))
        self.assertTrue(all(x["compliance_status"] == "UNVERIFIED_EXISTING_MODULES"
                            for x in registry["adoption_targets"]))


if __name__ == "__main__":
    unittest.main()
