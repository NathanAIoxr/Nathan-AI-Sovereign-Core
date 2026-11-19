# Sovereign mesh deployment contract

## Current state
D1 migration 0004 has been applied to existing `tabor-fleet-registry`. Reusable hashing, dispatch claiming and telemetry helpers are committed as source, not deployed into an existing Worker.

## Safety and verification
- A D1 hash chain is **tamper-evident only under an independently anchored root**; it is not immutable by itself. Add verified R2 retention and independently signed Git checkpoints before claiming WORM.
- Durable Objects, Queues, R2 buckets, Access policies and tunnels require explicit provisioned resources and account-level configuration. Do not invent IDs or bindings.
- Telemetry must be authenticated with per-device credentials, replay protection, size limits and schema validation before accepting hardware writes.
- Voice transcripts require user consent and retention controls. Never execute SQL or generated code from raw voice transcripts.
- Dispatch is approval-gated. The helper claims only queued jobs with approved=1, and it does not execute arbitrary commands.
- Use existing deployed Workers and registries rather than creating an unbounded or self-propagating fleet.
- D1 Time Travel is a recovery facility, not an immutable ledger; do not automate destructive rollback without validated backups and approval.
- A holding status in D1 does not protect direct .pages.dev or .workers.dev endpoints. Apply Cloudflare Access to private previews.
- Actual DNS zones require real domains and ownership verification. Zero zones were observed in the connected account.
