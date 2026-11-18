# Nathan AI — Unified Operations Cockpit

## Verified source mapping (2026-11-18 UTC)

This integration reuses **nathan-ai-cockpit-ledger**. It never creates an empty replacement for a populated production catalog.

| Worker binding | Existing D1 database | Role |
| --- | --- | --- |
| `DB` | `nathan-ai-cockpit-ledger` | Unified catalog, audit log, import progress |
| `GLOBAL_DB` | `tabor-global-import-catalog` | Global Atlas sources, layers, repos, components, existing fleet and ownership records |
| `FLEET_DB` | `tabor-fleet-registry` | Fleet entries, logical slots, apps, book sets and technology sets |
| `MASTER_DB` | `nathan-ai-global-catalog` | Master catalog, sources, batches, policy and events |
| `PLATFORMS` | `nathan-tabor-platforms` | Workers for Platforms dispatch namespace |

Account read-only audit returned **448 deployed Worker scripts** and a namespace reporting **1,000 dispatch scripts**. These are distinct objects. A virtual slot, catalog row, or discovered GitHub repository is **not** an executable supercomputer or an installed Worker.

### Live catalog reconciliation

All **19 source tables**, including empty `catalog_events`, were discovered. The 18 populated tables contain **6,716 source rows**. The live cockpit ledger was enlarged from 4,131 to 6,716 rows with additive upserts. The live `import_cursors` ledger now records all 19 tables as indexed, including the empty one. Existing integration statuses and GitHub sync flags were not overwritten.

## Deployment order

1. Confirm authorized GitHub and Cloudflare accounts, inspect any active deployment workflow, and review this feature branch.
2. Apply `schema.sql` to the **existing** `nathan-ai-cockpit-ledger` D1 database. The additive migration has already been applied to the connected account; executing it again is idempotent.
3. Provision the Worker secret `COCKPIT_KEY` (strong random secret). Provide `GH_PAT` with minimum required GitHub Actions dispatch access, plus `GH_OWNER` and `GH_REPO` as configuration. Never commit token values.
4. On GitHub, configure repository secrets `COCKPIT_URL` and `COCKPIT_KEY` for the return callback. A `repository_dispatch` workflow must exist on the **default branch** before it will execute.
5. Deploy `unified-operations-cockpit` using the root `wrangler.toml` after verifying bindings and secrets. Deployment has **not** been claimed here. Confirm `GET /health` with authorized credentials before use.

## API behavior

All endpoints require the bearer token or Basic auth `cockpit:<COCKPIT_KEY>`.

- `GET /api/sources`: enumerate real source tables and row counts through `sqlite_master`.
- `GET /api/catalog-status`: return imported source groups and per-table cursor progress.
- `GET /api/platforms`: report whether the binding exists. It deliberately does **not** fabricate a script count.
- `POST /api/import?pages=4`: import up to four pages of 100 rows each, checkpointed by source table. Every table is discovered dynamically. `?reset=1` rescans from row zero without deleting indexed catalog records.
- `POST /api/macro`: dispatch a single batch of up to 25 **GitHub repository references**, without cloning or installing any repository.
- `POST /api/macro-all`: dispatch up to 10 batches (250 records), contingent on GitHub API acceptance.
- `POST /api/callback`: accept a checked GitHub run result. Successful manifest upload marks a row `MANIFEST_EXPORTED`, never `INSTALLED`.
- `GET /dispatch/<script>`: dispatch an individual allowlisted script only. Set secret `ALLOWED_DISPATCH_SCRIPTS` to a comma-separated list; default is deny-all. No open global routing, port scanning, or third-party access.
- `POST /api/clear`: append a logical reset receipt without deleting source or audit records.

Cron runs every five minutes for checkpointed refresh. At 00:00 UTC it resets import cursors and initiates a non-destructive daily rescan. Check Cloudflare billing/limits for this cadence.

## GitHub receiver and Clouder Pro

`.github/workflows/catalog-manifest.yml` receives `catalog_manifest_batch` events, validates a maximum of 25 references, saves a GitHub Actions artifact, and returns a signed-key callback. This does not deploy a Worker, clone an external repository, or certify the referenced source as safe.

**Clouder Pro** is a separate third-party Cloudflare management app. No Clouder Pro API, login session, or write access was verified through this integration. The cockpit's authenticated HTTPS endpoints can be used only through an HTTP client or app integration that actually supports them; do not treat the Clouder subscription as an API key.

## Verification boundaries

- Source record indexed: **verified via D1 readback**.
- GitHub feature branch files: **written**, awaiting merge and workflow validation.
- Cloudflare cockpit Worker deployment: **not verified or claimed**.
- GitHub manifest callbacks and production credentials: **not verified or claimed**.
- Automatic script execution: **deny by default**; explicit allowlist required.
