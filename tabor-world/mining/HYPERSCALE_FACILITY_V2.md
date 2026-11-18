# TABOR CORP Hyperscale Mining Facility — Infrastructure Specification v2

**Scope:** Preserve existing Nathan Tabor Supercomputer, Cloudflare Hub, and mining command center. This is a facility architecture specification, **not an installed mining facility**.

## 1. Electrical and facility layer
- Utility interconnection study, approved substation capacity, transformers, protection relays, switchgear, metered distribution, grounding and arc-flash safety.
- Define per-rack power envelopes and documented PDU voltage/current limits from actual ASIC specifications.
- Model staged curtailment as an authorized, fail-safe operational control. Never issue live grid or hardware power commands from a public endpoint.
- Evaluate air, hydro and dielectric immersion cooling against ambient temperature, fluid compatibility, maintenance, fire protection and heat rejection.
- Do not assume 100–500 MW site capacity, UPS-free operations, or a particular cooling solution without engineering review.

## 2. Mining silicon and control layer
- Bitcoin SHA-256d proof-of-work is computed on dedicated ASIC hashboards; ARM/Linux control boards coordinate work, telemetry and firmware.
- Inventory: manufacturer, model, serial, firmware signature, rated TH/s, rated watts, joules/TH, rack position, cooling mode, maintenance status.
- Do not infer 3–5 nm fabrication or 1 PH/s performance for unspecified hardware.
- Keep management CPUs, ECC RAM, full-node SSDs, and AI accelerator resources distinct from ASIC hashing resources.

## 3. Mining network
- Segmented ASIC VLANs; local aggregation switches; redundant authorized upstream connectivity; no unrestricted public management interfaces.
- Stratum V2 where device/pool compatibility is verified, with encrypted channels and job negotiation as supported.
- Optional local proxy aggregation and independent Bitcoin Core full nodes; measure connection fanout, accepted/rejected shares, block-template freshness and propagation latency.
- Treat claimed 70% bandwidth reductions and <2 ms switching as unverified until reproduced under the selected topology.

## 4. Software and agents
- Firmware qualification and rollback, Bitcoin Core node monitoring, Stratum proxy health, thermal alerts, capacity planning and audited maintenance workflows.
- ABM Master Brain routes tasks to specialized *authorized* agents; no unsupervised firmware flashing, wallet transfers, mining-pool changes, or electrical switching.
- The existing Tabor World Hub, D1 registries, Supercomputer and mining dashboard form the control plane. ASICs and Bitcoin nodes run on separate physical infrastructure.

## 5. Data model
`facility -> power_zone -> rack -> miner -> hashboard -> chip`
`facility -> switch -> proxy -> pool`
`facility -> full_node -> block_template`
`event -> review -> approved_action -> execution_receipt`

Track timestamped telemetry, uptime, shares, difficulty, hashrate, temperature, input power, power price, and PUE. Retain original evidence, source hashes, configuration versions and non-destructive rollback paths.

## 6. Hardware procurement gates
Facility feasibility, electrical engineer approval, cooling design, ASIC and firmware compatibility, network architecture, cybersecurity, local regulations, insurance, cost modeling, and a metered pilot. No physical equipment has been procured by this repository.

## 7. Test and acceptance gates
- Deterministic SHA-256d test vectors and Bitcoin genesis header verification.
- Local Stratum interoperability tests with authorized test endpoints.
- Simulated rack/thermal/power telemetry and alert thresholds.
- Reproducible energy efficiency benchmarks, never an assumed 16:1 gain.
- Authenticated APIs, least privilege, human approval for irreversible actions, and complete receipts.
