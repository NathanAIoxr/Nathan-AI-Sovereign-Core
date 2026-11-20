#!/usr/bin/env bash
set -euo pipefail
manifest="${1:?Pass a JSON manifest or a text list of registered domains}"
mode="${2:---dry-run}"
batch_number="${3:-1}"
case "$mode" in --dry-run|--stage) ;; *) exit 64;; esac
[[ "$batch_number" =~ ^[1-9][0-9]{0,5}$ ]] || exit 64
if jq -e . "$manifest" >/dev/null 2>&1; then
  inventory="$(jq -c . "$manifest")"
else
  inventory="$(jq -Rs 'split("\n") | map(gsub("^\\s+|\\s+$";"") | select(length>0 and (startswith("#")|not)) | {domain:ascii_downcase,ownerAuthorized:true})' "$manifest")"
fi
jq -e 'type=="array" and length>0 and (map(.domain)|unique|length)==length and all(.[]; .ownerAuthorized==true and (.domain|test("^(?=.{1,253}$)([a-z0-9][a-z0-9-]{0,61}[a-z0-9]\\.|[a-z0-9]\\.)+[a-z][a-z0-9]{1,62}$")))' <<<"$inventory" >/dev/null
offset=$(((batch_number-1)*10))
inventory="$(jq -ec --argjson offset "$offset" '.[$offset:($offset+10)] | select(length>0)' <<<"$inventory")"
[[ "$mode" == --stage ]] || { jq -c --argjson batch "$batch_number" '{batch:$batch,state:"HOLDING",domains:map(.domain)}' <<<"$inventory"; exit 0; }
: "${CLOUDFLARE_ACCOUNT_ID:=${CF_ACCOUNT_ID:-}}"
: "${CLOUDFLARE_API_TOKEN:=${CF_API_TOKEN:-}}"
: "${CLOUDFLARE_ACCOUNT_ID:?}"
: "${CLOUDFLARE_API_TOKEN:?}"
holding_id="${HOLDING_KV_ID:-f0c0ef9b5a964825ba2508f8dd7ca6b8}"
ledger_id="3279cbc0-0e73-4b07-9bc2-47ab0c3b95c2"
[[ "$CLOUDFLARE_ACCOUNT_ID" =~ ^[a-f0-9]{32}$ && "$holding_id" =~ ^[a-f0-9]{32}$ ]] || exit 64
api() { curl --silent --show-error --fail-with-body -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H 'Content-Type: application/json' "$@"; }
pending="$(api --get https://api.cloudflare.com/client/v4/zones --data-urlencode "account.id=$CLOUDFLARE_ACCOUNT_ID" --data-urlencode 'status=pending' --data-urlencode 'per_page=50' | jq -er '.result_info.total_count // (.result|length)')"
mapfile -t domains < <(jq -r '.[].domain' <<<"$inventory")
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
  zone_api="https://api.cloudflare.com/client/v4/zones/$zone_id"
  cf_status="$(jq -er '.status' <<<"$zone")"
  route_id=
  if [[ "$cf_status" != active ]]; then
    api -X PATCH "$zone_api/settings/ssl" --data '{"value":"strict"}' | jq -e '.success' >/dev/null
    api -X PATCH "$zone_api/settings/always_use_https" --data '{"value":"on"}' | jq -e '.success' >/dev/null
    kv_url="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/storage/kv/namespaces/$holding_id/values/ZONE_STATUS%3A$domain"
    curl --silent --show-error --fail-with-body -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H 'Content-Type: text/plain' -X PUT "$kv_url" --data 'HOLDING' | jq -e '.success' >/dev/null
  fi
  desired="$(jq -c --arg host "$domain" '.[]|select(.domain==$host)|.origin // null' <<<"$inventory")"
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
      route="$(api -X POST "$zone_api/workers/routes" --data "$(jq -nc --arg pattern "$domain/*" '{pattern:$pattern,script:"tabor-train-operations"}')" | jq -ec '.result')"
    else
      jq -e '.script=="tabor-train-operations"' <<<"$route" >/dev/null
    fi
    route_id="$(jq -er '.id' <<<"$route")"
    dns="$(api --get "$zone_api/dns_records" --data-urlencode "name=$domain")"
    if jq -e '[.result[]|select(.type=="A" or .type=="AAAA" or .type=="CNAME")]|length==0' <<<"$dns" >/dev/null; then
      api -X POST "$zone_api/dns_records" --data "$(jq -c --arg name "$domain" '.+{name:$name,proxied:true,ttl:1}' <<<"$desired")" | jq -e '.success' >/dev/null
    else
      jq -e --argjson wanted "$desired" 'any(.result[]; .type==$wanted.type and .content==$wanted.content and .proxied)' <<<"$dns" >/dev/null
    fi
  fi
  if [[ "$cf_status" == active ]]; then
    printf 'Existing active zone %s was left for its current operator workflow.\n' "$domain" >&2
    continue
  fi
  nameservers="$(jq -c '.name_servers // []' <<<"$zone")"
  now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  canonical="$(jq -ncS --arg domain "$domain" --arg zone "$zone_id" --arg status "$cf_status" --arg route "$route_id" --arg at "$now" --argjson ns "$nameservers" '{domain:$domain,zoneId:$zone,cfStatus:$status,route:$route,at:$at,nameservers:$ns,gate:"HOLDING"}')"
  alien="$(printf 'ALIEN|%s' "$canonical" | sha256sum | cut -d' ' -f1)"
  neila="$(printf 'NEILA|%s|%s' "$alien" "$canonical" | sha256sum | cut -d' ' -f1)"
  sql="INSERT INTO dns_provision_receipts VALUES (?,?,?,?,?,'HOLDING',?,?,?) ON CONFLICT(domain) DO UPDATE SET cf_status=excluded.cf_status,nameservers_json=excluded.nameservers_json,route_id=excluded.route_id,alien_seal=excluded.alien_seal,neila_seal=excluded.neila_seal,checked_at=excluded.checked_at WHERE dns_provision_receipts.zone_id=excluded.zone_id AND dns_provision_receipts.gate_mode='HOLDING'"
  payload="$(jq -nc --arg sql "$sql" --arg domain "$domain" --arg zone "$zone_id" --arg status "$cf_status" --arg ns "$nameservers" --arg route "$route_id" --arg a "$alien" --arg n "$neila" --arg at "$now" '{sql:$sql,params:[$domain,$zone,$status,$ns,($route|select(length>0)//null),$a,$n,$at]}')"
  api -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/d1/database/$ledger_id/query" --data "$payload" | jq -e '.success and .result[0].success' >/dev/null
  printf '%s pending nameservers %s\n' "$domain" "$nameservers" >&2
  batch+=("$(jq -nc --arg domain "$domain" --arg zoneId "$zone_id" '{domain:$domain,zoneId:$zoneId}')")
done
if [[ "${#batch[@]}" == 0 ]]; then echo '{"action":"register-dns","domains":[]}'; exit 0; fi
printf '%s\n' "${batch[@]}" | jq -sc '{action:"register-dns",domains:.}'
