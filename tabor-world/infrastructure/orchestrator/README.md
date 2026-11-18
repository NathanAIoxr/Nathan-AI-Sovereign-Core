# Tabor Job Orchestrator

Authenticated bounded job executor for 64 registered agent IDs. Supported jobs: inventory-audit, genesis-selftest, telemetry-check. Jobs execute only when explicitly requested through POST /api/run-next. Set Cloudflare Worker secret `JOB_TOKEN` before writes work. D1 stores queued, claimed, completed, failed states and receipts. This is not 64 independently running agents, a mining pool, or remote shell access. Avoid reusing tokens across services.
