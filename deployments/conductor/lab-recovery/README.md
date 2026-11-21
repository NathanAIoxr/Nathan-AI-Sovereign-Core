# Nathan Tabor Labs source recovery

The complete 284-file recovery package is stored as the SHA-256-addressed object declared in `archive.mjs` in the owner-only `tabor-holding-vault` R2 bucket. It contains the source bytes, detailed path and hash manifest, 6,056 master source rows, 383 technology records, 533 app-station manifests and 2,761 writing index entries. The archive binds to the existing `nathan-tabor-labs` Worker as `LAB_ARCHIVE`. Its public status route is `/api/recovery` and its browser entry is `/recovery/`.

`schema.sql` creates and seeds `lab_recovery_jobs_v1` in the existing `tabor-autonomous-builds` D1 database, bound as `LAB_BUILDS`. The Worker uses the existing 15-minute trigger for private hash readback and existing launch checks. It only fetches the eight named release URLs. The existing Conductor's Independent App Builds rotation handles the remaining source and build rows. Private source remains in R2. The public endpoint omits private receipts and the object path.

The Worker wrapper layers these routes and checks on the active Labs catalog wrapper without replacing existing Labs endpoints, binding, or cron. Keep the existing modules when packaging `entry.mjs`. The archive import route requires a temporary encrypted secret and accepts the exact published byte length and digest. The activation removes that secret after intake. The source archive is immutable under its digest key.

## App build and source jobs

Claim exactly one source or build row using a fresh lease and the existing `tabor-autonomous-builds` connection.

```sql
UPDATE lab_recovery_jobs_v1 SET status='running', lease_owner=?1,
  lease_until=unixepoch()+1800, attempts=attempts+1, updated_at=unixepoch()
WHERE id=?2 AND kind IN ('source','build') AND next_attempt<=unixepoch()
  AND (status='queued' OR (status='running' AND lease_until<=unixepoch()))
RETURNING id,kind,title,task,attempts;
```

Set `?1` to `verified`, `blocked`, or `queued` only after recording source, checks, deployment evidence or an exact blocker in the receipt `?2`. Bind the ID and lease as `?3` and `?4`.

```sql
UPDATE lab_recovery_jobs_v1 SET status=?1, receipt=?2, lease_owner=NULL,
  lease_until=NULL, next_attempt=unixepoch()+3600, updated_at=unixepoch()
WHERE id=?3 AND lease_owner=?4 AND lease_until>unixepoch()
RETURNING id,status;
```

The handoff is tracked in [issue #523](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/issues/523). Keep each edition independently addressable and retain the original project identities and exact source versions.

Run `node --test deployments/conductor/lab-recovery/archive.test.mjs` with Node 24.
