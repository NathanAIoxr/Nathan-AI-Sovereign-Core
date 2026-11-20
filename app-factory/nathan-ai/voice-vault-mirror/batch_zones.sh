#!/usr/bin/env bash
# Authorized-domain HOLD planner; does not create DNS zones or change live routing.
set -euo pipefail
DOMAINS_FILE="${1:-domains.txt}"
[[ -f "$DOMAINS_FILE" ]] || { echo "Missing $DOMAINS_FILE" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq required" >&2; exit 1; }
mapfile -t DOMAINS < <(sed 's/#.*//;s/\r$//;/^[[:space:]]*$/d' "$DOMAINS_FILE")
for ((i=0;i<${#DOMAINS[@]};i+=10)); do
  for DOMAIN in "${DOMAINS[@]:i:10}"; do
    [[ "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$ ]] || { echo "invalid domain: $DOMAIN" >&2; exit 1; }
    jq -nc --arg domain "$DOMAIN" --argjson batch "$((i/10+1))" '{domain:$domain,batch:$batch,mode:"HOLDING",ssl:"strict",https:true,action:"PLAN_ONLY",requiresDomainOwnership:true}'
  done
done
