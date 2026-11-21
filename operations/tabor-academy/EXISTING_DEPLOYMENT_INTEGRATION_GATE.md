# Tabor Academy: existing deployment integration gate

Verified existing Cloudflare resources:
- Pages: `tabor-academy-blueprints` — `https://tabor-academy-blueprints.pages.dev`; latest successful deployment ID `d37e5cf1-bba7-44dd-b4b9-b1a5ef64ffd1`.
- D1: `tabor-academy-blueprints` UUID `7a426090-8b0b-4f85-8a68-8b5c8e6fc478`.
- Existing `blueprint_lessons`: 30 rows, 15 columns.
- Existing `blueprint_integrity`: 30 rows.
- Other Academy D1 `tabor_academy_db` UUID `f9708fd8-af51-4d79-b6c2-edb532f53fc0` is a separate educational system. Do not run the generated 19-column migration against it.

## Verified blockers to production promotion
1. Generated package `wrangler.toml` has a placeholder database UUID and points at the wrong database name. Its `db:remote` command targets `tabor_academy_db`, which would be destructive or incompatible. **Do not execute this script unchanged.**
2. Existing schema lacks `row_sha256`, `version`, `state`, and `r2_diagram_key`. The 19-column `CREATE TABLE IF NOT EXISTS` does not add these fields to an existing table. A versioned additive migration and row-by-row backfill with deterministic hashes are required.
3. Existing Cloudflare account has 500 Worker scripts. Do not create a new Worker; find an existing authorized service binding or deploy a compatible Pages Function after review.
4. Existing Pages project must be backed up / preview tested; the 7-phase package is a starter implementation and does not yet provide all optional Cloudflare services.
5. Investigative mode must be verified at **network response level**, not just DOM, to prevent answer leakage.
6. No claims of full self-healing, AI verification, or bit-level factual certainty without implementation and evidence.

## Safe next deployment sequence
- Commit generated source in a new isolated `academy/blueprint-engine/` tree.
- Correct Wrangler binding to existing Blueprint D1; do not run old migration.
- Create `0002_existing_blueprints_upgrade.sql` after snapshotting the live schema and rows. Add columns or companion table non-destructively; backfill SHA-256 using canonicalized source fields, with exact parity tests.
- Run local tests, D1 migration dry-run against a staging clone, then deploy a Pages preview (not production).
- Test existing lessons, Instant/Investigative responses, content security, auth, idempotency, offline cache and rollback.
- Promote to production only after verified preview; record commit SHA, D1 counts, deployment ID, and health/lesson endpoint responses.

## Status
This file records a real integration blocker and a safe migration path. It is **not** evidence that the generated package has been deployed. The existing site is live and should be preserved.
