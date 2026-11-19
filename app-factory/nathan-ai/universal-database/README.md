# Tabor Spiral · Universal Database

An original solo dimensional-ring puzzle by Nathan Tabor. Start at D0 / 00, collect the Firmament, Elf and Magnetic beacons, then return to the Origin. Rotate the view with the Orbit slider. Move with the buttons or arrow keys.

[Play the Universal Database edition](https://pub-21c3cbe0b9174cc4b2114ac87419675b.r2.dev/index.html)

## Recovered game lineage

| Project | Recovered material | Relationship to this edition |
| --- | --- | --- |
| [THE GAME OF GAMES — THE TABOR SPIRAL™](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/standalone-apps/game-app-stations/apps/the-game-of-games-the-tabor-spiraltm/play.html) | Playable 63-chamber Nautilus Labyrinth with Outer Gate, Constriction, Chokepoint and Citadel, plus Vanguard and Citadel turns. | Supplies the spiral as the board's organizing idea. The new puzzle uses a closed, vertically stacked dimensional route and beacon recovery. |
| [ONE · The 33 Trial Matrix · Epoch I](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/app-factory/one/trial-matrix/README.md) | Registered grid-puzzle project and five-level browser prototype. | Babylon’s Gate supplies a documented counter-rotating ring precedent. The firmament mirror is specific to this edition. |
| [Castles & Unicorns — The Rotating Storyteller](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/standalone-apps/game-app-stations/apps/castles-unicorns-the-rotating-storyteller/play.html) | Recovered playable storyteller project. | A related tabletop design. This edition is solo. |
| [Tabor World Tactical Card & Board Elements](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/standalone-apps/game-app-stations/apps/tabor-world-tactical-card-board-elements/app.json) | Cataloged design, marked build-pending in the recovered manifest. | Related world-building reference. |

## Route and rules

- Downward cycle: `D0 → -01D → … → -12D → 12D → … → 01D → D9 → … → D1 → D0`. Up reverses the route.
- Each ring has 12 sectors, for 408 cells. Vertical movement preserves the sector except at the firmament.
- The `-12D ↔ 12D` crossing mirrors sector `s` to `(12 - s) % 12`. The `D9 ↔ 01D` crossing changes rotation direction. Core rings use incrementing clockwise sectors. The negative and inverted rings reverse that step.
- The D0 binding stores origin identity and routes. The D1 binding stores its own root identity and the board. `parent_seed` is a logical cross-database reference. The two bindings have separate storage; the router is authorized to read each.
- The R2 release uses a static board snapshot generated from the same SQL migration. Game state is held in the browser during each run.

## Local use

With Node.js 24 and Python 3:

```sh
node --test
node scripts/build.mjs
python3 -m http.server 8080 --directory .build
```

Open [localhost:8080](http://localhost:8080/).

## D1 Worker

The Wrangler configuration targets the two provisioned databases. To use another Cloudflare account, create two D1 databases and replace their IDs. Use Wrangler 4.

```sh
npx wrangler d1 migrations apply sovereign-d0-origin --local
npx wrangler d1 migrations apply sovereign-d1-structure --local
npx wrangler dev --local
```

- `GET /board.json` reads the public game board from D1.
- `GET /api/roots` reads the two root records and the route registry.
- `GET /` serves the same browser game as the R2 build.

Once the account can create the Worker, apply both migrations with `--remote` in place of `--local`, then run `npx wrangler deploy`. The initial migrations are safe to rerun against the provisioned roots. The current public release uses R2 because Cloudflare rejected creation of a new Worker at the account limit.

Technical references: [Cloudflare Workers SDK](https://github.com/cloudflare/workers-sdk), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), [SQLite recursive CTEs](https://www.sqlite.org/lang_with.html).
