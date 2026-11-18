# Nathan AI Unified Operations Cockpit — initial implementation
This is a **scaffold, not a completed control plane**. It provides an authenticated job API, Cron producer, Queue consumer, D1 receipt ledger, and GitHub Actions scheduled matrix.
## Deployment prerequisites
1. Create or choose an authorized D1 database and apply schema.sql; replace placeholder database_id in wrangler.toml.
2. Create queues nathan-ai-cockpit-jobs and nathan-ai-cockpit-dlq.
3. Set CONTROL_TOKEN via Cloudflare secret storage; deploy using the repository's existing Wrangler setup.
4. Verify /health, authorized /api/jobs and /api/status, scheduled invocations, queue consumption and dead-letter behavior.
5. Add actual per-resource inventory collectors and verification logic before describing fleet reconciliation as completed.
No third-party scanning, unauthorized deployment, or destructive cleanup is implemented.
