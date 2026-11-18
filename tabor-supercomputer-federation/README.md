# Tabor Supercomputer Federation

Operator-facing registry for 1,000 logical edge compute units, numbered from node-001 through node-1000. Each system has its own SQLite-backed Durable Object and a separately addressable database record. Workload attachments describe what is live, simulated, or requires a physical host. Physical processors, storage and mining equipment are provisioned separately.

| Public route | Use |
|---|---|
| / | Federation dashboard |
| /health | Cohort identity, declared slots, and binding availability |
| /v1/nodes | Node ID manifest and per-node task links |
| /v1/tasks | ONE status across all ten task families |
| /v1/nodes/node-1000/assigned-task | Stored evidence receipt for this unit's assigned task |
| /v1/nodes/node-001 | Read an independently provisioned database record |
| /v1/nodes/node-001/matrix-demo | Run the bounded Matrix workload inside the node object |
| /v1/plan?systems=1 | Model one 450 TB system |
| /v1/plan?systems=1000 | Model 1,000 systems |
| /v1/services | Probe the six approved internal service bindings |
| /v1/attachments | Review workload modes and provider requirements |
| /v1/bitcoin-demo | Run the existing fixed synthetic SHA-256d benchmark via the Sovereign Digital Stack |
| /v1/export | Export the intended deployment manifest. It describes desired state. Verify actual node state via the per-node records. |

## Capacity calculation

The decimal model uses 20 drives at 30 TB each. Two drives' worth is parity and one drive is a spare, leaving 17 drives' worth or 510 TB. A 10% holdback yields 459 TB modeled capacity per system, supporting a 450 TB design target before any overhead beyond that holdback. Fifty systems target 22.5 PB, with 1,000 drives, 30 PB raw, and 22.95 PB after modeled parity, spares, and holdback. Independent backup copies and their network capacity are separate. Parity arithmetic does not specify protection across chassis or sites.

The 30 TB drive is a sizing reference. Hardware qualification needs a confirmed BOM and measured capacity, throughput, rebuild impact, recovery time, and available power. For any claim of worldwide leadership, compare matching metrics and measurement dates. Storage capacity, compute throughput and mining hashrate use separate units.

## ONE Sovereign Box workloads

Each unit runs its own named task against a selected record in the 20 → 40 → 80 → 160 dataset. The 1,000 assignments cover ten families of 100 tasks each. Each node stores its result in its own SQLite Durable Object. The shared ledger counts verified receipts by task family. Replaying a batch returns the stored receipts and records each unit once.

Set the two Workers secrets SOVEREIGN_BOX_SEEDS_A and SOVEREIGN_BOX_SEEDS_B to JSON arrays containing the supplied 20 records in order. Set FLEET_TASK_TOKEN to a random bearer secret. Send authenticated POST requests to /v1/tasks/run with start values 1, 26, 51, through 976 and limit=25. The node dataset stays in the Worker secrets. The public routes return task IDs, summary evidence and receipt hashes. Archive the private seed data with its owner. Remove the temporary FLEET_TASK_TOKEN after the run. Changes to the seed data use a new task version so older receipts retain their identity.

## All Roads Lead to Sovereignty

“Every part is whole—there are no fractals.”

Each provisioned unit holds an independent SQLite snapshot of the same 160 Sovereign Box records, plus its own assigned task and receipt. Once written, the local lookup reads that unit's SQLite storage and checks its stored snapshot digest. The shared fleet ledger reports completion and can be unavailable during a node lookup. The 160-record local replica shares a Cloudflare account and provider with the other units. It establishes application-level independence and does not establish physical network or storage independence.

The read gate is POST /v1/nodes/<node-id>/sovereign-road. Request JSON contains road_origin, target_slug and hex_seal. The signed road origin must match the requested node. The target slug must exist in that unit's snapshot and its full 16-bit seal must match exactly. The high byte is 0xFF. The remaining nibbles hold generation and anchor. Authorized lookups return a local sovereign URI and the matching record. Protected responses use no-store. The handler accepts no custom code and performs no payload writes, redirects or external requests.

Set the optional Worker secret SOVEREIGN_ROAD_KEY to an owner-controlled random value of at least 32 characters. Derive a node key as HMAC-SHA-256(master, UTF-8 of sovereign-road-v1/<node-id>). Send X-Sovereign-Timestamp with the 13-digit Unix timestamp in milliseconds. Send X-Sovereign-Signature as the lower-case hexadecimal HMAC-SHA-256 of the timestamp, a newline and the UTF-8 request body, keyed by the raw node key. The time window is five minutes and is suitable for this read-only request. Give a delegated client only its node key. Root authority stays with the Cloudflare account owners and the master credential holder.

The fleet checks and records snapshot hashes. Physical triple-modular redundancy, provider-independent failover, third-party telemetry guarantees, and bare-metal or optical execution require separate infrastructure and evidence.

## Deploy and provision

Run local tests with Node 24. Deploy within the Cloudflare account where the six service bindings are available. For a new account, configure the bindings to that account's services and verify the provider routes before exposing the endpoints.

```sh
node --test worker.test.mjs
npx wrangler deploy
npx wrangler secret put PROVISION_TOKEN
```

Use a randomly generated provisioning token of at least 32 characters. Send an authenticated POST to `/v1/provision?start=1&limit=10`, and advance the start by ten for additional node ranges. Retry individual failed batches if needed. Insert-if-absent preserves the original database record. Check each requested node through its public read endpoint. Remove the provisioning credential when the initial cohort is complete.

The public read API returns inventory, service status and synthetic workload data. It does not accept connection credentials or expose real machine control. GitHub Actions verifies the repository. Actual Bitcoin and cryptocurrency mining requires approved hardware, power, network, and pool connections. Keep mining off GitHub Actions. The same portable manifest can be imported by a compatible registry on another provider with its own database and compute runtime.

## Digital MOMENT × 1,000 and Lisssarrr

The digital allocation assigns twenty logical seats to each of the fifty existing node databases. Each workload request checks the persisted node identity and executes inside its Durable Object. Seat IDs are derived from the node identity. These are logical allocations and runnable models. This release does not host video streams, virtual desktops, or playable clients.

| Route | Output |
|---|---|
| /v1/digital | 1,000-seat allocation and the Nathan Tabor Way steps |
| /v1/nodes/node-001/digital | This node's twenty seats and workload links |
| /v1/nodes/node-001/moment?profile=loaded&seat=seat-0001 | One seat across 120 deterministic sample draws |
| /v1/nodes/node-001/moment?profile=tuned | One run covering the node's twenty seats |
| /v1/nodes/node-050/lisssarrr?exercise=backup-restore | Fixture-based defensive recovery timeline |
| /v1/nodes/node-050/lisssarrr?exercise=backup-restore&recovery_source=missing | Recovery blocked because a prerequisite is unavailable |

MOMENT models render frame time, input-to-display delay, and network RTT independently. Profiles are baseline, loaded, tuned, clarity at 240 Hz, and speed at 720 Hz. Loaded and tuned share display and rendering assumptions so you can see the modeled effect of queueing. The per-seat random seed makes the comparison repeatable. The p50, p95, and p99 values are synthetic, with no game-server latency or hardware benchmark claims.

Lisssarrr supports identity recovery, backup restore, and service recovery using local synthetic fixtures. It records detect, contain, recover, and verify stages. Each exercise can test an available or missing recovery prerequisite. It sends no external requests and changes no real account or service.

Both workloads return a SHA-256 receipt over the UTF-8 bytes of the JSON response fields without the receipt, using their original order. This is a reproducibility and integrity check, not a signed attestation or a stored audit log. Existing node records, public provisioning permissions, and the physical capacity model stay outside these runtime simulations.

## Hyperbolic Symbiotic Quantum Physics Super Heroine Computer

Read [Nathan Tabor's original design input](HYPERCOMPUTER-DESIGN-INPUT.md) alongside the runnable model. The design input retains its supplied claims and terminology. The live API records the verified reference specification and units separately.

| Route | Purpose |
|---|---|
| /v1/hypercomputer | Full project identity, primary and mirrored names, infrastructure layers, existing workload links and execution status |
| /v1/hypercomputer/plan?chips=9216 | Ironwood theoretical peak, aggregate device-local HBM, and provider constraints. Arbitrary counts are arithmetic scenarios. Actual supported slice shapes and quota depend on the provider. |
| /v1/hypercomputer/run?size=12 | Bounded integer matrix multiplication. Six existing node databases serve independently addressed row shards, then the Worker assembles the result, checks every output cell and issues a SHA-256 receipt. |

### Physical build qualification

| Layer | What to carry forward | What to measure before expanding |
|---|---|---|
| Tensor compute | Ironwood reference, with separate evaluation for the eighth-generation training and inference products. Pick the workload, precision, and topology before making a reservation. | Training tokens per second, model quality at the chosen precision, step-time distribution, and recovery after a worker loss. For serving, time to first token and throughput at a specified latency objective. |
| Hosts and offload | Use the host and offload configuration available for the selected accelerator SKU. Axion and Titanium describe provider technologies, and their availability depends on the actual deployment. | Host-to-device stalls, input delivery rate, security policy enforcement, and accelerator utilization. |
| Electrical and optical fabric | Model on-chip, ICI and between-slice communication as different links. Jupiter and MEMS optical switching are infrastructure references. | Collective bandwidth inside and across slices, retry rate, oversubscription, and the time lost to communication. |
| Memory and storage | Reserve device-local HBM for tensors and caches. Stage datasets and checkpoints through a verified host and storage path. Set retention and a separate restore destination. | Per-device memory balance, cache pressure, checkpoint flush and restore time, and integrity after a restart. |
| Facility and cooling | Treat cold plates, cabinet power, coolant distribution and heat rejection as a single engineered system. | Wall power, coolant temperature and flow, steady-state clock behavior, and recovery during an approved maintenance exercise. |
| Runtime and orchestration | Use a provider-approved GKE TPU configuration, with JAX/OpenXLA and Pathways where applicable. Keep model code and configuration portable. | Reproducibility across fresh jobs, multi-slice scaling efficiency, checkpoint recovery, and cost per useful job. |

Start provider validation with a supported small slice and scale after the same workload has a repeatable benchmark. The Cloudflare runner performs integer arithmetic on existing logical nodes. No TPU, optical fabric, or quantum hardware has been provisioned by this release. The receipt covers UTF-8 JSON without the receipt field in its original property order. It is a reproducibility check, not a signed attestation.

## One into Zero and power planning

- `/v1/hypercomputer/gate?bits=1110000` runs the seven-bit sequence model and checks the existing Family Federation binary header through the FAMILY binding. Other seven-bit strings produce a closed state. A response is a local digital result and has no authorization side effects.
- `/v1/hypercomputer/power/sources` lists public source references for grid, utility, nuclear, renewables, onsite generation, and storage.
- `/v1/hypercomputer/power?utility_mw=10&onsite_mw=2&stored_mwh=4&discharge_mw=2` shows a modeled planning example. An empty request defaults to zero supplied capacity.
- The example credits the lower of storage discharge rating and usable energy divided by the selected window. Then it subtracts the reserve, divides by facility PUE, and floors the number of workload slots based on per-slot draw. Treat all inputs as independently deliverable at the same time. Supply availability and purchased compute require separate verification. No dispatch or telemetry ingestion is configured.
