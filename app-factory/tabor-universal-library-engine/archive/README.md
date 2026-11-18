# Library of Tabor · Universal Sovereign Archive
By Nathan Tabor

**Public Reading Room:** https://library-of-tabor-archive.nathantaboract.workers.dev/

The historical archive sits alongside the playable [Library of Tabor](https://tabor-universal-library-engine.nathantaboract.workers.dev/library/). It has its own Cloudflare Worker, D1 catalog, and private R2 storage. The first release provides 21 official Library of Congress subject classes, 34 catalog records, 8 witness records, and 3 complete source editions pinned by SHA-256. The source editions retain their original line endings, encoding, provenance, and digitizer notices. The King James Bible transcription is served by this archive in the US. Its catalog and source links are available globally.

## Reading Room and APIs

| Route | Contents |
| --- | --- |
| / | Search by title, author, institution, reference, or record ID. Filter by class, historical vault, or evidence state. |
| /shelves | 21 subject classes and six archival vaults. |
| /works/{id} | Work detail, catalog provenance, surviving witnesses, rights, and published editions. |
| /architecture | Seventeen trilingual layers with KJV anchors, Middle-earth and Narnia analogues, and deployable components. |
| /api/catalog | Paginated search, with q, class, vault, state and page. |
| /api/works/{id} | Structured bibliographic, evidence and edition lookup. |
| /api/works/{id}/editions/{edition}/text | Byte-for-byte R2 reading copy, with SHA-256 ETag. |
| /api/works/{id}/editions/{edition}/verify | Verifies the stored byte count and recomputes SHA-256. |
| /api/architecture | Gates, offices, hierarchy, archive layers, π/φ cadence and registry affinity bands. |
| /api/registry/modules | 505 verified upstream ID records and their source classifications. Add ?id=OG-001 for one record. |
| /api/registry/act | 160 published ACT graph records and 17 lexicon entries, with original source seals. |
| /api/health | Live D1 counts and archive release receipt. |

## How the archive is built

| Component | Current implementation | Extension path |
| --- | --- | --- |
| Cair Paravel / Mithlond | Accessible server-rendered search, subject navigation, source links and edition reading | Annotated facsimile viewer and offline edition export |
| Morannon | Read-only public route allowlist, validation, response security headers, no reader analytics | Managed rate rules and authenticated editorial operations on a separately scoped service |
| Narya | Operator-driven exact-file acquisition and bounded Library of Congress metadata discovery | Resumable provider cursors, Queues and dead-letter review |
| Nenya | Private R2, D1 publication pointers, immutable edition and receipt records | Fixity rotation, geographic custody and independently restorable copies |
| Vilya | Three-source evaluation helper and witness evidence model | Passage-level editorial decisions, review history and signed evidence manifests |
| Wardrobe | Source-specific acquisition with pinned commit and digest | IIIF, MARC/MODS, TEI-XML, OAI-PMH and source-specific connectors |
| Wood Between the Worlds | Published registry snapshots and canonical upstream links | Read-only scheduled refresh with drift receipts and release review |
| Red Book / Hall of Records | Immutable digest receipts for each published local edition | Custody log, source version changes, takedown history and periodic fixity attestations |

The module snapshot contains 101 executable records, 96 fixtures, 106 specified records, and 202 awaiting specifications, using the source registry’s status vocabulary. The associated library classification bands document affinity and do not dispatch commands. The archive graph records are a projection of the published ACT register and do not provision 160 compute instances.

## Preservation model

1. **Work.** Record the title, contributors, languages, historical associations, subject classes and stable authority identifiers. A work can have multiple source manifestations.
2. **Witness.** Record the holding institution, original identifier, folio or line locator, source family and claim. Separate a physical witness, digitized facsimile, transcription, edition, translation and indirect attestation.
3. **Edition.** Save the exact authoritative byte stream only with edition-specific rights and provenance. Bind the immovable edition ID to SHA-256, size, a pinned source and a UTC capture timestamp.
4. **Receipt.** Persist publication only after the capture Worker verifies the expected byte count and digest and persists R2. D1 records the edition and receipt in one batch. A retry validates previously stored bytes and conditionally inserts the missing records. Unexpected stored bytes stop publication.
5. **Evidence.** Keep divergent transcriptions, uncertain readings, editorial emendations and unattested passages distinct. Three independent source families can flag candidate agreement for review. An alternate edition can reuse confirmed passages with explicit citation and may preserve lacunae.
6. **Reader.** A source-edition record can expose several exact editions. A historical collection or witness can link to the original holder. An Ω dossier can remain open indefinitely where text is missing.
7. **Custody.** A backup contains the D1 record set, all referenced digest objects and a versioned manifest. A restore verifies every retained object before announcing the release. Rights review applies to the edition, image, apparatus and translation individually.

The archive uses `0xFF` and `0xFFFF` as design markers. It uses SHA-256 for fixity and Cloudflare’s scoped credentials for writing. `sovereign://` URIs identify records. Published pages use HTTPS. The fixed-point π/φ calculation uses integer micro-units in the published architecture metadata. These values express the project’s mapping and are independent of clocks, consensus, and authorization.

## Development

From this directory with Node 24 or later:

```sh
node --test test.mjs
node scripts/discover-loc.mjs books "book of hours" 1 2
npx wrangler d1 migrations apply library-of-tabor-archive --local
npx wrangler deploy --dry-run
```

The discovery command prints metadata candidates and a page checkpoint. It runs only when called. The checked-in works and witness fixtures are the initial editorial catalog. The migration must precede inserts. `scripts/seeds.mjs` exports parameterized D1 statements for the catalog and capture process. Production migration and seeding use Cloudflare D1 API or equivalent operator tooling under the deployed account’s authentication.

The operator capture Worker in `scripts/capture.mjs` is deployed on demand for pinned entries in `data/editions.json`. It requires a scoped `CAPTURE_KEY` Worker secret and the two archive bindings. It downloads exact allowlisted commit URLs, validates their lengths and digests, and then writes R2 and D1. Deploy `src/worker.mjs` as the public Worker after capture. Keep R2 public access disabled. Verify the archive receipt, source pages, edition hashes, method restrictions and the existing Library’s health.

See [the full build-out](ARCHITECTURE.md) for phase boundaries, provenance rules, ring and layer mappings, and hardware/software responsibilities.
