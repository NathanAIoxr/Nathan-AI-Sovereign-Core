# Nathan AI Research and Compute Registry

Cloudflare D1 holds the live registry. GitHub versions its schema, source links and starting research assignments. Open the [Cloudflare D1 database](https://dash.cloudflare.com/?to=/:account/workers/d1) and select `nathan-ai-research-resource-registry`.

| Table or view | Contents |
| --- | --- |
| `research_opportunities` | Organizer, status, award basis, date, official link and verification date |
| `research_references` | Software, datasets, rules, workspaces and disclosure guidance |
| `research_workboard` | Research assignments joined to opportunity and compute status |
| `compute_profiles` | Verified Worker profiles and proposed hardware allocations |
| `compute_receipts` | Replay receipts from the existing fixed FP64 kernel |
| `account_assets`, `inventory_snapshots` | Account-only asset registration and observation counts |

From the D1 console:

```sql
SELECT title, award_usd, award_basis, deadline_local, deadline_timezone, official_url
FROM research_opportunities
WHERE status = 'open'
ORDER BY deadline_local;

SELECT opportunity, compute, compute_state, assignment_state, deliverable
FROM research_workboard
ORDER BY compute_state, opportunity;

SELECT source, inventory_count, observed_at
FROM inventory_snapshots
ORDER BY source;
```

The Sovereign Supercomputer Cloudflare Worker currently exposes a fixed FP64 dot-product kernel. Its receipts measure that operation. Cloud Slayer's Supercomputer and Hypercomputer are catalog workspaces. A physical cluster, GPU, quantum allocation or workstation moves to verified after the owner supplies its resource identity and verifies access. A planned assignment records the intended resource and deliverable. The registry does not dispatch it.

Initialize a new D1 database by executing the SQL files in numerical order. With the Cloudflare D1 query API, use `POST /accounts/{account_id}/d1/database/{database_id}/query` and send the file under the `sql` key. The starter records use conflict handling so rerunning initialization preserves existing rows and operator edits. To refresh a public organizer entry, edit its status, supporting URL and `checked_on` together. Register additional hardware and software in `account_assets` using a stable source and provider ID. Keep credentials and account inventory in their respective private provider consoles.

To refresh this registry's Cloudflare inventory, run `node refresh.mjs` with `CLOUDFLARE_ACCOUNT_ID`, `RESEARCH_REGISTRY_D1_ID`, and an account-scoped `CLOUDFLARE_API_TOKEN` with D1 Write, Workers Scripts Read, Pages Read, Workers KV Storage Read and Workers R2 Storage Read. Each successful resource list replaces only its own snapshot. R2 inventory covers the default jurisdiction. Provider asset names are stored in D1. The existing [Cloud Slayer inventory](../digital-flubber/README.md#cloud-slayer-worker-registry) has its own refresh path.

The registry records disclosure policy references. Research assignments cover mathematics, public scroll datasets, educational software and quantum simulation.

## Global discovery intake

`global_resource_intake` records the publisher, geography, official reference, access model, verification date, and tags for each discovered source. `global_resource_intake_queue` is the agent and worker handoff. Each queued row has one `intake_role` and the import mode `public_metadata`. The role describes the catalog work to do. Asset data, executable packages, and credentials remain at the provider.

```sql
SELECT intake_role, COUNT(*) AS queued
FROM global_resource_intake_queue
GROUP BY intake_role ORDER BY intake_role;

SELECT id, title, official_url, access_model, tags
FROM global_resource_intake_queue
WHERE intake_role = 'compute-allocation-agent'
ORDER BY region, title;

SELECT id, intake_role, region
FROM global_resource_intake_tags
WHERE tag = 'quantum';
```

A consumer uses the source ID as its deduplication key and records `imported` after the catalog confirms the metadata write. `skipped` removes a row from the queue while retaining the source record. Replaying the seed preserves existing rows and their intake states. For compute sources, an application listing documents a route to request capacity. A verified allocation belongs in `compute_profiles` or `account_assets` after access is granted.
