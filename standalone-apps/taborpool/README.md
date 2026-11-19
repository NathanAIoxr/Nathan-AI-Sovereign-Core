# TABORPOOL

[Live project](https://taborpool.pages.dev/) · [Work profile](https://taborpool.pages.dev/api/profile) · [Worker status](https://taborpool.pages.dev/health)

Codex 1 supplies Living Threshold lore and the historical broadsheet context. The recovered manifesto supplies the operating rules and archetypes. The ledger and treasury reflect Nathan’s deployment brief. Nathan Tabor’s build order is 1 - 1 = 0 (provision and migrate) followed by 1 + 1 = 2 (deploy and run).

Run `npm test` with Node 22 or newer. The primary live target is its own Cloudflare Pages project. It uses the same `src/index.js` as the standalone Worker. Apply the D1 migrations and set `SOVEREIGN_TOKEN` as an encrypted secret on the target platform before deploying. This project uses `taborpool_db`, `taborpool-archives`, and `TABORPOOL_LEDGER`. The necessary R2 objects are listed by filename and SHA-256 in the Worker. In production the source files are stored under `sources/` in that bucket. The public profile contains project material. Archived originals and operational records require the Worker bearer token.

| Method and route | Purpose |
| --- | --- |
| GET / | Project website |
| GET /api/profile | Project profile and attribution |
| GET /health | D1 connectivity and last successful verification time |
| GET /sources/{filename} | Download an archived source with the owner token |
| GET /ops/status | Inspect the indexed edition and task results |
| POST /ops/rebuild | Verify SHA-256, materialize the versioned R2 edition, and refresh the KV view |
| GET /archive | List the archived sources and checksums |
| GET /ledger | List private simulation ledger entries |
| POST /ledger | Append a simulation entry with an `Idempotency-Key` and JSON fields `register`, `source`, and integer `units` |

The cron expression `15,45 * * * *` is in UTC. It runs the same build routine as `POST /ops/rebuild` when deployed as a standalone Worker. Cloudflare Pages uses the authenticated `POST /ops/rebuild` route. The GitHub workflow is scoped to this project’s paths. It defaults to Pages and uses the Cloudflare Pages token; set the GitHub repository variable `TABORPOOL_DEPLOY_TARGET` to `worker` to select the Wrangler Worker target when account capacity permits. Clouder can manage the Pages project and its storage in the same Cloudflare account.

The archived Python engine is a local creative simulation. The edge ledger records simulation units and does not perform payments or distributions. The archive preserves the recovered manifesto, engine and demo.
