# Nathan AI — Full-fidelity restoration, not a flattened worker count

## What the user requested

Preserve everything discovered from outside sources, including repositories, components, books, technology sets, logical compute plans, existing account Workers and the 1,000 dispatch scripts. Distinguish references from source code and deployments. **Never mislabel catalog rows as executable Workers.**

## Verified live D1 restoration (November 18, 2026 account-local; reconciled just after midnight UTC)

Reused the existing **nathan-ai-cockpit-ledger** without erasing the pre-existing flat `unified_catalog`. Restored **7,717 full original records** (one new concordance receipt was observed after the earlier 7,716-record snapshot), including all JSON fields, original IDs, source database/table, source URLs, original declared status, type classification, custody, and operational-state evidence.

Reconstructed **7,419 exact relationship edges** linking mirrored external repos, fleet entries, master catalog records, layers, worker-account references, source catalogs, and 1,000 logical supercomputer slots to their separate apps, books and technology sets. Links are based on explicit matching source IDs, not guesswork.

The 1,000 owned Cloudflare dispatch scripts remain intact; their original **1,000 private D1 source snapshots** containing 2,011 modules are referenced by `code_snapshot_ref`. The language shard data remains in the existing concordance and language D1 tables. **No third-party repository was automatically cloned or executed.**

### Counts by source origin (source records, not unique executable programs)

| Original source | Count |
|---|---:|
| `tabor-global-import-catalog` | 1,618 |
| `tabor-fleet-registry` | 3,515 |
| `nathan-ai-global-catalog` | 1,584 |
| `nathan-tabor-platforms` dispatch namespace | 1,000 |
| **Full original records** | **7,717** |

There are **19 D1 source tables** (18 populated and one empty `catalog_events`) plus the namespace. The current 1,618 global source rows include a newly created audit receipt. Data can change as other authorized jobs run.

### Non-interchangeable resource categories

- **205 external GitHub repositories** in Global Atlas, independently mirrored in master catalog; status explicitly `discovered_not_installed`. Repository licenses in the master catalog are blank, so no code was cloned or installed without reviewing licenses and dependencies.
- **505 fleet catalog entries** occur in both Global Atlas and the fleet registry and also mirror master catalog pointers. These mirrors are relationship-linked rather than multiplied into fictitious unique Workers.
- **334 technology components** and **18 layers** are reference knowledge and taxonomy, not running programs.
- **525 inventoried owner resources** include Workers, D1, KV, R2, Queues, and Workflows; latest ownership inventory must be checked against the account when making live claims.
- **1,000 dispatch namespace scripts** are actual account scripts. The 989 language shards are executable data endpoints backed by 27,275 Glottolog records, not independent supercomputers.
- **1,000 logical supercomputer slots**, **1,000 book-set pointers**, and **1,000 technology-set pointers** remain three separate typed sets, joined with five app definitions. These represent plans and catalog references, not physical hardware.

## Design

The full-fidelity restoration is in the **private D1** tables:

- `restored_resources_v1`: full JSON originals, canonical UID, resource kind, custody, evidence-based state, original URLs and private-code snapshot pointer.
- `restored_resource_links_v1`: exact-evidence directed relationships between original records.
- `restoration_receipts_v1`: durable progress and source reconciliation receipts.
- Existing `dispatch_script_snapshots`: private Worker source archive; **not** included in the public GitHub manifests.

This Worker provides a small, read-only viewer. Public routes: `/`, `/health`, `/api/summary`, and `/api/public-repositories` (limit 50, cursor via offset). Details of account Worker names, original source JSON and graph links require `RESTORE_READ_KEY`: `GET /api/private/find?q=...`, `GET /api/private/record?uid=...`. The private endpoints are disabled until the owner provisions the secret. No external command execution, third-party scanning, mass cloning, or write API exists.

The six-hour Cron `47 */6 * * *` performs an integrity check and logs the result; it does **not** execute 7,717 rows.

## Deployment and verification

Use this directory's Wrangler config, then bind the existing D1 and deploy. Verify actual Cloudflare Worker version/deployment, the workers.dev route, and a successful HTTP smoke test separately. The Cloudflare API confirms resource creation and binding state; a returned deployment object alone does not prove successful public requests.

The source lists in this directory retain external project attributions and original source identifiers. Treat them as **discovery metadata**, not relicensed or rebranded copies. Any future licensed import must fetch an approved upstream commit, record SPDX license, verify checksums and dependencies, run tests in an isolated environment, and be enabled explicitly for an owned destination.
