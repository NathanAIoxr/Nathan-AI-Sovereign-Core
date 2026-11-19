# Nathan Tabor’s Ancient Traditions

Nine independent editions and a source index, by Nathan Tabor. Each edition has its own app manifest, Cloudflare Worker, source search, book view and game view. The Expedition, Cleopatra v057, Truthkeeper and Root Atlas keep their original interactive in a separate route. The index links to the editions without combining their files.

The [owner index](https://tabor-ancient-traditions.nathantaboract.workers.dev/) uses the existing Cloudflare Access owner identity. Original source names, links, manuscripts, live source manifests, databases and correspondence are served only after that check. The public repository contains release code and an authenticated-encryption backup format. The content key is available in the owner index and is excluded from GitHub.

## Build

Run `node --test worker.test.mjs` from this directory. Set `TEST_APP` to one app ID to exercise an edition independently. The GitHub Actions matrix checks each edition. The deployment entry point composes `runtime.mjs` with the edition's `app.json` and private source manifest. Cloudflare supplies `SOURCES` (private R2), `OWNER_AUDIENCE` and `OWNER_EMAIL`. The index alone receives `BACKUP_KEY`.

## Backup recovery

The GitHub snapshot uses AES-256-GCM. Save a copy of the owner key from the index before relying on an independent offline recovery. Download the numbered files from `sealed-v1/` and run:

```sh
node restore.mjs backup-manifest.json sealed-v1 /path/to/owner-key.txt Ancient_Traditions_Originals.zip
```

The recovery program checks every part against the manifest and only produces a ZIP after the authentication tag validates. The recovered ZIP contains the original filenames and SHA-256 receipts. The native files and export excerpts are identified by their filenames and archive records.
