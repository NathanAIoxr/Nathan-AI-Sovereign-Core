# Nathan AI — 24/7 Quota-Aware Operations (additive)

**Scope:** Existing Cloudflare Worker `nathan-ai-comms-bus`, its dedicated D1 ledger and Queue; existing GitHub PR #350. All the other Workers, dispatch scripts, Agents, Pages, R2, zones, D1 databases, KV namespaces and schedules retain ownership and independent execution. A cap in this Worker does **not** cap those services.

## 1. One-minute wake-up; useful work on demand

- Cloudflare Cron is now `* * * * *`, UTC. The Worker is invoked once per minute, but four of five invocations intentionally do no D1/Queue work.
- Every 5 minutes: persist a tiny `scheduler_receipts` sample.
- Every 15 minutes: enqueue a typed heartbeat for the existing communications consumer, subject to this Worker's local daily message ceiling.
- Every UTC midnight: prune **only** the new derived 30-day scheduler receipt and local quota telemetry. No pruning of original books, source archives, catalog entries, fleet slots, or historical messages.
- Existing producers and consumers remain unchanged. This is **not** permission to replicate third-party code or schedule resource-intensive or arbitrary programs.

## 2. Local message budget

`LOCAL_QUEUE_MESSAGES_PER_DAY=200` limits producer activity **on this communications Worker only**. Its budget is enforced with an atomic D1 `INSERT ... ON CONFLICT ... WHERE ... RETURNING` update. A normally delivered small message can consume three Queues operations (write, read, delete), and retries cost more. The 200/day cap is deliberately conservative; other Workers share separate billing allowances and are not governed by this setting.

`GET /v1/capacity` reports local accepted counts, recent scheduler receipts, and **hypothetical pacing references** based on published allowances. When there is no verified billing telemetry, the response explicitly says so. Do not misrepresent these references as live billing totals.

## 3. Confirmed published Workers Paid allowances, not entitlements verified for this account

| Service | Typical Workers Paid inclusion |
|---|---|
| Requests | 10 million / month, + $0.30 per additional million |
| CPU | 30 million CPU milliseconds / month, + $0.02 per additional million |
| KV | 10 million reads, 1 million writes per month; storage separately priced |
| D1 | 25 billion rows read, 50 million rows written, 5 GB storage |
| Queues | 1 million operations per month, roughly three per small delivered message |
| Cron Triggers | 250 per account at standard Workers Paid plan limits; not 1,000 |

References:
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/queues/platform/pricing/
- https://developers.cloudflare.com/kv/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/workers/platform/spend-management/

Approximate 30-day pacing at 5% reserve: **219 Workers requests/min** and **659 CPU-ms/min**, **across the whole account**. This is a ceiling-planning reference and not a target to artificially consume. Real billed periods can be different lengths; unavailable current billing data makes all available headroom unknown.

## 4. Billing, zone and Pages realities

The connected Cloudflare OAuth integration returned HTTP 403 for billing usage, account subscriptions and spend policies. It **cannot** verify a $20–$25 Pro zone or identify the user's $1.99 payment, and cannot enable a spending limit. Zero observed DNS zones means a Pro zone plan is not established for the connected account.

Cloudflare Workers' spending limits can block all account Workers, including Cron and Queues, and do not guarantee an invoice maximum because of enforcement delays and other billable services. Do not set a $0 Workers stop-limit blindly on a live fleet. Configure alerts and spending limits in **Billing → Spend limits** after reviewing availability impact and authorizing the change.

Static Cloudflare Pages builds, Workers Builds, GitHub Pages and Worker runtime invocations are distinct systems with distinct limits. Do not assume a Pro zone supplies 5,000 Pages builds or a guarantee of no overages.

## 5. GitHub and ChatGPT allocation

GitHub Actions workflow `.github/workflows/nathan-ai-comms-bus.yml` runs source checks for PRs, and scheduled status plus capacity checks twice a day **once it reaches the default branch**. Secretless GETs are supported; authenticated GitHub → Cloudflare messaging remains disabled until matching repository-scoped secrets are configured. Cloudflare → GitHub dispatch is likewise opt-in and requires a separate scoped token.

ChatGPT's existing **Nathan Fleet + Global Atlas Builder** hourly task should inspect receipts, Cloudflare live resources, GitHub commits, and CI status, reporting failures and proposing bounded changes. It is not the actual one-minute loop and cannot silently set billing policies. Avoid fake task keep-alives and any assumption that exact task counts or automatic pause behavior remain constant for all plans.

## 6. Verify

Run source checks:
```sh
node --check worker.mjs
node --check capacity-policy.mjs
node --test capacity-policy.test.mjs
```

Deploy through reviewed Wrangler config (from this directory):
```sh
npx wrangler d1 execute nathan-ai-comms-ledger --remote --file=./capacity-migration.sql
npx wrangler deploy
```

Check `/v1/status`, `/v1/capacity` and D1 `scheduler_receipts`; verify the Worker's Cron trigger actually propagated and that a queue heartbeat is processed. A deployed version is not proof that a scheduled interval fired. If the 1-minute Cron fails, restore the old 15-minute schedule without changing any unrelated Worker.
