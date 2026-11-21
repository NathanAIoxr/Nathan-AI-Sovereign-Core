# Nathan AI Central Conductor — implementation intake

Source: user-supplied Master Architect Handoff (Ubuntu 26.04 DMSP/DIT).

## Required deliverables, in order
1. Idempotent Ubuntu installer with local-only FastAPI, SQLite WAL, systemd services, optional swap and safe firewall setup.
2. OpenAPI 3.1 JSON for dispatch and health using HTTPS bearer auth.
3. D1 schema, Cloudflare Worker KV SYSTEM_STATE guard, R2 object metadata and watchdog; Wrangler config must use existing authorized resource IDs.
4. R2_UPLOAD support: content SHA-256, private bucket object storage, D1 metadata index and retry/idempotency.

## Required repairs before any live installation
- User-pasted governor contains invalid Python indentation and stray `Use code with caution.` line; fix before executing.
- Cloudflare D1 URL must use `https://api.cloudflare.com/client/v4/accounts/{account}/d1/database/{database}/query`; do not use the malformed placeholder URL.
- Validate Cloudflare D1 API payload format; do not assume a `batch` array is supported.
- Never place GitHub PAT in a Git clone URL or command line. Use a GitHub App or credential helper with secret redaction.
- Use strict realpath containment and allowlisted repositories, reject symlinks, validate all syntax with checked exit codes, and require PR review for production changes.
- Do not permit direct writes to production Cloudflare or protected branches without authorized review.
- Rate limiting is per actual provider quotas and responses; KV is eventually consistent, not a millisecond global emergency stop. For critical stops use a fail-closed authoritative control.
- Tunnel requires an actual hostname, Cloudflare Access policy and service token; a bearer token alone is insufficient to claim Zero Trust protection.
- `/health` should return actual service health rather than `ONLINE_24_7_365` merely because the API answered.
- SSH must be configured and tested before changing UFW; do not lock out the host. Cloudflared install must verify package architecture/signature.
- Watchdog should alert/stop on missed heartbeat, not expose unauthenticated control endpoints. Do not invent credentials or claim server provisioning.

## Execution
Recover existing server/Cloudflare/GitHub deployment inventory first. Build and test these components in a new isolated app directory. Commit tested source, open review PR, and deploy only to authorized existing resources with verified receipts. Maintain independent project identities and hand off bounded tasks to existing conductors.
