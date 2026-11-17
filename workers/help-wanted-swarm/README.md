# Nathan AI Sovereign Hive

By Nathan Tabor and Nathan AI.

- [Internal issue snapshot](https://nathan-ai-sovereign-hive.nathantaboract.workers.dev/api/queue)
- [Repair queue, source coverage and attempt counts](https://nathan-ai-sovereign-hive.nathantaboract.workers.dev/api/repair/status)
- [Public repair leads](https://nathan-ai-sovereign-hive.nathantaboract.workers.dev/api/repair/leads)
- [Patch verification receipts](https://nathan-ai-patch-verifier.nathantaboract.workers.dev/api/status)
- [GitHub Help Wanted discovery](https://nathan-ai-help-wanted.nathantaboract.workers.dev/)

**1+1=2** admits a verified source identity and saves its evidence.
**1-1=0** clears an active item on verified withdrawal or closure, with its evidence retained. Nathan controls implementation. Upstream maintainers control acceptance and merge.
**1×1=1** integrates the patch and its handoff under the same issue identity.
**1÷1=1** checks each patch against its pinned source and records what the check established.

## Cloudflare

The existing Hive Worker runs every five minutes. Upload `worker.mjs` and `repair.mjs` as ES modules. The `HIVE` binding points at the Hive D1 database. Apply `schema.sql` before deployment. The `DISCOVERY` service binding points at `nathan-ai-help-wanted`. The worker imports that index and the internal issue snapshot. Non-GitHub discovery connects the documented GNOME project label, Codeberg's Help Wanted issues, and Mozilla's good-first-bug keywords. A failure records the provider error and preserves its previous cursor and coverage. Replays skip unchanged job metadata. A D1 quota error prevents durable mutations until the account resets or the plan is changed. The owner’s connected GitHub account can refresh the internal snapshot. Direct Workers-to-GitHub listing records its own status and backs off after an anonymous failure. Optionally store a repository-scoped, read-only GitHub credential as the Worker secret `HIVE_GITHUB_READ_TOKEN` to enable authenticated direct scans.

Expand public coverage by adding confirmed provider/project definitions in `repair.mjs`. Jira and Azure DevOps require a tenant, project and maintainer-approved query. For more internal projects, add public owner-controlled tracker inputs or enqueue private tasks through an authorized operator. Private titles and patches belong behind authenticated endpoints. A current scan receipt applies only to its registered source.

## Repair state and authenticated API

POST endpoints accept JSON with an Authorization Bearer credential. Add independently generated secrets named `REPAIR_RUNNER_TOKEN` and `REPAIR_OWNER_TOKEN` to the Worker. Store the runner token in the owner's runner environment with restrictive permissions. The Worker refuses writes for each role until its secret exists. Each worker uses a distinct worker ID and an authorized runner credential.

| Endpoint | Request |
| --- | --- |
| `/api/repair/claim` | `worker`, `requestId`, `scope` and optional `repositories` |
| `/api/repair/heartbeat` | `id`, `worker`, `lease` |
| `/api/repair/finish` | Lease fields plus `status`, `receipt` |
| `/api/repair/task` | Owner credential and `id` |
| `/api/repair/advance` | Owner credential plus `id`, `from`, `to`, `updatedAt`, `evidence` |

`PATCH_READY` requires a pinned base and unified diff. `VERIFIED` also requires real passing test records with a command and numeric exit code. `IMPLEMENTED` records the applied revision. `DONE` requires an applied revision and passing verification. Keep the actual process logs or a reference to them in the receipt. `RETRY_WAIT` and `NEEDS_REVIEW` require a reason. Active leases expire after 120 seconds and the runner renews them every 25 seconds. Claim request IDs and finish receipts support retries. The run history keeps each attempt. Provider coverage, runnable work and terminal outcomes are independently visible.

## Continuous Linux runner

Use a Linux host with rootless Podman, Python 3.10+ and a trusted locally installed job image. The runner leases only the repositories in its profile. Use distinct profiles for `INTERNAL` and `GLOBAL` capacity. Choose the image and its command in the local profile. The command consumes `/job/task.json` and writes `/job/result.json` with a status and receipt. The profile should resolve a pinned base, check contribution rules, produce the diff and report checks actually run. The runner does not send repository issue text as a shell command or give credentials to the job image. Set `network` only in profiles that require network I/O. Keep repository code and tool artifacts inside the sandbox.

Example local profile:

```json
{
  "url": "https://nathan-ai-sovereign-hive.nathantaboract.workers.dev",
  "worker": "internal-linux-1",
  "scope": "INTERNAL",
  "repositories": ["NathanAIoxr/Nathan-AI-Sovereign-Core"],
  "profile": {
    "image": "localhost/nathan-repair-runner:local",
    "network": false,
    "timeoutSeconds": 600
  }
}
```

Install `runner.py` under `~/.local/lib/nathan-repair/`, place the profile at `~/.config/nathan-repair/internal.json`, and put the token in `~/.config/nathan-repair/runner.env` with permissions `0600`. Install `nathan-repair@.service` under `~/.config/systemd/user/`. From that service user, run:

```sh
systemctl --user daemon-reload
systemctl --user enable --now nathan-repair@internal.service
```

Enable lingering for the service user when it should run across logouts and boot. Verify the first claim and completion in the queue and journal before expanding the pool. Save a status receipt before requesting the next claim. A sandbox job that fails or loses its lease is retried or sent to the review queue. Linux profiles do not establish macOS test results.

## Validation

Run `node --test workers/help-wanted-swarm/repair.test.mjs`. The Cloudflare D1 setup was also exercised with a temporary job, covering an exclusive claim, an idempotent replay, expiry/reclaim, stale completion rejection and attempt history. The fixture was removed in the same batch. The Linux runner requires host enrollment and an installed job image before an end-to-end run is possible.

## Contribution drafts

`nathan-ai-handoff-bee` uses `handoff/worker.mjs` with the existing `HIVE` D1 binding. Apply the repair schema, `handoff/schema.sql`, then `handoff/immediate.sql` before deploying the Worker. D1 stages or invalidates drafts in the same transaction that changes a repair receipt or status. The one-minute schedule reconciles up to 100 drafts per run to cover historical receipts. Draft notes carry Nathan Tabor's sign-off and show whether runtime checks are pending. The source receipt preserves the pinned base, patch, and test evidence.

The outbox is available in the account's D1 console. The Worker has no HTTP routes or upstream publishing credentials. Repeated scheduled invocations do not duplicate drafts. When a source receipt changes or a job leaves an eligible state, the Worker refreshes or removes the stale draft. The run ledger retains seven days of scheduled receipts.

## Patch source verification

Apply `verifier/schema.sql` before deploying the verifier or repair status route. The [patch verifier](verifier/README.md) checks up to four eligible public GitHub handoffs at a time. Its named public receipts remain limited to Goldener and Glassbeetle. The repair status route reports aggregate verification and handoff activity. Its checks leave implementation and upstream release with Nathan Tabor.

The GitLab.com community source uses GitLab's published `Accepting merge requests` label, alongside the GNOME GitLab and Mozilla sources.

## Worker Bees and Ant Bots

Every Help Wanted record and registered owned project has a stable Worker Bee and Ant Bot identity. The Bee tracks repair state or the latest eligible project HTTP check. The Ant tracks the source observation or ownership registration. Both use the existing ledger. Public project listings include public registrations, and repairs retain the existing lease and handoff workflow.

- [Cloudflare dashboard](https://nathan-ai-sovereign-hive.nathantaboract.workers.dev/pairs)
- [GitHub Pages dashboard](https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/hive/)
- [Read-only assignments API](https://nathan-ai-sovereign-hive.nathantaboract.workers.dev/api/repair/pairs)

For a fresh Hive environment, apply `schema.sql` followed by `pair-runtime.sql` to D1. Upload `worker.mjs`, `repair.mjs`, and `pairs.mjs` as ES modules. The owned project registry is populated from verified ownership sources. Scheduled checks run in batches through the Hive's existing trigger, for known public Cloudflare endpoints.

### Explore the live ledger

Use title or ID, provider, lane, and Bee status to filter the public assignments. The JSON API validates those filters and preserves them across keyset pages. Each assignment shows the Bee and Ant IDs and the timestamp of the latest recorded evidence.

[`GET /api/repair/coverage`](https://nathan-ai-sovereign-hive.nathantaboract.workers.dev/api/repair/coverage) provides recorded source check outcomes, coverage watermarks, and counts by provider, lane and status. The public owned-project counts use the same visibility filter as the dashboard. Source check outcomes and coverage watermarks document the recorded scans.
