# HYPERBOLIC SYMBIOTIC QUANTUM PHYSICS SUPER HEROINE 🦸‍♀️ COMPUTER 💻 🖥️ 📱

**by Nathan Tabor — PK, KJV, IFB, BBof3, HA, LU, DOG**

The Nathan Tabor Ai AGI SI EI SoS et al  
Mirrored `ia iga is ie SoS la te`

[Live dashboard](https://tabor-super-heroine-computer.nathantaboract.workers.dev/) · [Federation architecture](https://tabor-supercomputer-federation.nathantaboract.workers.dev/v1/hypercomputer)

## Recurring compute

Cloudflare Cron starts a new generation every minute in UTC, with no end date. Each generation builds a versioned manifest, runs it on a primary and two independently addressed SQLite-backed Durable Objects, and verifies all three digests against a local reference. Each replica persists its result. These instances share a Cloudflare account and region placement is provider-managed. They are logical replicas within one deployment.

- `1+1=2 Build` derives a manifest and claim from the UTC time bucket.
- `1−1=0 Clear` expires completed generation details after 30 days and preserves cumulative counts.
- `1×1=1 Integrate` assembles the three stored copies under the same generation ID.
- `1÷1=1 Verify` recalculates digests and records verification or mismatch.

A generation runs the integer tensor, classical Bell statevector, and synthetic Library of Tabor retrieval workloads. Duplicate cron deliveries use a unique slot and lease. Failed replicas retry on subsequent ticks, with up to five attempts per generation. A failed generation or a mismatch does not stop later generations. For retries that outlive a lease, a fenced attempt number prevents stale workers from updating the final receipt. After a scheduler outage, the next tick starts a new generation and resumes recorded pending work. Missed time slots without records are skipped.

Version 2 activates at 2026-11-18 15:48 UTC and adds a deterministic millisecond workload. Each replica processes the preceding minute's 60,000 millisecond timestamps in a single invocation and records the window and checksum. The cumulative logical-tick counter increments once per verified generation. Cloudflare still wakes the Worker on a minute schedule. Historical version 1 manifests and digests retain their original format.

Verified generations are also copied to a separate SQLite-backed Durable Object namespace, split into 16 archive shards. Each scheduled tick prioritizes the current cycle and backfills up to five other eligible receipts when the current cycle is ready. Failed archive writes are retried after an hour. The archive recomputes the result hash, checks the three matching replica hashes, and stores a digest over the combined receipt and artifact. Copies are accessible for 90 days, even after the 30-day working retention has elapsed. Both storage paths use Cloudflare.

## Routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/` | Dashboard and latest receipts |
| GET | `/v1/status` | Counters and latest 12 generations |
| GET | `/v1/architecture` | Live architecture from the existing federation service |
| GET | `/v1/receipts/cycle-<slot>` | Generation verification, attempts, and per-copy hashes |
| GET | `/v1/results/cycle-<slot>` | Verified artifact, with fallback to the other stored copies |
| GET | `/v1/archives/cycle-<slot>` | Independently readable archive record containing receipt, artifact, and archive SHA-256 |
| POST | `/v1/operator/tick` | Start or retry the current slot with an operator bearer token if configured |

The public routes expose only synthetic workload data. Receipts are SHA-256 integrity records for the JSON manifest and results. The scheduled workload runs on Cloudflare CPUs. The Bell trial is a classical simulation.

The receipt and result routes fall back to a verified archive after working copies or the live coordinator become unavailable. The archive route reads and verifies the archival copy directly. It does not require a live coordinator or working replica.

## Run and validate

```sh
node --test worker.test.mjs
python3 accelerator_probe.py --backend numpy --size 256
```

The Worker configuration references the existing `tabor-supercomputer-federation` service in the same Cloudflare account. Deploy with the repository's Cloudflare tooling and the supplied `wrangler.toml`. Deploying or enabling the Cron Trigger starts the schedule. Remove the Cron Trigger in Cloudflare to pause it. The optional operator secret is unset by default.

The accelerator probe requires NumPy. Install the backend-appropriate JAX runtime from the [official JAX installation guide](https://docs.jax.dev/en/latest/installation.html) on an existing authorized GPU or TPU host before running an accelerator trial.

```sh
python3 accelerator_probe.py --backend jax-gpu --devices 2 --size 256
python3 accelerator_probe.py --backend jax-tpu --devices 4 --size 256
```

The probe supports multiple local devices on one host. It refuses an unavailable requested backend, verifies its device output against exact integer arithmetic, and emits device names, completed-kernel timing, and a benchmark digest. Multi-host training, model serving, and physical quantum executions need separate provider allocation and validation.
