# NATHAN AI — 2X+ Sovereign Supercomputer Job Release

**CONTINUE BUILDING** · Integration target: **TRUE CLOUD COMPUTING BY NATHAN TABOR**.

## Architecture
- Box 0: authenticated API gateway with `/compute`, `/v1/jobs`, `/v1/jobs/:id`, `/v1/jobs/:id/cancel`, `/v1/jobs/:id/artifact`, `/v1/capacity`.
- Box 1: D1-backed idempotency and job lifecycle, Cloudflare Queue consumer, Workers AI inference adapter, R2 output storage, event receipts.
- Fe: input/idempotency/budget gate. Fi: capacity reservation and lease. Fo: inference and output verification. Fum: result hash, artifact, receipt and capacity release.
- Backends: capability registry table for CPU, GPU, managed inference and cluster entries; only Workers AI is currently implemented as an execution adapter.
- CLI: `node cli/nathan-jobs.mjs submit "Hello" 1`, then `list`, `inspect <id>`, `artifact <id>`, `cancel <id>`, `capacity`.
- Benchmark: `NATHAN_API_URL=https://... node benchmark/health-benchmark.mjs 20` generates raw latency and error receipts for **health only**. Inference 2X benchmarks require fixed evaluation dataset, quality criteria, baseline and spend data.

## Deployment sequence
1. Verify the existing TRUE CLOUD COMPUTING and supercomputer-control Workers; preserve their names and history.
2. Provision `nathan-sovereign-jobs` Queue and `nathan-sovereign-vault` R2 bucket with operator-approved spending limits. Enable their Box 1 Wrangler bindings.
3. Apply `box-1-one/schema.sql` and `box-1-one/schema-jobs-v1.sql` to the existing D1 registry. Both are additive.
4. Set matching Worker secrets `BOX_INTERNAL_KEY` on both boxes and `SOVEREIGN_KEY` on Box 0. Use Wrangler secret commands, never commit values.
5. Deploy Box 1 first, then Box 0. Keep Box 1 private via `workers_dev=false` and no public route.
6. Exercise duplicate idempotency, cancellation, budget gate, queue delivery, capacity full, failure/retry, artifact hash, and end-to-end inference.
7. Record code SHA, deployment version, endpoint, latency, usage and verified result hashes.

## Important implementation notes
The first source slice establishes the API and execution path, not a full finished production release. Queue creation, R2 binding, D1 migration, secrets and live deployment are release gates. Current cost accounting records unknown provider spend as **unmeasured**, not zero. The first runner is a health benchmark, not a throughput/quality comparison. Workflows, checkpoint recovery, real GPU adapters, and 2X comparison receipts are next independent modules.

### Required engineering hardening before production
Implement distributed project quota enforcement, per-project credentials, transactional reservations, lease recovery, strict budget estimation, complete artifact atomicity, concurrency-safe retries and cancellation, audit-grade retention, and workload-specific acceptance checks. The initial implementation does not claim these properties are complete.
