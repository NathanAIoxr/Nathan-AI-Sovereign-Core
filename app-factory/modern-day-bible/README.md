# Modern Day Bible · private story library

A searchable reader connected to the existing ONE App Shell SQLite database. It keeps manuscripts, stories and source indexes distinguishable. This public folder contains application code only; source text, Notion snapshots, private links and original manuscript bytes stay in the owner's database outside the repository.

## Read

Start the ONE App Shell backend as described in [`../app-shell/README.md`](../app-shell/README.md), sign in, and choose **Modern Day Bible · Stories → Open original app**. The reader loads and reassembles the source records, verifies their full-text SHA-256 hashes, supports full-text keyword search and source-type filters, and links to the original sources. The static public page contains no story corpus and points to the private backend.

The initial requested collection comprises three related sources, not a verified recovery of the recent Modern Day Bible project: a manuscript, a fictional story/research chapter, and a scripture-project index. An index is not a full corpus. The reader displays this coverage distinction. It never treats a generated or fictional passage as verified historical material.

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
