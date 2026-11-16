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
