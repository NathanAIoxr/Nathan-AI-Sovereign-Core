# Nathan AI Sovereign Ledger v1.0 — Conductor handoff

The original instructions are in [HANDOFF.md](HANDOFF.md). The runtime sources, migration, canonical hash scheme, signing format, and vectors are the supplied versions. The ledger provides tamper evidence for its records. Artifact authenticity requires independent evidence.

| Order | Task | Evidence |
| --- | --- | --- |
| 1 | Install, type-check, run Node and Python suites | Passed with Wrangler 4.166.0, Workers types 5.20261120.1, Node 24.22.3 and Python 3.12.14. 12 TypeScript tests and 11 Python tests passed. Regenerating the vectors produced a byte-identical file. |
| 2 | Local D1 migration and signed requests | Wrangler applied all five migration commands. Worker startup in the workspace failed with `uv_interface_addresses` (system error 1), reproduced by Node's own interface lookup. The reusable integration test runs on an isolated local D1 instance on a GitHub-hosted runner. |
| 3 | Concurrent signed append | Included in the integration test after the signed request and replay checks. See the GitHub Actions job for the HTTP result. |
| 4 | D1 error matching | No match logic changed. The integration test checks the HTTP behavior of duplicate writes and simultaneous appends. |
| 5 | Deploy, remote verify, anchor | The target Cloudflare account listed 500 standard Workers, with no `nathan-ledger` Worker or D1 database by that name. The production binding is still a placeholder. A standard Worker slot and a production D1 binding are pending. |
| 6 | Bulk import | Pending verified deployment and anchoring. |

The first install failed with `ERESOLVE` because the open Wrangler range selected 4.166.0, which requires Workers types v5, while the original manifest required v4. The manifest now declares the compatible pair and includes the lockfile.

The original anchoring workflow also needs attention before activation. It redirects into `anchors/heads.jsonl` without creating the `anchors` directory, runs against the default branch, and masks all `git commit` failures. It has no commit signing setup. Confirm a push to the intended protected anchor ref and independently verify the commit before importing.

Run `npm ci`, `npm run typecheck`, `npm test`, `npm run test:py`, then `npm run test:integration` from this directory. The two workflows under this directory's `.github/workflows` are the supplied standalone repo templates. The parent repository's Sovereign Ledger handoff workflow runs verification only.
