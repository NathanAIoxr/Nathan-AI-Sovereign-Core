# Hook and Ring by Nathan Tabor

[Play Hook and Ring](https://hook-and-ring.nathantaboract.workers.dev/) · [Arcade catalog](https://hook-and-ring.nathantaboract.workers.dev/chassis) · [Play Friends](https://hook-and-ring.nathantaboract.workers.dev/competition)

TactileCore Cartridge 01. The ring swings on a fixed-length spherical pendulum. Play the flagship practice, trick shots, local multiplayer, Nathan AI 🚀, or the daily ranked tournament. Toss & Target contains 60 playable boards across five physics chassis. Grapple It and Yard Darts have their own playfields. Play Friends supports online 1v1 and invite brackets for 4, 8, 16, or 32 players. Finished brackets offer a JSON results download.

## Build and run

Use Node 22.13 or later. This project has no installation dependencies.

```sh
cd standalone-apps/hook-and-ring
npm test
npm run dev
```

Open http://127.0.0.1:8787. The local database starts empty and resets when the server stops. `npm run build` produces `dist/worker.mjs` for the Cloudflare Workers module runtime. Browser sources and assets, including the Worker’s `.html.in` templates, are in `game/`, API and Worker logic are in `server/`, and SQL migrations are in `migrations/`.

## Cloudflare

The production Worker is `hook-and-ring`, with D1 database `hook-and-ring` bound as `DB`. Reuse that binding for updates. For a new database, apply the two SQL files in order before enabling Workers traffic. Deploy the generated module with the existing Workers compatibility date, 2026-11-16. Use [release status](https://hook-and-ring.nathantaboract.workers.dev/api/status) to verify the Worker can see both tournament tables. Browser preferences, favorites, and practice progress are stored per device. Online events expire after 14 days.

This source is reconstructed from the public Worker and includes the game, server, and assets needed to rebuild it, plus development scripts and tests. The previous private development checkout and its history are separate. BIBLeTopia remains in its owner-private workspace. Swordplay Practice is part of this arcade. Original Swords cartridge integration and the native App Store/StoreKit release are separate work.

See [Nathan Tabor’s project rights notice](game/TACTILECORE-RIGHTS.md) for the proprietary TactileCoreSDK material included here.

## Toss Lab and Universal Digit Physics

`/training` runs the same 240 Hz pendulum and swept hook-contact model as the flagship. It provides five practice drills, a top-down trajectory, timeline, side-by-side toss comparisons, and a rolling 40-toss device history. Legacy cartridge replays and Toss Lab archives can be imported. The player-supplied inputs are validated and their physics results are computed again. The lab is a separate practice mode. Its attempts never enter ranked results or award coins.

The flagship accepts up to ten concurrent contacts when the browser and hardware report them. The first contact must grab the ring. Additional contacts join the grip. A guarded 50 ms history and One Euro filtering feed the touch release; a calibrated scale converts CSS pixels to approximate physical millimeters. Choose the 16 ms hand or 20 ms toe guard in Settings. The device reports touch contacts and cannot identify individual fingers or toes. The 16-point rope uses a visual curve under a held grip. The deterministic fixed-length solver still owns contact and scores.

The lab serves the original Tracker Ball, WristFlipEngine, and HybridKineticEngine modules directly from their sibling source projects. The Tracker Ball maps roll/swirl input to pull, aim, and flick. The wrist-flip surface supports one to three contact roles and keeps its original 14 ms guard. Motion toss and air trace require a compatible browser, usable sensor readings, and permission. All motion samples stay in memory. Touch and slider inputs remain available. Native CoreHaptics, native sensor certification, the deformable soft-body solver, StoreKit, and cross-cartridge ranking are outside the current browser implementation. D1 stores existing events and leaderboard records. Lab samples and history are kept on-device.

### Verify

`npm test` builds from source and checks the core public routes, arcade, replay and input handling, and the tournament refresh protocol. Deploy to the existing Worker with its `DB` binding; this release requires no schema migration.

## Cloudflare release

Build from a clean committed checkout with `PUBLISH_SOURCE=1 npm run build`. The build emits
`dist/worker.mjs` for Hook and Ring and `dist/release-bee.mjs` for its monitoring Worker.
The public `/release.json` records the GitHub commit and deployed asset checksums.
The `/source.tar.gz` archive contains the Hook and Ring subtree and the shared Tracker Ball
and TactileCore source files used by that release.

Apply `migrations/0002_release_bee.sql` to the Hook and Ring D1 database. Deploy the monitor
as `hook-and-ring-bee` with a `MONITOR_DB` binding to that database, the
`*/5 * * * *` Cron Trigger, and HTTP service bindings to the six Workers listed in
`game/ecosystem.json`. Use each Worker name in uppercase, replacing hyphens with
underscores, as the binding name.
Bind the game Worker to the monitor via the `RELEASE_BEE` service binding.
The monitor reads the game routes and writes its results to the dedicated
`hook_ring_bee_runs` table. The game directory at `/ecosystem` displays the latest report.
