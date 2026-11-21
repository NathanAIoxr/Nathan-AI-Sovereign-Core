# Sovereign AI extensions

Implemented source modules:
- `src/consensus.ts`: parallel Workers AI model calls, explicit model failures, and exact-normalized answer agreement. This is **not** semantic consensus or evidence of factual correctness.
- `src/durable-ram.ts`: Durable Object SQLite-backed agent state interface; requires binding and migration.
- `src/workflow.ts`: durable two-step audit Workflow; requires Workflow binding and deployment.
- `schema-v2.sql`: D1 job, model result and R2 artifact metadata tables.
- `../setup.sh`: interactive resource provisioning requests, **not yet executed**.

Remaining integration: attach bindings to main worker, create queue producer/consumer, R2 artifact retention, embedding pipeline and Vectorize query, Zero Trust policy, CI checks, secure token distribution, operational tests. Vectorize is finite and index dimensions must match the selected embedding model. No claim of 24/7 uninterrupted execution or absolute isolation.
