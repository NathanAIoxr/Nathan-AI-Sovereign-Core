# App Store and Google Play build queue

The release queue uses `app_store_release_jobs_v1` in the owner Cloudflare D1 database `tabor-autonomous-builds`. Each app has independent Apple and Google rows. Source locations and status come from the existing app manifests and station receipts. A station candidate indicates source review work. The original build queue remains the source for product and source-recovery milestones.

## Stages

1. **Source review.** Match the station and product manifest, identify duplicate catalog aliases by source evidence, and verify release rights, ownership, the canonical app root, and appropriate distribution. Keep private source and receipt content out of public issues and branches. An unrecovered concept stays pending until there is authorized source or a clear approved implementation.
2. **Native product.** Reuse any suitable native project. Scope app-specific mobile features, offline behavior where relevant, permissions, accessibility, and tests. Apple expects a product with functionality beyond a repackaged website.
3. **Native CI.** Use the existing app-specific GitHub workflow where available. Build and test iOS with the required Xcode SDK on a macOS runner. Build Android for the current Play target API and produce an AAB. Save exact artifact, commit and CI evidence. Keep unsigned or debug artifacts accurately labeled.
4. **Device QA.** Verify clean install and core flows, including touch input, sharing, accessibility, and app resume where applicable. Record device/simulator and OS versions and test evidence.
5. **Listing.** Prepare unique display name, app icon, screenshots, support and privacy links, and content rating and privacy disclosures grounded in the app's actual data flows. Record closed-testing requirements where they apply.
6. **Signing and release candidate.** Validate application identifiers, developer account access and signing using authorized systems. Record real prerequisites that remain outstanding. Mark prepared only when the signed build, device test evidence, and listing materials are verified. Store approval and publication are separate actions.

Browse current official requirements during implementation. [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/) · [Apple upload requirements](https://developer.apple.com/news/upcoming-requirements/) · [Google Play target API](https://support.google.com/googleplay/android-developer/answer/11926878) · [Play testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465)

## Claim and receipt

Choose a queued job with a concrete next action. A running job may be reclaimed after its lease expires. Claim one app per run with a fresh unique lease owner. This statement prevents simultaneous claims for both platforms of the same app. Use the canonical app key and deduplicate related aliases before starting implementation.

```sql
UPDATE app_store_release_jobs_v1 AS j
SET status='running', lease_owner=?1, lease_until=unixepoch()+2700, updated_at=unixepoch()
WHERE j.app_key=?2 AND j.platform=?3
  AND (j.status='queued' OR (j.status='running' AND j.lease_until<=unixepoch()))
  AND NOT EXISTS (
    SELECT 1 FROM app_store_release_jobs_v1 AS active
    WHERE active.app_key=j.app_key AND active.platform<>j.platform
      AND active.status='running' AND active.lease_until>unixepoch()
  )
RETURNING app_key, platform, source_ref, stage, next_action, lease_until;
```

Record each milestone with a timestamp, commit or PR, checks actually run, artifact link when built, remaining blocker, and next action. Use `queued` when another concrete milestone is actionable, `blocked` when a prerequisite is missing, and `prepared` for a verified release candidate. Reopen blocked rows when the named prerequisite is resolved. Transient failures can be released to `queued` with retry evidence. Write receipts only while the current lease is valid.

```sql
UPDATE app_store_release_jobs_v1
SET status=?1, stage=?2, next_action=?3,
    receipt_history_json=json_insert(receipt_history_json,'$[#]',json(?4)),
    lease_owner=NULL, lease_until=NULL, updated_at=unixepoch()
WHERE app_key=?5 AND platform=?6 AND status='running'
  AND lease_owner=?7 AND lease_until>unixepoch()
RETURNING app_key, platform, status, stage;
```
