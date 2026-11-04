# Nathan AI — launch candidate 2026.11.04-rc1

Nathan AI's public browser application can be hosted as static files. The release contains the existing app universe, ONE, the private file importer, the Work & Assets workspace, source retrieval, twelve skins and shared navigation. Private owner data is not included. This candidate does not turn every source registry into a completed service or game.

## Start the app

Open `app-factory/nathan-ai/index.html` through an HTTPS host or a local static server:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory /path/to/site
```

The repository root redirects into Nathan AI. Keep the whole release folder together: its relative paths connect ONE, Factory and the source catalogs. Do not upload only the Nathan AI subfolder. Existing browser data stays with its original origin and browser profile; changing the hostname or browser does not migrate it.

The main screen offers Install / Add to Home Screen and an explicit Keep core screens offline action. Supported browsers require HTTPS (localhost is sufficient for development). Offline preparation stores only a named public allowlist: the main hub, nine research catalogs, Work & Assets, Assistant source mode and Appearance Studio. Other modules and private original files require separate access. The offline cache never stores API responses, query URLs or imported records. Keep browser data backups independently.

## Build and verify the package

Required development tools: Git, Node.js 22 or later and Python 3.11 or later. No npm installation is required for the static application.

```sh
python3 tools/release/check.py --out /path/outside-checkout/checks
python3 tools/release/build.py --out /path/outside-checkout/release
python3 tools/release/build.py --verify /path/outside-checkout/release/nathan-ai-site.zip
```

Final packaging requires a clean Git checkout. Development previews can use `--allow-dirty`; they are labeled in the manifest. Archives are deterministic for the same commit and files. The release contains:

- `nathan-ai-site.zip`: public browser files, catalogs, documentation, icons and `.nojekyll`.
- `nathan-ai-source.zip`: tracked public source, tests, optional local servers, CI configuration and the offline ChatGPT export bridge.
- `release-manifest.json`: commit identity, file sizes and per-file SHA-256 values.
- `SHA256SUMS`: checksums of both archives.

The builder reads tracked files only, rejects private-sample/configuration paths and excludes the external scratch/attachments folders. The static ZIP does not contain executable Python servers, native project binaries, tests or Git metadata. `--verify` rejects changed, missing or additional files. Checksums establish byte integrity, not feature completeness or asset valuation.

## Publish the browser release

The repository already uses GitHub's branch-based Pages deployment. Push tested public changes to `main` and inspect the resulting Pages run. Do not add a competing Pages deployment job. For another static host, extract `nathan-ai-site.zip` to the host's public document root. HTTPS, directory-index serving and the `.mjs`, `.json`, `.webmanifest`, JavaScript, CSS and image MIME types are required. No SPA catch-all rewrite is necessary; retain ordinary 404 responses for missing API routes and files.

Verify the root redirect, the assistant's source search, Work & Assets save/reload and backup, the nine research catalogs, the ONE library import, offline core screens, install icons and a mobile viewport after deployment. Artifact creation and a successful push do not independently establish deployment success. GitHub Pages will not run the optional Python/Node servers.

Rollback static code by deploying a prior verified site archive or reverting the public release commit. Avoid resetting browser data; older code may not support newer saved-data schemas. Back up local records before crossing schema versions. Clear only the `nathan-ai-public-core-*` cache family when troubleshooting Nathan AI offline updates; do not clear all site storage or the independent ONE/scanner caches.

## Library and original files

ONE → MASTER LIBRARY accepts selected files and expanded folders, including images, Office/PDF binaries, code and structured source packs. Original bytes and fingerprints are retained in IndexedDB. Binary documents get metadata unless a text extractor is available through the separate offline bridge. The browser importer is not a ZIP expander or OCR service. Exact-content duplicates do not inflate line totals. Code counts include comments and blank lines and only cover measured files.

The open-source importer in `tools/library-bridge/` can index a downloaded ChatGPT account export plus Library downloads. See its README for the command. It creates a private searchable HTML/JSON index and flags unverified original-file references. ChatGPT Library is not a live connected account source here. A ChatGPT export is not assumed to contain every original image/document. Keep all private exports outside this public repository.

## Optional AI and account services

Assistant source retrieval works without provider credentials. For a single-owner local model adapter:

```sh
python3 -B app-factory/nathan-ai/assistant/server.py --port 8002
```

Configure `NATHAN_MODEL_URL`, `NATHAN_MODEL_NAME` and `NATHAN_MODEL_KEY` securely on the server. Never place credentials in browser JavaScript or release archives. The URL must be an HTTPS OpenAI-compatible chat-completions endpoint. The current adapter is loopback-only and is not a public multi-user authentication service. Public model hosting requires an authenticated backend, not exposing this local server. No live model is bundled or represented as tested without a successful provider request.

Work & Assets contains manual wallet records, balance snapshots, transactions, exchanges, mining payouts and reports. Owner verification, imports, estimates and missing information stay separate. Live Airtable/Finances synchronization, account ownership verification, trading, transfers and mining payouts are not configured by the static release. Existing read-only mining/provider gateways have their own setup instructions. No wallet seeds, private keys or unrestricted trading credentials belong in the app.

## Delivery status

| Delivery | Candidate scope |
| --- | --- |
| Public web app | Packaged and covered by automated checks; verify the deployment separately |
| Core browser installation/offline | Supported-browser feature, tested locally; other modules remain online |
| Local private data | Browser storage with explicit imports/exports; independent backups required |
| ChatGPT account archive | Offline export/import bridge; no live account enumeration |
| External model | Optional server configuration and live provider validation required |
| Live financial accounts | Unconfigured; manual records and existing provider contracts only |
| Native App Store delivery | Existing Xcode/signing workflows; requires Apple provisioning and device validation |

This document describes the current release package. It does not establish completion of private source packages, remote node deployments, consciousness, reserve valuations or market superiority.
