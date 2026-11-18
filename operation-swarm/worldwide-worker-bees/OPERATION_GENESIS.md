# OPERATION GENESIS — Worker Reproduction, Lineage & Nursery

Original Nathan AI module proposal: workers may clone their configuration, combine capabilities from two compatible parents, train offspring and specialize. These are **software agents**, not biological entities.

## Reproduction modes
1. CLONE: copy version-pinned worker configuration into a new identity; no shared mutable secrets.
2. CROSS: derive a child from two parent role manifests; intersect allowed permissions, union compatible skills subject to policy review.
3. MUTATE: sandbox experiments on prompt, workflow or adapter configuration; preserve parent originals.
4. TEACH: parents provide approved training examples, tests and feedback; provenance retained.
5. GRADUATE: child enters active roster only after test receipts, quota check and approval.
6. RETIRE: revoke child execution grants without deleting lineage history.

## Family tree
Every worker records immutable `worker_id`, `name`, `family`, `generation`, `parent_ids`, `birth_job_id`, `genome_hash` (configuration hash), `skills`, `capability_provenance`, `status`, `training_receipts`, `evaluation_receipts`, `quota`, `permissions`.

## Nursery lifecycle
`PROPOSED -> SANDBOX -> TRAINING -> EXAM -> QUARANTINED|APPROVED -> ACTIVE -> RETIRED`

## Reproduction constraints
- Default offspring are inert registry entries, not active compute.
- No permission inheritance by default; capability inheritance does not grant access.
- Global and per-family population limits, maximum generation depth, spawn rate limit, budget, TTL, and kill switch.
- Two-parent consent/compatibility and provenance checks.
- No self-propagation across accounts, machines, networks or repositories without owner authorization.
- No unrestricted recursive spawning, stealth persistence, security evasion, or secret copying.
- Training may use only licensed or authorized material, with privacy filters.
- Immutable source archive; reversible activation; append-only audit receipts.

## Placement
HIVE: approved active workers and deployment.
ANT HILL: mating/combination, nursery, training, tests.
CATACOMBS: family tree, source genomes, training evidence and original records.
THE THINKER: exam, permissions and rollback.
Pinky & Brain: novelty exploration + deterministic verification.

## Prototype implementation order
1. `genesis.schema.json` for role genome and lineage.
2. SQLite/D1 tables: workers, parent_links, spawn_requests, nursery_tests, approvals, audit_receipts.
3. Deterministic local `clone` and `cross` functions with explicit quotas.
4. Simulation of growth, generations, skill diversity and resource costs.
5. Integrate with Operation Swarm scheduler only after staged security tests.

**Status:** Architecture specification, not live self-replicating agents.
