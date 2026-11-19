# Production readiness gates

The D1 controls exist, but this code is not wired into a deployed runtime.

1. Verify Cloudflare Access identity on every admin request. Never trust caller-supplied actor identity.
2. Enforce global pause and per-project HOLD at the job-claiming boundary; all execution paths must honor it.
3. Enforce bounded retries, idempotency keys, timeout budgets and a dead-letter path. Do not retry deployments blindly.
4. Verify GitHub webhook signatures with HMAC-SHA256 and replay protection before any write.
5. Store scoped secrets in Cloudflare Worker secrets / GitHub Actions secrets. Do not use full-account tokens.
6. Separate audit-only from release actions; require explicit approval for production changes.
7. Test D1 migrations, build, deploy, smoke test, and status callback before marking DONE.
8. Add Durable Objects, Queues, R2 retention, Vectorize and Logpush only after verifying resource IDs and bindings. Do not claim WORM without verified retention support.
9. Ensure staging endpoints are protected by Access; database HOLD flags alone are not privacy controls.
10. Preserve each independent project and its own release manifest.

Current default: global paused=1, maximum 10 claims per cycle. No automatic releases.
