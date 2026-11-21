#!/usr/bin/env bash
set -euo pipefail
command -v npx >/dev/null || { echo "Node.js/npx required"; exit 1; }
echo "Nathan AI infrastructure setup — resources may incur Cloudflare charges."
read -r -p "Type PROVISION to create Cloudflare resources: " confirm
[[ "$confirm" == "PROVISION" ]] || { echo "Cancelled"; exit 1; }
npx wrangler kv namespace create NATHAN_AI_CACHE
npx wrangler d1 create nathan-sovereign-ledger
npx wrangler r2 bucket create nathan-sovereign-vault
npx wrangler queues create nathan-sovereign-jobs
npx wrangler vectorize create nathan-sovereign-memory --dimensions=768 --metric=cosine
echo "Resources requested. Review returned identifiers and configure bindings before deployment."
echo "Secrets must be configured separately using wrangler secret put; never commit secrets."
