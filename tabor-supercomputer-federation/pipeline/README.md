# Tabor Federation Pipeline

This Worker connects the existing Tabor Supercomputer Federation to authenticated queue intake, a SQLite-backed Durable Object, a native Cloudflare Workflow, Workers AI, and a dedicated Vectorize index. Existing Workers and queues have their own deployments.

The intake accepts only JSON with a unique `id` and `task: "federation-memory-check"`. Use the Cloudflare Queues dashboard or an API identity with queue send permission. The only public HTTP route is `GET /health`, which reports binding presence and the pipeline's configuration. There is no public job submission or inference route.

The consumer creates a Workflow with the job ID as the instance ID. If the message is redelivered and the instance already exists, the consumer acknowledges the duplicate. A failed handoff is retried up to the queue's configured three retries, then moved to the dead-letter queue. Failures after handoff are visible in Workflow history.

The coordinator admits up to 12 unique runs per UTC day and stores one receipt per accepted run. The fixed workflow checks the federation, requests at most 48 generated tokens, embeds one fixed test document, upserts one stable Vectorize record, verifies the query result, and stores a SHA-256 receipt. AI steps have no automatic retry. Index visibility is retried within the workflow step. The pipeline does not use private archives and has no recurring trigger.

## Deploy and inspect

- Create the intake and dead-letter queues named in `wrangler.toml`.
- Create the Vectorize index with 384 dimensions and cosine distance before deploying.
- Run `node --test pipeline.test.mjs` and deploy using `npx wrangler deploy` in this directory.
- Send a JSON message such as `{"id":"verify-20261118-01","task":"federation-memory-check"}`.
- Inspect the Workflow by its exact job ID in Cloudflare. A verified output contains the federation health check, model summary, vector match, mutation ID and digest.

The daily admission limit applies only to this pipeline. Per-invocation Workers CPU is configured to 1,000 ms. An account spend policy is separate. Cloudflare may bill components independently and usage enforcement may lag. Verify the account's existing settings and choose explicit thresholds before enabling account-wide usage blocking.
