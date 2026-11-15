# Modern Day Bible · private story library

A searchable reader connected to the existing ONE App Shell SQLite database. It keeps manuscripts, stories and source indexes distinguishable. This public folder contains application code only; source text, Notion snapshots, private links and original manuscript bytes stay in the owner's database outside the repository.

## Read

Start the ONE App Shell backend as described in [`../app-shell/README.md`](../app-shell/README.md), sign in, and choose **Modern Day Bible · Stories → Open original app**. The reader loads and reassembles the source records, verifies their full-text SHA-256 hashes, supports full-text keyword search and source-type filters, and links to the original sources. The static page reads the existing public recovery corpus; private manuscripts require the owner backend.

The app loads the repository's recovered **100 numbered entries (#102–201)** and the
**separate 52-record kinship index**, preserving the supplied story lines, references and
numbering. The 52 index records do not contain full original descriptions and are not
counted as additional numbered stories. Missing original spans remain **#1–101 and
#202–404**. The seven recovered aisle labels are shown with their provenance; story
placements are not invented, and the five Volume 2 section headings do not replace them.

On static hosting, those existing public recovery files load directly into the reader.
With the private backend, the authenticated reader imports them idempotently into the
same SQLite database as related private sources. The complete original Volume 2 file
and its verified SHA-256 are retained in `story_source_documents` in that database.
The three requested related sources remain separate: a manuscript, a fictional story/
research chapter, and a scripture-project index. Their private contents are not copied
into this public repository.

**Tabor Light (November 14, 2026):** The recovered public library also includes **4 source-reference records** in `../../data/tabor/modern_day_bible/tabor_light_public_sources.json`. These link to the already-public Tabor Trinity book/game and Tabor Light software/README source, without copying private artwork or the owner-only full manuscript into the public repository. The reader displays them in the source index; the authenticated recovery imports them alongside the unchanged 100 numbered stories and 52 kinship records. The owner can separately import the private, source-preserving `one.story-sources.v1` bundle of Tabor Light manuscript, declarations, historical leads, KJV references and artwork metadata. Original PNGs remain separate binary assets. Supplied scripture interpretations are not represented as
independently verified translations or historical facts.

## Import more stories

Use **Import stories** to import UTF-8 `.txt`, `.md` or a source-bundle JSON file, up to 8 MB. Plain-text uploads are labeled as directly added by the owner. Source bundles preserve their own source type, source link, collection status and original bytes/snapshot:

```json
{
  "schema": "one.story-sources.v1",
  "sources": [{
    "id": "my-story",
    "title": "My story",
    "url": "local:upload/my-story.txt",
    "kind": "story",
    "scope": "Added by the owner to this collection",
    "text": "Original story text, unchanged.",
    "original": {"format": "text/plain", "text": "Original story text, unchanged."}
  }]
}
```

For a command-line import into the same private SQLite database:

```sh
node app-factory/modern-day-bible/import.cjs /absolute/private/path/one-shell.sqlite /absolute/private/path/source-bundle.json
```

Imports validate every source before starting a transaction. Each immutable source version retains its full input snapshot, original bytes/text, and two SHA-256 hashes: display text and source bytes. The app projection splits long texts into ordered records of at most 9,000 UTF-16 code units without splitting surrogate pairs. Reassembly joins those records exactly and marks missing parts. Record pagination prevents silently dropping later parts. Reimporting the same source ID and text hash skips duplicates; new text is retained as another version.

**Export collection** downloads the latest imported version of each source, including its original snapshot, in the importable source-bundle format. Older versions remain in SQLite; retain database backups to preserve the complete revision history. Generic shell edits to projected record parts are detected by the reader's hash checks and do not overwrite original source snapshots. Export returns the preserved imported source, not unverified edits to those projected parts.

## Tests

```sh
node --test app-factory/modern-day-bible/import.test.cjs app-factory/app-shell/server.test.cjs
```

Covers long Unicode text, exact reconstruction, original-byte export, duplicate imports, source revisions, incomplete-part detection, invalid bundles, transaction safety and isolation from unrelated app records. API imports and exports use the existing authenticated owner session; no private source data is published to GitHub.

To import the public recovery from the command line:

```sh
node app-factory/modern-day-bible/recover.cjs /absolute/private/path/one-shell.sqlite
```

The reader calls authenticated `POST /api/story-recover` automatically. Recovery verifies
the raw Volume 2 SHA-256 against both existing manifests and checks every supplied story
line against the original file before importing.
