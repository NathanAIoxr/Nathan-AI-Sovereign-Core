# NATHAN AI 🚀 / ONE — 13 ROOT CLEAN-SLATE CONTRACT
## FENCEPOST ERROR SYNDROME — by Nathan Tabor

**Attribution:** creator-authored naming and two original system anchors, supplied November 13, 2026. This implementation extends the existing eight Fencepost Worker Bots, ONE Family 21, Families 65–75, and Technology-v108. It does not replace original words, historical IDs, or authored software.

**Exact anchor labels preserved:** **1+1=2** and **1-2+0**. The second expression evaluates to -1 in ordinary arithmetic; here it is preserved as an authored label for the asymmetry/origin/nullity group, not asserted to equal zero.

The supplied attachment includes seven initial categories, a thirteen-error list, and the later **13 clean-slate primitives**. The latter are the executable baseline.

## The 13 controls, implementation and regression coverage

| # | Root rule | Implemented enforcement | Dedicated test |
| ---: | --- | --- | --- |
| 1 | Half-open ranges | HalfOpen, explicit inclusive conversion | test_root_01_half_open_boundaries |
| 2 | Zero-based sequence positions | one_to_zero, zero_to_one | test_root_02_index_origin |
| 3 | Unique new-entity IDs | canonical_uuid, duplicate rejection | test_root_03_ids_and_duplicates |
| 4 | Raw ratios | Rate, pooled_rate (raw denominators) | test_root_04_weighted_raw_rates |
| 5 | Exact currency subunits | Money with integer amounts and declared precision | test_root_05_money_precision |
| 6 | Typed units | Quantity, exact unit conversion and mismatch rejection | test_root_06_unit_type_integrity |
| 7 | Rational multipliers | scale_exact, inverse_scale | test_root_07_exact_multiplicative_inverse |
| 8 | UTC instants and DST | utc_instant, local_to_utc, separate monotonic timer | test_root_08_utc_not_monotonic |
| 9 | Strict ISO serialization | strict_iso_date, iso_utc, parse_iso_utc | test_root_09_strict_iso_date_time |
| 10 | Bitemporal source events | Bitemporal(valid_at,recorded_at) | test_root_10_bitemporal_events |
| 11 | Value vs 0 vs null/failed | Observation with explicit state and reason | test_root_11_zero_is_not_missing |
| 12 | Immutable atomic ledger | EventStore + BEGIN IMMEDIATE + SQLite triggers | test_root_12_append_only_transactions |
| 13 | One owner + idempotent action | source_id and unique idempotency_key with conflict checks | test_root_13_single_owner_idempotency |

Also covered: undeclared JSON field rejection, 1000 deterministic randomized boundary cases, leap day, both DST transitions, the existing 19 Fencepost worker tests, and the existing 9 Technology-v108 tests.

## System-wide application rule

**PRESERVE → DECLARE → VALIDATE → AUDIT → TEST → APPROVE → DEPLOY → MONITOR.**

Every new producer, API, worker, game, website, research service, report, finance component, device simulator, and export should declare its boundary contract before any external write. New and migrated modules can call the shared Python correctness primitives directly or pass schema-declared JSON through the existing ONE Federation CLI. New adoption does not silently modify legacy data, ancient chronology or the user's original words.

The basic JSON sanitizer supports explicit types integer, iso_date, utc_instant, uuid, text, and measured_or_missing. Missing/extra fields and unknown contracts fail closed. Financial quantities, ratios, units, and event writes use the specialized strongly typed APIs, not generic JSON coercion.

### Read-only validation using the existing federation CLI

~~~sh
F=app-factory/nathan-ai/personal-intelligence/minds/federation
printf '%s\n' '{"amount_minor":"integer","as_of":"iso_date","owner":"text"}' >/tmp/one-contract.json
printf '%s\n' '{"amount_minor":1999,"as_of":"2026-11-13","owner":"Nathan AI"}' >/tmp/one-payload.json
python3 "$F/federation.py" validate-boundaries /tmp/one-payload.json /tmp/one-contract.json
~~~

The CLI creates **no database**, changes no supplied file, and does not authorize an external action. A monetary domain must separately enforce declared currency, precision and rounding rules before use.

### Attach the event store to the existing private ONE Federation master

~~~python
import sqlite3
from core_primitives import EventStore

# Only an owner-authorized environment opens this existing private database.
connection = sqlite3.connect("/owner/private/ONE_Federation_Master.sqlite3")
events = EventStore(connection)
events.initialize()
~~~

The event store adds one guarded table to the **same** database when explicitly initialized; it does not invent another master or reach into any private DB during this chat. GitHub tests use disposable SQLite files only.

### Repository-wide adoption inventory

~~~sh
F=app-factory/nathan-ai/personal-intelligence/minds/federation
python3 "$F/fencepost-error-syndrome/universal_audit.py" --root . --out /tmp/root13-adoption.json
~~~

The audit walks readable Python, JS/TS, SQL, HTML and configuration source. It reports **possible adoption locations**, not proven code defects or verified program compliance. Excluded directories, binaries, large files and unavailable private material remain unreviewed. The CI gate runs the three correctness test modules for every pull request/push and emits an inventory artifact.

To call an individual existing project **verified compliant**, its owner must map applicable roots to real data paths, implement contracts, test edge cases, review privacy/security/permissions, and record deployment plus rollback evidence. Passing a shared-library test alone does not complete that work.

## Exactness and interpretation limitations

- **Historical calendars:** zero-based array offsets do not imply a Year 0 in BC/AD chronology. Preserve calendar-specific historical rules.
- **UTC is not monotonic:** store UTC instants for events; use a *separate monotonic clock* for elapsed local durations. Recurring local events need time zones and DST fold/gap rules, not UTC alone.
- **ISO ordering is not binary endianness:** ISO date text avoids ambiguous MM/DD formats; byte order must still be specified for binary protocols.
- **Money:** integer subunits prevent a class of binary-float errors but exchange rates, fractional entitlements, local currency exponents and tax rounding remain domain-dependent. Add explicit 64-bit overflow guards at constrained interfaces.
- **Rates:** pooled raw denominators prevent unweighted-percentage errors but do not automatically remove selection bias or Simpson's paradox.
- **Distributed writes:** SQLite triggers and idempotency protect this local ledger; provider-side transactions and external exactly-once effects still require dedicated integrations and reconciliation.
- **Physical systems:** aviation, robotics, power, chemicals and biological equipment require independently approved testing and safety controls. Role registration is not authorization or certification.

## Honest acceptance thresholds

**13/13 core-controls compliance** means all thirteen named root test cases passed on the shared library. **108/108 Tech108 roster compliance** is a separate verified register. **Universal Nathan AI project compliance remains unverified** until every relevant existing program has actually been adapted and tested. We have not audited or changed Google's code or any remote hardware, payment, or biological system.

**ZERO SILENT ASSUMPTIONS. ZERO FALSE COMPLETION CLAIMS.**

**Machine-readable workforce and adoption plan:** [13 deterministic worker-role records and 12 program-job coverage targets](root13-workers.json) preserve ONE Family 21, Tech108 IDs and the original eight Fencepost workers. Their presence in the registry is not evidence of a running 24/7 workforce. CI tests an import into the existing ONE schema using an ephemeral database.
