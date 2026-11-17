"""Sovereign boxes: validated boundaries and transactional local application.

Current arithmetic anchors: 1+1=2 and 1-1=0. Historical labels are untouched.
No private database is opened implicitly. SQLite operations are local examples.
"""
from __future__ import annotations

from collections import Counter, deque
from dataclasses import dataclass
from datetime import timedelta
from enum import Enum
from fractions import Fraction
import json
import sqlite3
import time
import unicodedata

import regex

from core_primitives import (ContractViolation, HalfOpen, Money, exact_int,
                             require_text, strict_iso_date)

ZERO, ONE = 0, 1
MAX_I64 = (1 << 63) - 1
MAX_BATCH = 10_000


@dataclass(frozen=True)
class BitBox:
    value: int

    def __post_init__(self):
        if exact_int(self.value, "bit") not in (ZERO, ONE):
            raise ContractViolation("bit must be zero or one")


ZERO_BOX, ONE_BOX = BitBox(ZERO), BitBox(ONE)


@dataclass(frozen=True)
class CounterBox:
    """Immutable candidate construction preserves the previous valid state."""
    value: int
    limit: int

    def __post_init__(self):
        if not ZERO <= exact_int(self.value, "value") <= exact_int(self.limit, "limit"):
            raise ContractViolation("counter outside its box")

    def step(self, delta):
        return CounterBox(self.value + exact_int(delta, "delta"), self.limit)


def arithmetic_health():
    if ONE + ONE != 2 or ONE - ONE != ZERO or ZERO == ONE:
        raise ContractViolation("arithmetic anchor failed")
    return {"1+1=2": True, "1-1=0": True, "zero_distinct_from_one": True}


def i64(value):
    if not -(1 << 63) <= exact_int(value, "int64") <= MAX_I64:
        raise ContractViolation("int64 overflow")
    return value


def fields(payload, names):
    if type(payload) is not dict or set(payload) != set(names):
        raise ContractViolation("missing or unknown fields")
    return payload


def range_payload(payload, length):
    fields(payload, ("start", "end"))
    return HalfOpen(payload["start"], payload["end"]).bounded(length)


def display_range(span: HalfOpen, length: int):
    span.bounded(length)
    return "Showing 0 items" if span.length == 0 else f"Showing {span.start + ONE}–{span.stop}"


def inclusive_dates(first, last):
    """Calendar dates, not elapsed seconds or checkout timestamps."""
    start, end = strict_iso_date(first), strict_iso_date(last)
    if end < start:
        raise ContractViolation("inverted dates")
    try:
        exclusive = end + timedelta(days=ONE)
    except OverflowError as exc:
        raise ContractViolation("date successor overflows") from exc
    return start.isoformat(), exclusive.isoformat()


def chunks(span: HalfOpen, size: int):
    if not 0 < exact_int(size, "chunk size") <= MAX_BATCH:
        raise ContractViolation("chunk size outside limit")
    for start in range(span.start, span.stop, size):
        yield HalfOpen(start, min(start + size, span.stop))


def split_money(money: Money, count: int):
    if not 0 < exact_int(count, "buckets") <= MAX_BATCH:
        raise ContractViolation("bucket count outside limit")
    i64(money.amount_minor)
    quotient, remainder = divmod(abs(money.amount_minor), count)
    sign = -ONE if money.amount_minor < ZERO else ONE
    return tuple(Money(sign * (quotient + (position < remainder)), money.currency,
                       money.decimal_places) for position in range(count))


def round_half_even(value: Fraction):
    if not isinstance(value, Fraction):
        raise ContractViolation("exact Fraction required")
    quotient, remainder = divmod(value.numerator, value.denominator)
    doubled = remainder * 2
    return quotient + int(doubled > value.denominator or
                          (doubled == value.denominator and quotient % 2 != 0))


def graphemes(text):
    if not isinstance(text, str):
        raise ContractViolation("text required")
    # Reject unpaired surrogates before UTF-8 serialization.
    try:
        text.encode("utf-8", errors="strict")
    except UnicodeError as exc:
        raise ContractViolation("invalid Unicode scalar text") from exc
    return tuple(regex.findall(r"\X", unicodedata.normalize("NFC", text)))


def slice_text(text, span):
    clusters = graphemes(text)
    span.bounded(len(clusters))
    return "".join(clusters[span.start:span.stop])


def byte_view(data: bytes, span: HalfOpen):
    if type(data) is not bytes:
        raise ContractViolation("immutable bytes required")
    span.bounded(len(data))
    return memoryview(data)[span.start:span.stop]


class State(str, Enum):
    CART = "cart"
    SHIPPING = "shipping"
    PAYMENT = "payment"
    COMPLETE = "complete"


_TRANSITIONS = {State.CART: State.SHIPPING, State.SHIPPING: State.PAYMENT,
                State.PAYMENT: State.COMPLETE}


def transition(state: State, target: State):
    if not isinstance(state, State) or not isinstance(target, State):
        raise ContractViolation("typed states required")
    if _TRANSITIONS.get(state) != target:
        raise ContractViolation("undeclared state transition")
    return target


@dataclass(frozen=True)
class History:
    """Pure local replay/undo. Does not reverse external side effects."""
    events: tuple[int, ...] = ()
    position: int = 0

    def __post_init__(self):
        if type(self.events) is not tuple or not 0 <= exact_int(self.position, "position") <= len(self.events):
            raise ContractViolation("invalid history")
        for delta in self.events:
            exact_int(delta, "delta")

    @property
    def value(self):
        return sum(self.events[:self.position])

    def append(self, delta):
        return History(self.events[:self.position] + (exact_int(delta, "delta"),), self.position + ONE)

    def move(self, delta):
        return History(self.events, self.position + exact_int(delta, "movement"))


@dataclass(frozen=True)
class Lamport:
    value: int = 0

    def __post_init__(self):
        if i64(self.value) < ZERO:
            raise ContractViolation("negative logical clock")

    def tick(self, received=0):
        if i64(received) < ZERO:
            raise ContractViolation("negative remote clock")
        return Lamport(i64(max(self.value, received) + ONE))


@dataclass(frozen=True)
class VectorClock:
    entries: tuple[tuple[str, int], ...] = ()

    def __post_init__(self):
        if type(self.entries) is not tuple:
            raise ContractViolation("immutable entries required")
        seen = set()
        for node, value in self.entries:
            require_text(node, "node")
            if node in seen or i64(value) < ZERO:
                raise ContractViolation("invalid vector clock")
            seen.add(node)

    def tick(self, node):
        node = require_text(node, "node")
        values = dict(self.entries)
        values[node] = i64(values.get(node, ZERO) + ONE)
        return VectorClock(tuple(sorted(values.items())))

    def merge(self, other):
        left, right = dict(self.entries), dict(other.entries)
        return VectorClock(tuple(sorted((node, max(left.get(node, ZERO), right.get(node, ZERO)))
                                        for node in left.keys() | right.keys())))

    def precedes(self, other):
        left, right = dict(self.entries), dict(other.entries)
        nodes = left.keys() | right.keys()
        return (all(left.get(n, ZERO) <= right.get(n, ZERO) for n in nodes)
                and any(left.get(n, ZERO) < right.get(n, ZERO) for n in nodes))


@dataclass(frozen=True)
class OptimisticFlow:
    """One pending command; stale replies cannot roll back newer state."""
    committed: State = State.CART
    pending: State | None = None
    key: str | None = None

    def __post_init__(self):
        if not isinstance(self.committed, State):
            raise ContractViolation("typed committed state required")
        if self.pending is None:
            if self.key is not None:
                raise ContractViolation("key without pending state")
        else:
            transition(self.committed, self.pending)
            require_text(self.key, "pending key")

    @property
    def visible(self):
        return self.pending if self.pending is not None else self.committed

    def begin(self, target, key):
        if self.pending is not None:
            raise ContractViolation("resolve current command first")
        return OptimisticFlow(self.committed, target, key)

    def resolve(self, key, accepted):
        if self.key is None or key != self.key or type(accepted) is not bool:
            raise ContractViolation("stale or invalid acknowledgement")
        return OptimisticFlow(self.pending if accepted else self.committed)


class Telemetry:
    """Bounded metric names; never records user text, keys, or payloads."""
    NAMES = frozenset({"empty", "rejected", "replayed", "committed", "recovery_ok", "recovery_failed", "health_failed"})

    def __init__(self):
        self.counts = Counter()

    def record(self, name):
        if name not in self.NAMES:
            raise ContractViolation("unknown metric")
        self.counts[name] += ONE


@dataclass(frozen=True)
class RecoveryEvent:
    tick_ns: int
    state: str
    reason: str


class Recovery:
    """Synchronous, bounded remediation of a caller-owned local component.

    Caller must supply a bounded/time-limited repair and verification function.
    No scheduler, thread cancellation, or arbitrary subprocess restart is implied.
    """
    def __init__(self, attempts=3, cooldown_ns=1_000_000_000, clock=time.monotonic_ns):
        if not 0 < exact_int(attempts, "attempts") <= 10:
            raise ContractViolation("attempt limit outside 1..10")
        if exact_int(cooldown_ns, "cooldown") < ZERO:
            raise ContractViolation("negative cooldown")
        self.limit, self.cooldown, self.clock = attempts, cooldown_ns, clock
        self.failures, self.last, self.state = ZERO, None, "healthy"
        self.telemetry = Telemetry()
        self._events = deque(maxlen=100)

    @property
    def records(self):
        return tuple(self._events)

    def run(self, repair, verify):
        now = self.clock()
        if self.state == "halted":
            return False
        if self.last is not None and now - self.last < self.cooldown:
            return False
        self.last = now
        try:
            repair()
            ok = verify() is True
            reason = "verified" if ok else "verification_failed"
        except Exception:
            ok = False
            reason = "repair_or_verification_exception"
        if ok:
            self.failures, self.state = ZERO, "healthy"
            self.telemetry.record("recovery_ok")
            self._events.append(RecoveryEvent(now, self.state, reason))
            return True
        self.failures += ONE
        self.state = "halted" if self.failures >= self.limit else "degraded"
        self.telemetry.record("recovery_failed")
        self._events.append(RecoveryEvent(now, self.state, reason))
        return False


SCHEMA = """
CREATE TABLE IF NOT EXISTS sb_fences(
 resource TEXT PRIMARY KEY, token INTEGER NOT NULL CHECK(typeof(token)='integer' AND token>0));
CREATE TRIGGER IF NOT EXISTS sb_fence_initial BEFORE INSERT ON sb_fences
 WHEN NOT EXISTS(SELECT 1 FROM sb_fences WHERE resource=NEW.resource) AND NEW.token<>1
 BEGIN SELECT RAISE(ABORT,'initial token must be one'); END;
CREATE TRIGGER IF NOT EXISTS sb_fence_increasing BEFORE UPDATE ON sb_fences
 WHEN NEW.resource<>OLD.resource OR NEW.token<>OLD.token+1
 BEGIN SELECT RAISE(ABORT,'token must advance by one'); END;
CREATE TRIGGER IF NOT EXISTS sb_fence_no_delete BEFORE DELETE ON sb_fences
 BEGIN SELECT RAISE(ABORT,'fence cannot be deleted'); END;
CREATE TABLE IF NOT EXISTS sb_bookings(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 resource TEXT NOT NULL, start TEXT NOT NULL, stop TEXT NOT NULL,
 token INTEGER NOT NULL CHECK(typeof(token)='integer' AND token>0),
 CHECK(start<stop),
 CHECK(length(start)=10 AND start GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  AND substr(start,1,4)>='0001' AND date(start,'+0 days') IS start),
 CHECK(length(stop)=10 AND stop GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  AND substr(stop,1,4)>='0001' AND date(stop,'+0 days') IS stop));
CREATE TRIGGER IF NOT EXISTS sb_booking_guard BEFORE INSERT ON sb_bookings BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM sb_fences f
  WHERE f.resource=NEW.resource AND f.token=NEW.token)
  THEN RAISE(ABORT,'stale fencing token') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM sb_bookings b WHERE b.resource=NEW.resource
  AND b.start<NEW.stop AND NEW.start<b.stop)
  THEN RAISE(ABORT,'overlapping booking') END;
END;
CREATE TRIGGER IF NOT EXISTS sb_booking_immutable BEFORE UPDATE ON sb_bookings
 BEGIN SELECT RAISE(ABORT,'immutable booking'); END;
CREATE TRIGGER IF NOT EXISTS sb_booking_no_delete BEFORE DELETE ON sb_bookings
 BEGIN SELECT RAISE(ABORT,'immutable booking'); END;
CREATE TABLE IF NOT EXISTS sb_requests(
 resource TEXT NOT NULL, key TEXT NOT NULL, payload TEXT NOT NULL, result TEXT NOT NULL,
 PRIMARY KEY(resource,key));
CREATE TRIGGER IF NOT EXISTS sb_request_immutable BEFORE UPDATE ON sb_requests
 BEGIN SELECT RAISE(ABORT,'immutable request'); END;
CREATE TRIGGER IF NOT EXISTS sb_request_no_delete BEFORE DELETE ON sb_requests
 BEGIN SELECT RAISE(ABORT,'immutable request'); END;
CREATE TABLE IF NOT EXISTS sb_events(
 id INTEGER PRIMARY KEY AUTOINCREMENT, booking_id INTEGER NOT NULL UNIQUE REFERENCES sb_bookings(id),
 delta INTEGER NOT NULL CHECK(typeof(delta)='integer' AND delta=1));
CREATE TRIGGER IF NOT EXISTS sb_event_immutable BEFORE UPDATE ON sb_events
 BEGIN SELECT RAISE(ABORT,'append-only event'); END;
CREATE TRIGGER IF NOT EXISTS sb_event_no_delete BEFORE DELETE ON sb_events
 BEGIN SELECT RAISE(ABORT,'append-only event'); END;
CREATE TABLE IF NOT EXISTS sb_projection(
 id INTEGER PRIMARY KEY CHECK(id=1),
 value INTEGER NOT NULL CHECK(typeof(value)='integer' AND value>=0));
INSERT OR IGNORE INTO sb_projection SELECT 1,COALESCE(SUM(delta),0) FROM sb_events;
"""


class BookingService:
    """One explicit connection per worker; never opens the private ONE master.

    Exclusive transaction serializes local writes. API stores normalized ISO dates.
    Cursor ID is immutable, unique, increasing. until captures an append-only high
    watermark so later inserts do not extend an in-progress traversal.
    """
    def __init__(self, connection):
        self.db = connection
        self.telemetry = Telemetry()
        self.recovery = Recovery()

    def initialize(self):
        if self.db.in_transaction:
            raise ContractViolation("initialization needs its own transaction")
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.executescript(SCHEMA)

    def acquire(self, resource):
        resource = require_text(resource, "resource")
        if self.db.in_transaction:
            raise ContractViolation("nested transaction")
        try:
            self.db.execute("BEGIN IMMEDIATE")
            old = self.db.execute("SELECT token FROM sb_fences WHERE resource=?", (resource,)).fetchone()
            token = i64(old[0] + ONE if old else ONE)
            self.db.execute("INSERT INTO sb_fences VALUES(?,?) ON CONFLICT(resource) DO UPDATE SET token=excluded.token",
                            (resource, token))
            self.db.commit()
            return token
        except Exception:
            self.db.rollback()
            raise

    def book(self, resource, key, payload, token):
        resource, key = require_text(resource, "resource"), require_text(key, "idempotency key")
        fields(payload, ("start", "end"))
        start, stop = strict_iso_date(payload["start"]), strict_iso_date(payload["end"])
        if start >= stop:
            raise ContractViolation("booking must be nonempty [start,end)")
        token = i64(token)
        canonical = json.dumps({"start": start.isoformat(), "end": stop.isoformat()}, sort_keys=True)
        if self.db.in_transaction:
            raise ContractViolation("nested transaction")
        try:
            self.db.execute("BEGIN IMMEDIATE")
            old = self.db.execute("SELECT payload,result FROM sb_requests WHERE resource=? AND key=?", (resource, key)).fetchone()
            if old:
                if old[0] != canonical:
                    raise ContractViolation("idempotency conflict")
                self.db.commit()
                self.telemetry.record("replayed")
                return json.loads(old[1])
            cursor = self.db.execute("INSERT INTO sb_bookings(resource,start,stop,token) VALUES(?,?,?,?)",
                                     (resource, start.isoformat(), stop.isoformat(), token))
            result = {"id": cursor.lastrowid, "resource": resource, "start": start.isoformat(), "end": stop.isoformat()}
            self.db.execute("INSERT INTO sb_events(booking_id,delta) VALUES(?,1)", (cursor.lastrowid,))
            self.db.execute("UPDATE sb_projection SET value=value+1 WHERE id=1")
            self.db.execute("INSERT INTO sb_requests VALUES(?,?,?,?)", (resource, key, canonical, json.dumps(result)))
            self.db.commit()
            self.telemetry.record("committed")
            return result
        except (sqlite3.IntegrityError, ContractViolation) as exc:
            self.db.rollback()
            self.telemetry.record("rejected")
            raise ContractViolation(str(exc)) from exc
        except Exception:
            self.db.rollback()
            raise

    def page(self, resource, after=0, size=20, until=None):
        resource = require_text(resource, "resource")
        if not 0 < exact_int(size, "page size") <= 100:
            raise ContractViolation("page size outside 1..100")
        if i64(after) < ZERO:
            raise ContractViolation("negative cursor")
        if until is None:
            until = self.db.execute("SELECT COALESCE(MAX(id),0) FROM sb_bookings WHERE resource=?", (resource,)).fetchone()[0]
        if i64(until) < after:
            raise ContractViolation("inverted cursor window")
        rows = self.db.execute("SELECT id,resource,start,stop FROM sb_bookings WHERE resource=? AND id>? AND id<=? ORDER BY id LIMIT ?",
                               (resource, after, until, size + ONE)).fetchall()
        more = len(rows) > size
        items = [dict(zip(("id", "resource", "start", "end"), row)) for row in rows[:size]]
        if not items:
            self.telemetry.record("empty")
        return {"items": items, "next": items[-1]["id"] if more else None, "until": until}

    def _rebuild_projection(self):
        if self.db.in_transaction:
            raise ContractViolation("recovery needs its own transaction")
        try:
            self.db.execute("BEGIN IMMEDIATE")
            count = self.db.execute("SELECT COUNT(*) FROM sb_bookings").fetchone()[0]
            events = self.db.execute("SELECT COALESCE(SUM(delta),0) FROM sb_events").fetchone()[0]
            if count != events:
                raise ContractViolation("authoritative state disagrees; stop for review")
            self.db.execute("INSERT INTO sb_projection VALUES(1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value", (events,))
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def _projection_valid(self):
        value, expected = self.db.execute("SELECT (SELECT value FROM sb_projection WHERE id=1),"
                                          "(SELECT COALESCE(SUM(delta),0) FROM sb_events)").fetchone()
        return value is not None and value == expected

    def _snapshot(self):
        return self.db.execute("SELECT (SELECT COUNT(*) FROM sb_bookings),"
                               "(SELECT COALESCE(SUM(delta),0) FROM sb_events),"
                               "(SELECT value FROM sb_projection WHERE id=1)").fetchone()

    def health(self):
        if self.db.in_transaction:
            raise ContractViolation("health needs a committed state")
        arithmetic_health()
        integrity = self.db.execute("PRAGMA quick_check").fetchone()[0] == "ok"
        count, events, projection = self._snapshot()
        authoritative = integrity and count == events
        if authoritative and projection != events:
            self.recovery.run(self._rebuild_projection, self._projection_valid)
            count, events, projection = self._snapshot()
        return {"healthy": integrity and count == events == projection, "bookings": count, "events": events}
