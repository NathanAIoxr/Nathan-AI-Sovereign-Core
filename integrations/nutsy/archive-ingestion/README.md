# NUTSY archival source ingestion

This scheduled Worker captures bounded JSON responses from public research APIs. It writes original response bytes to a private R2 bucket, then adds a D1 snapshot and any provider IDs to the catalog in one D1 batch. The first sample looks up Henry Ford in the MediaWiki Action API and searches the Library of Congress. Worker invocations only perform the configured source lookups. Use the existing NUTSY review and GO workflow for any subsequent Conductor dispatch of research derived from those captures.

| Source | Input | Secret |
| --- | --- | --- |
| `wikimedia` | Exact English Wikipedia article title | None |
| `wikimedia-enterprise` | Exact English Wikipedia article title | `WIKIMEDIA_USER`, `WIKIMEDIA_PASS`, `WIKIMEDIA_CACHE_KEY` |
| `wikidata` | Wikidata QID, for example `Q8768` | None |
| `wikidata-sparql` | QID, to look up up to 25 direct entity relationships | None |
| `archive` | Internet Archive item identifier | None |
| `loc` | Library of Congress search terms | None |
| `chronicling-america` | Newspaper search terms via the Library of Congress collection API | None |
| `uspto` | Open Data Portal patent-application search expression | `USPTO_API_KEY` |
| `semantic-scholar` | Paper search terms | Optional `SEMANTIC_SCHOLAR_API_KEY` |
| `openalex` | Work search terms | Optional `OPENALEX_API_KEY` |

Enterprise access and refresh tokens are encrypted with AES-GCM in private KV. Generate a random 32-byte base64 cache key with `openssl rand -base64 32`. Use `wrangler secret put NAME` for each enabled secret. Secrets never belong in the topics manifest or a GitHub commit. The public adapters work without Enterprise credentials. Use a public project contact in the outbound User-Agent.

The Worker captures first-page search results or single items, up to 4 MiB per request, with at most eight configured lookups per invocation. It also respects Retry-After across invocations for HTTP 429 or 503. Bulk dumps, downloaded OCR and other files, and provider pagination are outside this first release. USPTO's application API should not be treated as an index of all nineteenth-century issued patents. Use an archival or historical patent source when the application is outside the portal's coverage.

## First run

1. Copy `wrangler.example.toml` to an ignored local `wrangler.toml`. Set the D1 database, private R2 bucket, KV namespace and a descriptive User-Agent with contact information. Map the bindings to resources dedicated to or already authorized for archival capture.
2. For local verification, with Wrangler and TypeScript installed, run `wrangler types worker-configuration.d.ts`, then `tsc --noEmit --strict --target ES2022 --lib ES2022 --module esnext --moduleResolution bundler worker-configuration.d.ts worker.ts`. Run `node --test worker.test.mjs`. Apply the schema with `wrangler d1 migrations apply ARCHIVE_CATALOG --local`. Use `wrangler dev --test-scheduled` and request `http://localhost:8787/__scheduled` for a real provider smoke run with local storage.
3. Verify the snapshot using `SELECT id, r2_key, sha256 FROM nutsy_archive_snapshots ORDER BY retrieved_at DESC;`. Retrieve the R2 object by its recorded key and compare its SHA-256. Query `nutsy_archive_entities` by `snapshot_id` to verify the provider’s entity and version IDs.
4. For a deployed run, apply the D1 migration with `--remote`, set the required Worker secrets, and enable the example cron or the chosen schedule in Wrangler. Deploy from the reviewed revision. GitHub holds the code and configuration example. Captured response bodies remain in R2.

An identical response for the same provider and input uses the same snapshot ID. R2's conditional write makes repeating the same raw payload safe. If D1 fails after an R2 write, repeating the capture can fill in the catalog without replacing the original R2 object. If the upstream response changes before retry, the earlier R2 object remains uncataloged and should be reconciled before applying any retention policy.
