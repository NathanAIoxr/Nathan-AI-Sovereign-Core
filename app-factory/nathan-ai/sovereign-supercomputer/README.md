# NATHAN AI 🚀 & NATHAN TABOR 2X+ SOVEREIGN SUPERCOMPUTER

[Live Sovereign Core](https://nathan-ai-sovereign-core.nathantaboract.workers.dev/) ·
[Live Vercel entry point](https://nathan-ai-sovereign-core.vercel.app/) ·
[Existing compute cluster](https://nathan-ai-sovereign-2x.nathantaboract.workers.dev/cluster) ·
[Tabor World Hub](https://tabor-world-hub.nathantaboract.workers.dev/)

## FP64 compute profiles

The console opens in **Expanded FP64**. API requests without a profile use **Classic FP64** and keep the existing receipt format. Both profiles run the same deterministic FP64 dot product.

| Profile | Maximum terms per request | Maximum shard calls | Counted FP64 operations |
| --- | ---: | ---: | ---: |
| Classic (`classic`) | 32,768 | 8 | 65,536 |
| Expanded (`fabric`) | 2,097,152 | 16 | 4,194,304 |

Expanded FP64 processes **64×** as many terms per request. Each shard runs one floating-point multiplication and one addition per term, then checks the result with an exact integer replay. The public Worker validates the input ranges and shard boundaries, combines the checksums, and hashes the receipt with SHA-256. The Python verifier replays the entire input sequence and checks the receipt digest. The reported elapsed time includes dispatch and shard verification.

| Route | Result |
| --- | --- |
| `GET /api/fp64/run?profile=fabric` | Runs the maximum expanded workload with seed 73 and returns a replay-checked receipt. The expected checksum is `549043171266`. |
| `GET /api/fp64/run?seed=73&terms=32768&shards=8` | Runs the classic workload with its original receipt format. |
| `GET /api/cluster/services`, `GET /api/cluster/receipts`, `GET /api/compute/manifest` | Existing cluster services and receipts, plus the 78-field, eight-layer compute contract. |
| `GET /api/architecture`, `GET /api/registry` | Benchmark targets, 172 families, 1,382 Clover nodes, 24 Council entries and 14 supplied app records of 101 slots. The 732 million and 126 billion address spaces are sparse logical capacities. |
| `GET /api/route`, `GET /api/rhythm` | Will, Wheel and Way trace all six directed links and three identities. The 13- and 17-year composition has a shared 221-year recurrence from the chosen anchor. |
| `GET /godtabor`, `POST /api/words` | GODTABOR portal and stateless WORDS preview with verbatim text, grapheme reversal, initials, base-12 address and SHA-256. |
| `GET /api/mirror/status` | Public aggregate and snapshot metadata. |
| `POST /api/intake`, `POST /api/snapshot`, `POST /api/supernodes/claim` | Owner-authenticated writes. Store original text, audit queued records and register verified logical addresses. |
| `POST /api/snapshot/archive` | Owner-authenticated retry by snapshot UUID once R2 is bound. |

## Development and deployment

From the repository root:

```sh
npm ci --prefix app-factory/sovereign-hub/cloudflare
node --test app-factory/nathan-ai/sovereign-supercomputer/runtime.test.mjs
python3 app-factory/nathan-ai/sovereign-supercomputer/nathan_ai_supercomputer.py run
```

From this directory, use the pinned Wrangler to apply the D1 migrations, deploy the private executor, then deploy the public Worker that binds to it.

```sh
WRANGLER=../../sovereign-hub/cloudflare/node_modules/.bin/wrangler
"$WRANGLER" d1 migrations apply SOVEREIGN_DB --remote
"$WRANGLER" deploy --config wrangler.fabric.jsonc
"$WRANGLER" deploy --keep-vars
```

The public `nathan-ai-sovereign-core` Worker serves the console and API, and it calls the private `nathan-sovereign-fp64-fabric` Worker through a service binding. The classic profile uses the existing `nathan-sovereign-fp64-executor` service. Vercel uses the same public API path.

Set `OWNER_TOKEN` through `wrangler secret put OWNER_TOKEN` and send it as `Authorization: Bearer …` to write routes. Use a random token of at least 24 printable ASCII characters. Scheduled audits run every six hours and skip writes with an empty queue.

The D1 batch commits mirror state and the corresponding SHA-256 manifest together. Retry an interrupted R2 archive using the snapshot ID. The account must enable R2 and bind `VAULT_R2` before archives can be copied. D1 retains the manifests in the current configuration. Snapshot manifests contain hashes and row identity, while the owner-only records retain the original text. They are audit manifests, not payload backups.

GitHub Actions tests the project on pull requests and pushes. The deployment job requires the repository variable `NATHAN_SOVEREIGN_DEPLOY=true` and the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

Put owner manuscript data in a JSON object, array, or `records` array. The importer shares the Worker’s WORDS implementation and accepts `raw_text`, `text`, or `raw_text_preserved`. Supplied checksums are verified before output. Existing record IDs retain their original content. Use `--db` for local import or generate SQL for D1:

```sh
python3 import_tabor_light.py /path/to/private-records.json --sql /path/to/private-import.sql
```

## Workload and HPL evidence

Run the deployed expanded profile and replay its receipt locally.

```sh
curl -fsS 'https://nathan-ai-sovereign-core.nathantaboract.workers.dev/api/fp64/run?profile=fabric' -o nathan-fp64-receipt.json
python3 nathan_ai_supercomputer.py verify nathan-fp64-receipt.json
```

The receipt records total operations in a single dot-product request. The November 2026 TOP500 reports **19.71 EFLOP/s** as the combined HPL result for its 500 listed systems. The physical milestone is one sustained HPL run above that published aggregate. Twice LineShine's listed HPL result is **4.3968 EFLOP/s**. [TOP500 highlights](https://www.top500.org/lists/top500/2026/11/highs/) · [TOP500 November 2026 rankings](https://top500.org/lists/top500/list/2026/11/?page=1)

Run HPL on a provisioned physical cluster and retain the raw output, matrix and process grid settings, hardware inventory, interconnect, software versions, precision and power measurements. The HPL command hashes the supplied output and compares results with a passing normalized residual to the published milestones.

```sh
python3 nathan_ai_supercomputer.py hpl HPL.out
```

## Architecture carried forward

The existing compute manifest supplies the 320 logical grid slots, 33 levels in each direction, four 4T Clover quadrants and simulated 1T1C/ECC behavior. The registry carries the Hive Above, Ant Hill Middle and Catacombs Below families and the nine named expansion families. The Tabor Light importer is ready for the owner's Trinity, story and kinship records.

The design inventory also includes eBPF, vSoC enclaves, quantum-HPC, silicon photonics, neuromorphic fabric, the 34-letter and 52-week cipher concepts, the 17 foundational frequencies, and the named hardware and story projects. An HPL cluster, a quantum provider, optical and neuromorphic testbeds, private manuscripts and original project materials each require their own inputs.

## Vercel and GitHub Pages

The Vercel project uses the [`hive/sovereign-supercomputer-vercel/` directory](../../../hive/sovereign-supercomputer-vercel/). External rewrites expose the same public console and runtime on Cloudflare. The allowlist excludes private intake, snapshot commands and node claims. The Nathan AI home page links to the primary Worker for GitHub Pages visitors.


## Cloud Slayer worker registry

[Supercomputer workspace](https://tabor-apps-nathan.pages.dev/cloud-slayer/supercomputer) · [Hypercomputer workspace](https://tabor-apps-nathan.pages.dev/cloud-slayer/hypercomputer)

The two views read the same D1-backed Cloud Slayer catalog, with modules filtered by workspace. Review [Cloud Slayer operations](../digital-flubber/README.md#cloud-slayer-worker-registry) for the inventory snapshot and server-local SQLite setup.
