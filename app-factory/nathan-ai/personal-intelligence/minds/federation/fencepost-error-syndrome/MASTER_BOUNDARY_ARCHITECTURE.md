# Sovereign boundary architecture — executable master blueprint

Nathan AI / ONE · Nathan Tabor's sovereign-box framework · 2026-11-16

Current request anchors: **1+1=2** and **1-1=0**. Zero and one have separate immutable `BitBox` instances. The existing Codex declaration, original eight workers, Root13 historical labels, Family 21 and existing registries remain preserved. These additions extend the existing boundary module in place.

The governing contract is: **Each box owns valid state. Every accepted operation preserves its invariants. Every handoff explicitly translates its units, encoding, ownership and boundary convention.**

## Run the complete local reference app

From the repository root, with Python 3.11+ and Node 22+:

```sh
F=app-factory/nathan-ai/personal-intelligence/minds/federation/fencepost-error-syndrome
python3 -m venv work/boundary-venv
work/boundary-venv/bin/pip install -r "$F/requirements-boundaries.txt"
work/boundary-venv/bin/python "$F/verify_boundaries.py" --out work/boundary-evidence.json
work/boundary-venv/bin/python "$F/boundary_api.py" --db work/boundary-demo.sqlite3
```

Open **http://127.0.0.1:8765**. The database is an explicitly selected local demonstration database. No private ONE master is located or modified automatically. Stop with Ctrl-C. Delete only that disposable demo database to reset it.

The local routes are `GET /health`, `GET /metrics`, `POST /fences`, `POST /bookings`, and `GET /bookings?resource=...&after=...&until=...&size=...`. A booking command has `resource`, `key`, `token` and `range: {start,end}` fields. Obtain a new ownership token only when starting a new command, never during a retry of an existing command.

The browser supports date-range reservations, pending status, repeatable command retries, cursor traversal, accessible status announcements, and storage health. It uses CSS `gap`, direct iteration, `textContent`, and JSON serialization. The API bounds request size and socket wait time, rejects duplicate JSON/query fields and nonfinite JSON, validates exact field sets, and rejects other origins/hostnames. The server is intentionally loopback-only, single-threaded and unauthenticated; local processes remain trusted. It is a reference app, not an internet-facing hosting server.

The running server polls health on its local event loop. If the derived booking-count projection drifts while authoritative bookings and events still agree, it automatically rebuilds that projection in a transaction and verifies it. Cooldowns bound repeated repairs. An authoritative ledger disagreement remains unhealthy for review; it is never erased to manufacture a green status. This is a working, narrowly defined self-healing action. The in-process loop pauses while a synchronous request runs; production monitoring needs independent probes and workload-appropriate intervals.

## Contract and implementation matrix

| Requirement supplied | Implementation and acceptance evidence |
|---|---|
| Distinct 0/1 and arithmetic anchors | Frozen `BitBox`; `arithmetic_health`; box mutation rejection test |
| Sovereign valid state | Frozen `CounterBox`; invalid candidates raise without changing prior object |
| Half-open intervals | Existing `HalfOpen` extended with `overlaps`, `split`, `bounded`, `indices`; empty overlap regression |
| Index-free application loops | UI iterates values; API delegates boundary operations; consumer AST gate rejects `range(len(...))` and `<= len(...)` |
| UI human boundary adapters | `display_range`; `inclusive_dates`; checkout form explicitly uses exclusive checkout |
| API anti-corruption layer | `range_payload`, exact fields, canonical date parser; API delegates to typed service |
| Wire schema | `boundary_contract.schema.json`; cross-field relationships additionally enforced by runtime parser |
| Storage range enforcement | SQLite constraints/triggers and PostgreSQL `daterange` + GiST exclusion migration |
| Cursor pagination | Immutable increasing ID cursor, exclusive `after`, inclusive captured `until`, bounded page sizes, explicit `next=None` termination |
| Concurrent changes | Append-only booking traversal uses fixed high-water mark; test inserts between pages |
| Named state transitions | `State` enum, closed transition table, exhaustive edge acceptance/rejection test |
| Immutable event ledger | Existing Root13 `EventStore`; reference app commits booking/event/request together; triggers reject mutations |
| Idempotent network retries | Resource-scoped key and canonical payload; identical retry returns saved result; changed payload rejected |
| Distributed ownership fencing | Per-resource increasing token; actual storage insert rejects stale token; acquisition and write serialize locally |
| Causal event clocks | Immutable Lamport and vector clocks; vector concurrency tests; no consensus claim |
| Exact money and rounding | Existing `Money`, rational parsing fix, int64 interface guard, deterministic remainder allocation and half-even rational rounding |
| Units and numeric distinctions | Existing `Quantity`, `Rate`, `Observation`, exact scaling; Root13 regression suite |
| Calendar / DST / monotonic time | Existing UTC/DST conversion tests; date adapter uses calendar successor; recovery uses monotonic nanoseconds |
| Unicode and normalization | NFC then Unicode extended grapheme segmentation via pinned `regex` `\X`; invalid surrogate rejection |
| Memory views | Read-only `memoryview` over immutable bytes, explicit bounds; test verifies original buffer identity |
| Parallel work partition | Lazy `chunks`; generated tests verify conservation, adjacency and exhaustive index coverage |
| Undo / redo | Immutable `History`, bounded replay position and branch truncation after undo |
| Optimistic state | `OptimisticFlow` validates transitions and command-correlated acknowledgments; rejected command rolls back visible state |
| Self-healing controls | `Recovery` verification, cooldown, bounded failure count, halt state and bounded-name metrics |
| Actual automatic repair | Server health loop rebuilds only a drifted derived count; fault tests verify recovery, cooldown and preservation of authoritative disagreements |
| Observability | Count-only telemetry; health checks arithmetic, SQLite quick integrity, and event/booking conservation |
| Property-based verification | Hypothesis: partition, empty overlap, Unicode slicing, money conservation and history replay |
| Fault injection | Event-write trigger failure proves all booking/request writes roll back |
| Concurrent writer verification | Two independent connections contend for one booking; exactly one commits |
| CI and inspectable evidence | `verify_boundaries.py` produces command results, test counts and source hashes; dedicated workflow runs PostgreSQL as well |
| Browser acceptance | `browser_acceptance.py` exercises adjacency, rejection, response loss after commit, idempotent retry, event conservation and mobile layout in Chromium |
| Preservation/restoration | Additive files and documented extensions; original declarations/IDs tested; no invented recovered source |

## State and transaction ownership

The API is an adapter. `BookingService` owns the transaction. SQLite owns exclusion and stale-token enforcement. Immutable domain objects own local invariants. No API route duplicates range or overlap calculations.

Booking commands use this sequence:

1. Parse canonical resource, key, ISO dates and integer fencing token.
2. Require nonempty `[start,end)` booking dates.
3. Begin an immediate write transaction.
4. If the scoped key exists, require the same canonical payload and return its saved result.
5. Validate current fencing token and non-overlap in storage.
6. Insert booking, append event and save response under the same transaction.
7. Commit all three or roll back all three.

A successful identical retry may return its original result after ownership has advanced: it performs no new write. An older token cannot authorize a new booking. This is local SQLite serialization and storage fencing, not a distributed lease service. A production distributed coordinator must issue tokens whose authority the actual destination storage verifies.

The immutable history represents local replay. Restoring an earlier internal value does not undo an email, payment or physical effect. Such effects need a separate compensating operation and provider reconciliation. The demo has no external effects.

## Boundary semantics that must remain explicit

- Generic `HalfOpen` may represent negative coordinates. Array slices call `bounded(length)` to require `0 <= start <= stop <= length`.
- An empty range overlaps nothing. Touching nonempty ranges share a coordinate, not an element.
- A fence with `n` sections has `n+1` posts under the initial-post model, including one post for zero sections. A list with `n` values has `max(n-1,0)` internal separators. These are different domains.
- A human inclusive date selection May 1 through May 3 becomes `[May 1,May 4)`. A May 3 checkout remains an exclusive May 3 endpoint. Do not infer semantics from two dates alone.
- Calendar days are not necessarily 24 elapsed hours. UTC wall time is not a monotonic duration clock. Daylight-saving changes do not themselves jump Unix epoch time; wall-clock corrections can affect duration measurement.
- Money uses declared minor units. Basis points are a rate, not a currency subunit. Remainder allocation and rounding are separate policies. Integers are checked at int64 interfaces; the browser wire interface additionally requires safely representable JSON integers.
- Floating point remains appropriate for many physical measurements. A tolerance must reflect units, scale and error bounds. It is not appropriate to inject an arbitrary epsilon into ownership or exact money comparisons.
- Graphemes describe user-facing text units, not protocol byte offsets. NFC does not make code-point count equal visible-character count. Preserve signed/raw protocol text when its exact bytes matter; normalize only the appropriate display/search field.
- Zero-copy requires safe lifetimes; here the view keeps immutable bytes alive. Disjoint chunks do not establish freedom from races on other shared state.
- Logical clocks describe causality or ordering. They do not supply distributed consensus or a globally accurate wall clock.

## Self-healing policy

`Recovery` runs caller-supplied repair then a fresh verification check. A repair returning successfully is not sufficient: verification must return the actual boolean `True`. A cooldown prevents tight retry loops. Consecutive failures stop at the configured limit. A new verified recovery resets the failure count. A bounded history of 100 immutable recovery records stores monotonic ticks, resulting state and a fixed reason category; exception payloads are excluded.

Use immutable candidates or database transactions to preserve user state. The counter and booking tests demonstrate both paths. Repair callbacks need their own deadlines; the synchronous controller cannot interrupt a hung callback. Before using an actual service restart, define resource ownership, state preservation, timeout, health probe and rollback behavior for that service. No arbitrary code patch or process restart is performed by this reference implementation.

Metrics use a fixed set of names and avoid recording payloads, personal text or idempotency keys. Empty-range metrics indicate behavior; they are not automatically errors. Sample/high-volume monitoring and alert thresholds belong to the adopting deployment.

## PostgreSQL verification

Use an explicitly selected disposable test database with `psql`:

```sh
psql "$BOUNDARY_TEST_DSN" -v ON_ERROR_STOP=1 -f "$F/booking_ranges.sql"
psql "$BOUNDARY_TEST_DSN" -v ON_ERROR_STOP=1 -f "$F/test_booking_ranges.sql"
```

The test transaction verifies adjacency, overlap rejection, empty rejection and unbounded rejection, then rolls back test rows. PostgreSQL canonicalizes discrete `daterange` bounds to `[)`. Continuous `tsrange`/`tstzrange` need their own explicit bound-flag constraints and timezone policy. The SQL file is a booking-range example, not a port of the SQLite idempotency ledger or fencing service.

For optional browser acceptance, install `requirements-browser.txt`, run `python -m playwright install chromium`, then run `browser_acceptance.py --screenshot work/boundary-browser.png --report work/boundary-browser.json`. Use `--chromium /path/to/chromium` to select an existing browser. This creates and removes its own disposable server/database. CI runs the same browser acceptance with a managed Chromium install.

Schema initialization creates the new prefixed reference tables. It is not a schema upgrader for arbitrary existing applications. Existing installations need versioned migrations, backups and integration-specific verification.

## Production adoption and acceptance

For each app, record its entry points, domain units, trusted writer permissions, transaction owner, storage constraints, external effect semantics, and all applicable rows of the matrix. Route real data paths through the shared types and adapters. Add app-specific regressions, load tests and deployment/rollback evidence. Enforce the focused gate on consumers; it is a syntactic guard rather than a proof of arbitrary code.

The reference HTTP server needs a production server, authentication, tenant authorization, rate limits, lifecycle management, retention policies and operational monitoring before external exposure. Idempotency keys need a documented retention window and scope. Mutable sort keys or deletions need a database snapshot or versioned traversal rather than assuming an ID cursor alone freezes arbitrary data.

**100% of a named acceptance matrix** means every applicable row has passing evidence for that named implementation and environment. Passing this module does not establish repository-wide adoption, flawless hardware, or the absence of unknown failures. The evidence report explicitly identifies its scope and deployment status.
