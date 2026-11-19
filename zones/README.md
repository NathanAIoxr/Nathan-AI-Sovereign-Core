# Nathan Tabor project holding zones

Each tracked project has its own registry record. A project can receive a dedicated DNS zone and mapped hostname once the domain is known. The account-level D1 registry, private R2 bucket, KV message configuration, and holding Worker are shared. A project with a Cloudflare hostname that is still in holding mode serves a generic page on its root. Its files require a valid Cloudflare Access token with that project's audience.

Run `node --test zones/test.mjs` from the repository root. Run `node zones/inventory.mjs HEAD` to produce a source inventory. An inventory record confirms a tracked file. Where a project has a product and a station manifest, both source entries can appear. A build key in the registry records an uploaded staging snapshot. Asset keys follow `projects/<project_id>/<build_key>/<relative_path>`. A private R2 upload is separate from DNS activation, Access configuration, and public launch. The existing BOOBIES releases have their own publishing paths.

## Initial deployment

- Cloudflare resources: D1 `tabor-zone-holding`, private R2 `tabor-zone-holding-assets`, KV `tabor-zone-holding-config`.
- Worker: `tabor-zone-holding` in the `nathan-tabor-platforms` dispatch namespace.
- GitHub Actions: [Zone holding deployment](../.github/workflows/zone-holding.yml).
- The first source import recorded 689 manifests and release entries. Ten BOOBIES projects have private artifact snapshots. The gallery snapshot includes the four posters, source text, and its release directory. The nine individual entry snapshots have their own object prefixes. Check the cross-project navigation and any service bindings when assigning real hostnames.
- Domain assignments, dispatch gateway routing, and the Cloudflare Access issuer and per-project audiences are configured per launch. The pending zone lifetime is documented by Cloudflare. The registry is the long-term holding record for projects without domains.

## Deployment order

1. Commit the isolated `zones/` package in the monorepo.
2. Provision `tabor-zone-holding` in D1, `tabor-zone-holding-assets` as a private R2 bucket, and `tabor-zone-holding-config` in KV. Record their IDs in `zones/wrangler.toml`.
3. Run the migration before uploading the Worker. Keep the R2 managed public URL disabled.
4. Upload the Worker to the existing `nathan-tabor-platforms` dispatch namespace. Its default and preview URLs are disabled. The Worker resolves an exact hostname to one project. A dispatch gateway must preserve that hostname and route only approved hostnames to this script.
5. For each real domain, record its Cloudflare zone ID and enable the correct hostname and Access audience. Set the Worker variable `ACCESS_ISSUER` to the team's HTTPS `*.cloudflareaccess.com` origin. Restrict the Access policy to authorized admins and confirm that the gateway forwards Cloudflare's signed assertion. Configure a public holding page exception only if desired. Validate an anonymous request, an authorized preview, and a denied asset request with the wrong audience.
6. When that individual project is ready, confirm its zone is active, its staged entry and assets respond through the gateway, and its DNS and mail records match the intended setup. Update only its `launch_status` to `LIVE` and adjust its Access policy if the public needs to reach its custom hostname. Test anonymous access end to end.

## Wrangler and Cloudflare API

Export the account-scoped `CLOUDFLARE_ACCOUNT_ID` and a scoped `CLOUDFLARE_API_TOKEN` in your shell. For a new account, provision the resources and put the returned IDs in the config.

```bash
npx --yes wrangler@4 d1 create tabor-zone-holding
npx --yes wrangler@4 r2 bucket create tabor-zone-holding-assets
npx --yes wrangler@4 kv namespace create tabor-zone-holding-config
npx --yes wrangler@4 d1 migrations apply ZONES --remote --config zones/wrangler.toml
npx --yes wrangler@4 deploy --config zones/wrangler.toml --dispatch-namespace nathan-tabor-platforms
```

With `PROJECT_DOMAIN` set to one authorized domain, create its zone and save the returned `result.id` and `result.name_servers`.

```bash
jq -n --arg domain "${PROJECT_DOMAIN:?}" --arg account "${CLOUDFLARE_ACCOUNT_ID:?}" \
  '{name:$domain,account:{id:$account},type:"full"}' |
  curl --fail-with-body --silent --show-error \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN:?}" -H 'Content-Type: application/json' \
    -X POST --data-binary @- https://api.cloudflare.com/client/v4/zones
curl --fail-with-body --silent --show-error \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN:?}" \
  "https://api.cloudflare.com/client/v4/zones/${PROJECT_ZONE_ID:?}" |
  jq '.result | {name,status,name_servers}'
```

Check existing DNS records, especially mail, TXT verification, DNSSEC and any existing websites, before any registrar change. Configure Full (strict) for proxied HTTPS origins after validating their certificates. Proxy eligible web records where Cloudflare should serve the traffic. Preserve DNS-only mail records and third-party verification records. Attach the custom hostname to the approved gateway and configure Access before serving a private build. Review the zone status after delegation. Pending zones have a deletion window, and provider development URLs are publicly reachable when enabled without Access.

- [Cloudflare zone status](https://developers.cloudflare.com/dns/zone-setups/reference/domain-status/)
- [Cloudflare Access assertion validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Cloudflare workers.dev availability and Access](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)

## Sovereign staging and conductor operations

The [staging entry](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/sovereign-staging) exposes four independent holding pages. `staging/projects.json` records their identifiers and the SHA-256 of the supplied infrastructure and conductor transcript. The exact transcript is in the private `tabor-sovereign-provenance` bucket under `sha256/<digest>`. R2 Bucket Locks cover that prefix. The [train runtime](../app-factory/nathan-ai/operations/train-runtime/README.md) remains its own service.

| Role | Cloudflare responsibility |
| --- | --- |
| Train conductor | Verify the registry, project manifest, and access gate. |
| Locomotive engineer | Run Worker requests and coordinate each project's state in a Durable Object. |
| Orchestra conductor | Use the MCP switchboard to read staging state and request a project audit. |
| Monkey conductor | Execute repeatable audit jobs and release checks through Queues and GitHub Actions. |

A project needs an active DNS zone, a matching hostname and Cloudflare Access audience, and an authorized dispatch route to use its private operations. Configure `ACCESS_ISSUER` on the holding Worker and validate Access before connecting production. For an active hostname, `FLEET_STATUS=HOLDING` or `ZONE_STATUS:<hostname>=HOLDING` in KV suppresses the public build. Set an individual hostname key to `LIVE` after the registry has an active zone, a staged build, and a verified Access audience. The fleet-level hold takes precedence. KV propagates globally over time. Cloudflare Access and DNS should be used for immediate revocation at ingress.

| Authenticated endpoint | Input |
| --- | --- |
| `POST /sovereign/artifacts` | Raw files, up to 1 MiB. |
| `POST /sovereign/telemetry` | A JSON object up to 16 KiB with an optional `Idempotency-Key`. |
| `POST /sovereign/voice` | Audio up to 4 MiB with its MIME type. Stores the transcript, cleaned text, and extracted hashtags in D1. |
| `POST /sovereign/mcp` | MCP JSON-RPC. Supports `get_zone_status` and `queue_integrity_audit` for the authenticated project. |
| `POST /sovereign/node/claim`, `POST /sovereign/node/release` | Lock key and lease duration to claim. Lock key and lease token to release. |
| `GET /sovereign/node/socket` | WebSocket upgrade for the authenticated project. |

D1 stores the ordered hash chain and audited Merkle roots. The scheduled workflow verifies the GitHub source digest against D1, reads and hashes the corresponding R2 bytes, and acknowledges queued audits after recording a receipt. The handoff digest is published as metadata. Raw records remain private. A watchdog reports mismatches through the workflow run for review before a D1 Time Travel restore.

For staging, keep each project's D1 record and R2 prefix independent. Hosted holding routes use the existing cockpit dispatcher. For a real zone, attach its verified hostname as a Worker Custom Domain for `unified-operations-cockpit` after auditing any existing DNS records. The dispatcher preserves the HTTPS hostname and forwards it to the holding Worker. Register that exact hostname and zone ID in D1, confirm Cloudflare has activated the zone, and maintain its individual holding state. DNS zones, Full (strict) origin mode, Pages migration, MQTT and physical tunnels require the corresponding URLs, origin ownership, or devices. The existing Cloudflare Pages projects have separate release ownership.
