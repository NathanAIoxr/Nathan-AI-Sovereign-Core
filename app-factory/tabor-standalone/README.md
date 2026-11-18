# Tabor Standalone · Tabor World

Each entry has one stable page and links into every collection it belongs to. The release includes the original 101 Library of Tabor challenges, individual readers for the three Pee Dee editions, public literary and translation records with their source stages, and individual website records from the existing 398-entry portfolio.

The game player imports Grapple It's existing Atlas record and scoring functions. Each game has a distinct manifest ID, launch scope, service worker cache and local score key. The original Grapple It and Library launches remain available. Each Pee Dee book links to its original series location and corresponding books in the other editions. The archive retains original wording and labels drafts with their source stage. The hosted Tower of Babel reader remains on its original site.

Each portfolio item links to its original page or source. Portfolio states are preserved. The project exposes a read-only metadata catalog and release receipt. Rebuild after editing upstream sources; the build reads those sources directly.

    node app-factory/tabor-standalone/build.mjs
    node --test app-factory/tabor-standalone/worker.test.mjs

Cloudflare Worker: https://tabor-standalone.nathantaboract.workers.dev/

## Public website hosting

Build the separate public-site Worker with `python app-factory/tabor-standalone/build_public_sites.py`. The build follows the checked-in portfolio and static references. It emits `.release/public-sites/worker.mjs`, `receipt.json`, and versioned asset packs. Upload each `pack-NNNN.json` file as text to Workers KV under `<release>/pack-NNNN` before deploying the module. Bind that namespace as `PUBLIC_ASSETS` to the `tabor-public-sites` Worker. Use a fresh release key whenever asset contents change so existing deployments keep serving their original bytes while the new release uploads.

Run `node --test app-factory/tabor-standalone/worker.test.mjs app-factory/tabor-standalone/public-sites.test.mjs` after building. The tests compare all 379 site pages against their original files, check sample supporting assets, and test template and game launch routes.

The hosting worker reads the listed source pages and bundled assets. Hook and Ring serves its own seven template routes and 60 playable boards. Historic frontends continue to use their original remote services where configured. The two full-resolution poster images link to their source files.
