# Independent holding vault

The existing `tabor-fleet-registry` D1 database stores project metadata. Each project retains its own `project_id`, source, and release status. This is an optional reusable holding gate, **not a DNS zone** and not a way to exceed deployed Worker limits.

Do not deploy the template with `PROJECT_ID=REPLACE_WITH_REGISTERED_PROJECT_ID`. For each authorized project, configure a unique project ID, stage a verified `.pages.dev` or `.workers.dev` URL, and use a private Access-protected preview where private content is required. The public HOLD page alone is not an authentication boundary for direct staging URLs.

DNS zones can only be created for actual owned root domains. Do not change nameservers, MX records, DNS, SSL or public routes without explicit domain mapping and launch approval.

D1 migration:
`npx wrangler d1 migrations apply tabor-fleet-registry --remote --config zones/holding-vault/wrangler.toml`

Deploy only after project registration and verification:
`npx wrangler deploy --config zones/holding-vault/wrangler.toml`
