import concurrent.futures
from dataclasses import FrozenInstanceError
from fractions import Fraction
from datetime import date, timedelta
from http.server import HTTPServer
import json
import os
from pathlib import Path
import sqlite3
import tempfile
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

os.environ.setdefault("HYPOTHESIS_STORAGE_DIRECTORY", str(Path(__file__).resolve().parents[6] / "work/hypothesis"))
from hypothesis import given, settings, strategies as st

from core_primitives import ContractViolation, HalfOpen, Money
from production_boundaries import (BookingService, CounterBox, History, Lamport, Recovery, State,
    ONE_BOX, ZERO_BOX, OptimisticFlow, VectorClock, round_half_even,
    arithmetic_health, byte_view, chunks, display_range, graphemes, i64,
    inclusive_dates, range_payload, slice_text, split_money, transition)
from boundary_api import decode_json, handler_for, safe_wire
from boundary_gate import violations

settings.register_profile("boundaries", max_examples=250, derandomize=True, deadline=None, database=None)
settings.load_profile("boundaries")


class Properties(unittest.TestCase):
    @given(st.integers(0, 10_000), st.integers(0, 10_000), st.integers(1, 100))
    def test_chunk_partition_and_split(self, start, length, size):
        span = HalfOpen(start, start + length)
        pieces = tuple(chunks(span, size))
        self.assertEqual(sum(piece.length for piece in pieces), length)
        self.assertEqual([i for piece in pieces for i in piece.indices()], list(span.indices()))
        for left, right in zip(pieces, pieces[1:]):
            self.assertEqual(left.stop, right.start)
            self.assertFalse(left.overlaps(right))
        left, right = span.split(start + length // 2)
        self.assertEqual(left.length + right.length, length)

    @given(st.integers(-10**15, 10**15), st.integers(1, 200))
    def test_money_conservation(self, total, buckets):
        parts = split_money(Money(total, "USD", 2), buckets)
        self.assertEqual(sum(part.amount_minor for part in parts), total)
        self.assertLessEqual(max(p.amount_minor for p in parts) - min(p.amount_minor for p in parts), 1)

    @given(st.integers(-100, 100), st.integers(-100, 100), st.integers(0, 100))
    def test_empty_never_overlaps(self, point, start, length):
        empty, span = HalfOpen(point, point), HalfOpen(start, start + length)
        self.assertFalse(empty.overlaps(span))
        self.assertFalse(span.overlaps(empty))

    @given(st.text(alphabet=st.characters(blacklist_categories=("Cs",)), max_size=100))
    def test_unicode_roundtrip(self, text):
        clusters = graphemes(text)
        self.assertEqual(slice_text(text, HalfOpen(0, len(clusters))), "".join(clusters))
        self.assertEqual(slice_text(text, HalfOpen(0, 0)), "")

    @given(st.lists(st.integers(-100, 100), max_size=50))
    def test_history_replay(self, deltas):
        history = History()
        for delta in deltas:
            history = history.append(delta)
        self.assertEqual(history.value, sum(deltas))
        if deltas:
            self.assertEqual(history.move(-1).move(1), history)
            self.assertEqual(history.move(-1).append(99).events[-1], 99)


class Contracts(unittest.TestCase):
    def test_sovereign_boxes_preserve_state(self):
        self.assertNotEqual(ZERO_BOX, ONE_BOX)
        with self.assertRaises(FrozenInstanceError): ZERO_BOX.value = 1
        box = CounterBox(1, 1)
        with self.assertRaises(ContractViolation): box.step(1)
        self.assertEqual(box.value, 1)
        self.assertEqual(box.step(-1).value, 0)

    def test_optimistic_ack_and_rollback(self):
        flow = OptimisticFlow().begin(State.SHIPPING, "command-a")
        self.assertEqual(flow.visible, State.SHIPPING)
        self.assertEqual(flow.resolve("command-a", False).visible, State.CART)
        self.assertEqual(flow.resolve("command-a", True).visible, State.SHIPPING)
        with self.assertRaises(ContractViolation): flow.resolve("stale", False)
        with self.assertRaises(ContractViolation): flow.begin(State.PAYMENT, "another")

    def test_vector_concurrency_and_rounding(self):
        left, right = VectorClock().tick("a"), VectorClock().tick("b")
        self.assertFalse(left.precedes(right))
        self.assertFalse(right.precedes(left))
        merged = left.merge(right).tick("a")
        self.assertTrue(left.precedes(merged))
        self.assertTrue(right.precedes(merged))
        for numerator, expected in ((5, 2), (7, 4), (-5, -2), (-7, -4)):
            self.assertEqual(round_half_even(Fraction(numerator, 2)), expected)

    def test_lint_rejects_reintroduced_boundary_antipatterns(self):
        self.assertTrue(violations('for i in range(len(items)): pass'))
        self.assertTrue(violations('if i <= len(items): pass'))
        self.assertFalse(violations('for item in items: process(item)'))

    def test_arithmetic_and_boundary_adapters(self):
        self.assertTrue(all(arithmetic_health().values()))
        self.assertEqual(range_payload({"start": 0, "end": 0}, 0).length, 0)
        self.assertEqual(display_range(HalfOpen(0, 0), 0), "Showing 0 items")
        self.assertEqual(display_range(HalfOpen(0, 5), 5), "Showing 1–5")
        self.assertEqual(inclusive_dates("2026-05-01", "2026-05-03"), ("2026-05-01", "2026-05-04"))
        for payload in ({"start": True, "end": 1}, {"start": -1, "end": 1},
                        {"start": 0, "end": 2}, {"start": 0, "end": 1, "extra": 0}):
            with self.assertRaises(ContractViolation):
                range_payload(payload, 1)
        with self.assertRaises(ContractViolation):
            inclusive_dates("9999-12-31", "9999-12-31")

    def test_money_long_exact_input_and_overflow(self):
        raw = "123456789012345678901234567890.12"
        self.assertEqual(Money.from_decimal_text(raw, "USD", 2).amount_minor, 12345678901234567890123456789012)
        with self.assertRaises(ContractViolation):
            i64(2**63)
        with self.assertRaises(ContractViolation):
            split_money(Money(1, "USD", 2), 0)
        with self.assertRaises(ContractViolation):
            Money.from_decimal_text("1", "USD", -1)

    def test_graphemes_and_zero_copy(self):
        text = "e\u0301👩🏽‍💻🇺🇸"
        self.assertEqual(len(graphemes(text)), 3)
        self.assertEqual(slice_text(text, HalfOpen(1, 2)), "👩🏽‍💻")
        with self.assertRaises(ContractViolation):
            graphemes("\ud800")
        data = b"abcdef"
        view = byte_view(data, HalfOpen(1, 3))
        self.assertIs(view.obj, data)
        self.assertTrue(view.readonly)
        self.assertEqual(bytes(view), b"bc")

    def test_all_state_edges(self):
        allowed = {(State.CART, State.SHIPPING), (State.SHIPPING, State.PAYMENT), (State.PAYMENT, State.COMPLETE)}
        for source in State:
            for target in State:
                if (source, target) in allowed:
                    self.assertEqual(transition(source, target), target)
                else:
                    with self.assertRaises(ContractViolation):
                        transition(source, target)

    def test_recovery_cooldown_halt_and_verification(self):
        now = [0]
        recovery = Recovery(attempts=2, cooldown_ns=10, clock=lambda: now[0])
        calls = []
        def repair(): calls.append(True)
        self.assertFalse(recovery.run(repair, lambda: False))
        self.assertFalse(recovery.run(repair, lambda: True))
        self.assertEqual(len(calls), 1)
        now[0] = 10
        self.assertFalse(recovery.run(repair, lambda: False))
        self.assertEqual(recovery.state, "halted")
        now[0] = 20
        self.assertFalse(recovery.run(repair, lambda: True))
        self.assertEqual(len(calls), 2)
        self.assertEqual(recovery.records[-1].state, "halted")
        self.assertEqual(recovery.records[-1].reason, "verification_failed")
        healthy = Recovery(cooldown_ns=0)
        self.assertTrue(healthy.run(lambda: None, lambda: True))
        self.assertEqual(healthy.telemetry.counts["recovery_ok"], 1)
        self.assertFalse(healthy.run(lambda: None, lambda: 1))
        def broken(): raise RuntimeError("payload must not be logged")
        self.assertFalse(healthy.run(broken, lambda: True))
        self.assertEqual(healthy.records[-1].reason, "repair_or_verification_exception")

    def test_lamport_and_json(self):
        self.assertEqual(Lamport(2).tick(10).value, 11)
        for raw in ('{"x":1,"x":2}', '{"x":NaN}', '{"x":9007199254740992}'):
            with self.assertRaises(ContractViolation):
                decode_json(raw)
        self.assertFalse(safe_wire({"token": 2**53}))


class Storage(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.service = BookingService(self.db)
        self.service.initialize()
        self.token = self.service.acquire("room")

    def tearDown(self): self.db.close()

    def book(self, key="a", start="2026-05-01", end="2026-05-03", token=None):
        return self.service.book("room", key, {"start": start, "end": end}, self.token if token is None else token)

    def test_adjacency_retry_conflict_and_stale_writer(self):
        first = self.book()
        self.assertEqual(self.book(), first)
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM sb_events").fetchone()[0], 1)
        with self.assertRaises(ContractViolation): self.book(end="2026-05-04")
        with self.assertRaises(ContractViolation): self.book(key="overlap", start="2026-05-02")
        self.book(key="adjacent", start="2026-05-03", end="2026-05-04")
        token = self.service.acquire("room")
        with self.assertRaises(ContractViolation): self.book(key="stale", start="2026-05-04", end="2026-05-05")
        self.book(key="current", start="2026-05-04", end="2026-05-05", token=token)
        self.assertTrue(self.service.health()["healthy"])

    def test_direct_sql_guard_and_rollback(self):
        self.book()
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO sb_bookings(resource,start,stop,token) VALUES('room','2026-05-02','2026-05-04',?)", (self.token,))
        self.db.rollback()
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO sb_bookings(resource,start,stop,token) VALUES('room','2026-02-30','2026-03-04',?)", (self.token,))
        self.db.rollback()
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("UPDATE sb_fences SET token=0 WHERE resource='room'")
        self.db.rollback()
        self.db.execute("CREATE TRIGGER simulate_event_failure BEFORE INSERT ON sb_events BEGIN SELECT RAISE(ABORT,'disk simulation'); END")
        with self.assertRaises(ContractViolation): self.book(key="rollback", start="2026-05-03", end="2026-05-04")
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM sb_bookings").fetchone()[0], 1)
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM sb_requests").fetchone()[0], 1)
        for sql in ("DELETE FROM sb_events", "UPDATE sb_bookings SET stop='2026-05-09'"):
            with self.assertRaises(sqlite3.IntegrityError): self.db.execute(sql)
            self.db.rollback()

    def test_cursor_snapshot_and_empty(self):
        self.assertEqual(self.service.page("room")["items"], [])
        for offset in range(5):
            start = date(2026, 6, 1) + timedelta(days=offset)
            self.book(str(offset), start.isoformat(), (start + timedelta(days=1)).isoformat())
        page = self.service.page("room", size=2)
        ids = [row["id"] for row in page["items"]]
        self.book("later", "2026-07-01", "2026-07-02")
        while page["next"] is not None:
            page = self.service.page("room", after=page["next"], size=2, until=page["until"])
            ids.extend(row["id"] for row in page["items"])
        self.assertEqual(len(ids), 5)
        self.assertEqual(len(set(ids)), 5)

    def test_automatic_projection_healing_and_cooldown(self):
        self.book()
        self.db.execute("UPDATE sb_projection SET value=99 WHERE id=1")
        self.db.commit()
        self.assertTrue(self.service.health()["healthy"])
        self.assertEqual(self.db.execute("SELECT value FROM sb_projection").fetchone()[0], 1)
        self.assertEqual(self.service.recovery.records[-1].reason, "verified")
        self.db.execute("UPDATE sb_projection SET value=99 WHERE id=1")
        self.db.commit()
        self.assertFalse(self.service.health()["healthy"])
        self.assertEqual(len(self.service.recovery.records), 1)

    def test_authoritative_disagreement_is_not_auto_erased(self):
        self.db.execute("INSERT INTO sb_bookings(resource,start,stop,token) VALUES('room','2026-05-01','2026-05-03',?)", (self.token,))
        self.db.commit()
        self.assertFalse(self.service.health()["healthy"])
        self.assertEqual(self.service.recovery.records, ())
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM sb_bookings").fetchone()[0], 1)

    def test_concurrent_overlapping_requests(self):
        with tempfile.TemporaryDirectory() as temp:
            path = str(Path(temp) / "demo.sqlite3")
            with sqlite3.connect(path) as db:
                service = BookingService(db)
                service.initialize()
                token = service.acquire("room")
            barrier = threading.Barrier(2)
            def worker(key):
                with sqlite3.connect(path) as db:
                    service = BookingService(db)
                    barrier.wait(timeout=5)
                    try:
                        service.book("room", key, {"start": "2026-05-01", "end": "2026-05-03"}, token)
                        return True
                    except ContractViolation:
                        return False
            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
                results = list(pool.map(worker, ("a", "b")))
            self.assertEqual(sorted(results), [False, True])

    def test_concurrent_identical_retries_have_one_effect(self):
        with tempfile.TemporaryDirectory() as temp:
            path = str(Path(temp) / "demo.sqlite3")
            with sqlite3.connect(path) as db:
                service = BookingService(db)
                service.initialize()
                token = service.acquire("room")
            barrier = threading.Barrier(2)
            def worker(_):
                with sqlite3.connect(path) as db:
                    service = BookingService(db)
                    barrier.wait(timeout=5)
                    return service.book("room", "same-key", {"start": "2026-05-01", "end": "2026-05-03"}, token)
            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
                results = list(pool.map(worker, (0, 1)))
            self.assertEqual(results[0], results[1])
            with sqlite3.connect(path) as db:
                self.assertEqual(db.execute("SELECT COUNT(*) FROM sb_events").fetchone()[0], 1)


class HTTPIntegration(unittest.TestCase):
    def test_api_contract_and_atomic_retry(self):
        ready = threading.Event()
        holder = {}
        def serve():
            with sqlite3.connect(":memory:") as db:
                service = BookingService(db)
                service.initialize()
                server = HTTPServer(("127.0.0.1", 0), handler_for(service))
                holder["server"] = server
                ready.set()
                with server: server.serve_forever(poll_interval=0.01)
        thread = threading.Thread(target=serve)
        thread.start()
        self.assertTrue(ready.wait(5))
        base = f"http://127.0.0.1:{holder['server'].server_port}"
        def request(path, body=None):
            data = None if body is None else json.dumps(body).encode()
            req = Request(base + path, data=data, headers={"Content-Type": "application/json"})
            with urlopen(req, timeout=5) as response: return json.load(response)
        try:
            token = request("/fences", {"resource": "room"})["token"]
            body = {"resource": "room", "key": "a", "range": {"start": "2026-05-01", "end": "2026-05-03"}, "token": token}
            self.assertEqual(request("/bookings", body), request("/bookings", body))
            self.assertTrue(request("/health")["healthy"])
            self.assertEqual(len(request("/bookings?resource=room")["items"]), 1)
            body["range"]["end"] = body["range"]["start"]
            with self.assertRaises(HTTPError) as error: request("/bookings", body)
            self.assertEqual(error.exception.code, 400)
            error.exception.close()
            with urlopen(base + "/", timeout=5) as response:
                self.assertIn(b"Sovereign Boundary Lab", response.read())
                self.assertIn("frame-ancestors 'none'", response.headers["Content-Security-Policy"])
            req = Request(base + "/health", headers={"Origin": "https://untrusted.example"})
            with self.assertRaises(HTTPError) as error: urlopen(req, timeout=5)
            self.assertEqual(error.exception.code, 403)
            error.exception.close()
        finally:
            holder["server"].shutdown()
            thread.join(timeout=5)
            self.assertFalse(thread.is_alive())


if __name__ == "__main__": unittest.main()
