# Nathan AI Worker, Bot & Agent Registry

[Open the registry](https://tabor-bridge.nathantaboract.workers.dev/worker-registry/).

The production registry is in your existing Cloudflare D1 database, `tabor-fleet-registry`, in the `owned_runtime_registry` table. The registry distinguishes kinds and provenance. A record found in the current Cloudflare account or its dispatch namespaces has state **observed**. A script absent from a later snapshot has state **missing**. An owner-supplied or GitHub-sourced definition is **declared** until there is separate deployment evidence.

Use your registry key in the page or send it as a bearer token to `/worker-registry/records`. GET supports `kind`, `state`, `q`, and `after`. POST saves a definition with a stable `slug`, `kind`, `title`, optional `location`, and optional `source_ref`. Reusing a kind and slug updates its owner-defined record. To flag a deployment as observed, refresh the Cloudflare inventory through the account API. The database has no application-enforced total record cap. Storage and Cloudflare operation quotas apply separately. Registration does not deploy or run a script.

The GitHub repository holds the source, schema, and tests. The private account's full inventory stays in D1. To build, run `npm test && npm run build`. Use `wrangler d1 migrations apply DB --remote --config wrangler.toml` and deploy with `wrangler deploy --dispatch-namespace nathan-tabor-platforms --config wrangler.toml`. The live namespace script uses the `REGISTRY_KEY` encrypted binding. Deploy the shared `tabor-bridge` only when routing changes.

For a manual inventory refresh, run `node scripts/sync-cloudflare.js` with your own account ID and a scoped Cloudflare token that can list the account's Workers and update this D1 database. A complete inventory is applied as one statement. Owner records and the existing fleet catalog retain their own entries.
