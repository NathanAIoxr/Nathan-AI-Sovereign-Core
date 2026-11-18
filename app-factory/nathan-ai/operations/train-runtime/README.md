# OPERATION RAM × OPERATION OCTOPUS × OPERATION CONVOY

## The Tabor Train of Truth

**The train is Nathan Tabor. The command engine is Nathan AI.** The operational roster includes DOG AI, REAPER AI, Santa Claus AI, Miss Stacy Clause AI, 007 @Will AI, and ACT AI. The Misfits and Minds are creative project roles, not claims of synthetic consciousness, human identities, or autonomous system access.

This additive, independent Cloudflare Worker is a **live, bounded planning service**. It does not run untrusted code, execute arbitrary shell commands, automatically replicate, modify another repository, delete files, or reach other people's systems. There are no privileged bindings, API keys, or data connectors.

### What actually executes

1. **RAM**: inspect owner-provided task titles, normalize whitespace, remove duplicate task titles, classify into authorized lanes and report rejected entries.
2. **OCTOPUS**: organize accepted tasks across eight visible arms (intake, repair, defense, language, library, creative, delivery, audit).
3. **CONVOY**: group accepted tasks into reviewable batches of at most four tasks. Dispatch is false until a separately authenticated, explicitly approved integration is built.

### API

- `GET /`: service introduction
- `GET /health`: runtime health metadata
- `GET /roster`: full team and role boundaries
- `GET /operations`: RAM, OCTOPUS, CONVOY specifications and eight channel roles
- `GET /demo`: complete simulated in-memory mission
- `POST /run`: validates up to 24 owner-submitted tasks and returns the three-step plan

Example request:

```json
{
  "tasks": [
    {"title": "Repair an authorized Cloudflare Worker"},
    {"title": "Restore the Library of Tabor index", "lane": "library"},
    "Verify the Tabor Train release evidence"
  ]
}
```

All work items are in request memory only; no external tasks are created, scheduled, dispatched, or duplicated. Do not submit passwords, personal data, source material intended to remain private, or privileged instructions to this public endpoint.

### Provenance and boundaries

The original 13 creator-authored operations are preserved unchanged in [the historical register](../operations.json) and [the original source text](../SOVEREIGN_STACK.md). Their old `documented_not_deployed` status continues to describe **those original conceptual specifications**. This new Worker is an additive executable interpretation of *three* safely scoped concepts, and does not prove that historical operations ever ran.

The historical terminology about smashing access controls or overwhelming monitoring is **not implemented**. RAM means authorized bottleneck review; OCTOPUS means data coordination; CONVOY means bounded review batching.

The service is intended for deployment as `tabor-train-operations` with JavaScript module `worker.mjs`. To run its tests locally from the repository:

```bash
node --test app-factory/nathan-ai/operations/train-runtime/worker.test.cjs
```

Deployment note: a Cloudflare script may be uploaded and have a 100% active version without its public route being externally verified. Confirm health via the assigned workers.dev hostname and verify GitHub commit and CI results before wider rollout.
