# Nathan AI — restoration execution order
Source of truth: RESTORATION_MATRIX.csv. Independent projects stay independent.

## P0 — blockers and source audit
1. Run restoration index validation; fix duplicate or incomplete rows.
2. Verify existing GitHub Actions executions and log failures.
3. Inventory authorized Cloudflare Pages, Workers, D1, R2 and queues.
4. Inspect Cloud Slayer, Fiber Arts, Find the Tabor and OS security sources before any changes.
5. Verify the GitHub↔Cloudflare deploy connection, capacity and rollback.

## P1 — independent builds
Each application gets a distinct source path, project identity, owner, build test, release artifact, Cloudflare mapping and verification evidence. No overwriting another application's Worker or Pages project.

## P2 — archive and research recovery
Preserve exact original quotations, dated provenance and evidence-vs-interpretation. Historical source claims are not running infrastructure.

## Agents
MSP DEAMON: inventory/build/packaging. IT ANGEL: independent integrity/privacy/test verification. WILL authorizes. WHEEL sequences. Challenger reports contradictions. All proposed cloud mutations require resource ownership, authorization, impact and rollback checks.

## Completion conditions
No unit is marked DEPLOYED without live endpoint and health verification. No scheduled workflow is marked RUNNING without observed run. No missing historical project is marked RESTORED without recovered source or a clearly labeled reconstructed implementation.
