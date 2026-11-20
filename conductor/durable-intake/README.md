# Sovereign Core Conductor intake

This adapter connects two kinds of signals to the existing Two-Sided Conductor Bridge: failed CI runs and owner-submitted build proposals. It provides a queue producer and D1 queue consumer for integration into the existing Worker. It has no public HTTP route.

| Source | Accepted input |
| --- | --- |
| Six Dogs CI and Zeros and Ones | Failed run ID/attempt and full head commit SHA from the existing trusted CI producer |
| Hop In Chatbox and Nathan AI Voice Box | Opaque proposal ID from an authenticated, explicitly submitted draft |

## Connect the existing Worker

1. Apply receipt-table.sql as a reviewed migration on the bridge D1 database. This stores intake receipts alongside the existing sovereign_conductor_events table.
2. Have the existing authenticated producers call enqueueIntake with a Queue binding. Keep logs, prompts and transcripts in their existing access-controlled stores. A receipt means the queue accepted the event.
3. Register projectIntake in the existing Worker's queue handler. Configure retries and a dead-letter queue with retention sized for overnight D1 quota recovery. Alert on backlog age and dead letters. On quota exhaustion, pause the consumer where appropriate and resume after quota recovery. Surface queue unavailability to producers so they can retry with the same input.
4. Use CI receipts to track repair drafts scoped to the failed revision and check. Run the affected workflow, its tests, and the applicable Wrangler dry run in a credential-free checkout. Route owner-submitted build proposals through the same review path. Promote through existing protected deployment environments with the exact checked revision.
5. Record validated artifact hashes and deployment receipts in the existing provenance path. Keep signing and deployment authority in the protected release workflow. The intake hash identifies the event and supports replay deduplication.

A D1 transaction batches round trips. D1 still meters rows written. Start with one authorized account. Register separately authorized targets explicitly, with individual credentials and deployment budgets, when adding accounts.

Run `node intake.test.mjs` from this directory on Node 20 or newer. Tests use Queue and D1 doubles. Validate queue retry, D1 migration and replay in staging before enabling producers.
