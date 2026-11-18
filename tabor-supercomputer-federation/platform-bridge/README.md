# ONE + Workers for Platforms: 1,000 + ONE

Production link: `one-sovereign-hub` → service binding `PLATFORM_HUB` → existing `nathan-tabor-hyper-federation` → dispatch namespace `nathan-tabor-platforms` (1,000 Worker scripts). This preserves 11 named platform scripts and 989 Glottolog v5.4 language data shard scripts, rather than overwriting them. The separate `tabor-supercomputer-federation` continues to provide 1,000 SQLite-backed logical Durable Object nodes.

The main source module is `one-entry.mjs` and must be deployed **alongside** the existing ONE `worker.js` and `fleet-release/*` modules, with `main_module = "platform-bridge/one-entry.mjs"`. Existing bindings are inherited; add a service binding `PLATFORM_HUB` targeting `nathan-tabor-hyper-federation` in production. It appends read-only, on-demand routes without changing existing routes:

- `/fleet/platforms`: configuration overview
- `/fleet/platforms/health`: dispatch controller health JSON
- `/fleet/platforms/catalog`: 11 named platforms
- `/fleet/platforms/shards?start=1`: shard directory, paged
- `/fleet/platforms/p/compute`: named platform JSON
- `/fleet/platforms/p/language-shard-0001`: language shard JSON
- `/fleet/platforms/library`: Library capacity plan metadata

All fan-out remains bounded to one backend invocation per request. The bridge does not run a clock loop or acquire dedicated RAM, SSDs, or physical computers; Cloudflare provides managed Workers/Durable Objects and metered execution/storage. The $25 Workers for Platforms price is the published plan price, but account subscription/payment could not be independently inspected due to billing API permission. API deployment version and binding are verified; direct public HTTP route checks were blocked by DNS in this environment and need independent verification.

Rollback: redeploy prior ONE version `975d28f1-ab27-4686-bb33-dc1240cdf469` using Cloudflare Workers deployment version controls; this does not change stored databases.
