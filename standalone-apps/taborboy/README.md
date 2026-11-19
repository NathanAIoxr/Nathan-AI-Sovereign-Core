# TABORBOY

[Live project](https://taborboy.pages.dev/) · [Work profile](https://taborboy.pages.dev/api/profile) · [Worker status](https://taborboy.pages.dev/health)

Codex 1 supplies the root profile and Living Threshold lore. Codex 9 supplies the platform specification. The football play comes from The Art of Basics. Nathan Tabor’s build order is 1 - 1 = 0 (provision and migrate) followed by 1 + 1 = 2 (deploy and run).

Run `npm test` with Node 22 or newer. The primary live target is its own Cloudflare Pages project. It uses the same `src/index.js` as the standalone Worker. Pages binds R2 as `TABORBOY_ASSETS` because it reserves `ASSETS` for static assets. Apply the D1 migrations and set `SOVEREIGN_TOKEN` as an encrypted secret on the target platform before deploying. This project uses `taborboy_db`, `taborboy-assets`, and `TABORBOY_ZONES`. The necessary R2 objects are listed by filename and SHA-256 in the Worker. In production the source files are stored under `sources/` in that bucket. The public profile contains project material. Archived originals and operational records require the Worker bearer token.

| Method and route | Purpose |
| --- | --- |
| GET / | Project website |
| GET /api/profile | Project profile and attribution |
| GET /health | D1 connectivity and last successful verification time |
| GET /sources/{filename} | Download an archived source with the owner token |
| GET /ops/status | Inspect the indexed edition and task results |
| POST /ops/rebuild | Verify SHA-256, materialize the versioned R2 edition, and refresh the KV view |
| GET /profile | Read private identity profiles |
| POST /skimmer-traverse | Store a private identity and motion record with an `Idempotency-Key` and JSON fields `identity_blank`, `mode`, `zone_masthead`, `demographic_tier`, and `motion_vector` (`x`, `y`, `z`) |

The cron expression `5,35 * * * *` is in UTC. It runs the same build routine as `POST /ops/rebuild` when deployed as a standalone Worker. Cloudflare Pages uses the authenticated `POST /ops/rebuild` route. The GitHub workflow is scoped to this project’s paths. It defaults to Pages and uses the Cloudflare Pages token; set the GitHub repository variable `TABORBOY_DEPLOY_TARGET` to `worker` to select the Wrangler Worker target when account capacity permits. Clouder can manage the Pages project and its storage in the same Cloudflare account.

The source archive also specifies live BLE capture, the full baseball and jump-shot analyzers, the Vampire Cipher, franchise and sandbox modules, and the pure-text KJV API. Those features require their own implementation.

## Web app

[Open the installable app](https://taborboy.pages.dev/app/). Android and other supporting browsers can use the install prompt. On iPhone in Safari, use Share → Add to Home Screen. The app shell can reopen offline after the initial online visit.

The Identity Blank supports six device-local slots. The Motion Lab accepts synthetic or recorded CSV as `t_ms,gx,gy,gz,ax,ay,az` with strictly increasing timestamps, gyro in radians per second and acceleration in meters per second squared. The app calculates peak angular speed, peak acceleration magnitude, time to peak and sample rate from the CSV. The Sideline Bait walkthrough has three phases.

Run `npm test` and `npm run build:pages`. The Pages output is `build/pages/_worker.js`. The scheduled GitHub workflow reruns tests and checks the /health and /app/version routes every six hours.

Pocket Control links the app through its own `taborboy-worker` dispatch bot. The bot verifies the app's private source checksums, materializes the profile edition and updates the respective storage on the hub's hourly schedule. The Pages build directory contains the web module and a separate `build/worker-bot.js` dispatch artifact.

The public website opens the magazine. The original project profile is at `/project/` and the project's interactive tools are at `/app/`. The magazine reader, issue pages, and Recipe Relay are available under `/magazine/`. The dedicated R2 bucket serves an allowlisted cover path. The Pages build includes the same WebP covers as static assets for CI deployment.
