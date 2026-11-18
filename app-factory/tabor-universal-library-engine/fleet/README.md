# Sovereign Crown · Library of Tabor

The registry uses global IDs 1–505 and preserves numbering within each batch. Global ID = (batch − 1) × 101 + local ID. This fleet numbering is specific to these five catalogs. The Library archive's OG-001–OG-101 and 001–404 system-module numbering is a separate registry.

| Batch | IDs | Source |
| --- | --- | --- |
| Open-source infrastructure | 1–101 | Tabor Worker Catalog |
| Languages and ancient scripts | 102–202 | Cloudflare script inventory where available |
| Wisdom | 203–303 | Library of Tabor Wisdom Catalog |
| Imagination | 304–404 | Library of Tabor Imagination Engines |
| Sovereign command and verification | 405–505 | Submitted master-fleet attachment |

The seed preserves all 101 submitted Batch 5 titles and descriptions, including proposals. A catalog description states the intended capability. The deployed contracts in `routes.mjs` specify the supported operation, which may implement part of the proposal. For example, the Library search binding uses the existing archive search, while the verbatim diff binding returns the first differing index. The fleet response uses `catalog` for sourced titles and descriptions, `worker_name` for labels derived from existing script names, and `awaiting_source` for slots awaiting their original entry. A Worker mapping records that a script was identified, while `dispatch` identifies calls implemented by Crown.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/` | Mobile catalog and search |
| GET | `/api/health` | Slot, catalog, mapping, and binding counts by release or batch |
| GET | `/api/fleet?batch=5&q=rational` | Search names, categories, and mapped Worker names |
| GET | `/api/fleet/424` | Get an entry and its callable contract |
| GET | `/api/capabilities` | List available route contracts and request examples |
| GET or POST | `/api/dispatch/ID` | Call one of the fixed service-binding operations |

For catalog pagination, pass the previous response's `next` value as `after` with the same filters. The dispatch routes accept their declared methods and parameters. POST routes accept a JSON object up to 64 KiB. Crown's data access is read-only. The deployed gateway routes public computations and archive searches through fixed service bindings. Deployment commands, account changes, and private data do not have gateway routes.

For an iPhone Shortcut, use **Get Contents of URL** with the method and example from `/api/capabilities`. To add one-half and one-third, use POST at `/api/dispatch/424` with this JSON body.

```json
{"a":"1","b":"2","c":"1","d":"3","op":"add"}
```

## Deployment

Run from this directory. The Wrangler configuration includes the dedicated registry database ID and service names for the existing account. To use another account, create or select its D1 database and configure its service targets.

```sh
npx wrangler d1 migrations apply tabor-fleet-registry --remote
npx wrangler deploy
```

The SQL files also run in order through the D1 query API. The seed can be replayed for this release. Add new source records through a later migration so previously applied release seeds stay fixed.
