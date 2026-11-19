# Nathan AI Project Runner

The Project Runner turns a task plan into a resumable queue for software and manuscripts. A Cloudflare Worker and its own D1 database keep the plans, dependency graph, leases, and receipts. A Node process works through the queue using an operator-selected adapter. Start it once per job and let it claim, save, verify, and pick up the next ready task.

## What runs where

| Piece | Function |
| --- | --- |
| Owner and planner | Convert the approved brief and exact source revisions into a JSON plan |
| Cloudflare Worker and D1 | Admit plans, claim ready tasks atomically, fence expired claims, and keep attempt receipts |
| Worker Bee | Run a build or writing task with the configured local adapter |
| Reviewer and integrator | Run the corresponding tasks in the dependency graph and check their accepted artifacts |
| Node dispatcher | Save a completion receipt locally, confirm it with D1, and claim the next task |

Plan roles are `build`, `review`, `integrate`, and `verify`. Declare dependencies explicitly. A review can depend on a build, and an integration can depend on multiple reviews. The runner honors the graph and the declared task order. Required blocked tasks produce a blocked job even when independent tasks finished.

Publishing is a separate operation in the named preview or production target. The included adapter creates working artifacts, patch files, and test receipts. Credentials for GitHub pushes or production releases belong to the operator or a dedicated deployment service.

## Give it one brief

Use the `start` command for an end-to-end job with the included Codex planner. Supply the usual worker settings below and replace `jobId` and `root` with a `project` object containing `id`, `root`, `title`, `mode`, and `brief`. The planner reads the workspace and generates the task plan. The runner saves and submits that plan, then starts execution. Rerun the same command with the same settings and journal to resume an interrupted job without re-planning.

```sh
node hive/project-runner/runner.mjs start settings.json
```

## Submit a plan you already have

Save the following as `plan.json` and adjust the sources and paths in the brief and task instructions. The root is a label that matches the runner configuration. Keep the same working directory and journal when resuming the job.

```json
{
  "id": "atlas-preview-01",
  "root": "atlas",
  "title": "Atlas CSV export preview",
  "mode": "code",
  "brief": "Use my checked out Atlas revision. Add filtered CSV export under app/export. Preserve original behavior and prepare a local patch.",
  "tasks": [
    {
      "id": "export-csv",
      "role": "build",
      "instruction": "Implement filtered CSV export and save a patch with the exact changed files.",
      "acceptance": ["CSV escaping verified", "Current filter honored", "Targeted tests pass"],
      "maxAttempts": 3
    },
    {
      "id": "review-export",
      "role": "review",
      "dependsOn": ["export-csv"],
      "instruction": "Check the saved patch and verify the targeted test evidence.",
      "acceptance": ["Verified saved patch", "Review evidence recorded"]
    }
  ]
}
```

For a manuscript, choose `manuscript` and use chapter and continuity tasks. Pin the originals and author decisions in the brief. Add an assembly task and a final counted manuscript task to the graph. Mode `both` permits code and prose tasks in a single project.

## Start or resume the worker

Use Node 22 or newer and a dedicated working copy. Configure the private `NATHAN_RUNNER_URL` and `NATHAN_RUNNER_TOKEN` in the host environment. The token matches the deployed Worker secret `RUNNER_TOKEN`. For a long-running worker, use a durable host or container with the working copy and journal mounted persistently.

```json
{
  "jobId": "atlas-preview-01",
  "root": "atlas",
  "cwd": "/absolute/path/to/atlas-workspace",
  "journal": "/absolute/path/to/persistent/private-journal",
  "adapter": "node",
  "args": ["/absolute/path/to/hive/project-runner/codex-adapter.mjs"],
  "roles": ["build","review","integrate","verify"],
  "pollMs": 5000,
  "taskTimeoutMs": 900000
}
```

```sh
node hive/project-runner/runner.mjs submit plan.json
node hive/project-runner/runner.mjs run settings.json
node hive/project-runner/runner.mjs status atlas-preview-01
```

The included adapter requires a working Codex CLI login on the runner host. A custom adapter reads the task packet on standard input and prints one JSON result. Save the artifact in the workspace and return its relative path. The runner computes its SHA-256 and checks dependency hashes before it executes a task. Keep accepted artifacts stable and reachable for downstream workers.

```json
{
  "outcome": "accepted",
  "evidence": {
    "artifact": {"path": ".nathan-artifacts/atlas-preview-01/export-csv/1/changes.patch"},
    "checks": [{"name": "Targeted tests", "result": "passed", "evidence": "actual test output or log reference"}]
  }
}
```

A result can be `retry` or `blocked` with an evidence object containing a reason. An optional `stopAt` ISO timestamp stops new claims by that process. An in-flight task can finish and checkpoint. The dispatcher uses bounded task timeouts and the plan's attempt limits. After stopping, rerun the same command and settings, adjusting `stopAt` as needed.

Use one runner per writable working copy. For parallel isolated worktrees, share immutable artifacts at matching relative paths or use a coordinated store through a custom adapter. The API accepts plans with up to 500 tasks and 512 KiB of JSON. Larger programs can use multiple milestone plans.

## Cloudflare deployment

1. Apply `schema.sql` to the dedicated project-runner D1 database.
2. Deploy `worker.mjs` as a module with that database bound as `LEDGER`.
3. Configure `RUNNER_TOKEN` as an encrypted Worker secret. Only the liveness route is public.
4. Verify `GET /healthz`, then submit a small authenticated plan with a build and review.

Run the local acceptance checks with `node --test hive/project-runner/runner.test.mjs`. The tests exercise duplicate claims, stale leases, dependency blockers, and recovery after an artifact was saved and a completion connection was interrupted.
