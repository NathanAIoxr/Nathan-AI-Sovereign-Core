# Nathan release fleet

Track websites, books, OS work and compute evidence in the owner D1 database `tabor-autonomous-builds`. Mobile release jobs remain in the [native release queue](../../docs/app-store-release/BUILD-QUEUE.md). The source inventory uses complete tracked manifest paths. A station entry remains an independent launch or source-recovery record. The same app may have both a product manifest and a station manifest.

| Work | Build and verification |
| --- | --- |
| Websites | GitHub Actions rebuilds the station catalog and checks its digest manifest. UNBOUND gets its own Worker artifact and verifies its mount, CSS, JS, install manifest, reader and service worker routes. Existing site origins and deployment controls still apply. |
| Apple and Google | The app-specific workflow builds UNBOUND from its existing catalog, using SwiftUI on iOS and Android framework views on Android. It preserves realm-gate play and progress on-device. Its build outputs are an unsigned IPA, unsigned AAB and debug APK. Record actual SDK, device QA, signing, listing and review evidence in the native queue. |
| Books | Two independently packaged EPUB 3 previews reuse the existing UNBOUND series map and Worlds Within chapter text. The rest of the tracked book sources are reviewed independently. Full manuscripts, editorial and device proof are tracked as release work. |
| HAT OS | Build the BIOS diagnostic image and verify boot plus all four profile labels in a networkless QEMU guest. This milestone covers the diagnostic and virtual keyboard, VGA and serial output. Kernel services, persistent storage, drivers, UEFI and security remain engineering milestones. |
| Supercomputer | The scheduled D1 runner accepts a bounded digest job. The Sovereign Core FP64 service reports an isolated replay-verified receipt. Keep both kinds of evidence with the source or artifact they verify. |
| Hypercomputer and servers | Record federation health, pool configuration and verified workloads separately. Use a hardware runner only for its verified operating system and toolchain. The database Container pool currently exposes readiness and benchmark probes. A server heartbeat alone establishes reachability. |

The `Nathan release fleet` workflow runs on changes and every day at 10:23 UTC. `Sorting Hats & Hatettes native builds` runs on its source changes and manual requests. The website build publishes an artifact to GitHub Actions. Website deployment is verified at the app's existing Cloudflare origin. The release workflows use the user-authorized repository and bounded app paths. Artifacts and source records are public in this repository. Keep signing secrets, unpublished user data and private manuscripts in their existing approved storage.

## D1 releases

`release_fleet_sources_v1` stores source paths and the observed commit. `release_fleet_jobs_v1` stores the website, book, OS and compute queue. Pick one independently testable milestone and record its source, artifact, actual test result and remaining dependency. For a station link-only job, check the exact owned R2 address and its digest. Read the original source status before assigning app development. Source review of other book records uses existing owned source. OS and compute rows retain their own statuses and receipts.

Claim one row with a fresh lease ID and a finite lease. Retries keep the same primary key. Use the native queue's documented claim for mobile jobs.

```sql
UPDATE release_fleet_jobs_v1 AS job
SET status='running', lease_owner=?1, lease_until=unixepoch()+2700, updated_at=unixepoch()
WHERE project_key=?2 AND target=?3
  AND (status='queued' OR (status='running' AND lease_until<=unixepoch()))
  AND NOT EXISTS (
    SELECT 1 FROM release_fleet_jobs_v1 AS other
    WHERE other.project_key=job.project_key AND other.target<>job.target
      AND other.status='running' AND other.lease_until>unixepoch()
  )
RETURNING project_key,target,source_path,stage,next_action,lease_until;
```

```sql
UPDATE release_fleet_jobs_v1
SET status=?1, stage=?2, next_action=?3,
    receipts=json_insert(receipts,'$[#]',json(?4)),
    lease_owner=NULL, lease_until=NULL, updated_at=unixepoch()
WHERE project_key=?5 AND target=?6 AND status='running'
  AND lease_owner=?7 AND lease_until>unixepoch()
RETURNING project_key,target,status,stage;
```

Use `queued` when another available step can start, `blocked` when a named dependency is required, and `verified` when that target's requested work has evidence. Keep the owner's canonical project scope if another catalog uses an alias. Check exact platform requirements with [Apple Developer](https://developer.apple.com/news/upcoming-requirements/) and [Google Play Console Help](https://support.google.com/googleplay/android-developer/answer/11926878) when preparing a store submission.
