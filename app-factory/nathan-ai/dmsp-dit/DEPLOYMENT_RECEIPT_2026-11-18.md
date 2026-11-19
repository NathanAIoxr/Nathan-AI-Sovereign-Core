# Nathan Tabor DMSP + DIT — Deployment Receipt

**Build date (US Eastern):** 2026-11-18
**Worker:** `nathan-ai-dmsp-dit`
**Expected public URL:** https://nathan-ai-dmsp-dit.nathantaboract.workers.dev/
**GitHub:** https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/356 (draft PR; unmerged)

## Evidence ledger

| Requirement | State | Evidence |
| --- | --- | --- |
| Existing project source inspected | VERIFIED | `app-factory/nathan-ai/dmsp-dit/` contained README, Worker, schema, Wrangler config, upstream candidates |
| Cloudflare account linked | VERIFIED | Cloudflare account-scoped API returned expected account; avoid printing credentials |
| Existing D1 database identified | VERIFIED | `nathan-ai-dmsp-dit`, UUID `cdf85223-d671-4afe-8c69-1b90697b1951` |
| Department schema expanded | VERIFIED | `INSERT OR IGNORE` added 16; follow-up D1 COUNT=28 |
| Per-department playbooks staged | VERIFIED | 28 runbook metadata records; enabled=0; all approval_required=1 |
| Worker script uploaded | VERIFIED | Cloudflare `PUT /workers/scripts/nathan-ai-dmsp-dit` reported success |
| Live Worker deployment configuration | VERIFIED | Deployment `50f2e0fc-ef0b-42f3-8058-24f173c198b9`, active version `ebaab7df-d5aa-4e05-b458-55498be5e5e4` at 100% |
| D1 binding | VERIFIED | Cloudflare settings GET returned `DB` type `d1` with expected UUID |
| workers.dev routing | VERIFIED | Script subdomain GET returned `enabled: true`, preview URLs disabled |
| Public HTTP response | UNVERIFIED | External URL checks failed because current tools could not access workers.dev; test from a client before declaring public service usable |
| Code unit tests | PENDING | Node test file and GitHub Actions workflow committed; no successful run yet observed |
| Customer data or assets onboarded | NO | D1 tenants COUNT=0 and tickets COUNT=0 at initial audit; no client integrations set up |
| Managed endpoint monitoring | NOT ENABLED | Requires owned/authorized resources, verified integrations and alert workflow |
| Customer private API | NOT ENABLED | `DMSP_ADMIN_KEY` not configured by this build; Access and per-tenant RBAC required |
| Billing, contracts, SLA staffing | NOT ENABLED | Product design only; no subscriptions or staffed desk asserted |

## Source/deployment mapping
The Worker upload used the Worker source read directly from GitHub feature branch, previously committed as source change `10a928f92462846753b7bc269f959bcc4d7c195d`. Subsequent changes on that branch extended data schemas, runbook templates, documentation and tests, not the deployed Worker code.

## Required next verification
1. Visit the expected public URL and `/healthz` using a normal browser or independent HTTP client.
2. Execute and record Node test results and API response snapshots.
3. Put identity, access control, tenant authorization, rate limits and secret handling in place before enabling private operations.
4. Bind future changes to reviewed GitHub commits and release receipts.
5. Never assert an external endpoint, resource, tenant, user, backup or worker is operating unless separately verified.

**Definitions:** VERIFIED = observed via relevant provider API. UNVERIFIED = not independently tested. NOT ENABLED = a designed capability not activated or established. A Worker or database record is not a physical server or running MSP team.
