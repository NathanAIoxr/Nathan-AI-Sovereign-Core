# Nathan AI Cloudflare fleet

The fleet has 64 Cloudflare Worker deployments in its roster. The roster includes 33 existing workloads and 31 new fleet Workers. The fleet controller also performs one companion check. Each roster entry has a named, SQLite-backed Durable Object supervisor. Two existing supervisors also cover the Tabor App Portfolio and the Library of Tabor Data service.

`fleet-plan.mjs` maps the applications to reachability checks and, where configured, companion checks. Companion Workers run through private service bindings. Supervisors record their latest result and consecutive failures. The second consecutive failure flags the check for attention. Check failures also appear in Cloudflare Workers Logs. The schedule runs one of five cohorts per minute, so each supervisor runs every five minutes. The first status request schedules a sweep for workloads that are still awaiting their first receipt.

Checks cover application routes, response type or page title, and the age of the handoff job receipt. A `protected` result confirms an expected access restriction. A `stale` result means a supervisor has missed more than two check intervals.

The public aggregate is available at [Fleet status](https://nathan-ai-fleet.nathantaboract.workers.dev/health). It reports counts by workload group. The Workers Logs entries contain individual failed check receipts.

## Validate and deploy

Run `node --test hive/cloudflare-fleet/fleet.test.mjs` from the repository root.

`node hive/cloudflare-fleet/deployment.mjs` prints the modules and upload metadata for the Cloudflare Workers API. Add `--new-controller` for the first controller upload on an account. Upload the private companions first with the `companion.mjs`, `probe.mjs`, and `fleet-plan.mjs` modules, then upload the controller with `controller.mjs`, `probe.mjs`, and `fleet-plan.mjs`. Apply each entry’s `enabled` value to its `workers.dev` setting with preview URLs disabled. Apply the controller’s cron schedule after upload.
