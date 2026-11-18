# NATHAN AI — NATHAN TABOR 2X+ SOVEREIGN SUPERCOMPUTER

Compute platform for **TRUE CLOUD COMPUTING BY NATHAN TABOR**. The original Sovereign AI Unit stays in place on the same two Worker IDs. The exact previous deployed modules are recorded in `legacy/` and `cloud-bridge/original-worker.mjs`. Legacy Box 0 version `47f84348-47d1-4d8f-b001-ed239f98c453`, Box 1 version `c4416d98-3959-431f-92ae-4fa235d8a42c`, and True Cloud version `e6496078-bf9b-4977-8037-e7dad8f85cc7` remain in Cloudflare deployment history. The in-place wrappers extend the subsequently activated Will · Wheel · Way module snapshots in `legacy/*-live.mjs`, Box 0 version `911bc79a-2792-47d5-9326-331721ab255a` and Box 1 version `55889bf5-42cf-43da-8a7c-4759a94414e0`. Marketplace and worldwide capacity comparisons require comparable measured work and a documented denominator.

## Working release

- [Sovereign compute dashboard](https://sovereign-ai-unit.nathantaboract.workers.dev/platform), [True Cloud entry](https://tabor-true-cloud-computing.nathantaboract.workers.dev/compute-platform), [status](https://sovereign-ai-unit.nathantaboract.workers.dev/platform/status), [benchmark receipts](https://sovereign-ai-unit.nathantaboract.workers.dev/platform/benchmarks).
- **Box 0, `1 - 1 = 0`** validates bearer/project pairs from `JOB_PROJECT_KEYS`, applies a per-project rate limit, forwards only screened identity and admission fields, returns accepted/rejected/deferred/cleared receipts, and preserves `/compute`, `/health`, `/zero`, and the hourly legacy maintenance.
- **Box 1, `1 + 1 = 2`** runs a durable SQL queue and append-style result ledger in the existing Sovereign Ledger database under new `platform_*` tables. Atomic admission reserves retry-inclusive budget. Fi uses a conditional SQL lease to reserve a slot. Fo verifies one slice and checkpoints completed progress. Fum uses the lease token to commit the artifact hash, result, and estimated usage. The one-minute recovery schedule also expires deadlines and clears retained job payloads. A timely kick runs small jobs without waiting for the next schedule.
- Managed inference uses [Cloudflare Workers AI bge-small-en-v1.5](https://developers.cloudflare.com/workers-ai/models/bge-small-en-v1.5/) to produce 384-dimensional embeddings. Batch jobs checkpoint four texts at a time. Real device count, precision and interconnect for the provider-managed pool are undisclosed. The two managed slots are platform concurrency permits. The CPU adapter verifies uploaded object bytes with SHA-256 when R2 is enabled.
- Backend connectors accept only preconfigured private service bindings. Capacity placement considers supported workload/model, region, available slots, deadline, request budget and configured rates. A failed inference slice can go to a second compatible pool. Training stays on the pool that owns its checkpoint. No arbitrary code, targets or credentials from job input.
- Each project's access and data scope comes from its own token and slug. `pie-pi-phi` and `supercalifragilisticexpialidocious` can each use the shared execution API while retaining their own project configuration and stores. The bridge has no shared project token. It forwards each caller's identity and leaves existing True Cloud jobs and schedules in place.

## Operate the job API

Use Node.js 24. Set `SOVEREIGN_PROJECT` and inject `SOVEREIGN_JOB_TOKEN` from your secret manager into the process environment. The CLI can target the True Cloud bridge by setting `SOVEREIGN_URL=https://tabor-true-cloud-computing.nathantaboract.workers.dev/compute-platform`.

```sh
node tools/cli.mjs status
node tools/cli.mjs status project
node tools/cli.mjs submit workload.json my-first-job
node tools/cli.mjs wait JOB_ID
node tools/cli.mjs artifact JOB_ID result.json
node tools/cli.mjs cancel JOB_ID
node tools/cli.mjs upload input.bin
node tools/cli.mjs benchmarks
node --test tests/platform.test.mjs
```

A workload example is `{"kind":"embedding","texts":["A telescope gathers light."],"budgetMicro":100,"deadlineSeconds":120}`. Budget units are USD micros. `batch-embedding` takes up to 48 texts. `sha256` takes the project-scoped object ID and hash returned by upload. `training` takes an uploaded dataset, an approved recipe, model and held-out evaluation hashes, a target quality, and a minimum GPU count and interconnect. The API validates the actual job artifact or the authorized runner's training attestation and returns client-verifiable SHA-256 hashes. Submit with a stable idempotency key from the caller's own namespace.

Pending jobs can be cancelled by the owning project. A cancelled attempt cannot write output. Its occupied slot stays fenced until the provider call returns or its lease expires. External work is at-least-once across an actual lost attempt. A remote pool must deduplicate the stable job/slice key and keep checkpoint artifacts available. A provider may already have billed for work that was cancelled. The estimate conservatively books dispatches. It omits Cloudflare edge overhead and is not an invoice. Standard outputs expire after one day, configurable to 60 seconds–7 days. Ledger identities, costs, hashes and outcome evidence remain for audit. The object endpoint is project-scoped, private and capped at 8 MiB per upload.

## Release and rollback

Use the three configuration files in `config/` to deploy the in-place extensions. Apply `migrations/0002_jobs.sql` to the existing `sovereign-ledger` database before activating Box 1. Deploy Box 1, then Box 0, then the True Cloud bridge. Set `PLATFORM_REVISION` in Box 1 to the exact GitHub revision. Check `/health`, `/platform/status`, and `/compute-platform/status`. Roll back by switching each Worker to its preceding version and keeping the additive database migration. The one-minute Box 1 cron can be removed when rolling back to a version without a scheduled handler. GitHub checks run the matching SQL and module contracts. Deploy through the existing account or a future authorized GitHub Cloudflare credential.

## Owner setup and expansion

1. Set a separate `JOB_PROJECT_KEYS` secret on Worker `sovereign-ai-unit` with a JSON object keyed by project, each containing `sha256` of its own random bearer token, integer `dailyMicro` and `maxActive`. For example `{"pie-pi-phi":{"sha256":"<64 lowercase hex characters>","dailyMicro":50000,"maxActive":8}}`. The bearer and fingerprint are different values. Set legacy `SOVEREIGN_KEY` independently if using `/compute`. Never commit either secret.
2. In Cloudflare R2 Overview enable R2 on the existing account, provision private bucket `sovereign-compute-artifacts`, and bind it as `ARTIFACTS` to Box 1. Do not enable a public bucket URL. Apply the account's current R2 pricing to expected bytes, storage duration and request counts.
3. Deploy up to two private instances of `gpu/relay.mjs` using `config/gpu-pool.example.toml`. Set each instance's `POOL_ENDPOINT` to the authorized HTTPS workload runner's fixed `/v1/slice` endpoint and configure its `POOL_BEARER` secret. Bind to Box 1 as `GPU_POOL_A` and `GPU_POOL_B`. In Box 1's `GPU_BACKENDS_JSON`, record each pool's `id,binding,ownership,region,deviceCount,deviceType,memoryMiB,precision,interconnectGbps,slots,priceMicro,kinds,models,recipes`. The pool receives a stable Idempotency-Key, a JSON job/slice envelope, or on the first training slice multipart with `job` and hashed `dataset`. It returns `vectors` for embedding or `checkpointSha256,artifactSha256,evaluationSha256,heldOutQuality` for training. The backend must retain its own artifacts by hash and reject unknown recipes and untrusted lease requests. Acceptance of a training claim also needs independently verified evaluation output and timed hardware measurements.
4. Run the recovery and failover tests against actual pool adapters before marking hardware execution verified. Use `tools/capacity.mjs` with measured per-device rates and real hourly quotes to estimate devices, device-hours, bytes, bandwidth and costs. The platform did not acquire capacity.

## Benchmark protocol

The first release uses the checked-in public retrieval fixture in `tools/benchmark-dataset.json` with predetermined top-1 quality and a 120 s job SLA. The runner hashes the dataset and each artifact, measures queue and execution time, prints failed rows, and records costs and the version. Embeddings do not stream tokens, so TTFT is null. The benchmark books a conservative model cost and records the provider invoice as unknown. Physical hardware information is also unknown for Workers AI. The latency target and selected data are a baseline for this workload only. Do not extrapolate the measured four cases to sustained worldwide capacity. To compare results at equal spend, reconcile actual comparable billing, retain both raw runs, and report scope, workload, precision, hardware, failures and important uncertainty.

```sh
node tools/benchmark.mjs receipts/fresh-run.json 1 fresh-baseline
node tools/capacity.mjs receipts/fresh-run.json 100000 32 1000 2 12000 2000 3600
```

The example capacity parameters are illustrative. A second phase should compare cache-off, measured cache-hit, and optimized fresh-compute trials on the same held-out quality set and budget. GPU-hours, training time to target and precision throughput require physical backend telemetry.
