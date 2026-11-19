# Infinity Grid Federation — verified source mappings

The grid's primary D1 database is `nathan-ai-dmsp-dit` (`cdf85223-d671-4afe-8c69-1b90697b1951`).

## Newly applied additive schema
```sql
CREATE TABLE IF NOT EXISTS grid_sources (
 source_id TEXT PRIMARY KEY, provider TEXT NOT NULL, resource_id TEXT NOT NULL,
 table_name TEXT, entity_kind TEXT NOT NULL, observed_count INTEGER NOT NULL DEFAULT 0,
 sync_state TEXT NOT NULL DEFAULT 'REFERENCED', last_verified_at TEXT, notes TEXT
);
CREATE TABLE IF NOT EXISTS grid_node_sources (
 node_id TEXT NOT NULL, source_id TEXT NOT NULL, external_key TEXT NOT NULL,
 link_state TEXT NOT NULL DEFAULT 'REFERENCE_ONLY', PRIMARY KEY(node_id,source_id)
);
CREATE TABLE IF NOT EXISTS grid_build_queue (
 job_id TEXT PRIMARY KEY, kind TEXT NOT NULL, target TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'PLANNED', requires_approval INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Verified Cloudflare writes
- Source registry references `nathan-tabor-platforms` (1,000 verified script names).
- Source registry references `tabor-fleet-registry.virtual_supercomputer_slot_v1` (1,000 logical slots; prior count).
- Source registry references `nathan-ai-cockpit-ledger.unified_catalog` (4,131 records; prior count).
- 1,000 supercomputer node links to their actual registered script names (`VERIFIED_NAME_MATCH`).
- 1,000 additional node links to numbered virtual slot references (`SLOT_NUMBER_REFERENCE`); this is a *positional association*, not proof the old slot's app/book/technology belongs to that particular Worker.
- Four planned implementation work items: allowlisted dispatcher, receipts, tenant identity, GitHub integration.

## Integrity and scope
The existing 2,001 logical nodes and 2,000 hierarchy links remain intact. The source references do not move, duplicate or install applications. The two 1,000-slot layers share the existing 1,000 Worker script identifiers; they are not 2,000 separate compute engines. `INFINITY` means an extensible, paginated schema, bounded by actual compute, security, storage and cost limits.

## Required implementation gates
1. Read source records and verify foreign resource IDs and provenance before claiming a true join.
2. Implement tenant identity and least-privilege authorization before any writable customer API.
3. Test existing Worker handlers for safe readiness operations, one allowlisted script at a time.
4. Use capped dispatch budgets, receipts, retries, and operator approvals.
5. Reconcile catalog items and code references without executing untrusted external repositories.
