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

## Private stand-in websites

Every workspace has a stand-in website at `/holding-vault/preview/<workspace-id>/site`. Its reserved `.zones.test` name is displayed in the preview. The working URL is served by Tabor Bridge behind Cloudflare Access. The placeholder name is never written to production domain or DNS fields.

Each staged component has a private page scoped to its workspace and stable source identity. The preview views update with the underlying registry and component snapshots, so new entries receive pages automatically. Open the workspace first to reach its stand-in website and snapshot. Supply the real hostname and release details when the project is ready for launch.

## Launch brakes and source traces

The global KV launch switch is `gate:*`. Each workspace uses `gate:<workspace-id>`. Both keys must explicitly contain `LIVE` before a public redirect is possible. `BRAKE`, `HOLDING`, missing keys, and KV failures close the gate. The Worker also requires `LAUNCH_STATUS=LIVE` and reads the individual launch state and domain verification from the D1 primary. For an immediate project brake, set the D1 launch state to `HOLDING` and set its KV switch to `BRAKE`. For a global rollout brake, set `gate:*` to `BRAKE`. Allow for Cloudflare KV propagation before treating the KV update as effective at every location.

Private source traces follow provenance edges for each workspace and its companion projects. A trace marks unresolved references, external references, and nodes with no outgoing edge in the tracked graph. It also reports when its 2,000-node limit is reached. Follow a trace from the owner preview for the project.

## Source trails

Open **Source trail** inside an owner preview. The route walks all recorded references reachable from that workspace and lists the results 50 at a time. Each entry includes its direct references. The JSON route returns the same records. The walk deduplicates node IDs and handles cycles.

The provenance tables hold repository path and Git object identifiers, staged snapshot identifiers and digests, and Cloudflare resource relationships. The `buildProvenance` function in `scripts/provenance.mjs` accepts a D1 query function, the Cloudflare account inventory, and the pinned repository path map. Use `after` and `through` to resume a range of staged rows. Apply migration `0004_provenance.sql` first.

A verified root is an account or repository reached by the stored chain. Entries labeled external reference retain the destination origin. Unresolved entries retain the available path evidence. The separate GitHub Actions workflow refreshes integration candidates from the mapped manifests and build ledgers every six hours.
