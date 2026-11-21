# Nathan Tabor Supercomputer / TABOR CORP — Physical Hardware Blueprint v1

**Status: engineering specification, not purchased, provisioned or installed.**

## Reference systems
- Foundry USA: mining pool coordination; pool hashrate is not one operator's hardware.
- MARA: industrial mining operator; SEC 2026-09-30 report describes ~435,000 rigs, 71.2 EH/s energized hashrate, 1.9 GW energy capacity. These are *benchmarks*, not claims about TABOR CORP.

## Hardware roles
| Tier | Chips / Compute | RAM | Storage | Network | Purpose |
| --- | --- | --- | --- | --- | --- |
| Edge management | modern multi-core CPU with TPM 2.0 | 32–64 GB ECC where supported | mirrored enterprise SSDs, 1–2 TB | redundant 10 GbE | secure gateway, telemetry, configuration |
| Ledger validation | x86-64 / ARM64 CPU | 32–128 GB ECC | 2–8 TB NVMe with backup | 1–10 GbE | Bitcoin full nodes and consensus validation |
| AI / Supercomputer | CPU + optional accelerator | 128–512 GB ECC per node | 2–8 TB NVMe scratch; R2 for archives | 25–100 GbE where justified | modeling, analysis, task agents, simulations |
| Mining | SHA-256 ASICs for Bitcoin | device-specific firmware memory | management/log storage only | isolated Ethernet | actual proof-of-work computation |
| Other chains | algorithm-compatible CPU/GPU/ASIC only after network-specific verification | device-specific | chain-specific | isolated VLAN | Alephium / Quai / Iron Fish research; do not assume CPU viability |
| Archive | storage server with ECC | 32–128 GB | redundant HDD arrays + offsite encrypted copies | 10 GbE | source originals, receipts, checkpoints |

## Controls
1. Separate physical mining networks from Tabor World public APIs and wallet custody.
2. Hardware-backed credentials; secrets never in GitHub or public D1 records. Do not use voicebox words as the sole wallet security.
3. Signed firmware, controlled upgrades, authenticated miner telemetry, independent full-node validation.
4. Measure joules/TH, uptime, power tariff, temperature, rejected shares, stale blocks, storage integrity, PUE.
5. Protect original code and evidence with content hashes, versioned snapshots, and review-gated deployments.
6. No 16:1 cost-efficiency or SHA-256 inversion claims without reproducible independent benchmarks.
7. No 5-million-proxy network should be deployed without a legitimate capacity plan, provider authorization, abuse prevention, and budget.
8. Actual hardware procurement needs power, facility, cooling, rack, insurance, networking, jurisdiction, budget and physical safety review.

## Logical design
Tabor World Hub -> authenticated Supercomputer API -> task queue -> independent verified executor -> hardware telemetry -> D1 receipts + encrypted archive. Mining ASICs connect to approved mining pool or self-hosted node, **not to Cloudflare Worker CPU for mining**.

## Build phases
- Phase 1: source inventory, coin provenance, simulation, read-only telemetry dashboard.
- Phase 2: deploy authorized local full node, benchmark SHA-256d verifier, establish monitoring.
- Phase 3: procure a pilot miner and meter energy; calculate actual unit economics.
- Phase 4: expand only after verified performance, thermal, reliability, and security results.
