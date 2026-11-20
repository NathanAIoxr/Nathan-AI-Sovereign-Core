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
  desired="$(jq -c --arg host "$domain" '.[]|select(.domain==$host)|.origin // null' "$manifest")"
  if [[ "$desired" != null && "$(jq -r '.status' <<<"$zone")" != active ]]; then
    jq -e 'type=="object" and (.type=="A" or .type=="AAAA" or .type=="CNAME") and
      (.content|type=="string" and length>0 and length<=253 and test("^[a-zA-Z0-9.:-]+$"))' <<<"$desired" >/dev/null
    zone_api="https://api.cloudflare.com/client/v4/zones/$zone_id"
    # Stage a service gate and owner access before creating the proxied origin.
    access_api="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/access/apps"
    policy_source="${CHEIR_ACCESS_POLICY_SOURCE:?Supply the approved Access application ID}"
    allow="$(api "$access_api/$policy_source/policies" | jq -ec '[.result[]|select(.decision=="allow")|{name,decision,include,exclude,require,precedence}] | select(length>0)')"
    access="$(api "$access_api?per_page=100" | jq -c --arg domain "$domain" '.result[]|select(.domain==$domain)' | head -1)"
    if [[ -z "$access" ]]; then
      access="$(api -X POST "$access_api" --data "$(jq -nc --arg name "$domain" '{name:("Nathan AI HOLDING "+$name),domain:$name,type:"self_hosted",session_duration:"8h",app_launcher_visible:false}')" | jq -ec '.result')"
    fi
    access_id="$(jq -er '.id' <<<"$access")"
    policies="$(api "$access_api/$access_id/policies")"
    if jq -e '.result | length==0' <<<"$policies" >/dev/null; then
      while IFS= read -r rule; do
        api -X POST "$access_api/$access_id/policies" --data "$rule" | jq -e '.success' >/dev/null
      done < <(jq -c '.[]' <<<"$allow")
    fi
    route="$(api "$zone_api/workers/routes" | jq -c --arg route "$domain/*" '.result[]|select(.pattern==$route)' | head -1)"
    if [[ -z "$route" ]]; then
      api -X POST "$zone_api/workers/routes" --data "$(jq -nc --arg pattern "$domain/*" '{pattern:$pattern,script:"tabor-bridge"}')" | jq -e '.success' >/dev/null
    else
      jq -e '.script=="tabor-bridge"' <<<"$route" >/dev/null
    fi
    dns="$(api --get "$zone_api/dns_records" --data-urlencode "name=$domain")"
    if jq -e '[.result[]|select(.type=="A" or .type=="AAAA" or .type=="CNAME")]|length==0' <<<"$dns" >/dev/null; then
      api -X POST "$zone_api/dns_records" --data "$(jq -c --arg name "$domain" '.+{name:$name,proxied:true,ttl:1}' <<<"$desired")" | jq -e '.success' >/dev/null
    else
      jq -e --argjson wanted "$desired" 'any(.result[]; .type==$wanted.type and .content==$wanted.content and .proxied)' <<<"$dns" >/dev/null
    fi
  fi
  batch+=("$(jq -nc --arg domain "$domain" --arg zoneId "$zone_id" '{domain:$domain,zoneId:$zoneId}')")
done
printf '%s\n' "${batch[@]}" | jq -sc '{action:"register-dns",domains:.}'
