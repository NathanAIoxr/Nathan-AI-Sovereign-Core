# Tabor Cryptocurrency Infrastructure Server

Live Cloudflare Workers HTTP service with existing D1 data: coin federation, mining coins, hardware, market observations and receipts. This is a read-only control plane. It does not claim ASICs or blockchains exist. The existing `tabor-corp-mining-hub` and `tabor-coin-federation` remain separate sovereign services.

Endpoints: `/health`, `/api/summary`, `/api/coins`, `/api/federation`, `/api/hardware`, `/api/markets`, `/api/receipts`.

Future separately authorized services: authenticated miner telemetry ingestion, chain node RPC gateway, pool status, mining payout verification, job scheduling and alerting. Never put seed phrases or pool credentials in the database or source. Cloudflare edge infrastructure is not Bitcoin ASIC hardware.
