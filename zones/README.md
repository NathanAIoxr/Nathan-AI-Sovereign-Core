# Nathan Tabor project holding zones

Each tracked project has its own registry record. A project can receive a dedicated DNS zone and mapped hostname once the domain is known. The account-level D1 registry, private R2 bucket, KV message configuration, and holding Worker are shared. A project with a Cloudflare hostname that is still in holding mode serves a generic page on its root. Its files require a valid Cloudflare Access token with that project's audience.

Run `node --test zones/test.mjs` from the repository root. Run `node zones/inventory.mjs HEAD` to produce a source inventory. An inventory record confirms a tracked file. Where a project has a product and a station manifest, both source entries can appear. A build key in the registry records an uploaded staging snapshot. Asset keys follow `projects/<project_id>/<build_key>/<relative_path>`. A private R2 upload is separate from DNS activation, Access configuration, and public launch. The existing BOOBIES releases have their own publishing paths.

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
