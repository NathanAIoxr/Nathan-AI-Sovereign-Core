# Tabor Worker Catalog

[Browse the catalog](https://tabor-worker-catalog.nathantaboract.workers.dev/worker-catalog/)
· [Library of Tabor](https://library-of-tabor-archive.nathantaboract.workers.dev/worker-catalog/)
· [Tabor World](https://tabor-world.nathantaboract.workers.dev/worker-catalog/)
· [Federation](https://tabor-supercomputer-federation.nathantaboract.workers.dev/worker-catalog/nodes)

The catalog keeps the 101 numbered entries and nine collections from the submitted list. It labels checked repositories, archived repositories, checked template paths, matches in curated indexes, related references, and index-only entries. Source verification establishes a catalog link. Runtime readiness depends on the particular code revision, license, services, and environment.

## Published surfaces

Each hub's `/worker-catalog/catalog.json` serves the complete release with the same SHA-256. Archive ingestion adds 101 Technology shelf records. The Tabor World destinations feed points to its locally bundled catalog. The `data/release.json` digest covers the exact manifest bytes including its final newline.

The federation manifest supplies the 1,000 node identities for the batch. Each logical slot has an independently addressable R2 object at `worker-catalog/<cohort>/<sha256>/<node-id>.json`. Federation serves that slot's object at `/v1/nodes/<node-id>/worker-catalog`. Copies represent catalog placement. Physical server provisioning and application runtime health have their own registries.

Three local tools run from the corresponding entry pages. They use the input provided to their form or JSON request.

| No. | Path under `/worker-catalog/tools/` | JSON input |
| --- | --- | --- |
| 021 | `opengraph` | `{"html":"<title>Tabor</title>"}` |
| 096 | `strip-tracking` | `{"url":"https://example.org/?utm_source=catalog"}` |
| 098 | `hash` | `{"algorithm":"SHA-256","text":"Tabor"}` |

## Build and verify

- `node --test test.mjs`
- `node scripts/prepare-release.mjs` recomputes the snapshot digest and counts.
- `scripts/compile-catalog.py` compiles the submission and observed source snapshots. The input directory includes provider repository metadata, curated README snapshots, and the federation manifest with actual slot identities.
- `src/replica.mjs` runs as the canonical Worker and exports `withWorkerCatalog` for existing Workers. Wrappers preserve non-catalog handlers. The federation wrapper also receives the replica bucket binding.
- Publish `scripts/replicate-worker.mjs` temporarily with the R2 binding and `CATALOG_COPY_TOKEN`. Supply the matching `TABOR_COPY_TOKEN` to `node scripts/replicate.mjs <operator-endpoint>`. The writer uses deterministic keys, checks source digests on writes, and resumes safely when a batch was interrupted.
- Verify the catalog hash against every registered slot URL and consult `/worker-catalog/api/replicas`. Remove the operator token and disable its public endpoint after replication.

The checked-in [submission](data/submitted-list.md) preserves the original source text. [Catalog](data/catalog.json), [federation identities](data/fleet.json), and [release digest](data/release.json) record the published inputs.
