# Agent orchestration and deployment contract

This is an implementation plan, not a claim that every project is production-ready.

## Roles
- **Architect/AI coding agent:** proposes scoped changes in pull requests.
- **GitHub Actions runner:** tests changed projects and produces immutable artifacts.
- **Deployment controller:** deploys only approved project manifests with least-privilege credentials.
- **Cloudflare Workers:** serve bounded HTTP/queue jobs; no uncontrolled self-replication.
- **Cloudflare D1:** stores a durable job ledger and deployment status.
- **Cloudflare Queues:** distribute bounded tasks with retries and dead-letter handling.

## Independent project manifest
Every app keeps its own unique slug, source directory, target, build command, test command, health endpoint, and release SHA. Never combine distinct apps merely because they share an engine.

## State machine
DISCOVERED -> VALIDATED -> BUILT -> TESTED -> APPROVED -> DEPLOYED -> HEALTHY
Failure states: BLOCKED, FAILED, ROLLED_BACK. Deployment record alone is not HEALTHY.

## Controls
- No mass deployments without per-project build and test results.
- Production releases use protected GitHub Environments and explicit approval.
- No PATs, Cloudflare tokens, or other secrets in source or logs.
- Restrict GitHub Actions permissions to contents:read unless write is necessary.
- Use concurrency groups, timeouts, retry caps, and rate limits.
- Require idempotency keys for queued jobs; maintain an audit trail.
- Never import arbitrary third-party bots, servers, or repositories as executable workers.
- Respect Cloudflare account limits; don't evade limits by creating hidden accounts or shadow worker databases.

## D1 proposed tables
```sql
CREATE TABLE IF NOT EXISTS app_registry (
  app_id TEXT PRIMARY KEY,
  source_path TEXT NOT NULL UNIQUE,
  deployment_target TEXT NOT NULL,
  health_url TEXT,
  enabled INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS deployment_jobs (
  job_id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES app_registry(app_id),
  commit_sha TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('DISCOVERED','VALIDATED','BUILT','TESTED','APPROVED','DEPLOYED','HEALTHY','BLOCKED','FAILED','ROLLED_BACK')),
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(app_id,commit_sha)
);
```

## Initial verification
1. Inventory repositories, existing workflows, Cloudflare Workers and Pages.
2. Confirm ownership and build/test commands for each independent project.
3. Fix GitHub-to-Cloudflare credential configuration using repository secrets.
4. Resolve hostname collisions before production deployment.
5. Test one pilot app end-to-end; then expand in bounded batches.
6. Publish deployment status and failures separately from application health.
