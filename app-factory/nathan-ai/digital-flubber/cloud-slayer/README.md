# Cloud Slayer

[Worker Registry](https://tabor-apps-nathan.pages.dev/cloud-slayer) · [Operations and local setup](../README.md#cloud-slayer-worker-registry)

The account inventory persists in D1. Shared modules execute through reviewed, fixed handlers on the existing edge service. Supercomputer, Hypercomputer and SOS are registry views. A shared module record consumes no additional Cloudflare Worker script slot.

## Tool Library

[Open the Tool Library](https://tabor-apps-nathan.pages.dev/cloud-slayer/tools).

The GitHub-owned manifests in [tool-library/manifests](tool-library/manifests/) store the catalog. Each line defines one tool and pins its GitHub source to a commit. A repeated key updates the existing entry. Tags and descriptions are searchable by word and prefix. A catalog record links to source code or documentation. The separate shared-module registry handles approved live actions.

The library has no application-level total-record ceiling. It streams imports in 100-record transactions and uses SQLite FTS5 with cursor pagination. Production uses the existing `CLOUD_SLAYER_DB` D1 binding. Local SQLite uses the same migration. Database storage and provider operation limits apply.

- Add a JSONL manifest or shard with `key`, `title`, `description`, `tags`, `kind`, `source_path`, and `source_ref`. For Nathan AI entries the source path is relative to this GitHub repository. The ref is a 40-character commit SHA. Supported kinds are `worker`, `app`, `library`, and `guide`.
- From the Digital Flubber directory, run `node cloud-slayer/tool-library/import.mjs --check cloud-slayer/tool-library/manifests`. GitHub CI validates these same manifests.
- For the production catalog, apply [migration 0002](migrations/0002_tool_library.sql) and [migration 0004](migrations/0004_upstream_catalog.sql), then run the importer with `--d1` and the existing account and database IDs plus a D1 write token. For your own SQLite database, use `--sqlite /path/to/cloud-slayer.sqlite` followed by the manifest path. This mode applies the migration and supports the existing local server.
- Replaying a manifest is safe. A malformed input or interrupted request can leave earlier batches committed. The counter, entries, and search index commit together in each batch.


### Open-source upstream catalog

The [upstream manifest](tool-library/manifests/upstream.jsonl) holds free and open-source software links. Each external record has an `upstream-` key, an upstream GitHub repository in `source_repository`, the reviewed license label in `source_license`, and the pinned license file path in `source_license_path`. The `source_ref` pins both links to the same revision. Set `source_path` to an empty string to open the repository tree. The browser can filter by source and initial letter. The catalog provides source and license references for review. It ships no third-party code and makes no deployment changes.
