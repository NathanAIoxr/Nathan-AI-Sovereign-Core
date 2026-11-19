# Nathan AI DMSP + DIT — Workers for Platforms Pool
## Verified state
- Cloudflare dispatch namespace: `nathan-tabor-platforms`
- Existing dispatch scripts: 1,000, confirmed via Cloudflare namespace scripts listing
- Cloudflare D1: `nathan-ai-dmsp-dit`
- `dmsp_platform_workers`: 1,000 registered inventory records
- `dmsp_worker_pool`: 1,000 pool entries, execution_enabled=0, health_state=UNKNOWN
- Existing script sources are **not** copied to GitHub by the inventory; only names and metadata are present.
- No evidence that 1,000 scripts have been executed or are independently healthy.

## Pool state machine
REGISTERED -> VALIDATING -> READY -> ACTIVE -> DEGRADED / DISABLED.
Promote to READY only after a bounded read-only smoke test of the exact script; promote to ACTIVE only after authorized, successful dispatch and receipt. Preserve the existing namespace and avoid duplicating scripts.

## Remaining build
1. Inspect dispatch script handlers and validate safe, non-mutating readiness probes.
2. Add a dedicated dispatcher Worker with `[[dispatch_namespaces]]` binding to `nathan-tabor-platforms`.
3. Configure secure operator authentication and tenant-scoped allowlists.
4. Implement bounded batch scheduling, per-script concurrency, retry/backoff, and cost budgets.
5. Add verified dispatch receipts, per-script health history, circuit breakers and rollback.
6. Connect Cloudflare deployment checks, GitHub Actions CI and the mobile dashboard.
7. Build customer-facing service features (ticket lifecycle, NOC, SOC, billing, backups, identity) with explicit authorization.
8. Validate licensing and hosting requirements before deploying third-party open-source MSP applications.

No unauthorized external systems are enrolled, scanned or controlled.