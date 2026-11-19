# Nathan AI — Global Infrastructure Atlas
Updated: 2026-11-18. This additive package does not replace existing Nathan AI apps, worker registries, or automations.

## Coverage
The public read-only Cloudflare Worker indexes **18 layers** from physical connectivity and pre-OS firmware to agents, bots, messaging, IoT, decentralized nodes and observability. Each seed component has a **reference-only status**: no claim of installation, authorization, ownership, or live network presence. The complete separately produced research export contains **871 public-reference components** and preserves the preceding 205-repository catalog. The original seed remains available through the existing endpoints. The full reference snapshot is available through the archive endpoints.

## API
- `GET /health` or `/` — service status and reference counts
- `GET /api/layers` — all infrastructure layers
- `GET /api/components?layer=L11&q=agent&limit=50` — bounded catalog search
- `GET /api/edges` — architecture-only relationships
- `GET /api/sources` — public reference directories
- `GET /api/summary` — coverage, limitations
- `GET /api/archive/summary` — full archive counts and download links
- `GET /api/archive/components?layer=L11&q=agent&limit=50&offset=0` — paginated search over the full reference snapshot
- `GET /api/archive/catalog.json` — canonical reference data, including layers, sources, and relationships
- `GET /archive/download` — complete research bundle, including the offline viewer and SQLite database

## Relationships to existing platform
Existing Cloudflare resources remain unchanged. Use verified service bindings, D1 metadata, and Queue consumer registrations only after inspecting their current schema and access permissions. Kernel projects, BMC/firmware, cloud-hosted broker clusters and IoT gateways are **not** Cloudflare Workers and cannot be bulk-deployed into a Worker runtime. Third-party licenses, dependency provenance and compatible execution environments must be checked before any import. No mass host scans, external infrastructure interjection, unbounded replication, or externally hosted code execution are part of this implementation.

## Build validation
`node --test app-factory/nathan-ai/global-infrastructure-atlas/index.test.mjs`
Scheduled GitHub Action validates this package hourly. The existing Nathan Fleet Builder automation continues approved integration batches.

## Existing account snapshot
At first integration review: Cloudflare **440 Worker scripts, 50 D1 databases, 9 KV namespaces, 6 R2 buckets, 10 Queues and 5 Workflows**. Counts are a point-in-time inventory, not proof of all components working. The repository had 4,865 tracked files/directories. No private IDs or secrets are published here.

## Persistent account integration, verified 2026-11-18

The existing private D1 database `tabor-global-import-catalog` now has additive `global_atlas_*` tables. Its original `imported_workers` table was preserved. After an account-scoped read and write verification, the catalog contained:

| Data family | Verified records | Interpretation |
| --- | ---: | --- |
| Layers | 18 | Conceptual infrastructure levels |
| Curated components | 334 | Public reference components, not installations |
| Prior public repositories | 205 | Source candidates, all discovery-only |
| Public source directories | 13 | Lookup catalogs and standards references |
| Owner Cloudflare resources | 525 | 444 Worker script names, 50 D1, 10 KV, 6 R2, 10 Queues, 5 Workflows (snapshot only) |
| Existing 101×5 fleet crosswalk | 505 | Entries from `tabor-fleet-registry`; source_state `catalog` |
| Catalog entries matching existing Worker names | 79 | Name-level verification, not health or source audit |

The private D1 resource inventory is intentionally **not exposed** through the public atlas Worker. It can be read only through authorized Cloudflare account access. The Worker serves a static public seed and reads approved public research files from the dedicated `ATLAS_ARCHIVE` R2 binding. It has no D1 bindings. Avoid inferring a host's geolocation or permissions from a registry name.

The original 205-repository seed is stored as `public-github-discovery-205.json` and the bounded read-only search program as `public_discovery.py`. The hourly `nathan-global-software-discovery.yml` action rotates five queries across 20 software topics, 25 code languages, and 14 multilingual terms, and saves candidate reports as ephemeral workflow artifacts for review. It never clones or executes results or deploys them to Cloudflare.

To reproduce the namespaced schema, see `migrations/0001_global_atlas.sql`. Deployments and indexing are independent: an indexed project becomes an actual installation only after explicit compatibility checks, authenticated writes, tests, and a documented deployment receipt.


## Archived source files

- [Whole Global Computing Network Atlas](archive/whole_global_computing_network_atlas.zip) includes the original research exports and the preserved discovery seed.
- [Earlier discovery bundle](archive/global_tech_discovery_bundle-v1.zip) and [later discovery bundle](archive/global_tech_discovery_bundle-v2.zip) preserve both supplied copies. The later bundle matches the discovery script included in the full atlas.

The R2 bucket `nathan-global-atlas-archive` is private. The Worker serves the three fixed download keys and reads the catalog gzip from the `2026-11-18/` prefix. The archive routes use reference data only and accept GET and HEAD requests. The catalog gzip is a compact JSON serialization of `whole_global_network_atlas.json` from the original ZIP.
