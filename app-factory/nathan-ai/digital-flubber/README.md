# Digital Flubber by Nathan Tabor

[Open the simulator](https://tabor-apps-nathan.pages.dev/) · [Arcade](https://tabor-apps-nathan.pages.dev/game) · [Learn](https://tabor-apps-nathan.pages.dev/learn) · [Zones](https://tabor-apps-nathan.pages.dev/zones) · [SOS](https://tabor-apps-nathan.pages.dev/sos)

Digital Flubber is an installable browser app with a timed arcade, an interactive physics lab and a defensive permission and containment console. It's an independent module in Nathan AI. Its manifest points to the related DMSP + DIT and Sovereign Supercomputer projects.

- Drag from a ball to fling it. Use **Fling** or focus the arena and press Enter or Space for a keyboard launch.
- Choose a zone and count, then place balls or walls. One arena holds up to 64 balls and 16 walls. Right-click a spot or use **W** and then click to position a wall.
- The Vault is closed by default. Its optional practice grant is scoped to the current arena tab. Revoking it removes objects in the Vault. Edge permission checks always enforce the guest role and deny irregular scopes.
- **SOS** halts physics and placement in this browser and provides a downloadable activity log and response exercises. At most 75 events are stored locally. The public site accepts no logs, credentials or device access.

## Local build

Run `npm test` using Node 22 or later. Run `npm start` and visit `http://127.0.0.1:8787/`. The app has no runtime package dependencies.

## Cloudflare

The current deployment target is the existing `tabor-apps-nathan` Cloudflare Pages project. `node build-pages.mjs` builds the single Pages edge bundle in `dist/pages/_worker.js`. The Slubber policy and SOS response services run in this bundle. Served assets are versioned for offline use. The app interfaces are scoped to the public guest lab and the browser-local SOS console.

For dedicated Workers, `deployment.json` declares the main site Worker and two private service-bound Workers. `node build.mjs` followed by `node deploy.mjs` needs `CLOUDFLARE_ACCOUNT_ID`, a Workers Scripts Write token in `CLOUDFLARE_API_TOKEN`, and capacity for the three named Workers. Both deployment forms expose the same pages and APIs.

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Verify both service handlers |
| `GET /api/zones` | List edge guest permissions |
| `GET /api/permissions?zone=vault&action=wall` | Exercise a 403 Slubber decision |
| `GET /api/sos?scenario=unexpected-motion` | Retrieve a fixed, app-scoped response guide |


## Cloud Slayer worker registry

[Search Cloud Slayer](https://tabor-apps-nathan.pages.dev/cloud-slayer) · [Supercomputer view](https://tabor-apps-nathan.pages.dev/cloud-slayer/supercomputer) · [Hypercomputer view](https://tabor-apps-nathan.pages.dev/cloud-slayer/hypercomputer)

The **OO** shortcut in SOS opens worker search with the SOS view selected. Cloud Slayer stores inventory in the account's `cloud-slayer-registry` D1 database and runs curated read-only modules through the existing Pages deployment. The summary separates a timestamped inventory of Cloudflare scripts from modules served through this app. Public search reads only the shared module catalog. Private script names remain accessible to the account owner through D1.

- Apply [the migration](cloud-slayer/migrations/0001_registry.sql) to a new D1 or SQLite database. The Cloudflare Pages production binding is `CLOUD_SLAYER_DB`. Set `CLOUD_SLAYER_DB_ID` to bind the optional dedicated site Worker.
- To refresh the Cloudflare inventory, run `node cloud-slayer/refresh.mjs` with the account and database IDs and a token scoped to Worker script reads and D1 writes. The refresh replaces the snapshot as a batch.
- For SQLite on your server, run `CLOUD_SLAYER_SQLITE=/path/to/cloud-slayer.sqlite npm start` with Node 22.13 or later. The listener is on localhost. The same SQL schema and read-only API are used. Omitting the path opens a temporary database with the shared modules.
- The three public endpoints are `GET /api/cloud-slayer/summary`, `GET /api/cloud-slayer/modules`, and `GET /api/cloud-slayer/worker?key=<registered-id>`. The compute views show catalog placement. The linked Sovereign Supercomputer provides the separately deployed compute workloads.
