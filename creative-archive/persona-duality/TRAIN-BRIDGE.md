# PD-004: Persona Atlas → Tabor Train review bridge

**Status:** implemented, source-compatible offline adapter. **Not** a live connection, worker deployment, or automatic dispatch.

This additive module imports the existing Persona Atlas task registry and emits the exact bounded `{tasks:[{title,lane}]}` payload expected by the original [Tabor Train Worker](../../app-factory/nathan-ai/operations/train-runtime/worker.mjs) `POST /run` route. No external POST is performed. The Tabor Train's original RAM (deduplicate), OCTOPUS (8 lanes), and CONVOY (4-item review batches) remain unchanged. The original Train task IDs are generated from their input positions, so the bridge keeps original `PD-###` identifiers in a separate manifest for traceability rather than claiming the Train's temporary IDs are canonical.

- `buildTrainReviewInput()`: deterministic, validated Train input preview.
- `buildReviewManifest()`: stable source IDs, lane owners, review-only batches, explicit zero external calls and writes.
- All 14 backlog tasks remain pending until independently implemented and verified; the adapter does not change their status.
- Inputs are limited to 24 unique tasks and eight existing Train lanes. No API keys, network access, queue consumers, autonomous bots, or self-replication.

Test with `node --test creative-archive/persona-duality/train-bridge.test.mjs`. This module can later be used by a separately authenticated, owner-approved workflow after review, but no such workflow is authorized by this PR.
