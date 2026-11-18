# Tabor World Hub — Cloudflare deployment record

Cloudflare Worker: `tabor-world-hub` (deployed via Cloudflare API, 100% deployment recorded).

Database binding: `REGISTRY` → existing D1 `tabor-database-registry` (id `af177f57-154c-41a1-a5cd-5602568a4a2f`).

Routes:
- `GET /`: read-only system catalog website
- `GET /health`: operational health response
- `GET /api/overview`: architecture and grouped system counts
- `GET /api/systems?q=...`: searchable registered system specifications

Deployment does not alter existing `tabor-world`, `tabor-one`, `one-sovereign-hub`, or `nathan-tabor-supercomputer` Workers.

Security and scope: read-only API; no private archive, credentials, agent instructions, or source corpus published. This is a first Hub interface, not a claim that all worldwide agents are operational. All 48 registered system entries currently have `specified` status. Extend with verified worker inventory, separate identity-aware agent profiles, authenticated management, and review-gated task execution.

Cloudflare deployment ID: `8bff120f-e7d7-4ac1-8231-29a4adb16b24`.
