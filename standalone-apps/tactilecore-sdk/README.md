# TactileCoreSDK — Universal Finger & Hybrid Kinetic Platform

**Nathan Tabor · November 12, 2026 · working source-backed prototype v0.2.1**

TactileCoreSDK is an **active software development project**, not merely an idea. It combines 1/2/3-finger touch tracking and staggered releases with handheld CoreMotion sensor processing and a shared `UnifiedThrowVector` interface. Five playable/simulated cartridge modes are included: Bowling (08), Cornhole (02), Pub Darts (09), Baseball, and Air Conductor.

## Files

- `src/engine.mjs`, `src/kinetic.mjs`, `src/games.mjs`, `src/app.mjs` — modular JavaScript implementation
- `standalone.html` — single-file browser game
- `index.html` — modular web interface
- `tests/*.test.mjs` — automated JavaScript tests
- `native/ios/hybrid/` — Swift/UIKit/CoreMotion + SwiftUI/SceneKit prototype
- `native/ios/` and `native/android/` — native touch-capture examples
- `docs/USER_SUPPLIED_HYBRID_SPEC_2026-11-12.txt` — original user-supplied reference source preserved separately
- `PROJECT_STATUS.md` — verified status and outstanding validation
- `docs/HYBRID_KINETIC_RELEASE_NOTES.md` — testing details and integration notes

## Run

Run `npm test` from this directory (Node.js required). To explore the game, open `standalone.html` in a modern browser; it does not require a backend server. Browser-native motion sensors may require permissions and a secure origin.

Native iOS compilation, hardware accuracy, motion calibration and production game physics remain to be verified on supported devices. A virtual throw **never requires physically releasing the phone**.

## Attribution and licensing

Originator/user-supplied specification: **Nathan Tabor**. He designates this work proprietary and patent pending; that designation is not independent evidence of an application filing or grant. The surrounding repository is public and Apache-2.0-licensed; see this project's separate [LICENSE.md](LICENSE.md) notice before reproducing or redistributing its source.
