# NATHAN AI RECURSIVE READER BOTS — DEEP_CRAWLER
Creator: Nathan Tabor. Independent project; no other applications overwritten.

## Stage 0 — safe reference implementation
- `reader.js`: deterministic extraction of HTTPS references restricted to explicit allowlisted hostnames, SHA-256 identifiers, ALIEN/NEILA lineage seals, bounded depth and queue message construction.
- `schema.sql`: minimal D1 graph metadata ledger. No raw document payloads, tokens, personal data, or private storage values.
- Root status `leaf` means no *allowed references found in inspected content*, not that the resource is a global root. `depth_limit`, `blocked`, `error`, and `cycle` are separate outcomes.
- `NATHAN_GH_BOT`, `NATHAN_CF_BOT`, `NATHAN_LINK_TRACER` are logical roles, not deployed autonomous crawlers.
- No bulk D1 scans, unrestricted outbound HTTP fetches, webhook invocations, or cross-account discovery. No credentials committed.

## Pending integration
Wire to a scoped, authenticated source adapter; paginated reads with byte/row/time budgets; secret redaction; durable deduplication; per-source permission checks; owner approval before TWEEZER-OS imports; and existing Cloudflare Queue consumer after verification. GitHub commit does not mean Cloudflare deployed. Account currently reports 500-Worker limit; reuse an existing Worker only after confirming ownership and isolation.
