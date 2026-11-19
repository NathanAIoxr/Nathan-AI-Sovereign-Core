# Unified Operations Cockpit

The Worker reads all three catalog databases and adds missing records to the existing private D1 ledger. Each five-minute trigger discovers application tables and checks the two least recently attempted. The source inventory and latest verification for each table are durable. Existing records retain their original status, provenance, and archived bytes.

## Deploy

Run these commands from this directory with access to the Cloudflare account.

```sh
wrangler d1 execute nathan-ai-cockpit-ledger --remote --file=reconcile.sql
wrangler deploy
wrangler secret put COCKPIT_KEY
```

Store the owner key in Cloudflare secret storage and send it only in the HTTPS `Authorization: Bearer` header. The aggregate dashboard and `GET /api/summary` work without a key. The dashboard fits mobile browsers.

| Owner endpoint | Operation |
| --- | --- |
| `GET /api/status` | View source tables, reconciliation times, and failures |
| `GET /api/catalog` | Page through private registry entries with `source`, `limit`, and `offset` |
| `GET /api/platforms` | View the dispatch binding and the last script count observed by a Cloudflare control-plane check |
| `POST /api/import` | Reconcile the next two tables or use the `source` and `table` query parameters to select one |
| `POST /api/micro` | Record an owner pulse and return status |
| `POST /api/macro` | Retrieve the latest completed GitHub verification and record its result in D1 |

The hourly GitHub workflow checks the aggregate and writes a run summary. A manual workflow run and the `unified-cockpit-verify` repository dispatch are also supported. The Worker periodically records the matching completed run from GitHub's public Actions API. A successful GitHub verification records the result of the check. Deployment statuses come from the source or Cloudflare.

The namespace count is a timestamped Cloudflare control-plane observation. The binding is configured for the existing namespace. Application invocation remains the responsibility of the existing dispatch Worker.
