# Nathan AI Holding Vault

Each tracked website, book, app, or game has a project record with its own workspace ID and future domain assignment. The holding page is public. The project registry and R2 downloads require the owner's Cloudflare Access session. The Worker verifies the signed Access assertion for its specific issuer and audience. R2 objects use the project ID as their key prefix. The KV binding is reserved for project-scoped runtime data.

The Worker runs in the existing `nathan-tabor-platforms` dispatch namespace. The existing Tabor Bridge mounts it at `/holding-vault/`. D1 stores the registry and the book, app module, and game state tables. The root Wrangler config belongs to the operations cockpit.

## Build and deploy

Use the account's existing Cloudflare deployment credentials. Run from the repository root.

```bash
node --test zones/holding-vault/holding-gate.test.mjs
cd zones/holding-vault
npx --yes wrangler@4.165.0 d1 migrations apply tabor-holding-vault --remote
npx --yes wrangler@4.165.0 deploy --dispatch-namespace nathan-tabor-platforms --keep-vars
```

Set `ACCESS_AUDIENCE` to the audience of the Access application for `tabor-bridge.nathantaboract.workers.dev/holding-vault/preview`. This deployment preserves the existing audience secret. The app must have an owner-only allow policy. A request without a valid assertion receives a denial even if it reaches the Worker directly.

## Stage a verified domain

For each project, supply the registered domain, the existing Pages project or Worker, and the records that must survive delegation. Use a token with the necessary permissions for that account and project. Start with the Cloudflare API zone lookup. Create a pending zone only if the existing lookup has no match.

```bash
: "${CLOUDFLARE_ACCOUNT_ID:?}"
: "${CLOUDFLARE_API_TOKEN:?}"
: "${PROJECT_DOMAIN:?}"
api=https://api.cloudflare.com/client/v4
auth="Authorization: Bearer $CLOUDFLARE_API_TOKEN"

curl --fail-with-body -sS -G -H "$auth" "$api/zones" \
  --data-urlencode "account.id=$CLOUDFLARE_ACCOUNT_ID" \
  --data-urlencode "name=$PROJECT_DOMAIN"

jq -n --arg name "$PROJECT_DOMAIN" --arg account "$CLOUDFLARE_ACCOUNT_ID" \
  '{name:$name,account:{id:$account},type:"full"}' |
  curl --fail-with-body -sS -X POST -H "$auth" -H 'Content-Type: application/json' \
    --data-binary @- "$api/zones"
```

Compare the staged DNS inventory with the authoritative provider, including mail and verification records. For applicable web origins, confirm valid origin TLS before selecting Full (strict). Preserve registrar control until the project is ready for delegation. Use the nameservers returned for that zone and confirm its active state through the API.

```bash
: "${CLOUDFLARE_ZONE_ID:?}"
curl --fail-with-body -sS -H "$auth" "$api/zones/$CLOUDFLARE_ZONE_ID" |
  jq -e '.success and .result.status == "active"'
```

Bind the hostname to the existing project serving the release. For Pages, use the account's documented custom domain endpoint.

```bash
: "${PAGES_PROJECT_NAME:?}"
jq -n --arg name "$PROJECT_DOMAIN" '{name:$name}' |
  curl --fail-with-body -sS -X POST -H "$auth" -H 'Content-Type: application/json' \
    --data-binary @- "$api/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PAGES_PROJECT_NAME/domains"
```

Verify the DNS, certificate, application response, and access boundary before switching an individual project to `LIVE`. To redirect traffic from its holding URL, the project row must identify the active Cloudflare zone and an approved HTTPS URL on the assigned domain. Enable the global launch variable only for a release that is ready to follow this policy. Private R2 assets remain behind Access.

## Replicate the private build inventory

Run `node scripts/sync-replica.mjs` from this directory after applying the migrations. The Cloudflare token needs access to read the build ledger and Pages inventory and write to the Holding Vault database. The sync preserves project scopes, keeps existing launch controls, and stores source snapshots and SHA-256 digests in D1. A project can have GitHub, native platform, game station, audit, and release components. An existing production reference describes the original project. The replica stays in HOLDING.

Open a project in the owner preview to inspect its staged components or download its JSON snapshot. Source file and asset references point to their original locations. Use the app's own build workflow for its code and binaries. Native signatures, private R2 object bytes, and complete production databases are outside this inventory import.
