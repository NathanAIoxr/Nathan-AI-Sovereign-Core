#!/usr/bin/env bash
set -euo pipefail
: "${CLOUDFLARE_ACCOUNT_ID:?}"
: "${CLOUDFLARE_API_TOKEN:?}"
manifest="${1:?Pass a JSON owner manifest of 1 to 10 registered domains}"
mode="${2:---dry-run}"
case "$mode" in --dry-run|--stage) ;; *) exit 64;; esac
jq -e 'type=="array" and length>0 and length<=10 and (map(.domain)|unique|length)==length and all(.[]; .ownerAuthorized==true and (.domain|test("^(?=.{1,253}$)([a-z0-9][a-z0-9-]{0,61}[a-z0-9]\\.|[a-z0-9]\\.)+[a-z][a-z0-9]{1,62}$")))' "$manifest" >/dev/null
[[ "$mode" == --stage ]] || { jq -c '{batch:length,state:"HOLDING"}' "$manifest"; exit 0; }
api() { curl --silent --show-error --fail-with-body -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H 'Content-Type: application/json' "$@"; }
pending="$(api --get https://api.cloudflare.com/client/v4/zones --data-urlencode "account.id=$CLOUDFLARE_ACCOUNT_ID" --data-urlencode 'status=pending' --data-urlencode 'per_page=50' | jq -er '.result_info.total_count // (.result|length)')"
mapfile -t domains < <(jq -r '.[].domain' "$manifest")
batch=()
for domain in "${domains[@]}"; do
  zone="$(api --get https://api.cloudflare.com/client/v4/zones --data-urlencode "account.id=$CLOUDFLARE_ACCOUNT_ID" --data-urlencode "name=$domain" | jq -c '.result[0] // null')"
  if [[ "$zone" == null ]]; then
    [[ "$pending" -lt 10 ]] || { echo 'Ten pending DNS zones already staged' >&2; exit 1; }
    request="$(jq -nc --arg id "$CLOUDFLARE_ACCOUNT_ID" --arg name "$domain" '{account:{id:$id},name:$name,type:"full"}')"
    zone="$(api -X POST https://api.cloudflare.com/client/v4/zones --data "$request" | jq -ec '.result')"
    pending=$((pending+1))
  fi
  zone_id="$(jq -er '.id' <<<"$zone")"
  if [[ "$(jq -r '.status' <<<"$zone")" != active ]]; then
    api -X PATCH "https://api.cloudflare.com/client/v4/zones/$zone_id/settings/ssl" --data '{"value":"strict"}' | jq -e '.success' >/dev/null
  fi
  batch+=("$(jq -nc --arg domain "$domain" --arg zoneId "$zone_id" '{domain:$domain,zoneId:$zoneId}')")
done
printf '%s\n' "${batch[@]}" | jq -sc '{action:"register-dns",domains:.}'
