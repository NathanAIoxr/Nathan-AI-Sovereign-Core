#!/usr/bin/env bash
set -euo pipefail
: "${CLOUDFLARE_ACCOUNT_ID:?}"
: "${CLOUDFLARE_API_TOKEN:?}"
out="${1:?Provide the destination for hash-only receipts}"
url="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/d1/database/3279cbc0-0e73-4b07-9bc2-47ab0c3b95c2/query"
curl -fsS --max-time 30 -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H 'Content-Type: application/json' "$url" \
  --data '{"sql":"SELECT event_id,source_hash,created_at FROM voice_vault ORDER BY created_at DESC,event_id LIMIT 1000"}' |
  jq -eS 'select(.success and .result[0].success) | .result[0].results | {voiceEvidence:.}' > "$out"
