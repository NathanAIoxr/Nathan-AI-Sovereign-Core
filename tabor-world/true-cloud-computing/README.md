# TRUE CLOUD COMPUTING BY NATHAN TABOR

[Live service](https://tabor-true-cloud-computing.nathantaboract.workers.dev/) · [Tabor World Hub](https://tabor-world-hub.nathantaboract.workers.dev/) · [Architecture API](https://tabor-true-cloud-computing.nathantaboract.workers.dev/api/architecture)

GitHub holds the source and CI workflow. A Cloudflare Worker serves the dashboard and typed API. D1 stores job claims, results, and SHA-256 receipts. The federation route checks fixed Cloudflare service bindings for Tabor World Hub, the Nathan AI 2X+ Sovereign Supercomputer, and the Compute Fleet Registry. The edge location is the Cloudflare data center reported by the request.

## API

| Route | Purpose |
| --- | --- |
| `GET /api/federation` | Edge location and live reachability of the three bound services |
| `GET /api/status` | Job totals and counts from the underlying infrastructure registry |
| `GET /api/jobs` | Recent jobs, including history from the earlier schema |
| `GET /api/jobs/:id`, `GET /api/jobs/:id/audit` | Current receipt and independent SHA-256 recomputation |
| `GET /api/act/address?label=Pie+Pi+Phi` | Derive a repeatable ACT ID, pie sector, and phi phase |
| `POST /api/jobs`, `POST /api/run-next` | Owner-only queue and dispatch, enabled with `TRUE_CLOUD_TOKEN` |

The 15-minute Cron queues a bounded inventory audit, telemetry count, and known-vector SHA-256d self-test. Repeated Cron delivery reuses the same job IDs. D1 batches atomically claim each job, recover expired claims, and fence completion. Manual job requests can set an `Idempotency-Key`. Source-level health describes reachability. Fleet enrollment and measured physical compute are separate evidence.

## NATHAN AI — NATHAN TABOR 2X+ Sovereign Supercomputer

Open `/compute` to run the two-box FP64 job path. Each tenant has a separate credential, daily operation budget, job view and idempotency namespace. The existing Sovereign AI Unit inference endpoint keeps its own contract and credentials. The `/compute-platform` bridge is available on the same site for its job and artifact API.

| Route | Purpose |
| --- | --- |
| `GET /api/compute/manifest` | Runtime contract, namespaces, allowed workload and operation budgets |
| `GET /api/compute/benchmark/probe` | Run the fixed public software vector and verify the result |
| `GET /api/compute/benchmarks` | Read and verify the last 12 scheduled benchmark receipts |
| `POST /api/compute/jobs`, `GET /api/compute/jobs` | Submit or list jobs in one project |
| `GET /api/compute/jobs/:id`, `GET /api/compute/jobs/:id/receipt` | Inspect job events or audit a completed receipt |
| `POST /api/compute/jobs/:id/cancel` | Cancel a job before its result is committed |

Set `FABRIC_PIE_PI_PHI_TOKEN` and `FABRIC_SUPERCALIFRAGILISTICEXPIALIDOCIOUS_TOKEN` to different random Worker secrets. Send the corresponding project slug in `X-Tenant`, the token as an Authorization bearer, and a stable `Idempotency-Key` for each submission. Submit JSON with an unsigned 32-bit `seed` and `terms` from 64 to 4096. The manifest lists the per-project quota. Quotas count admitted operations once per job, including cancelled jobs, on a UTC day. They are independent of cloud billing.

The gate records accepted jobs and state changes in D1. The engine claims work with a fenced lease, calls the existing Sovereign 2X+ service binding, replays the FP64 result independently, and commits the verified receipt with the completed state in a transaction. Cancellation prevents result commit. Work in flight may finish at the upstream runtime. Cron recovers expired work and archives one fixed-vector benchmark per 15-minute bucket. Results and evidence are in D1. Physical benchmark verification still needs measured hardware runs. A missing execution timer is represented by a null rate.

## The Global Technology Stack

The `/technology` dashboard covers the physical foundation, binary switch, four functional layers, and centralized and distributed deployment patterns. Its two-bit trace evaluates logic gates and a half adder in the Worker. It checks the D1 binding with a read-only query and reports Cloudflare ingress when available. Use `GET /api/technology` for the map and `GET /api/technology/trace?a=1&b=1` for a live example.

## Pie / Pi / Phi

The math uses π ≈ 3.141592653589793 and the golden ratio φ = (1 + √5) / 2 ≈ 1.618033988749895. A versioned digest supplies the ACT ID. Fixed-point mappings give a 12-sector pie index, angle, and φ phase without storing input labels in D1. This module is an implementation of the addressing idea in the supplied notes. Its scale constants and 12 sectors are software design choices.

## Build and deploy

Use Node 24. Run `npm test` and `npx --yes wrangler@4.164.0 deploy --dry-run` in this directory. Apply `schema.sql` to the D1 binding before deployment. The schema adds claim and receipt tables alongside existing jobs.

The GitHub workflow verifies pull requests and can publish on relevant pushes to `main` or an explicit manual dispatch on `main`. Its deployment job needs the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Configure the separate `TRUE_CLOUD_TOKEN` via Cloudflare to enable owner submissions. Scheduled jobs run independent of that secret.
