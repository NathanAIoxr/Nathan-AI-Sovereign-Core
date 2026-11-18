# Nathan Mind Fleet

By Nathan Tabor and Nathan AI.

The fleet retains 101 `NTW-001` through `NTW-101` Worker IDs and 101 corresponding `NTB` bot IDs. Every pair performs a specific operation and has a sample payload. The Worker performs the operation. The bot performs the operation and returns a targeted review of its output. These are deterministic, on-demand bots. The registry and workbench are one deployment, with 101 individually named Cloudflare Workers using the same source and their individual `FLEET_MEMBER` binding.

| IDs | Group | Examples |
| --- | --- | --- |
| 001–010 | Language and phonetics | Root evidence, grapheme mirrors, acrostics, cadence and homophone review |
| 011–020 | Logic and attributes | Label-free comparison, cause hypotheses, base 12 and contradiction audit |
| 021–030 | Handling Life and provenance | Voice Vault, verifiable text, Mosaic metadata and archive fingerprints |
| 031–040 | Find the Tabor and research | Variant matching, lineages, timelines and source-ledger review |
| 041–050 | Library of Tabor and publishing | Catalog entries, editions, rights, A–Z stories and print proof |
| 051–060 | Finger Physics and games | 1-Euro smoothing, lift-off buffer, Safe-Cancel, trackball and cadence |
| 061–070 | Vehicles, hardware and repair | Repairability, OBD code categories, maintenance tracking inputs and cut lists |
| 071–080 | Engineering and diagnostics | Incident timelines, latency, capacity, tolerances and schema drift |
| 081–090 | Operations and releases | Release receipts, scope review, retries, idempotency and handoffs |
| 091–100 | Sovereignty and verification | Consent, least privilege, retention, backups and replica digests |
| 101 | Fleet orchestration | Job-plan review and bounded batch execution |

## Workbench and API

[Open the fleet](https://tabor-nathan-mind-fleet-registry.nathantaboract.workers.dev/). [Open Voice Vault](https://tabor-nathan-mind-fleet-registry.nathantaboract.workers.dev/vault).

- `GET /fleet` returns all pairs, live hostnames, and sample inputs. `GET /worker/14` and `GET /bot/14` return metadata. Send a JSON object with `POST` to run either endpoint.
- Each individual Worker is served at `tabor-nathan-mind-ntw-NNN.nathantaboract.workers.dev`. Run it with `POST /` or run its bot with `POST /bot/N`. Every host exposes `GET /health`.
- `POST /batch` on the registry or Worker 101 runs one to twelve jobs in order. Each job uses `{ "id": "NTB-014", "input": { "value": "144", "from": 10, "to": 12 } }`. It returns a result or error for each job in the same order. It is a synchronous request, with no recurring execution.
- Voice Vault stores audio and typed, pasted, or device-dictated text in IndexedDB on the current browser and origin. Its add-only interface records SHA-256 separately for text and audio. Download originals and receipts from the vault for a portable copy. The vault does not use D1 or automatically transcribe audio. The public workbench API accepts input over HTTPS and does not persist submissions.
- The phonetic tool implements English Soundex and compares caller-supplied, cited root entries. The surname matcher and evidence tools return comparisons of the supplied input. Historical lineage, origin, and ownership require independent source evidence.

## Run and release

```sh
node --test worker.test.mjs
npx wrangler dev
npx wrangler deploy --dry-run
node verify-live.mjs
```

Use Wrangler with authenticated Cloudflare access to deploy the registry. For a member deployment, copy this Wrangler config in the same directory, set its `name` to `tabor-nathan-mind-ntw-NNN`, and add `"vars": {"FLEET_MEMBER":"N"}`, where `NNN` is the three-digit ID and `N` its numeric value. Deploy with `npx wrangler deploy --config <member-config>`. The registry and members share one compatibility date and the same `worker.mjs`, `tools.mjs` and `ui.mjs` source. These public endpoints run on demand and use no secrets, external service bindings, or private archive data.
