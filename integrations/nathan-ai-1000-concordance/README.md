# Nathan AI 🚀 — 1,000-owned-script concordance

## Live inventory and snapshot (2026-11-18, UTC)

The existing Cloudflare dispatch namespace `nathan-tabor-platforms` contains **1,000 script names**:
- **989** `language-shard-NNNN` scripts containing partitioned Glottolog CLDF v5.4 records.
- **11** platform-router scripts that share a common code ETag.

A Cloudflare readback confirmed:
- 1,000 owned script metadata entries copied into the private `nathan-ai-cockpit-ledger` D1 `dispatch_script_registry`.
- 1,000 complete source snapshots containing **2,011 module files** and **3,239,741 raw fetched bytes** in `dispatch_script_snapshots`.
- 989 extracted shard JSON records in `language_shard_concordance`, representing **27,275 languoid records**.
- 1,000 new unified catalog entries, increasing the ledger to **7,716** total entries.
- All 1,000 registry rows have `code_verified = 1`, meaning the source was read, parsed, and stored. **This does not mean runtime invocation testing was completed.**

The separate existing `tabor-platform-languages` D1 contains **27,275** normalized `languoid` records. Reuse it as the language concordance source rather than duplicating it unnecessarily.

## Runtime

The `nathan-ai-1000-concordance` Worker intentionally provides a small, bounded control plane:

- `GET /health` — identify the service.
- `GET /api/summary` — reconcile live D1 snapshot/registry/language totals.
- `GET /api/languages?q=Zulu&limit=20` — read-only language, family and dialect search.
- `GET /api/language/zulu1248` — lookup by Glottocode.
- `GET /api/shards/language-shard-0001` — perform an **on-demand GET** to that owned script through the existing dispatch namespace, only after checking the owned registry and archived source. Arbitrary script invocation is not exposed.
- Every six hours, append an integrity heartbeat to `cockpit_log`; no unbounded fan-out, third-party scanning, installation or external replication.

## Replication rules

1. Original: the 1,000 Cloudflare dispatch scripts remain in place.
2. Private source snapshot: per-script named modules plus the original ETag live in the cockpit D1 archive. These are reusable for audited restoration but no automatic replacement occurs.
3. Public GitHub: source-controlled **gateway code, configuration, schema and inventory identifiers only**. Raw script snapshots remain private to avoid publishing hard-coded secrets or proprietary material accidentally.
4. Language data: extracted into concordance shard JSON, while the existing normalized `languoid` database is reused for search.
5. Changes to existing scripts need source review, a single-script staging test and an explicit rollout; no blind rewriting of all 1,000 scripts.

**Glottolog attribution:** Glottolog CLDF v5.4, Harald Hammarström, Robert Forkel, Martin Haspelmath and Sebastian Bank, CC BY 4.0, https://glottolog.org/meta/downloads.

## Deployment

Deploy with this integration's `wrangler.toml` or an equivalent Cloudflare API upload, then verify the three bindings and public health/search endpoints. The existing scripts are untouched. Scheduled reconciliation is `17 */6 * * *` UTC. Archive size/counts should be verified from D1 rather than inferred from the manifest.
