# Library of Tabor · Imagination Engines

[Open the public catalog](https://library-of-tabor-imagination.nathantaboract.workers.dev/) · [Download all 101 entries](https://library-of-tabor-imagination.nathantaboract.workers.dev/api/catalog.json)

The catalog retains the supplied titles, descriptions, order, and eight original sections. The catalog numbers use the `IMAG-001` through `IMAG-101` namespace. Each entry has a permanent URL at `/engines/IMAG-nnn`.

Eight demo links call existing Workers using service bindings. They run fixed examples for dragon species, dragon names, Yin-Yang SVG, A–Z portals, story dice, coloring pages, Moon gravity, and the decoder ring. The other 93 are catalog entries. Source descriptions describe the intended engines. The catalog has no account, upload, recording, or story-saving endpoints.

## Verify

Run `node --test worker.test.mjs` with Node 24. The suite checks the release digest, ordering, category ranges, browsing, filter behavior, the exact downloadable JSON, and the requests sent to each demo service.

## Release

Catalog rows are stored in the existing Library of Tabor archive D1 under `tabor_imagination_releases` and `tabor_imagination_engines`. R2 stores a byte-identical copy under `imagination/catalogs/<sha256>.json` in the archive bucket. The public Worker reads the release selected by `RELEASE_SHA256` in `wrangler.json`.

1. For a revised source, run `python3 import-catalog.py path/to/catalog.txt`. Review the JSON changes and set `RELEASE_SHA256` to the printed digest.
2. Upload the generated JSON to the archive bucket under the digest-based object key before activating the release.
3. Apply `schema.sql` to D1. In a single D1 batch, insert a release row containing the digest, R2 key, exact byte count, entry count, and serialized categories, then run `import.sql` with the digest and serialized engine array. Both inserts support retries. Compare the 101 ordered rows to `catalog.json`.
4. Deploy the Worker using `wrangler deploy` with the archive and demo service bindings declared in `wrangler.json`. Verify `/health`, `/api/catalog.json`, and all eight demo links.
5. For the original archive registration, apply `index-collection.sql` after verifying the public URL.
