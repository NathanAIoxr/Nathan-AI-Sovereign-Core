# Nathan AI Project Runner handoff

## Resume point

The Cloudflare Worker is deployed with a dedicated D1 ledger. The live write path accepted a synthetic build and then its dependent review. The Node runner saved both artifact checksums and returned a complete job. The unauthenticated job endpoint returned HTTP 401.

- [Project Runner liveness](https://nathan-ai-project-runner.nathantaboract.workers.dev/healthz)
- Hosted deployment probe `deployment-probe-1794947791423`
- [Setup, brief format, and resume commands](README.md)

The proof covers the hosted API, D1 dependency claims, a local adapter process, and completion receipts. The local acceptance tests also cover a duplicate claim, rejection of an expired lease, retry exhaustion, recovery after an artifact save, and a repeated start that reuses the saved plan.

The separate Codex model pilot stopped before it could generate a plan. Codex reported `Read-only file system (os error 30)` while initializing its local app-server state. Use a runner host where the authenticated Codex CLI can write its state directory. Repeat that pilot before assigning a real project. The hosted probe used a deterministic adapter and verifies the runner independently of model access.

## What to do next

| Order | Work | Evidence that closes it |
| --- | --- | --- |
| 1 | Put the included Codex adapter on the intended persistent host and run a small task against a dedicated project checkout. | An accepted artifact with its checksum and an actual model and test receipt from that host |
| 2 | Start the first real project from its brief and approved sources. Supply the working directory, journal, small initial milestone, and review criteria. | Saved plan and a complete build, review, integration, and verification chain for the first milestone |
| 3 | Keep the worker running after the interactive session. Put the Node command under the host's service manager with persistent workspace and journal storage. | Restart the service during a task, then see the same job continue from the accepted state |
| 4 | Add job-wide spend reservations, adapter usage totals, and an operator pause control before commissioning a large run. | Multiple workers respect the same cap, including outstanding calls, and resume without re-planning |
| 5 | Add a private status view for the owner. | The owner can see blockers, attempt receipts, artifact revisions, and per-milestone completion |
| 6 | Connect the approved release service once source and destination are pinned. | Verified preview or production URL, release revision, smoke test results, and rollback reference |

The current deployment uses a pull dispatcher kept on the runner host. If managed Cloudflare orchestration is preferred, a future Workflow can wake the dispatcher or manage its execution steps through the same D1 job and receipt contract.

## Pause and continue

Stop the local process at a task boundary or set `stopAt` in its configuration. Keep the workspace and journal. Use `node runner.mjs status JOB_ID` to locate the active or blocked task and see accepted artifact references. Then rerun `node runner.mjs start SETTINGS.json` with the same brief and journal, or `node runner.mjs run SETTINGS.json` if the plan was submitted separately.

An interrupted claim expires and can be reassigned. The runner reuses a saved accepted result when its task fingerprint and artifact hash still match. If a job is terminally blocked, preserve the prior receipts and submit a follow-up plan for the unresolved work after addressing the blocker.
