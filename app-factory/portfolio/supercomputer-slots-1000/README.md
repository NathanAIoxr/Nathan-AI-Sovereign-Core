# Nathan AI — 1,000 individually indexed logical compute slots
Snapshot source commit: `172bf8a16be0f3566f257ec4967119ff454c6584` (GitHub public repository). Snapshot date: 2026-11-18.

## Identity / truth in deployment
This directory records **1,000 logical slots**, not 1,000 physical supercomputers or independently deployed server instances. Each slot is a named configuration record with exactly one of five existing Cloudflare Worker apps, one independent book-set ID, and one independent technology-set ID. Only the five shared apps have existing Worker deployment histories, checked separately in the connected Cloudflare account. Slot state `indexed_only` means the slot is not separately provisioned and is not confirmed to be actively running. Existing 505 fleet registry entries remain unchanged.

## Five apps
| App ID | Original project | Logical slot assignments | Existing public Worker URL |
| --- | --- | ---: | --- |
| bibletopia | Bible Topia | 200 | https://bibletopia.nathantaboract.workers.dev/ |
| tabor-world | Tabor World | 200 | https://tabor-world.nathantaboract.workers.dev/ |
| grapple-it | Grapple It | 200 | https://grapple-it.nathantaboract.workers.dev/ |
| hook-and-ring | Hook & Ring | 200 | https://hook-and-ring.nathantaboract.workers.dev/ |
| tabor-tracker-ball | Tabor Track Baller | 200 | https://tabor-tracker-ball.nathantaboract.workers.dev/ |

## Separate machine-readable indexes
- `slots.csv`: 1,000 individually numbered compute assignments (200 of each of the five apps).
- `book-sets.csv`: 1,000 independent **catalog references** to the original works and book roots; NOT 1,000 copies of manuscripts.
- `technology-sets.csv`: 1,000 independent **catalog references** to source technology; NOT deployed hardware.
- `apps-index.csv`: 398 existing public portfolio entries, with their own catalog stage (hosted/registered/template).
- `books-and-publications-index.csv`: 55 manifest records + 85 book/publication directory assets. Paths and manifests may refer to the same work; do not sum them as unique books.
- `technology-source-index.csv`: 1089 code-source blob entries in this GitHub revision (including historical variants), not independent engines.
- `repository-asset-index.csv`: every one of 4178 source file blobs, including duplicates, backups and historical versions, with separate source path and SHA.
- `migration.sql`: additive Cloudflare D1 schema and deterministic seed for these logical slots; never deletes or overwrites the earlier 505-entry fleet.
- `verify.py`: standalone consistency tests for all three 1,000-entry indices.

## Source preservation and ownership
Original books, videos, drawings, unpublished notes, private Creator Vault archives and licensed third-party material must not be copied into this public repository. References are not substitutes for source bytes. Distinguish a registered webpage from a tested application, and a Worker script from an independently provisioned supercomputer. Public URLs are discovery routes, not a promise that every route is reachable. Keep deployment and integration receipts separate.

The public app portfolio is `../catalog.json`, progress `../progress.json`; original manuscript references: `../../nathan-ai/original-works/manifest.json`; the existing 505-entry Cloudflare D1 fleet remains separate.

## Cloudflare state
D1 table names use `virtual_...` prefixes; application assignments can later be upgraded from `indexed_only` only after per-slot runtime/service provisioning is verified. The schema is additive. To re-run the migration in Cloudflare D1 use reviewed, least-privilege migration tooling; never send credentials in git commits.

## Counts mean different things
A source file, app directory entry, book edition, worker script, logical slot, deployed Worker and physical supercomputer are **different types of object** and must never be summed as if all were real running computers.
