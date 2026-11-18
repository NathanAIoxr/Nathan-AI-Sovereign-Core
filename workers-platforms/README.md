# Nathan Tabor Hyper Supercomputer Federation

[Live federation](https://nathan-tabor-hyper-federation.nathantaboract.workers.dev/) · [Language explorer](https://nathan-tabor-hyper-federation.nathantaboract.workers.dev/p/languages/catalog)

The whole federation, the independently operated platforms, and their explicit relationships are the three parts of Nathan Tabor’s design. Implement the relationship as published APIs or source links. The hub only routes and lists platforms. It has zero database bindings. Each platform owns its Worker deployment and D1 database. The namespace and account remain shared operational dependencies. GitHub stores source and release automation.

## Handoff for ChatGPT and maintainers

1. Read `platforms.mjs` to find the registered platform and related projects. Inspect each project's source and contract before changing it.
2. Make changes in the owning platform. Define platform-local bindings on upload. A new platform starts with a uniquely named D1 database, a route ID and a Worker in the same dispatch namespace. Add KV or R2 when a workload actually requires them and bind them only to that platform.
3. Use the directory to discover others. Add a link for human navigation or define an explicit authenticated API for programmatic exchange. Keep private projects behind their existing access policies. Keep externally supplied data out of the dispatch target, database identifier and upstream host.
4. Version and review the source in GitHub. Validate one selected platform before deploying it. Releasing the router and releasing a platform are distinct operations.
5. Measure coverage by source, language, dialect, family, attestation, corpus rights, and supported operation. Keep the **66,666** program target distinct from verified imports, transcription, translation, or model support. Add new ancient, modern and sign-language sources only with evidence and permissions.

## Production map

`nathan-tabor-hyper-federation` dispatches eleven user Workers inside `nathan-tabor-platforms`. Each live ID binds `DB` to a unique database named `tabor-platform-<id>`. The adapters publish platform records and connect to existing deployments. The language Worker additionally hosts the searchable catalog. Existing workload services continue to run at their own endpoints.

- `GET /api/platforms` returns the allowlisted routes and their invocation limits.
- `GET /p/<id>/api/platform` reads that platform’s identity from its own D1 database.
- `GET /p/languages/api/catalog` supports `q`, `kind`, `period`, `sign=1` and `offset`.
- `GET /p/languages/api/coverage` returns live database coverage and release provenance.

The router uses 30 CPU ms and five subrequests per dispatched invocation. These are invocation limits. Account spend and D1 usage are separate. Cloudflare lists 1,000 included scripts, 20 million requests and 60 million CPU ms in the Workers for Platforms allotment. See [Cloudflare pricing](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/reference/pricing/).

## Releases and recovery

Run `node --test workers-platforms/dispatch.test.mjs`. The REST deployer uses an account-scoped token with Workers Scripts Write and D1 Write and releases one target at a time. The existing namespace and D1 database are prerequisites. To add a target, include it in the manifest and in the workflow’s choices. Use an explicit D1 export and a known Git commit for recovery. The public runtime has no administrative write route.

```sh
node workers-platforms/deploy.mjs languages
node workers-platforms/deploy.mjs hub
```

The initial deployment already enabled the hub’s workers.dev hostname. For a fresh account, create the dispatch namespace and required databases, import the language release, deploy each tenant, deploy the hub, then enable its hostname. The manual GitHub release job reads the repository variable `CLOUDFLARE_ACCOUNT_ID` and secret `CLOUDFLARE_API_TOKEN` after merge to main. A production branch checkout is required by the workflow.

## Language source

Hammarström, Forkel, Haspelmath and Bank, [Glottolog v5.4](https://glottolog.org/meta/downloads), CC BY 4.0. The import projects a subset of the CLDF metadata columns and derives the sign marker from the release's classification and parent-language field. The pinned release includes all rows labeled language, dialect or family by CLDF. Its counts include catalog classifications and can differ from Glottolog’s published count of spoken first languages. Documentation years are source data. Records without dates remain searchable without a date filter.

Run `python3 workers-platforms/import-languages.py /tmp/tabor-languages.sql` and import the resulting SQL into `tabor-platform-languages` using [D1 import](https://developers.cloudflare.com/d1/best-practices/import-export-data/). Verify the row totals and catalog release through the coverage endpoint after import.

## Full 1,000-slot deployment

The namespace includes eleven core platforms and 989 independent read-only catalog Workers, named `language-shard-0001` through `language-shard-0989`. Each shard bundles a unique range of 27 or 28 public Glottolog entries and has zero database bindings. Together they carry the same 27,275 source entries as the central D1 catalog, projected to Glottocode, name, kind, and ISO code. They retain local readable data if the central catalog database is unavailable. The public router serves one named shard per request. Shard directory links start at `/api/shards`.

The bulk deployment reconciles the expected IDs against Cloudflare's namespace inventory. It uploads only missing workers in bounded batches, verifies its final inventory, and stops if the change would exceed 1,000 scripts. Run it again to resume after an interrupted upload or a Cloudflare rate limit. Existing tagged catalog shards remain in place. For a new catalog release, version the catalog and migration deliberately.

```sh
python3 workers-platforms/build-shards.py /tmp/tabor-shards.ndjson
node workers-platforms/deploy.mjs shards /tmp/tabor-shards.ndjson
node workers-platforms/deploy.mjs hub
```

The GitHub Actions `shards` target regenerates the dataset from its verified release hash and reconciles the same inventory after the workflow is available on main.
