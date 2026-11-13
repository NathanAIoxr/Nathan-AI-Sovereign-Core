#!/usr/bin/env python3
"""NATHAN AI / ONE: 13-root universal *opt-in* correctness primitives.

FENCEPOST ERROR SYNDROME — by Nathan Tabor.
Original anchor labels: "1+1=2" and "1-2+0" (the latter evaluates to -1;
it is preserved as an authored framework label, not asserted equal to zero).

Standard library only. No network, remote control, secret handling, automatic
source modifications, or private master-database connection is performed.
A client must explicitly call these primitives at its data boundaries.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from fractions import Fraction
import json
import re
import sqlite3
import time
import uuid
from zoneinfo import ZoneInfo


class ContractViolation(ValueError):
    """Fail closed on contradictory or ambiguous data-boundary semantics."""


def exact_int(value: object, name: str) -> int:
    if type(value) is not int:
        raise ContractViolation(f"{name}: integer required; no floats or bools")
    return value


def require_text(value: object, name: str) -> str:
    if not isinstance(value, str) or not value or value.strip() != value:
        raise ContractViolation(f"{name}: nonblank trimmed text required")
    return value


# Root 1: half-open ranges, explicit conversion from inclusive input.
@dataclass(frozen=True)
class HalfOpen:
    start: int
    stop: int

    def __post_init__(self):
        exact_int(self.start, "start")
        exact_int(self.stop, "stop")
        if self.stop < self.start:
            raise ContractViolation("stop < start")

    @property
    def length(self) -> int:
        return self.stop - self.start

    def contains(self, index: int) -> bool:
        return self.start <= exact_int(index, "index") < self.stop

    @classmethod
    def inclusive(cls, first: int, last: int) -> "HalfOpen":
        exact_int(first, "first")
        exact_int(last, "last")
        if last < first:
            raise ContractViolation("last < first for inclusive range")
        return cls(first, last + 1)


# Root 2: index origins converted explicitly; do not rewrite historical years.
def one_to_zero(ordinal: int) -> int:
    exact_int(ordinal, "one-based ordinal")
    if ordinal < 1:
        raise ContractViolation("one-based ordinal must be >= 1")
    return ordinal - 1


def zero_to_one(offset: int) -> int:
    exact_int(offset, "zero-based offset")
    if offset < 0:
        raise ContractViolation("zero-based offset must be >= 0")
    return offset + 1


# Root 3: new entity IDs must be canonical, unique UUIDs; retain historical IDs.
def canonical_uuid(value: str) -> str:
    require_text(value, "entity ID")
    try:
        parsed = uuid.UUID(value)
    except (ValueError, AttributeError) as exc:
        raise ContractViolation("entity ID must be a canonical UUID") from exc
    if str(parsed) != value:
        raise ContractViolation("UUID must be canonical lowercase hyphenated form")
    return value


def validate_distinct_ids(values: list[str]) -> int:
    if not isinstance(values, list):
        raise ContractViolation("ID collection must be a list")
    canonical = [canonical_uuid(x) for x in values]
    if len(set(canonical)) != len(canonical):
        raise ContractViolation("duplicate record ID; do not silently deduplicate")
    return len(canonical)


# Root 4: ratios derive from raw numerators and denominators.
@dataclass(frozen=True)
class Rate:
    numerator: int
    denominator: int

    def __post_init__(self):
        exact_int(self.numerator, "numerator")
        exact_int(self.denominator, "denominator")
        if self.denominator < 0 or self.numerator < 0:
            raise ContractViolation("raw counts cannot be negative")

    def value(self) -> Fraction:
        if self.denominator == 0:
            raise ContractViolation("rate is undefined with zero denominator")
        return Fraction(self.numerator, self.denominator)


def pooled_rate(rows: list[Rate]) -> Fraction:
    if not rows or not all(isinstance(x, Rate) for x in rows):
        raise ContractViolation("one or more raw Rate records required")
    return Rate(sum(x.numerator for x in rows),
                sum(x.denominator for x in rows)).value()


# Root 5: exact money in explicitly declared integer subunits, never binary float.
@dataclass(frozen=True)
class Money:
    amount_minor: int
    currency: str
    decimal_places: int

    def __post_init__(self):
        exact_int(self.amount_minor, "minor units")
        require_text(self.currency, "currency")
        if not re.fullmatch(r"[A-Z]{3}", self.currency):
            raise ContractViolation("currency must be a three-letter uppercase code")
        exact_int(self.decimal_places, "decimal places")
        if self.decimal_places not in (0, 2, 3):
            raise ContractViolation("declare a supported currency precision (0/2/3)")

    @classmethod
    def from_decimal_text(cls, amount: str, currency: str, decimal_places: int) -> "Money":
        if not isinstance(amount, str) or not re.fullmatch(r"-?\d+(?:\.\d+)?", amount):
            raise ContractViolation("exact monetary input must be a decimal string")
        try:
            scaled = Decimal(amount) * (10 ** exact_int(decimal_places, "decimal places"))
        except InvalidOperation as exc:
            raise ContractViolation("invalid decimal amount") from exc
        if scaled != scaled.to_integral_value():
            raise ContractViolation("fractional minor unit; explicit rounding policy required")
        return cls(int(scaled), currency, decimal_places)

    def __add__(self, other: "Money") -> "Money":
        if not isinstance(other, Money) or (other.currency, other.decimal_places) != (
            self.currency, self.decimal_places
        ):
            raise ContractViolation("currency and subunit precision must match")
        return Money(self.amount_minor + other.amount_minor, self.currency, self.decimal_places)


# Root 6: typed physical units, exact rational conversions.
_FACTORS = {
    "m": ("length", Fraction(1)), "cm": ("length", Fraction(1, 100)),
    "ft": ("length", Fraction(381, 1250)),
    "s": ("duration", Fraction(1)), "ms": ("duration", Fraction(1, 1000)),
    "kg": ("mass", Fraction(1)), "g": ("mass", Fraction(1, 1000))
}


def as_fraction(value: object) -> Fraction:
    if isinstance(value, bool) or isinstance(value, float):
        raise ContractViolation("binary floating point is disallowed for exact quantities")
    if isinstance(value, Fraction):
        return value
    if type(value) is int:
        return Fraction(value)
    if isinstance(value, Decimal) and value.is_finite():
        return Fraction(value)
    if isinstance(value, str) and re.fullmatch(r"-?\d+(?:\.\d+)?", value):
        return Fraction(Decimal(value))
    raise ContractViolation("expected exact integer, decimal string, Decimal or Fraction")


@dataclass(frozen=True)
class Quantity:
    amount: Fraction
    unit: str

    def __post_init__(self):
        if self.unit not in _FACTORS:
            raise ContractViolation(f"unknown or undeclared unit: {self.unit!r}")
        object.__setattr__(self, "amount", as_fraction(self.amount))

    def convert(self, target: str) -> "Quantity":
        if target not in _FACTORS or _FACTORS[target][0] != _FACTORS[self.unit][0]:
            raise ContractViolation("cannot convert incompatible physical dimensions")
        return Quantity(self.amount * _FACTORS[self.unit][1] / _FACTORS[target][1], target)

    def __add__(self, other: "Quantity") -> "Quantity":
        if not isinstance(other, Quantity):
            raise ContractViolation("typed quantity required")
        return Quantity(self.amount + other.convert(self.unit).amount, self.unit)


# Root 7: percentage change uses explicit exact rational multipliers.
def scale_exact(amount: object, numerator: int, denominator: int) -> Fraction:
    exact_int(numerator, "multiplier numerator")
    exact_int(denominator, "multiplier denominator")
    if denominator == 0:
        raise ContractViolation("cannot divide by zero")
    return as_fraction(amount) * Fraction(numerator, denominator)


def inverse_scale(amount: object, numerator: int, denominator: int) -> Fraction:
    if numerator == 0:
        raise ContractViolation("zero multiplier has no inverse")
    return scale_exact(amount, denominator, numerator)


# Root 8: UTC instants for persistence, monotonic clock only for elapsed timing.
def utc_instant(value: datetime) -> datetime:
    if not isinstance(value, datetime) or value.tzinfo is None or value.utcoffset() is None:
        raise ContractViolation("timezone-aware datetime required")
    return value.astimezone(timezone.utc)


def local_to_utc(wall_time: datetime, zone: str, fold: int | None = None) -> datetime:
    """Reject nonexistent local timestamps; demand fold on ambiguous timestamps."""
    if not isinstance(wall_time, datetime) or wall_time.tzinfo is not None:
        raise ContractViolation("local wall clock must be a naive datetime")
    require_text(zone, "IANA zone")
    try:
        tz = ZoneInfo(zone)
    except (KeyError, ValueError) as exc:
        raise ContractViolation("unknown IANA timezone") from exc
    offsets = [wall_time.replace(tzinfo=tz, fold=i).utcoffset() for i in (0, 1)]
    if offsets[0] != offsets[1] and fold is None:
        raise ContractViolation("ambiguous or nonexistent time; explicit fold required")
    if fold not in (None, 0, 1) or type(fold) not in (type(None), int):
        raise ContractViolation("fold must be 0, 1, or omitted")
    selected = 0 if fold is None else fold
    instant = wall_time.replace(tzinfo=tz, fold=selected).astimezone(timezone.utc)
    if instant.astimezone(tz).replace(tzinfo=None) != wall_time:
        raise ContractViolation("nonexistent local clock time")
    return instant


def monotonic_tick_ns() -> int:
    return time.monotonic_ns()


# Root 9: strict, reversible canonical ISO serializations; avoid byte-endian conflation.
def strict_iso_date(raw: str) -> date:
    if not isinstance(raw, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw):
        raise ContractViolation("ISO date must be YYYY-MM-DD")
    try:
        d = date.fromisoformat(raw)
    except ValueError as exc:
        raise ContractViolation("invalid ISO date") from exc
    if d.isoformat() != raw:
        raise ContractViolation("noncanonical date")
    return d


def iso_utc(value: datetime) -> str:
    return utc_instant(value).isoformat(timespec="microseconds").replace("+00:00", "Z")


def parse_iso_utc(raw: str) -> datetime:
    if not isinstance(raw, str) or not re.fullmatch(
        r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z", raw
    ):
        raise ContractViolation("UTC timestamp requires canonical YYYY-MM-DDTHH:MM:SS.ffffffZ")
    try:
        result = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ContractViolation("invalid UTC timestamp") from exc
    if iso_utc(result) != raw:
        raise ContractViolation("noncanonical UTC timestamp")
    return result


# Root 10: both valid_at (event happened) and recorded_at (recorded by system).
@dataclass(frozen=True)
class Bitemporal:
    valid_at: datetime
    recorded_at: datetime

    def __post_init__(self):
        object.__setattr__(self, "valid_at", utc_instant(self.valid_at))
        object.__setattr__(self, "recorded_at", utc_instant(self.recorded_at))


# Root 11: measured 0, unavailable and failed are distinct.
@dataclass(frozen=True)
class Observation:
    state: str   # measured, missing, failed
    value: object = None
    reason: str | None = None

    def __post_init__(self):
        if self.state == "measured":
            if self.value is None or self.reason is not None:
                raise ContractViolation("measured value must be present; reason must be absent")
            if isinstance(self.value, float):
                raise ContractViolation("binary float observation not accepted at exact boundary")
        elif self.state in ("missing", "failed"):
            if self.value is not None or not self.reason:
                raise ContractViolation("missing/failed observation needs reason, never a fake zero")
        else:
            raise ContractViolation("state must be measured, missing, or failed")


# Roots 12+13: append-only, bitemporal, atomic and idempotent event store.
# Attach this to the owner's ONE Federation SQLite connection, never create a new master.
EVENT_SCHEMA = """
CREATE TABLE IF NOT EXISTS one_root13_events(
  source_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  delta INTEGER NOT NULL,
  valid_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  PRIMARY KEY(source_id,event_id),
  UNIQUE(source_id,idempotency_key)
);
CREATE TRIGGER IF NOT EXISTS one_root13_no_update
 BEFORE UPDATE ON one_root13_events BEGIN SELECT RAISE(ABORT,'append-only event'); END;
CREATE TRIGGER IF NOT EXISTS one_root13_no_delete
 BEFORE DELETE ON one_root13_events BEGIN SELECT RAISE(ABORT,'append-only event'); END;
"""


class EventStore:
    def __init__(self, connection: sqlite3.Connection):
        if not isinstance(connection, sqlite3.Connection):
            raise ContractViolation("existing sqlite3 connection required")
        self.db = connection

    def initialize(self) -> None:
        self.db.executescript(EVENT_SCHEMA)
        self.db.commit()

    def append(self, source_id: str, event_id: str, idempotency_key: str,
               delta: int, valid_at: datetime) -> bool:
        """True if appended, False on an *identical* retry; otherwise fail closed.

        BEGIN IMMEDIATE serializes competing SQLite writers. Do not call inside
        an existing transaction; integrate via explicit transaction boundary.
        """
        source_id = require_text(source_id, "canonical source")
        event_id = canonical_uuid(event_id)
        idempotency_key = require_text(idempotency_key, "idempotency key")
        delta = exact_int(delta, "delta")
        valid_iso = iso_utc(valid_at)
        recorded_iso = iso_utc(datetime.now(timezone.utc))
        try:
            self.db.execute("BEGIN IMMEDIATE")
            old = self.db.execute(
                "SELECT event_id,delta,valid_at FROM one_root13_events "
                "WHERE source_id=? AND idempotency_key=?",
                (source_id, idempotency_key)
            ).fetchone()
            if old is not None:
                if old != (event_id, delta, valid_iso):
                    raise ContractViolation("idempotency key reused with changed payload")
                self.db.commit()
                return False
            self.db.execute(
                "INSERT INTO one_root13_events VALUES(?,?,?,?,?,?)",
                (source_id, event_id, idempotency_key, delta, valid_iso, recorded_iso)
            )
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            raise

    def total(self, source_id: str) -> int:
        return self.db.execute(
            "SELECT COALESCE(SUM(delta),0) FROM one_root13_events WHERE source_id=?",
            (require_text(source_id, "canonical source"),)
        ).fetchone()[0]

    def records(self, source_id: str) -> list[dict]:
        rows = self.db.execute(
            "SELECT event_id,idempotency_key,delta,valid_at,recorded_at "
            "FROM one_root13_events WHERE source_id=? ORDER BY recorded_at,event_id",
            (require_text(source_id, "canonical source"),)
        ).fetchall()
        return [dict(zip(("event_id","idempotency_key","delta","valid_at","recorded_at"), r))
                for r in rows]


# Fail-closed, schema-declared JSON input adaptor to reuse in apps, games and bots.
# Unknown fields are rejected to prevent accidental bypass.
def sanitize_json(payload: dict, contract: dict[str, str]) -> dict:
    if not isinstance(payload, dict) or not isinstance(contract, dict):
        raise ContractViolation("payload and contract must be objects")
    if set(payload) != set(contract):
        raise ContractViolation(f"missing/unknown fields: {sorted(set(payload) ^ set(contract))}")
    results = {}
    for field, type_name in contract.items():
        value = payload[field]
        if type_name == "integer":
            results[field] = exact_int(value, field)
        elif type_name == "iso_date":
            results[field] = strict_iso_date(value).isoformat()
        elif type_name == "utc_instant":
            results[field] = iso_utc(parse_iso_utc(value))
        elif type_name == "uuid":
            results[field] = canonical_uuid(value)
        elif type_name == "text":
            results[field] = require_text(value, field)
        elif type_name == "measured_or_missing":
            if not isinstance(value, dict) or set(value) != {"state", "value", "reason"}:
                raise ContractViolation("observation requires state, value and reason")
            record = Observation(**value)
            results[field] = {"state":record.state,"value":record.value,"reason":record.reason}
        else:
            raise ContractViolation(f"undeclared field contract: {type_name}")
    return results


ROOT_IDS = tuple(range(1, 14))
AUTHOR_ANCHORS = ("1+1=2", "1-2+0")
