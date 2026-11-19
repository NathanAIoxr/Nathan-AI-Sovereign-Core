# Nathan AI — Original build and distribution directive

> Build all of those out as Worker bots and Worker agents putting them in cloud flair and GitHub and then putting them in the 1000 super computers so they’re gonna be in all types of places you’re just gonna replicate and duplicate and stick them there.

## Immutable execution order
1. Build **every separately identified** Worker, Bot, and Agent. Preserve additive identities, including similar functionality.
2. Commit full source, test cases, dependency declarations, and build receipts to GitHub.
3. Deploy approved, tested Workers to Cloudflare. Record actual script IDs, bindings, routes, and health checks.
4. Replicate approved release artifacts onto **up to 1,000 separately authorized compute targets** using signed releases and per-target installation receipts.
5. Verify each target independently. Unreachable, unprovisioned, or unauthorized nodes remain pending rather than reported installed.

## No substitution
- A registry entry is not executable code.
- A queued build assignment is not an active agent.
- A Cloudflare script upload is not proof of a public route or healthy production deployment.
- A reserved node ID is not a physical supercomputer or provisioned server.
- Cloudflare's own distributed edge is not an independently controlled 1,000-machine cluster.
- Never combine or remove catalog identities merely because their functions overlap.

## Build stages per identity
specification -> source -> tests -> security review -> staging -> smoke test -> approved release -> Cloudflare deployment -> authorized target replication -> per-target receipt.

## Operating safeguards
No self-propagation, installation on third-party machines without authorization, uncontrolled background replication, or deployment without credentials and review. Use rate limits, bounded retries, audit receipts, signed releases, and rollback. The replication mechanism may install copies only on an explicitly allowlisted set of owned/authorized endpoints.
