# App station build queue

The `game_station_jobs_v1` table in Cloudflare D1 `tabor-autonomous-builds` tracks work by app ID. Each app manifest remains the source for its path, original source, and verified launch status.

| Role | Execution |
| --- | --- |
| Build agent | The existing hourly Nathan Tabor Independent App Builds automation advances scoped app milestones. Each completion retains its own lease and receipt. |
| Build and test | GitHub-hosted Actions runners run application-specific tests and package the output. |
| Release | Publish verified static artifacts to the authorized station path in Cloudflare R2. |
| Cloudflare Supercomputer | Existing scheduled digest job checks supported release input. |
| Hypercomputer and server pools | Existing compute bindings are documented at `app-factory/nathan-ai/sovereign-supercomputer/database-compute/`. Their current published interface provides readiness and resource probes. An application executor or approved runner is required before scheduling application code there. |

The build agent claims a row with an atomic compare-and-set statement. Bind the app ID and a fresh lease owner as parameters. Resolve the exact project from its manifest.

```sql
UPDATE game_station_jobs_v1
SET status='running', lease_owner=?1, lease_until=unixepoch()+1800, updated_at=unixepoch()
WHERE app_id=?2 AND (
  status='queued' OR (status='running' AND lease_until<=unixepoch())
)
RETURNING app_id, task, lease_until;
```

Complete a row after testing and verifying the published app. Bind a JSON receipt with the GitHub PR or commit, test run, and live URL. Keep source-recovery milestones queued until the app has a verified build.

```sql
UPDATE game_station_jobs_v1
SET status='verified', receipt=?1, lease_owner=NULL, lease_until=NULL, updated_at=unixepoch()
WHERE app_id=?2 AND status='running' AND lease_owner=?3 AND lease_until>unixepoch()
RETURNING app_id;
```

For a deliberately paused milestone, clear the current owner's lease and return it to `queued`. If a run is interrupted, the next runner may reclaim the expired lease. Pull request jobs use GitHub-hosted runners. Promote a self-hosted runner only after it has been registered for trusted app builds and its workload has been verified.

The App Station Build Bots workflow runs the recovered archive integrity checks and each Infinitum game test as separate CI jobs. It publishes a CI artifact after they pass. The hourly build agent reads the D1 backlog, prioritizes tested draft integration and batches source-recovery checks, and keeps each app in its own leased scope. For an existing playable edition, verify its specific live URL and source before moving its station to an existing launch. Record that as route reuse in the receipt. Archived standalone editions record the original bytes' digest. New adaptations record their relationship to the documented prototype in their app manifest.

## Parallel source recovery and drafts

GitHub Actions **App Station Source Recovery** checks the source-available and build-pending app manifests in eight parallel shards. It verifies that each pending station appears exactly once in the consolidated `station-source-backlog` artifact. A matching repository pathname is a source lead. Confirm that the path contains the specific project's implementation or design before building from it.

The existing Cloudflare Tabor Build Loop generates bounded JavaScript draft modules for the entries in `fast-build-lanes.json`. Its scheduled dispatcher picks up pending modules. These draft tasks use public or owner-supplied design details, keep automatic publication off, and are reviewable through the existing owner console. The draft adapter for Infinitum covers only the grid transforms. The full private Infinitum service remains a separate integration and deployment milestone.

The Cloudflare D1 schema in `source-recovery.sql` links an audit snapshot and draft task to each active station. GitHub CI publishes fresh audits as artifacts. The Independent App Builds agent can read the latest artifact and reconcile any newer evidence with the station before choosing work. The Cloudflare snapshot records its source commit and timestamp. Inspect the state and output of a linked draft with this query:

```sql
SELECT j.app_id, j.task, j.status, a.source_state, a.audit_commit,
       a.candidates_json, a.checked_at, q.id AS draft_job_id,
       q.status AS draft_status, q.provider, q.code_sha256
FROM game_station_jobs_v1 AS j
LEFT JOIN game_station_source_audit_v1 AS a USING (app_id)
LEFT JOIN build_job_meta AS m
  ON m.plan_id = a.draft_plan_id AND m.task_key = a.draft_task_key
LEFT JOIN build_queue AS q ON q.id = m.job_id
WHERE j.status != 'verified'
ORDER BY CASE WHEN q.status = 'generated' THEN 0
              WHEN j.task = 'build-source' THEN 1
              WHEN a.source_state = 'repository-candidate' THEN 2 ELSE 3 END,
         j.updated_at, j.app_id;
```

Generated drafts require review, app-specific tests, and an authorized release. An audit, draft, or related reference does not complete the station. The existing Cloudflare Supercomputer can compute a digest for the batch metadata. Continue to use GitHub-hosted runners for app builds.

The GitHub Actions and [Cloudflare Build Loop console](https://tabor-build-loop.nathantaboract.workers.dev/console/) can be opened on mobile. Clouder Pro is an external mobile client with separate account authorization. The project uses existing Cloudflare and GitHub connections for API operations.
