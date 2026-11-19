# Nathan AI DMSP + DIT — Workers for Platforms Pool
## Original platform inventory
- Cloudflare dispatch namespace: `nathan-tabor-platforms`
- Existing dispatch scripts: 1,000, confirmed via Cloudflare namespace scripts listing
- Cloudflare D1: `nathan-ai-dmsp-dit`
- `dmsp_platform_workers`: 1,000 registered inventory records
- `dmsp_worker_pool`: 1,000 original catalog entries with a dedicated read-only health schedule
- Existing script sources are **not** copied to GitHub by the inventory; only names and metadata are present.
- No evidence that 1,000 scripts have been executed or are independently healthy.

## Pool state machine
REGISTERED -> VALIDATING -> READY -> ACTIVE -> DEGRADED / DISABLED.
Promote to READY only after a bounded read-only smoke test of the exact script; promote to ACTIVE only after authorized, successful dispatch and receipt. Preserve the existing namespace and avoid duplicating scripts.

## Launch dependencies

Customer operations require operator authentication, tenant-scoped roles, approved connectors, service agreements, and documented restore and rollback tests. Review licensing and hosting requirements before deploying third-party services. The [launch issue](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/issues/357) tracks those remaining dependencies.

## DMSP + DIT department builds

The `nathan-tabor-platforms` dispatch namespace also contains 28 dedicated `dmsp-dit-*` department scripts. The scoped dispatcher `nathan-ai-dmsp-dit-pool` consumes their `DMSP_DEPARTMENT_BUILD` jobs from `grid_build_queue` every minute. It validates each department's baseline and records the department's next build deliverable, required input, and acceptance evidence. The public [department status](https://nathan-ai-dmsp-dit-pool.nathantaboract.workers.dev/status) exposes those draft checklists and runtime receipts.

The dispatcher processes up to four requests concurrently. It checks fixed department names, bounds each dispatch's CPU and subrequests, and keeps seven days of idempotent D1 receipts. A passing receipt promotes the worker to `ACTIVE`, a failed one marks it `DEGRADED`, and the public active count requires a passing receipt from the last three minutes. These jobs handle planning data. Approved tenant identity, real service inputs, and operator sign-off are required before customer operations or privileged runbooks can go live.

For an authorized redeployment from this directory, first run `node --test *.test.mjs`. Set the Cloudflare account ID and a scoped deployment token in your environment, then run the commands below. The existing grid and DMSP tables must already be present. Deploy the updated grid reconciler before the first migration so its legacy inventory check uses linked slots.

```sh
node deploy-departments.mjs
npx wrangler deploy --config grid-reconciler.wrangler.toml
npx wrangler d1 execute nathan-ai-dmsp-dit --remote --file pool-dispatch-schema.sql
npx wrangler d1 execute nathan-ai-dmsp-dit --remote --file catalog-health-schema.sql
npx wrangler deploy --config pool-dispatcher.wrangler.toml
npx wrangler deploy --config catalog-health.wrangler.toml
```

Pause an individual planning job by setting its `dmsp_worker_pool.execution_enabled` to `0` and `pool_state` to `DISABLED`. Pause the dispatcher fleet by removing the dispatcher's cron trigger. Existing department runbook approval flags are managed separately.

## Catalog worker health

The catalog health Worker reads the dedicated grid build queue entry and checks all 11 catalog portals each minute. It rotates the 989 Glottolog language shards through five minute-long buckets. It uses fixed GET routes via the dispatch binding, validates the response identity, and stores each script's latest D1 receipt. The [catalog status endpoint](https://nathan-ai-dmsp-catalog-health.nathantaboract.workers.dev/status) shows coverage and failures separately for portals and language shards.

Before initial activation, the live source of each portal was compared against its shared read-only runtime. Each shard was checked against its shared runtime and a JSON-only data module from the Glottolog CLDF v5.4 catalog.
