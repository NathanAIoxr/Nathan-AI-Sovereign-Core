# Tabor Train — source and build repair pack

- The 202 entries are copied verbatim from the existing 101 Worker + 101 Bot source catalog. Registry entries do not constitute live Worker deployments.
- The branch's root `.gitmodules` path was not found; no submodule pointers were deleted. Do not purge nested repositories without inspecting Git tree modes.
- The SQL migration is additive and idempotent. Apply it with the D1 binding of the target Worker before routing traffic. Avoid running D1 schema creation on every HTTP request.
- GitHub Actions should run schema checks and TypeScript checks without fetching submodules.
- The existing Sovereign 202 runtime uses Durable Object SQLite and does **not** bind D1. This schema belongs to D1-backed gateway deployments, not the DO runtime.
- Cloudflare's 432 script entries were counted via API in the connected account. Active deployments, health, and 101+101 implementation completeness have not been established.
- No production Worker was overwritten or reset. This pack does not wipe data.
