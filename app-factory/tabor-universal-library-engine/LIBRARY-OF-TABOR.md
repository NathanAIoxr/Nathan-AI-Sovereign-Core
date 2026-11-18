# Library of Tabor within Tabor World
By Nathan Tabor

## Release history

| Release | Scope |
| --- | --- |
| Grapple It PR #271 | Original 101 playable applications, all 21 subject shelves, five mechanics, and one stable launch ID per challenge. |
| Library of Tabor 1 | Dedicated library destination, rotunda artwork, animated room selectors, browse and detail views, machine-readable catalog, and a Tabor World gateway entry. |

## Continue here

- Browse the [Tabor Worker Catalog](https://library-of-tabor-archive.nathantaboract.workers.dev/worker-catalog/) and its 101 searchable Technology shelf records.

- Historical archive and Reading Room: https://library-of-tabor-archive.nathantaboract.workers.dev/
- Archive source, APIs and operating model: [archive/README.md](archive/README.md)

- Live entrance: https://tabor-world.nathantaboract.workers.dev/library/
- Library Worker: https://tabor-universal-library-engine.nathantaboract.workers.dev/library/
- Health receipt: https://tabor-universal-library-engine.nathantaboract.workers.dev/library/api/health
- Source of playable entries: `../grapple-it/public/atlas.mjs`. Keep an entry’s original three-digit ID in its play link.
- The v.7 workbench has its own catalog and numbering. It is a separate destination linked from the library.
- The source classification attribution is in the footer and the machine-readable catalog.

## Build and verify

From the repository root:

    node app-factory/tabor-universal-library-engine/build.mjs
    node --test app-factory/tabor-universal-library-engine/test.mjs
    node --test app-factory/tabor-universal-library-engine/library.test.mjs

Deploy the generated modules from `.release/` to the `tabor-universal-library-engine` Worker. The source of the Tabor World entry and short redirect is `world-gateway/worker.mjs`, deployed to the existing `tabor-world` Worker. Verify both live destinations, a specific record, image delivery, and an original v.7 route after a release. Record subsequent changes here so future work can resume from the latest shipped release.

The rotunda WebP is a new site illustration based on the Library of Tabor poster. The site uses live HTML for the title and opens the original Grapple It implementation for play and scoring.


## Tabor Accords connections and 85/15

- Tabor World alias: https://tabor-world.nathantaboract.workers.dev/accords/library/
- Live receipt: https://tabor-universal-library-engine.nathantaboract.workers.dev/library/api/connections
- Cloudflare Worker `library-of-tabor-data` receives D1 bindings in `data-broker/connections.mjs`. Resolve each database name to its account database ID at deployment. The Worker has no public route. The Library uses the `LIBRARY_DATA` service binding to read status and two fixed public sample projections.
- The public receipt returns readiness counts, a limited set of library labels, and provider integration status. Other databases appear only in aggregate. A readiness check is a read-only database round trip. It does not attest to freshness or content completeness.
- Airtable and Notion use existing D1 snapshots. GitHub is linked as source provenance. Live external providers need their own authorized scopes and Worker secrets before they can be queried. Existing private keys, signing tokens, and owner-authentication bindings remain on their source Workers.
- The 85/15 workbench runs in the browser. Each of the six adapters supplies sample vocabulary and four evidence checks. The shared core keeps the observed symptom and candidate visible and distinguishes an open cause from one supported by the recorded checks.
