# Tabor ONE — Fiber Matrix + Tabor Track Baller

Standalone, additive Nathan AI touch/voice training interface for 12 historical textile crafts. This package does **not** replace the ONE app shell, Hook & Ring, Track Baller, or the broader worker fleet.

## Live interface
- [Cloudflare Fiber Lab](https://tabor-fiber-track-baller.nathantaboract.workers.dev/)
- [Health](https://tabor-fiber-track-baller.nathantaboract.workers.dev/api/health)
- [Craft + gesture manifest](https://tabor-fiber-track-baller.nathantaboract.workers.dev/api/manifest)

## Source components
- `index.html` — self-contained offline-compatible prototype with trackball, quaternion view rotations, two-finger tension and exploded views, swipe/tap step sequencing, long-press strand highlighting, voice controls where supported, and local timestamped ledger export.
- `manifest.json` — 12 independent craft adapters, each with 6 instruction operations; common gestures and event schema; topology is described without erasing historical nomenclature.
- `scripts/build-worker.mjs` — generates a self-contained Cloudflare ES module Worker.
- `wrangler.jsonc` — binding-free deployment configuration with hourly manifest-integrity cron.
- `tests/smoke.mjs` — checks all adapters and runs the Worker Fetch API in Node.

## Architecture and provenance
- All 12 crafts are preserved as distinct adapters: Nålebinding, Tatting, Tunisian Crochet, Broomstick/Hairpin Lace, Sprang, Bobbin Lace, Lucet, Kumihimo, Invisible/Swiss Darning, Tambour, Stumpwork, Drop Spindle.
- The trackball is a reusable **view controller**, not yet a fully validated thread-mechanics engine.
- Tension is a visual instructional parameter and does not certify stitch strength, mechanical locking, unravel resistance, or physical safety.
- Local event exports are **client-side only**; this Worker does not ingest or publish family records, private archives, fingerprints, biometrics, or medical data.
- The Cloudflare scheduled handler checks that the public manifest still defines 12 craft adapters; it does not autonomously implement backlog items.

## Local commands
```sh
cd app-factory/nathan-ai/fiber-arts-track-baller
node scripts/build-worker.mjs
node --test tests/smoke.mjs
npx wrangler deploy
```
To deploy from CI, configure the standard Cloudflare account/token secrets yourself and protect deployment credentials; no keys are committed here.

## Build backlog
1. Physically verifiable topology engine with explicit crossing orders and reversible states.
2. Real rope/thread simulation with calibrated contact/tension constraints.
3. 3D strand picking and occlusion-aware long-press highlights.
4. Complete keyboard/switch and screen-reader alternatives to multitouch.
5. Voice Box permission handling, offline speech fallback, and accessibility testing.
6. Cross-platform browser touch regression on real hardware.
7. Workflows for user-owned craft exports and optional vendor fulfillment after user consent.
