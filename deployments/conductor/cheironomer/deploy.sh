#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mode="${1:---dry-run}"
case "$mode" in --dry-run|--activate) ;; *) exit 64;; esac
sha="$(git rev-parse HEAD)"
wr() { npx --yes wrangler@4.165.0 "$@"; }
node --test cheironomer/cheironomer.test.mjs
wr deploy --dry-run --dispatch-namespace nathan-tabor-platforms --outdir "${RUNNER_TEMP:-/tmp}/cheironomer-bundle" --var "RELEASE_SHA:$sha"
[[ "$mode" == --activate ]] || exit 0
wr d1 migrations apply nathan-ai-conductor-ledger --remote
wr deploy --dispatch-namespace nathan-tabor-platforms --keep-vars --var "RELEASE_SHA:$sha"
base=https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/cheironomer
curl -fsS --retry 5 "$base/health" | jq -e --arg sha "$sha" '.release==$sha and .holdCapacity=="126732000000" and .next!=null'
# The control deck uses no-store. For a verified dedicated DNS zone, purge only explicit URLs.
