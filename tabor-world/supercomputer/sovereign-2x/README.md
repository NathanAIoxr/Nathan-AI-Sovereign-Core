# NATHAN AI 🚀 & NATHAN TABOR 2X+ SOVEREIGN SUPERCOMPUTER

[Cloudflare control plane](https://nathan-ai-sovereign-2x.nathantaboract.workers.dev/) · [Architecture API](https://nathan-ai-sovereign-2x.nathantaboract.workers.dev/api/compute/manifest) · [Receipt journal](https://nathan-ai-sovereign-2x.nathantaboract.workers.dev/api/compute/receipts)

## Running system

The interactive control plane runs a bounded binary64 dot product. It models the 320-slot (10 × 32) grid, 732,000,000 logical addresses, and 33 forward/reverse transitions. The Slayer classifies invalid and clear packets. The software 1T1C DRAM model uses SECDED(39,32) to correct one flipped bit and detect two. A detected double-bit fault quarantines the work before the kernel. The Sleyer builds the 78-field, eight-layer receipt and preserves a SHA-256 proof. The Mirror independently replays the kernel and route.

| Operation | Interface |
| --- | --- |
| Run live demonstration | `GET /api/compute/probe?seed=73&terms=2048&faults=1` |
| View the design targets and telemetry contract | `GET /api/compute/manifest` |
| Read recent D1 receipts | `GET /api/compute/receipts` |
| Read and replay a D1 receipt | `GET /api/compute/receipts/:id`, `GET /api/compute/receipts/:id/audit` |

The public probe returns its receipt to the caller. The 15-minute Cron writes the software check to a dedicated D1 journal using an idempotent schedule bucket. Existing registry, architecture, and telemetry routes remain accessible. The dashboard export is a static read-only mirror of this service.

## Local Python and verification

```sh
python3 nathan_ai_supercomputer.py --db ./telemetry.sqlite3 run --seed 73 --terms 2048
python3 nathan_ai_supercomputer.py --db ./telemetry.sqlite3 audit RUN_ID
python3 nathan_ai_supercomputer.py verify-edge saved-probe.json
python3 nathan_ai_supercomputer.py targets
npm test
npm run mirror
```

Use Node 24 and Python 3.12. The expected seed-73, 2,048-term checksum is 524311609 in both runtimes. Kernel timing measures the dot product, excluding routing, hashing, and database I/O. The browser displays a rate only when the Worker timers observe a positive duration. SQLite is the local journal and D1 is the deployed journal. SHA-256 detects changes against a known receipt hash. It does not attest hardware identity.

## Deployment

GitHub Actions runs the tests and builds the mirror on relevant changes. Its manual Cloudflare deployment option requires repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Provide a token with access to the target Worker and D1 database. The deployment applies `compute.sql` before starting the Worker. The Vercel mirror can deploy the two files from `dist/` as a static site using the live Worker API.

## Benchmark evidence

The 4.396+ EFLOP/s, 3.618 EFLOP/s, and 2 ZFLOP/s values are design targets. TOP500's November 2026 HPL table lists LineShine at 2.1984 EFLOP/s and El Capitan at 1.809 EFLOP/s. The exact 2× amount for LineShine is 4.3968 EFLOP/s. [TOP500 results](https://www.top500.org/lists/top500/list/2026/11/?page=1)

HPL or efficiency claims require a run on provisioned hardware with its configuration, benchmark log, and measured power if comparing energy efficiency. The current grid, DRAM fault injection, and symmetric quantum–classical routes are software models. eBPF, physical interconnects, enclaves, photonics, neuromorphic devices, and quantum execution are tagged in the manifest as hardware integration or research targets.
