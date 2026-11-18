# Nathan AI — Sovereign Concordance

Source-preserving integration, not a mass code import. The existing Cloudflare D1 databases remain the source of truth. This standalone Worker reads tabor-global-import-catalog as ATLAS and tabor-fleet-registry as FLEET. It does not copy, run, modify or execute third-party repository code; it does not delete original resources.

## What is linked
- 18 conceptual infrastructure layers and 334 curated component references.
- 205 public GitHub candidate repositories, including 12 kernel-adjacent candidates; all are discovery-only, not installed.
- 13 source directories, a 505-row atlas fleet crosswalk, and 15 prior imported-worker records.
- The separate 505-entry fleet catalog and 1,000 indexed_only logical compute slots.

A live Cloudflare audit also found 445 ordinary Worker scripts and 1,000 uploaded dispatch scripts in nathan-tabor-platforms (989 Glottolog language-data shards and 11 platform scripts). The latter have an existing dispatch binding through nathan-tabor-hyper-federation. They are not 1,000 distinct physical AI supercomputers. This index does not itself independently retest all runtime endpoints.

## API
- /health — checks D1 connection
- /api/summary — database-backed counts and honest statuses
- /api/layers — 18 layers
- /api/repositories?q=&category=&limit=&offset= — bounded public repository metadata search
- /api/kernels — kernel-adjacent source references; not Cloudflare-installable native kernels
- /api/components?layer=&q=&limit=&offset= — bounded component references
- /api/fleet — source-state and logical-slot-state summary
- /api/receipts — latest scheduled D1 snapshot digests

HTTP is read-only (GET/HEAD). The Cloudflare Cron Trigger runs hourly, reads the existing D1 sources and appends a SHA-256 summary receipt to an isolated new sovereign_concordance_receipts table within the existing atlas D1. No external scanning, self-propagating workers, third-party code execution, or automatic external publication.

## Validation
Run: node --test app-factory/nathan-ai/sovereign-concordance/worker.test.mjs
Four local tests passed on the equivalent source before committing. GitHub CI and live Cloudflare runtime checks must be separately verified. Source refs: app-factory/nathan-ai/global-infrastructure-atlas, public-github-discovery-205.json. Deployment is not equivalent to source completeness or operational health. The owner controls any later deployment of third-party technology.
