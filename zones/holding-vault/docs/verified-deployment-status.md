# Verified Cloudflare holding inventory — 2026-11-19

- Existing account: 0 DNS zones. Do not invent domains or change nameservers.
- Existing Cloudflare Pages projects: 20, registered independently in `zones_registry`.
- Existing Worker app entries: 5, registered independently in `zones_registry`.
- Each registered project has `launch_status=HOLD`; this is metadata, **not an access control** on existing public staging endpoints.
- Existing book reference sets: 1,000 and technology reference sets: 1,000, copied into `holding_catalog_references_v1` as reference-only inventory, not misrepresented as deployed apps, complete books, or executable compute.
- The D1 schema and records were applied directly to existing `tabor-fleet-registry` and verified.
- Holding-vault Worker source is scaffolded in this branch but **not deployed**. Do not deploy its placeholder PROJECT_ID or add another Worker script without checking capacity.
- Before public custom-domain launch: verify domain ownership, DNS/MX, SSL mode and origin certificate, authentication for unpublished assets, routes, and user approval.
