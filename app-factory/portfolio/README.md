# Tabor World app portfolio

The public app directory and continuation ledger for Nathan Tabor. Each app entry retains its source path. Existing Cloudflare routes use their own origins. Registered GitHub pages and source templates carry individual labels.

## Continue the work

Start with [progress.json](progress.json). Use its pending batch and stable project IDs. Add a receipt when a batch advances, with exact source and deployed URLs, verification performed and incomplete work. The 6,922-record inventory remains the recovery baseline. The production catalog uses current public repo material and existing public Cloudflare routes. The earlier inventory includes versions, catalog registrations and external workspace records which must be reconciled at the project level.

## Rebuild and verify

From this directory run `python build_catalog.py` against a checked-out source revision, followed by `node --test worker.test.mjs`. Commit the catalog alongside the changed sources. For a Chromium browser check use `python browser-check.py <site-url>`. A locally served directory also works.

The Worker is named `tabor-app-portfolio`. Run `python pack_worker.py --output /tmp/tabor-app-portfolio.mjs` at the release commit, then upload that file as a JavaScript module. The release bundles the frontend, catalog, continuation ledger and WebP artwork. The health endpoint reports the source commit and bundled file count. The GitHub Pages copy can read the checked-in JSON directly.
