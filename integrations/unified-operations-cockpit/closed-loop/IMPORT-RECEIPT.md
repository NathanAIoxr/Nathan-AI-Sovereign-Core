# Verified closed-loop catalog consolidation — 2026-11-18

Cloudflare account: `a70580bacdf96c946662b7b67dcb45b5`
Destination D1: `nathan-ai-cockpit-ledger` (`ee93da4e-7d2d-4440-9dfc-ce4b6cdbdb3c`)
Destination table: `unified_catalog`

| Origin table | Rows |
| --- | ---: |
| tabor-global-import-catalog.global_atlas_public_repos | 205 |
| tabor-global-import-catalog.global_atlas_components | 334 |
| tabor-global-import-catalog.global_atlas_layers | 18 |
| tabor-global-import-catalog.global_atlas_sources | 13 |
| tabor-global-import-catalog.imported_workers | 15 |
| tabor-global-import-catalog.global_atlas_existing_fleet | 505 |
| tabor-fleet-registry.fleet_entry | 505 |
| tabor-fleet-registry.virtual_supercomputer_slot_v1 | 1000 |
| nathan-ai-global-catalog.catalog_items | 1536 |
| **Verified total** | **4131** |

D1 query `SELECT COUNT(*) n FROM unified_catalog` returned `4131`.

The master catalog count of 1,536 includes the earlier 1,075-item atlas linkage. Records are not deduplicated across different source tables. Existing source databases and script resources were not deleted.

New source code: `closed-loop/worker.js`, `closed-loop/wrangler.toml`, `closed-loop/schema.sql`.

**Deployment state:** Source code committed, D1 schema applied and data imported. Worker deployment, secret bindings, live dispatch namespace access, Clouder Pro session integration, GitHub callbacks, and mobile operation are not yet verified. No source record has been marked installed merely because it was indexed or committed.

**Security:** Do not add unrestricted script execution, deletion of unified_catalog, or callbacks that claim installed status based solely on GitHub workflow completion.
