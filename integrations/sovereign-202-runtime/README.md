# Sovereign 202 runtime — additive implementation
This is new source code, **not yet deployed**. Existing 202-unit IDs remain in `integrations/nathan-mind-101-workers-101-bots.json`.
- A single Durable Object serializes append-only provenance writes, avoiding a D1 last-row race.
- Each bot job has independent persisted scheduling and next-due time; alarms wake a bounded set of due jobs. No 1ms real-time guarantee.
- Alarm jobs only calculate local verification hashes; no external posting, scraping, deletion, replication or unauthorized actions.
- All gateway routes require a long random AUTH_TOKEN, configured outside GitHub. The response deliberately does not imply successful deployment.
- The supplied sample's `ctx.waitUntil(botStub.scheduleBotCycle(...))` is not a supported remote Durable Object RPC shape without an explicit public RPC method. This implementation uses `stub.fetch`.
- The original sample's D1-to-R2 backup, MCP endpoint, workerd portability, emergency wipe, social publishing and 101 distinct bot implementations are **not yet built**; these require independent implementation and tests.
- Secrets and provider-specific services must be replaced/adapted for self-hosting; portability is a goal, not verified zero-code migration.
- Do not deploy until TypeScript check, security review, schema tests and secret setup succeed.
