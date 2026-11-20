# Nathan AI Sovereign Scroll & Artifact Provenance Engine

**Architect** John "Nathan" Tabor

The [original blueprint](SOURCE-BLUEPRINT.txt) preserves the submitted specification and examples. This implementation runs inside the existing Conductor and uses its primary Engine D1 binding. The [schema](migrations/0002_artifact_scroll_ledger.sql) and [write budget](migrations/0003_scroll_write_budget.sql) are applied before release. The existing binary receipt route continues to use its own raw 18-byte prefix.

Every scroll route checks `X-Sovereign-Anchor: AA55FF01312B313D327E312D313D300400F0` before database access. Ingest and ledger reads require the private `SCROLL_LEDGER_TOKEN` bearer credential. The anchor is a fixed protocol marker. The credential controls access, and the SHA-256 seals check the committed data.

| Route under `/tabor-sites/conductor/api/artifact-scroll` | Operation |
| --- | --- |
| `GET /health` | Read the schema and report readiness, intake configuration and release commit. |
| `POST /ingest` | Send a JSON object with `records`, an array of 1–20 items. |
| `GET /ledger?siglum=1QIsa-a&after=0` | Read up to 50 records in ascending ID order. Continue with `next_after`. Omit `siglum` for the full catalog. |

Each record includes `scroll_siglum`, `cave_or_site`, `medium`, `script_lang`, `epigraphic_status` and `raw_text`. The allowed media are parchment, papyrus, copper and stone. The script/language values are Hebrew, Aramaic, Greek and Paleo-Hebrew. The status reported by the submitting curator is `extant_verified` or `reconstructed`. The optional `media_asset_sha256` references a scan by its SHA-256 hex digest. Supply `unix_timestamp` in UTC seconds to preserve the original ingest stamp through sync or retry. Omit it to stamp the request with the current time.

Worker and Python use the same compact UTF-8 JSON field order, trim ASCII whitespace at the boundaries, and apply NFC. The request receives a UTC Unix stamp and the corresponding ISO-8601 value. The chain starts at 64 zeroes. A record fingerprint identifies the canonical data and timestamp. A separate payload hash binds those fields to the previous hash in that ledger. Local and Cloudflare ledgers can have distinct predecessors if records arrive in a different order. A database trigger rejects stale predecessors, and all inserts in a batch commit together. Replaying the same fingerprint returns the original cloud receipt.

The scroll ledger admits up to 1,000 new records per UTC day. SQLite indexes and budget updates also count toward D1 row-write usage. Batching reduces round trips. Full local auditing validates every link and recomputes hashes from the stored fields. An independently recorded head hash can anchor a later audit.

## Local import, audit and sync

From this directory:

```sh
python3 nathan_ai_scroll_ledger.py import-json fixtures/scroll-seed.json
python3 nathan_ai_scroll_ledger.py verify
python3 nathan_ai_scroll_ledger.py sync
```

The provided Great Isaiah Scroll fixture is a catalog note supplied with the blueprint. It includes no manuscript transcription. The database uses local SQLite. `import-markdown` reads JSON metadata between opening and closing `---` lines and uses the remaining Markdown as the content. `import-sqlite` copies the catalog fields from a prior database opened read-only and seals them into a new chain. Retain the original database and its hashes. Set `SCROLL_LEDGER_TOKEN` in the environment before syncing. Sync audits the local chain and verifies the fingerprints in the cloud response.

The Conductor Node Template GitHub workflow runs the Worker and Python ledger tests on changes to this module. Deploy the existing Conductor with its current namespace and bindings after applying the migrations to the primary Engine D1 database.
