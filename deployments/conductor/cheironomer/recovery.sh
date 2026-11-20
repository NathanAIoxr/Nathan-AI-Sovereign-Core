#!/usr/bin/env bash
set -euo pipefail
: "${CLOUDFLARE_ACCOUNT_ID:?}"
: "${CLOUDFLARE_API_TOKEN:?}"
: "${CHEIR_RECOVERY_DB_ID:?Supply the isolated recovery database ID}"
case "$CHEIR_RECOVERY_DB_ID" in
  3279cbc0-0e73-4b07-9bc2-47ab0c3b95c2) echo 'Use an isolated recovery database for the Cheironomer ledger' >&2; exit 64;;
esac
path="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/d1/database/$CHEIR_RECOVERY_DB_ID/time_travel"
auth="Authorization: Bearer $CLOUDFLARE_API_TOKEN"
info="$(curl -fsS -H "$auth" "${path%/time_travel}")"
jq -e '.success and .result.name=="nathan-ai-cheironomer-recovery"' <<<"$info" >/dev/null
if [[ "${1:-}" == --bookmark ]]; then curl -fsS -H "$auth" "$path/bookmark"; exit; fi
[[ "${1:-}" == --restore && "${2:-}" =~ ^[A-Za-z0-9:_-]{8,256}$ ]] || exit 64
curl -fsS -X POST -H "$auth" -H 'Content-Type: application/json' "${path}/restore" --data "$(jq -nc --arg bookmark "$2" '{bookmark:$bookmark}')"
