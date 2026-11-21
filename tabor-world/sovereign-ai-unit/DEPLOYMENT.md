# Nathan AI two-box deployment

Box 0 and Box 1 are separate Workers connected by a Cloudflare service binding. They are logically isolated; not physically separate machines or zero-latency hardware.

## Preconditions
- Existing D1 registry `tabor-database-registry`; apply `box-1-one/schema.sql` to it once before enabling inference.
- Box 1: `AI` binding and optional `CACHE` KV binding. Do not deploy until the `CACHE` namespace exists and is configured.
- Both Workers: same strong `BOX_INTERNAL_KEY` stored as separate Worker secrets; Box 0 additionally requires `SOVEREIGN_KEY`.
- Disable public `workers.dev` and routes on Box 1; verify service binding resolves.
- CI GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
- Deploy Box 1 before Box 0; smoke-test /health and authenticated /compute; inspect D1 receipts.

## Limitations
The example Workers AI inference consumes paid AI resources depending on usage. A KV cache is not RAM. D1 records are durable but not immutable. Model agreement is not proof of truth. Workflows are durable executions, not continuously running 24/7 processes. No automatic uncontrolled agent execution is enabled.

## Existing code status
`box-0-zero/index.js` and `box-1-one/index.js` are implementation drafts. Their secret and KV bindings are not yet configured. They should not be represented as deployed until tests and runtime verification pass.
