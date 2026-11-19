# PD-011 — Cloudflare Persona Atlas health verification

This module adds **read-only monitoring** for the existing `tabor-persona-duality` Worker without changing the deployed Worker, KV keys, cron, or original canon.

- `health-check.mjs` requests only `GET /api/health` and `GET /api/receipts` on the pinned owned workers.dev hostname; no third-party targets, redirects, or mutating calls.
- Requires Worker health, a bound KV namespace, graph baseline preservation, and an actual receipt younger than 45 minutes. Missing, stale, or malformed receipts fail closed.
- Confirms that scheduled review rotation has **not executed development tasks**. This monitor cannot prove a feature is complete.
- GitHub Actions runs local tests on PRs. A live probe runs only on manual or six-hourly scheduled workflows; failures are visible as failed checks. The workflow has no deployment credentials and cannot write to Cloudflare.
- The Cloudflare cron remains `*/15 * * * *`; GitHub's six-hour monitor is an independent audit and not a replacement.
- Run locally: `node --test creative-archive/persona-duality/monitoring/health-check.test.mjs` then `node creative-archive/persona-duality/monitoring/health-check.mjs`.
- Avoid recording private data or raw credentials in logs; the probe prints only public health fields and public review receipt IDs.

**Status:** source committed in a reviewable PR. Live checks should not be claimed successful until the workflow has actually run and reported a passing result.
