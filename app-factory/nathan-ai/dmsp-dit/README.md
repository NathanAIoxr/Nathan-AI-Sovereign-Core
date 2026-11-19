# Nathan Tabor DMSP + DIT

## Public installation and download (current release)

- **Live Cloudflare PWA:** https://nathan-ai-dmsp-dit.nathantaboract.workers.dev/
- **Download standalone offline HTML:** https://nathan-ai-dmsp-dit.nathantaboract.workers.dev/download
- **GitHub offline file:** [public/offline-standalone.html](./public/offline-standalone.html)
- **GitHub source on main:** https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/nathan-ai/dmsp-dit
- **Public catalog download:** https://nathan-ai-dmsp-dit.nathantaboract.workers.dev/download/catalog.json
- **Install instructions:** [PUBLIC_DOWNLOAD_GUIDE.md](./PUBLIC_DOWNLOAD_GUIDE.md)

The public app supports search/filter across 28 departments, DMSP/DIT/co-managed plan construction, local JSON plan export, copy summary, an offline single-file edition and PWA install support. Cloudflare API confirms production deployment and D1 binding. GitHub PR #356 was merged into `main`; the relevant workflow passed. **Independent outside-browser URL verification could not be completed from the tool environment.** No customer account enrollment or active endpoint monitoring has been enabled.

**Digital Managed Service Providers + Digital IT Departments** — a tenant-scoped managed IT operating system built on Cloudflare Workers, D1, and GitHub.

## Product modes
- **DMSP**: third-party managed services with customer contracts and service-level agreements.
- **DIT**: internal IT department operating the same workflow engine for one organization.
- **CO_MANAGED**: customer staff and provider share responsibility under explicit access and approval policies.

## Verified initial implementation (2026-11-18)
- Cloudflare D1 `nathan-ai-dmsp-dit` UUID `cdf85223-d671-4afe-8c69-1b90697b1951` created.
- Database schema applied; **28** operating departments seeded and independently counted.
- Cloudflare Worker API source `worker.js` committed; Wrangler binding points to new D1.
- **Cloudflare Worker deployment API returned success** and the `nathan-ai-dmsp-dit` workers.dev subdomain is enabled. **Independent public HTTP endpoint checks remain unverified** because the current external request tools cannot reach the fresh workers.dev URL. Do not claim continuous monitoring or a functioning help desk until customer connectors, identity, runtime and support operations are tested.

## Departments
28 operational departments are indexed in D1, including the initial 12 plus asset lifecycle, network engineering, business apps, data, observability, integrations, platform engineering, training, onboarding, vendors, procurement, automation verification, incident command, privacy, release quality and field services. See [OPERATING_MODEL.md](./OPERATING_MODEL.md).

## Public portal and read-only APIs
- Public URL: https://nathan-ai-dmsp-dit.nathantaboract.workers.dev/
- `GET /` read-only service portal
- `GET /healthz` real database probe and honest configuration state
- `GET /api/public/departments` real D1 department registry
- `GET /api/public/services` 28 service scopes
- `GET /api/public/gaps` 16 improvements standard MSPs should make
- `GET /api/public/comparison` legacy IT vs MSP vs DMSP/DIT

## Implemented API source (private operations)
- `GET /api/departments` — department registry
- `GET /api/tenants` — tenant registry
- `POST /api/tenants` — create customer/internal department tenant
- `GET /api/overview?tenant=...` — counts of assets, tickets and checks
- `GET /api/tickets?tenant=...` — tenant ticket list
- `POST /api/tickets` — create ticket
- `GET /api/actions?tenant=...` — action queue (read-only)

Current API requires server-side `DMSP_ADMIN_KEY` and is suitable only for a single trusted operator until a proper Cloudflare Access or equivalent per-user identity and per-tenant authorization layer is implemented. Do **not** expose a shared admin token to customers. Tenant isolation currently relies on the gateway's trusted-operator model; customer self-service must wait for authorization tests.

## Next phases
1. Validate the public Worker URL with an independent HTTP client and configure secure operator access before private use.
2. Add tenant-aware roles and verified identity, customer self-service, MFA, and fine-grained action permissions.
3. Add ticket lifecycle transitions, SLA clocks, priority queues, escalation, and on-call coverage.
4. Add opt-in monitoring connectors for authorized Cloudflare/GitHub resources, with rate limits and audit records.
5. Add alert deduplication, runbook approvals, idempotency, rollback, and verification receipts.
6. Add backup verification and safe restoration drills.
7. Add billing, contracts, customer reporting, compliance evidence, and cost accounting.
8. Add mobile PWA and bridge to the existing Pocket Control Plane, without requiring access to the private Clouder Pro app.
9. Add deployment pipelines, tests, disaster recovery, and measurable service reliability.

## Binary verification model
- `0`: absent, pending, failed or not verified
- `1`: verified successful for a *specific* operation or check
- Do not conflate indexed assets, detected events, completed workflows, and repaired incidents.
- Preserve `UNKNOWN` and `WARN` as distinct monitoring states; lack of data is not success.

## Operational security
No third-party networks or customer systems may be monitored, scanned, changed, or enrolled without authorization. No self-replicating agents or arbitrary script execution. Destructive actions and high-risk changes require explicit human approval and audit trails.

## Code verification
- `worker.test.mjs` includes Node 22 tests of portal, catalogs, D1 department read, health and protected-route fail-closed behavior.
- `.github/workflows/dmsp-dit-ci.yml` runs those tests on changes in this module.
- This branch adds documents, tests, and schema while keeping existing private ticket/tenant paths locked without a secret.

## Department playbooks seeded (inert by design)
- `runbooks-seed.sql` provides one review-required template for each of the 28 departments.
- Live D1 verification: **28 runbook records**, **0 enabled**, **28 require approval**.
- These records are definitions, not running automations. Only credentialed, authorized tenant-specific workflow execution may be enabled in a later hardening release.
