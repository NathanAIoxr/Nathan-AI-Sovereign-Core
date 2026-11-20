# HANDOFF: Nathan AI Sovereign Ledger (rebuild v1.0)

**Paste this whole file into ChatGPT, then give the result to the conductor.**

> Instruction to the receiving agent: treat this repo as the source of truth. Do not change the hashing scheme, the migration, or the signing format without regenerating `test/vectors.json` and passing both test suites. Do the "Conductor first tasks" in order. Report anything that fails instead of working around it.

## 1. What this is

An append-only, hash-chained provenance ledger for artifacts and scrolls (Dead Sea Scroll style catalog fields), running on **Cloudflare Workers + D1**, with a **local Python engine** that uses the identical scheme and syncs to the Worker. Source on GitHub, CI on GitHub Actions.

It proves **tamper-evidence of the ledger**. It does not prove the authenticity of any artifact.

## 2. The math, mapped to the system

| Operation | Bit level | In this system |
|---|---|---|
| **ADD** | `1 + 1 = 10` (sum = XOR, carry = AND) | Every write is an append. State only grows. Chain: `payload(n) = H(content(n), prev = payload(n-1), ts)` |
| **SUBTRACT** | `a - b = a + (~b) + 1 mod 2^w` (subtraction is addition of the complement) | No UPDATE or DELETE exists (DB triggers forbid both). A mistake is cancelled by appending a `correction` entry that references the original by `ref_client_sha256` |
| **ROTATE** | `rol(x, n) = ((x << n) \| (x >> (w - n))) mod 2^w` | Wraparound structures: HMAC secret rotation (`LEDGER_HMAC_SECRET` + `LEDGER_HMAC_SECRET_NEXT`), daily head anchoring cycle, bounded batch windows |

**Anchor** `AA55FF01312B313D327E312D313D300400F0` (18 bytes: SOF, rail 1 = ASCII `1+1=2`, spine `~`, rail 2 = ASCII `1-1=0`, XOR seal `04`, EOF). It is a **format/version marker** stored in every record and checked on every request. It is **not** a secret and **not** authentication. Authentication is the HMAC (section 5).

## 3. Repo map

```
migrations/0001_init.sql      schema + constraints + append-only triggers (used by D1 AND local SQLite)
src/core.ts                   pure logic: canonical JSON, hashes, HMAC, validation, chain verify
src/index.ts                  Worker: /health /ingest /ledger /head /verify
python/ledger.py              local engine + CLI (add, verify, push, remote-head, remote-verify)
python/gen_vectors.py         regenerates test/vectors.json from the Python reference
python/test_ledger.py         11 tests
test/core.test.ts             12 tests (node:test), reads test/vectors.json
test/vectors.json             cross-language parity vectors
.github/workflows/ci.yml      typecheck, tests, vector-drift gate, deploy on main
.github/workflows/anchor-head.yml   daily: commit ledger head hash into git history
wrangler.toml                 bindings (fill in database_id)
```

## 4. Hashing scheme (must be identical in every language)

Canonical JSON = keys sorted, no whitespace (`separators=(",", ":")`), UTF-8, no ASCII escaping of non-ASCII.

```
content   = { anchor, entry_type, lang, media_hash, medium, ref, siglum, site, status, text }   (text = trim + Unicode NFC)
client_sha256  = SHA256(canonical(content))                      # computed by client AND verified by server
payload_sha256 = SHA256(canonical({ ...content, client_hash, prev_hash, ts_unix }))
genesis prev   = 64 zeros
```

The server recomputes `client_sha256` for every record and rejects mismatches (HTTP 422). That check enforces cross-language parity at runtime.

## 5. Security model

- **Auth: HMAC-SHA256.** Headers: `X-Ledger-Timestamp` (unix seconds, ±300 s), `X-Ledger-Signature` (hex).
  Signing string: `"{ts}\n{METHOD}\n{path+query}\n{sha256_hex(body)}"`. Key = `LEDGER_HMAC_SECRET`. Constant-time verify. Bodies are signed, so tampering in transit fails.
- **Format gate:** `X-Sovereign-Anchor` must equal the anchor (HTTP 400 otherwise).
- **Only `/health` is unauthenticated**, and it reveals nothing.
- **Idempotency / replay:** `client_sha256` is UNIQUE; replaying a record returns 409.
- **No fork:** `prev_chain_sha256` is UNIQUE; concurrent writers cannot both extend the same parent. The loser re-reads the tail and retries (3 attempts, then 503).
- **Secret rotation:** `wrangler secret put LEDGER_HMAC_SECRET_NEXT`, update clients, promote it to `LEDGER_HMAC_SECRET`, delete `_NEXT`.
- **External anchor:** `anchor-head.yml` commits the head hash daily, so rewriting the DB chain would also require rewriting git history. Enable signed commits and branch protection on `anchors/`.

## 6. API

All routes except `/health` need the three headers above.

- `POST /ingest` body `{"records":[ {entry_type?, ref_client_sha256?, scroll_siglum, cave_or_site, medium, script_lang, epigraphic_status, raw_text, media_asset_sha256?, client_sha256} ]}`, max 20 records, 2 MB. Returns `{status, count, head_sha256, records:[{client_sha256, payload_sha256, iso_timestamp}]}`.
- `GET /ledger?siglum=&after_id=&limit=` (limit ≤ 200).
- `GET /head` returns the current head hash and id.
- `GET /verify?after_id=&limit=` walks and re-hashes the chain (≤ 1000 rows per call); returns `{ok, checked, broken_at_id?, next_after_id, done}`.

Enums: `medium` = parchment | papyrus | copper | stone | other. `script_lang` = Hebrew | Aramaic | Greek | Paleo-Hebrew | other. `epigraphic_status` = extant_verified | reconstructed. `entry_type` = record | correction (a correction **must** carry `ref_client_sha256`; a record **must not**).

## 7. Deploy runbook

1. `npm install`
2. `npx wrangler d1 create nathan-ledger`, then paste the `database_id` into `wrangler.toml`.
3. `npm run db:migrate:local`, then `npx wrangler dev` for local testing.
4. `npx wrangler secret put LEDGER_HMAC_SECRET` (use 32+ random bytes, e.g. `openssl rand -hex 32`).
5. GitHub repo, Environment `production`, secrets: `CLOUDFLARE_API_TOKEN` (scoped to Workers + D1 edit), `CLOUDFLARE_ACCOUNT_ID`, `LEDGER_WORKER_URL`, `LEDGER_HMAC_SECRET`.
6. Push to `main`. CI tests, migrates, deploys, and verifies the remote chain.
7. Local use: `export LEDGER_HMAC_SECRET=... LEDGER_WORKER_URL=...`, then `python3 python/ledger.py add ...`, `verify`, `push`.

## 8. Verification status (honest)

**Executed and passing in the build sandbox**
- 11 Python tests and 12 Node tests, including byte-for-byte hash parity on Hebrew, NFC-composed, control-character, U+2028, emoji, and correction cases; HMAC vectors; tamper detection; append-only triggers; fork and replay prevention; foreign-key protection for corrections.
- `src/core.ts` and `src/index.ts` type-check under strict mode (against minimal D1 type stubs).
- Both workflow files parse as valid YAML.

**NOT executed here (no network, no Cloudflare runtime). The conductor must verify**
- `src/index.ts` request handling end to end under `wrangler dev` / real D1.
- That D1's error text for a constraint failure contains the column name (`client_sha256`, `prev_chain_sha256`), which the 409/retry logic matches on. If it doesn't, adjust the matching.
- That migrations containing `CREATE TRIGGER ... BEGIN ... END` apply cleanly via `wrangler d1 migrations apply`.
- Full `npm install` + `tsc` against the real `@cloudflare/workers-types`.
- The GitHub workflows on a real runner.

## 9. Capacity notes (check against current Cloudflare docs)

D1's free plan allows 100,000 rows written per day, and batching does not reduce that count. Each ledger insert writes 1 table row plus 4 index rows (3 UNIQUE + 1 siglum index), so budget about **5 rows written per record, roughly 20,000 records/day** on the free plan. Confirm with `meta.rows_written` on a test insert. `MAX_BATCH = 20` is deliberately conservative for subrequest limits; raise it only after testing on your plan.

## 10. Conductor first tasks (in order)

1. Run `npm install && npm run typecheck && npm test && npm run test:py`. All must pass.
2. Write an integration test run under `wrangler dev --local`: sign a request, ingest 3 records, `GET /verify`, replay the same body (expect 409), send a tampered body (expect 401), send a stale timestamp (expect 401).
3. Concurrency test: two simultaneous `/ingest` calls; both must succeed with a single unbroken chain (one may retry).
4. Fix any D1 error-string mismatches found in task 2 or 3.
5. Deploy, run `remote-verify`, enable the anchor workflow.
6. Only then: bulk import of existing JSON/Markdown/SQLite sources through `ledger.py add` or a batch importer that calls `append_record`.

## 11. Rules for any agent editing this repo

- Never add UPDATE or DELETE paths. Corrections are new `correction` entries.
- Never change the canonical JSON rules, field names, or anchor without regenerating vectors and passing both suites; CI blocks drift.
- Never commit secrets. Never log the signature or secret.
- Never remove the HMAC check or treat the anchor as authentication.
- Keep the Worker flat-bundled (no git submodules).

## 12. Known limits

- A hash chain shows the database is internally consistent and (with anchoring) unrewritten. It cannot show that the transcription, dating, or provenance data entered is true.
- `/verify` costs rows read proportional to ledger size; page it and schedule it, don't run it per request.
- Timestamps are Worker clock time, not a trusted timestamping authority. For legal-grade time proof, add RFC 3161 timestamping of the head hash.
