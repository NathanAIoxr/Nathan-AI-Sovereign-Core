# Nathan AI — Cloudflare / GitHub / ChatGPT communications bus

The purpose is **verified two-way control-plane communication**, not simulated physical server provisioning.

## Live inventory (2026-11-18)
- 445 existing Cloudflare Worker scripts, 50 pre-existing D1 databases, 10 pre-existing Queues, 10 KV namespaces and 6 R2 buckets.
- 0 zones and 0 Cloudflare Pages projects visible in the connected Cloudflare account. Workers.dev services and GitHub Pages are different from DNS zones/Cloudflare Pages.
- Fleet D1: 505 catalog entries; 1,000 virtual machine slots with `allocation_kind=logical` and `deployment_state=indexed_only`.
- Global atlas D1: 205 public open-source repositories, **all cataloged as discovered_not_installed**, plus 15 imported-worker records.
- **New separate resources**: one communications D1 ledger and two Queues. Existing queues and scheduled workers are unchanged.

## Wiring
Cloudflare Cron → `nathan-ai-comms-events` Queue → Worker consumer → D1 receipts.
GitHub scheduled Actions → public /v1/status; optional authenticated POST /v1/messages.
Cloudflare Cron → optional GitHub repository_dispatch only if `GITHUB_DISPATCH_TOKEN` installed.
ChatGPT can read and manage account resources through connected tools and existing hourly scheduled task, but is **not** an autonomous resident process or permanent socket.

## API
- GET /v1/status — public health summary.
- GET /v1/registry — aggregate fleet records; not evidence of deployment or ownership outside this account.
- GET /v1/messages — authorized metadata history.
- POST /v1/messages — authorized, bounded typed messages. No remote commands or arbitrary destinations.

## Secrets, safety and rollout
- Secret `BRIDGE_TOKEN` on Cloudflare must match GitHub Actions secret `NATHAN_BRIDGE_TOKEN`; do not commit either value.
- Optional `GITHUB_DISPATCH_TOKEN` must be repository-scoped and minimal. GitHub Actions scheduled runs use default-branch workflow, so merging reviewed changes is required.
- Queues have retries and a dedicated dead-letter queue. Messages are at-least-once, with idempotent D1 inserts.
- Third-party code is only indexed as a lead; assess license, provenance, runtime and security before installing. Do not execute arbitrary remote repositories or target external infrastructure.

## Deployment
From `integrations/nathan-ai-comms-bus`:
```sh
npx wrangler d1 execute nathan-ai-comms-ledger --remote --file=./schema.sql
npx wrangler secret put BRIDGE_TOKEN
npx wrangler deploy
```
Install the GitHub secret separately before enabling the authenticated GitHub → Cloudflare leg. A deployed Worker does not prove that GitHub ↔ Cloudflare messaging is configured.
