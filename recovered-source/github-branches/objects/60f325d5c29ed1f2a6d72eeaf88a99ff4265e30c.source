# NATHAN AI — ONE read-only Airtable catalog gateway

**Development status:** Source and unit tests only. **Not deployed, not integrated into the public browser app, not connected to Supabase.** Existing ONE local libraries, owner originals and the separate encrypted backup gateway are untouched.

## Intended sequence

1. **Airtable** holds canonical IDs and reviewed catalog metadata. The registered base is [NATHAN AI — ONE MASTER INDEX](https://airtable.com/app00zqqUnAe8uo4k).
2. **ONE catalog gateway** runs privately on the operator's server. It makes read-only authenticated calls to Airtable; the token and Airtable PAT never enter the browser or public GitHub.
3. **ONE app** will access a user-scoped backend only after a proper session authentication mechanism and per-record authorization are implemented. This module **does not** supply production browser authentication, tenant isolation, or authorization for 3rd-party accounts.
4. **Supabase** may become a persistent, private database after owner connection, SQL review, Auth configuration and RLS tests. Migration SQL is a future proposal, not applied.

## What the gateway exposes

- \`GET /healthz\`: reports only configured mode, not credentials, record counts or private metadata.
- Authenticated \`GET /v1/catalog?limit=50&offset=...\`: reads at most 100 records per request and returns only record ID, canonical ID, name, department, kind, build status and source URL.
- No POST, PATCH, DELETE, data uploads, write scopes, bulk sync, record-content exports, or publicly enabled cross-origin browser access.
- Network errors return a generic response; no Airtable error payloads or tokens are logged.
- Loopback binding only, by default and enforced in the entrypoint.

## Local configuration (Node 20+)

- Copy \`.env.example\` to an untracked, private local configuration or set environment variables in your deployment's secret manager. This module doesn't auto-load \`.env\`.
- Set \`ONE_CATALOG_READ_TOKEN\` to a unique random 32+ character private owner secret.
- Set \`AIRTABLE_TOKEN\` to a separate Airtable personal access token restricted to **data.records:read** on the designated base. Never reuse ONE's encrypted-backup credential.
- Set \`ONE_AIRTABLE_BASE_ID\` and \`ONE_AIRTABLE_TABLE_ID\` using the IDs for the existing master registry.
- Launch with \`node app-factory/one/catalog-api/server.cjs\`. The server listens only on \`127.0.0.1:8792\` by default.
- A private operator can query it locally with \`curl -H "Authorization: Bearer <YOUR_PRIVATE_READ_TOKEN>" http://127.0.0.1:8792/v1/catalog\`; do not paste secrets in chat.

## Testing and rollout

\`\`\`sh
node --test app-factory/one/catalog-api/server.test.cjs
\`\`\`

Run unit tests before merging. Perform security review, gateway rate limits, TLS at an authenticated reverse proxy, session-based authorization, negative tests for tenant isolation, outage/retry testing, data reconciliation, original-byte backups and operator rollback **before any public deployment**. A server-only bearer credential is not suitable for storage in the browser.

The [draft Supabase schema](./supabase/001_catalog_schema.sql) is **unapplied**. It is intentionally append-only, tenant-owned, uses RLS and contains pointers/metadata only, not source manuscript content. Validate with a connected Supabase test project first.

Status rule: a source file or Airtable record is not a production deployment or proof that all proposed AI nodes, books, games or translations exist.
