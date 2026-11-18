# Tabor Federation Pipeline

[Live bindings and limits](https://tabor-federation-pipeline.nathantaboract.workers.dev/health)

A Cloudflare account user publishes a fixed task to the existing `tabor-federation-pipeline` queue. The consumer reserves one daily admission in the SQLite-backed Durable Object and starts the `FederationPipeline` Workflow using the application job ID. A repeated message for that ID retrieves the same reservation or acknowledges its completed receipt. On dispatch errors, the queue retries three times and sends exhausted deliveries to `tabor-federation-pipeline-dlq`.

| Task | Steps |
| --- | --- |
| `federation-memory-check` | Check the federation binding, generate one short status note, embed the fixed fixture, write it to Vectorize, and verify the cosine match. |
| `federation-fp64-check` | Run the existing Sovereign Core's 16-shard FP64 workload, validate its digest and deterministic checksum, generate one short status note, embed the fixed verified metrics, and verify the namespaced Vectorize match. |

The Workflow commits a SHA-256 receipt to the coordinator. Retrieve it at `GET /api/receipts/<job-id>`. The receipt records a computation and software checks, with separate fields for the generated note and the Vectorize match. It includes numeric reference metrics alongside the model's summary. The FP64 workload measures a deterministic distributed calculation, and the receipt records `comparable_hpl: false`.

## Queue publishing

Send this body as JSON through **Compute > Queues > tabor-federation-pipeline** or through the authenticated Cloudflare Queue Push Message API. Use a new ID for each intended run. IDs are lowercase, hyphenated strings of 8–48 characters.

```json
{"id":"fp64-check-example-01","task":"federation-fp64-check"}
```

For the API, put that object in `body` and set `content_type` to `json`. Cloudflare account access authorizes queue publishing. Public routes expose only health and receipts for these fixed tasks.

## Usage controls

- Global across this pipeline, 12 unique admissions and 24 Workers AI calls per UTC day. The coordinator reserves an inference slot before each model call. It also limits each job ID to one generation and one embedding attempt.
- The consumer runs one batch at a time with one message per batch. Ordinary transient Workflow steps have finite retries. The Vectorize check retries while an asynchronous write becomes visible.
- The queue accepts operator submissions. The Worker has no recurring trigger. Queue delivery and repeated polling can still count toward provider usage.
- The application's quotas apply to this pipeline. Cloudflare's Billing > Spend Management limit covers Workers requests and CPU charges across the account, with a delay before enforcement. Durable Objects and other products have separate billing. [Cloudflare spending limits](https://developers.cloudflare.com/workers/platform/spend-management/)

## Verify and deploy

Run `node --test pipeline.test.mjs` here. Use the pinned Wrangler under `../../sovereign-hub/cloudflare/node_modules/.bin/wrangler` to deploy this configuration onto the existing resources. The coordinator's deployed SQLite migration tag is `v1`. The queue and dead-letter queue, Vectorize index, federation service, and Sovereign Core service are existing account resources.
