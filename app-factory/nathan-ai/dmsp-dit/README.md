# Nathan Tabor DMSP + DIT
**Digital Managed Service Providers + Digital IT Departments** — a tenant-scoped managed IT operating system built on Cloudflare Workers, D1, and GitHub.

## Product modes
- **DMSP**: third-party managed services with customer contracts and service-level agreements.
- **DIT**: internal IT department operating the same workflow engine for one organization.
- **CO_MANAGED**: customer staff and provider share responsibility under explicit access and approval policies.

## Verified initial implementation (2026-11-18)
- Cloudflare D1 `nathan-ai-dmsp-dit` UUID `cdf85223-d671-4afe-8c69-1b90697b1951` created.
- Database schema applied; 12 departments seeded and counted.
- Cloudflare Worker API source `worker.js` committed; Wrangler binding points to new D1.
- **Worker deployment and live HTTP tests not yet performed.** Do not claim continuous monitoring or a functioning help desk until connectors, authentication and runtime are tested.

## Departments
Digital Help Desk; NOC; SOC; Cloud Operations; Endpoint Management; Identity and Access; Backup and Recovery; DevOps and Automation; Compliance and Risk; Digital CIO/CTO; Client Success; Finance and Operations.

## Implemented API source
- `GET /api/departments` — department registry
- `GET /api/tenants` — tenant registry
- `POST /api/tenants` — create customer/internal department tenant
- `GET /api/overview?tenant=...` — counts of assets, tickets and checks
- `GET /api/tickets?tenant=...` — tenant ticket list
- `POST /api/tickets` — create ticket
- `GET /api/actions?tenant=...` — action queue (read-only)

Current API requires server-side `DMSP_ADMIN_KEY` and is suitable only for a single trusted operator until a proper Cloudflare Access or equivalent per-user identity and per-tenant authorization layer is implemented. Do **not** expose a shared admin token to customers. Tenant isolation currently relies on the gateway's trusted-operator model; customer self-service must wait for authorization tests.

## Next phases
1. Deploy Worker with secure secrets and validate the endpoints.
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
