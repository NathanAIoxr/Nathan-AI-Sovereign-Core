# Nathan Tabor Game & App Stations

[Cloudflare station directory](https://pub-a374b836528943e2917457f04363c2ff.r2.dev/index.html)

Each directory in `apps/` contains that app's source manifest. Build with `node standalone-apps/game-app-stations/build.mjs`. Output includes a standalone HTML station per manifest, a searchable homepage, a machine-readable catalog, and a digest receipt. The existing apps keep their own launch URLs. Some arcade modes open a shared original engine. Research collections and private attachments are outside this public release.

- **Existing launch** means the inventory provides an existing public app, game, mode, or project-page URL. Check the original before making additional readiness claims.
- **Source available** means an authorized public source or implementation document is linked and a runnable public release needs verification.
- **Build pending** records a source recovery or build task. The station itself is addressable.

Cloudflare serves the station HTML as individual R2 objects. Each station has its own path and manifest. Runtime code and data on the linked origins remain managed by the original app.

The verification workflow builds every manifest and checks the live stations after merge. For an authorized update, publish the generated station HTML objects first, then `catalog.json`, `index.html`, and `release.json`. Keep the known-good release available until its replacement verifies.
