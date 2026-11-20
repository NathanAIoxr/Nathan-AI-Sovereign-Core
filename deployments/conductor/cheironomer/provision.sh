#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${CLOUDFLARE_ACCOUNT_ID:?Cloudflare account ID is required}"
: "${CLOUDFLARE_API_TOKEN:?Use the encrypted Cloudflare deployment credential}"
wr() { npx --yes wrangler@4.165.0 "$@"; }
if [[ "${1:-}" == --create-new ]]; then
  wr d1 create "${CHEIR_D1_NAME:-nathan-ai-cheironomer}"
  wr kv namespace create "${CHEIR_KV_NAME:-nathan-ai-cheironomer-control}"
  wr r2 bucket create "${CHEIR_R2_NAME:-nathan-ai-cheironomer-audit}"
  wr queues create "${CHEIR_QUEUE:-nathan-ai-cheironomer-events}"
  wr queues create "${CHEIR_DLQ:-nathan-ai-cheironomer-dlq}"
else
  wr d1 info nathan-ai-conductor-ledger
  wr queues info nathan-ai-cheironomer-events
  wr queues info nathan-ai-cheironomer-dlq
fi
if [[ "${INJECT_EXPLICIT_SECRETS:-0}" == 1 ]]; then
  for key in GITHUB_TOKEN CF_API_TOKEN CF_ACCOUNT_ID; do
    value="${!key:-}"
    [[ -z "$value" ]] || printf '%s' "$value" | wr secret put "$key" --dispatch-namespace nathan-tabor-platforms
  done
fi
