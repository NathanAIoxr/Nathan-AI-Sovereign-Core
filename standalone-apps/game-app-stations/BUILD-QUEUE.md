# App station build queue

The `game_station_jobs_v1` table in Cloudflare D1 `tabor-autonomous-builds` tracks work by app ID. Each app manifest remains the source for its path, original source, and verified launch status.

| Role | Execution |
| --- | --- |
| Build agent | The existing hourly Nathan Tabor Independent App Builds automation takes one scoped app milestone. |
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

The App Station Build Bots workflow runs the recovered archive integrity checks and each Infinitum game test as separate CI jobs. It publishes a CI artifact after they pass. The hourly build agent reads the D1 backlog, explores a source-backed build and a source-recovery task when both lanes have work, and keeps each app in its own leased scope. For an existing playable edition, verify its specific live URL and source before moving its station to an existing launch. Record that as route reuse in the receipt. Archived standalone editions record the original bytes' digest. New adaptations record their relationship to the documented prototype in their app manifest.
