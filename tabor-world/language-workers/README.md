# Library of Tabor · Language Workers

[Open the live Language Workers directory](https://tabor-polyglot-knowledge-gateway.nathantaboract.workers.dev/)

The catalog preserves Nathan Tabor's original IDs 001–101 and eight groups. The public Worker serves the directory and dispatches numbered tools. Its service binding verifies the existing Library of Tabor collection through `GET /api/library`. It uses a separate catalog from the Library's existing game and book directories.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/catalog` | The full directory, including submitted scope, actual scope, sources and dependencies |
| `GET /api/catalog/095` | One record; use its three-digit ID |
| `POST /api/tools/095` | Run a tool with the record's example JSON body where supplied |
| `GET /api/health` | Counts, Library binding and owner AI configuration |
| `GET /api/library` | Live service-binding check for the Library of Tabor |

```sh
curl -fsS 'https://tabor-polyglot-knowledge-gateway.nathantaboract.workers.dev/api/tools/101' \
  -H 'Content-Type: application/json' \
  --data '{"text":"Tabor שלום 𓀀","language":"eng"}'
```

## Scope

- `live` and `limited` routes execute in the Worker. The per-record scope states the supported behavior.
- `provider` routes contact the fixed upstream documented on each record. A provider may reject requests or be unavailable. Gutenberg also accepts user-supplied TXT for a local preview.
- `owner` routes use the Workers AI binding. Set `POLYGLOT_AI_KEY` with Wrangler secrets and provide it as a bearer token to enable those routes. The public UI sends no owner credentials. Whisper takes a raw audio body, with an `audio/*` content type and a 2 MB cap.
- `upstream_reference` retains the repository at a specific inspected commit. CuReD and Ancient Language Decipherer require external Python runtimes. Seshat links to its browser interpreter. The font adapter reads pinned font bytes. Upstream app repositories are referenced by revision; the gateway implements its own adapters.
- `requires_build` lists the per-entry dependencies. In particular, the current release serves read-only catalog, search, and analysis tools. It has no bulk archive ingestion or Vectorize index.

The six pre-existing standalone Cloudflare Workers are listed on their original numbered records. The gateway implementations of those IDs have separate request/response schemas and leave the standalone endpoints intact.

## Development

Use Node 24 and run `npm ci`, `npm test` and `npm run build`. For a Wrangler validation build, use `npx --yes wrangler@4.164.0 deploy --dry-run --minify`. The deploy command uses the same configuration without `--dry-run`.

The Unicode character-name tables derive from Unicode Character Database 15.0 via Python's `unicodedata`. See [UNICODE-LICENSE.txt](UNICODE-LICENSE.txt). ISO 639 data, BiDi, Double Metaphone, and default romanization come from pinned npm packages. The Egyptian font route fetches the upstream [NewGardiner font](https://github.com/nederhof/opentypehiero/tree/089a8d604b19cb3e5883b03ad1159ba0800a7a8f/fonts) at its published Git revision. The font identifies SIL Open Font License 1.1 in its metadata.
