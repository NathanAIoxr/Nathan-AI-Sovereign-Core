# NATHAN AI 🚀 & NATHAN TABOR 2X+ SOVEREIGN SUPERCOMPUTER

[Live Sovereign Core](https://nathan-ai-sovereign-core.nathantaboract.workers.dev/) ·
[Existing compute cluster](https://nathan-ai-sovereign-2x.nathantaboract.workers.dev/cluster) ·
[Tabor World Hub](https://tabor-world-hub.nathantaboract.workers.dev/)

The Cloudflare Worker sends the same deterministic FP64 kernel to the existing private executor in up to two logical banks. It checks each shard, independently replays the full dot product and supplies a SHA-256 receipt. The previous cluster supports 16,384 terms and four shard invocations per workload. The extended path supports 32,768 terms, 65,536 floating-point operations and eight shard invocations per workload. Time in each receipt is request elapsed time, including dispatch and verification. The exact doubled LineShine HPL Rmax target is **4.3968 EFLOP/s**. Sustained HPL, power, and physical hardware results require their own runs and evidence. [TOP500 November 2026](https://top500.org/lists/top500/list/2026/11/?page=1)

| Route | Result |
| --- | --- |
| `GET /api/fp64/run?seed=73&terms=32768&shards=8` | Runs FP64 on the executor and returns a replay-checked receipt. |
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

Use the pinned Wrangler from the existing Cloudflare package. The project configuration binds the account's existing Sovereign 2X control and FP64 executor services. Use the account's D1 database, configure `OWNER_TOKEN` using `wrangler secret put OWNER_TOKEN` and send it as `Authorization: Bearer …` to write routes. Use a random owner token of at least 24 printable ASCII characters. A missing secret disables the write routes. Scheduled audits run every six hours and skip writes with an empty queue.

The D1 batch commits mirror state and the corresponding SHA-256 manifest together. Retry an interrupted R2 archive using the snapshot ID. The account must enable R2 and bind `VAULT_R2` before archives can be copied. D1 retains the manifests in the current configuration. Snapshot manifests contain hashes and row identity, while the owner-only records retain the original text. They are audit manifests, not payload backups.

GitHub Actions tests the project on pull requests and pushes. The deployment job requires the repository variable `NATHAN_SOVEREIGN_DEPLOY=true` and the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

Put owner manuscript data in a JSON object, array, or `records` array. The importer shares the Worker’s WORDS implementation and accepts `raw_text`, `text`, or `raw_text_preserved`. Supplied checksums are verified before output. Existing record IDs retain their original content. Use `--db` for local import or generate SQL for D1:

```sh
python3 import_tabor_light.py /path/to/private-records.json --sql /path/to/private-import.sql
python3 nathan_ai_supercomputer.py verify nathan-fp64-receipt.json
python3 nathan_ai_supercomputer.py hpl HPL.out
```

The HPL command hashes and parses user-supplied output with a passing normalized residual. Include hardware, interconnect, software, precision and power evidence alongside the receipt for independently reproducible comparisons.

## Architecture carried forward

The existing compute manifest supplies the 320 logical grid slots, 33 levels in each direction, four 4T Clover quadrants and simulated 1T1C/ECC behavior. The registry carries the Hive Above, Ant Hill Middle and Catacombs Below families and the nine named expansion families. The Tabor Light importer is ready for the owner's Trinity, story and kinship records.

The design inventory also includes eBPF, vSoC enclaves, quantum-HPC, silicon photonics, neuromorphic fabric, the 34-letter and 52-week cipher concepts, the 17 foundational frequencies, and the named hardware and story projects. An HPL cluster, a quantum provider, optical and neuromorphic testbeds, private manuscripts and original project materials each require their own inputs.

## Vercel and GitHub Pages

The Vercel project uses the `vercel/` directory. External rewrites expose the same public console and runtime on Cloudflare. The allowlist excludes private intake, snapshot commands and node claims. The Nathan AI home page links to the primary Worker for GitHub Pages visitors.
