# The Nathan Tabor Autonomous Sovereign Engine

[Live health](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/api/node-template/health) · [Live node contract](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/api/node-template/contract) · [Lasso of Truth release gate](../release-gate/)

**Architect** John "Nathan" Tabor

A shared receipt template for Nathan AI and its registered AI and compute nodes. It reads each node's identity from the existing Worker/Bot/Agent registry, fleet catalog, Sovereign Core, or compute registry at credential issue and receipt intake.

| Loop | Operation | Evidence a node can attach |
| --- | --- | --- |
| Self-Populating | `ingestion` | A normalized import manifest, source digest and item counts |
| Self-Creating | `creation` | A change proposal, candidate artifact or draft PR |
| Self-Healing | `ci-repair` | An exact GitHub run, checked-out revision and proposed change |
| Self-Testing | `defensive-validation` | Local unit and input-validation results on the candidate |
| Self-Optimizing | `benchmark` | Same-input timing, memory and write-meter comparisons |
| Self-Documenting | `provenance` | An audit record tying inputs, outputs and revision together |

Use **1 + 1 = 2** to build the candidate, **1 - 1 = 0** to discard a rejected staged artifact, **1 × 1 = 1** to integrate it with its registered project, and **1 ÷ 1 = 1** to verify its evidence. Source files and release history remain available for reproduction. A receipt authenticates a registered reporter and binds its declared outcome to a file digest. The existing Lasso gate governs promotion to live destinations.

## Connect a node

1. With the Cheironomer Cloudflare Access operator session, POST `{"source":"backend","node":"workers-ai-default"}` to `/cheironomer/operator/node-template/credential` under the Conductor mount. Use the source and ID from the relevant registry. The credential is scoped to that pair and expires after one hour.
2. Use an encrypted runtime secret for the returned bearer credential. From this directory, call the same template from Node.js, the Worker, or an agent wrapper. The example reads a local evidence file and submits only its SHA-256 digest.

```sh
node submit.mjs backend workers-ai-default intake-001 provenance verified evidence.json
```

With `NATHAN_NODE_TOKEN` in the environment, the client submits the receipt. Without it, it prints the canonical JSON for staging. Keep raw chat, voice, logs and source documents in their authorized source stores. Set a stable event ID and reuse it for exact retries. A different receipt for the same event ID returns HTTP 409. An accepted R2 overflow receipt returns HTTP 202 and its object key. Once D1 recovers, an authenticated operator can POST `{"key":"…"}` to `/cheironomer/operator/node-template/replay`. D1 enforces append-only records after admission.

## GitHub and deployment

The tested backend adapters use the eight live registry tables through three fixed D1 bindings. The health endpoint checks schema readiness without scanning registry rows. The existing Conductor Worker and its other routes share the deployment. Set `NODE_TEMPLATE_SIGNING_KEY` as an encrypted Cloudflare binding and apply `0005_node_template.sql` to the existing Conductor ledger before deployment.

GitHub Actions stages a bounded repair input when the owned Six Dogs CI or Zeros and Ones workflow fails. The artifact contains the exact run identity and SHA-256, with `review-required` status. A coding agent can use it in a clean worktree, run the owning project's existing checks, and record a candidate with this template. The Lasso gate and the Conductor's deployment workflow handle live promotion. Use the public health endpoint and the GitHub run to verify a rollout.

D1 batching reduces round trips. Budget using the platform's actual rows-written metric and use backpressure, per-project limits and the receipt overflow path. [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) · [D1 rows-written guidance](https://developers.cloudflare.com/d1/observability/find-expensive-queries/)
