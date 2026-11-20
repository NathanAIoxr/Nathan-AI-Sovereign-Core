# TWEEZER-OS × TAP THAT · TIME / EMIT · ALIEN / NEILA

This holding zone coordinates the two standalone apps through synthetic cartridge rehearsals. The current runtime is `src/runtime.mjs`, with its single-file `stage-board.html` staged in R2. The original prototype, its seed migration and its test still run against the original tables. Migration 0003 adds the verified hash chain and its receipt tables independently.

## Staging stack

| Component | Resource |
| --- | --- |
| Staging branch | `zone/tweezer-tap-os` |
| Dedicated Cloudflare namespace | `tweezer-tap-os-holding` |
| Conductor Worker | `zone-tweezer-tap-conductor` |
| Durable Object | `MasterConductor` |
| Ledger and track warrant | `zone-tweezer-ledger-db` |
| Holding mode and emergency brake | `zone-tweezer-config-kv` |
| EMIT Queue | `zone-tweezer-events-q` |
| Queue dead-letter destination | `zone-tweezer-events-dlq` |
| Private cartridge and audit store | `zone-tweezer-artifacts` |
| Private alias | `tweezer-tap-os.test` |

TIME coalesces Cron and alarm signals into one UTC heartbeat per minute. A ten-second Durable Object alarm checks the virtual watchdog, resumes the outbox and continues TIME once armed. The D1 warrant and KV holding mode gate commands. Two distinct authenticated operators acquire the hold interlock in strongly consistent Durable Object storage. The emergency button and simulated flinch limit stop the active cartridge. The KV brake stops further simulation on the next authority check. The runtime's integrity fault latches the brake.

ALIEN executes deterministic transitions. NEILA replays the reducer and reconstructs each previous state from its undo record. Rehearsals also verify reverse continuity between all 60 measures. EMIT projects an append-only, hash-linked D1 ledger and content-addressed private R2 evidence from the transactional Durable Object outbox. Queue retries may duplicate a message. The consumer verifies the evidence and records one logical delivery receipt per ID.

## Operation

- `GET /` displays the single-file board on the internal alias. `GET /status` reports the warrant and simulation state. `POST /tap` uses `{id, trigger, mission}`; retries reuse the same ID.
- Configure distinct Cloudflare Worker secrets `OPERATOR_A_KEY` and `OPERATOR_B_KEY` for operator access. `SENSOR_KEY` enables the staging-only `POST /sensor` input for simulated flinch events. The board keeps an operator key only in the current input field.
- An optional staging webhook is configured through `REHEARSAL_WEBHOOK_URL`, `REHEARSAL_WEBHOOK_HOST`, and `REHEARSAL_WEBHOOK_KEY`. The subscriber validates the exact canonical request-body HMAC and deduplicates by the event ID. Delivery retries are possible.
- On a standard Worker deployment, use the checked-in Wrangler config for the every-minute UTC Cron Trigger and automatic Queue consumer. For Workers for Platforms, provide a private platform clock driver and a supported Queue consumer. Uploading a Worker to a dispatch namespace by itself neither arms the alarm nor attaches a Cron Trigger or a consumer.
- Run `node --test test/*.test.mjs` with Node 24 from this directory. The suite covers time deduplication, exact reverse order, immutable ledger writes, role isolation, receipt deduplication and recovery from an EMIT error.

## GitHub main-line switch

Open one promotion PR from `zone/tweezer-tap-os` to `main`. After the branch checks pass and an independent reviewer approves its exact SHA, a maintainer can push a tag named `launch/tweezer-tap-os/<staged-sha>-<main-sha>` at the staged commit. Both identifiers are full 40-character SHAs. GitHub Actions assesses Measures 61–72, reverses all 72 measures, verifies fresh TIME and EMIT evidence in Cloudflare D1 using the repository Cloudflare credentials, rechecks the branch heads, and requests the exact-head PR merge through GitHub. The switch is scoped to this PR and release. The staging board has no production write path.

## Deployment verification

The original schema remains available for the original tests. Migration 0003 adds `conductor_evidence`, `conductor_delivery_receipts`, and `conductor_webhook_receipts`. The current dispatch Worker uses these tables and leaves the original `extraction_log` schema intact. The staging database retains the 12 original seeded TAP tiles.

Cloudflare returned error 10037 for the standard Worker because the account is at 500 scripts. The private dispatch deployment has no attached Cron Trigger. Cloudflare also returned error 10007 when attaching it as a direct Queue consumer. A standard Worker slot or an authorized platform driver and compatible Queue consumer is required to start the verified recurring TIME/EMIT run. The control board remains on the internal staging alias and its operator secrets are provisioned separately.

## D1 delivery fallback

Cloudflare deployment `e00f2776157c438982dd68ba484547a8` runs as `zone-tweezer-tap-ledger` in `tweezer-tap-os-holding`. This companion uses the original staging ledger and `DELIVERY_MODE=d1`. A single D1 transaction records local delivery and acknowledges the corresponding outbox row. This mode performs ledger delivery without sending Queue messages or external webhooks. The hash-chain Conductor remains a separate deployment.

The fallback source is `src/conductor.mjs` and its verification command is `node test.mjs` with Node 24. Authenticated `POST /clock` bootstraps the fallback's own Durable Object alarm once a dispatch entry point is configured. The upload is confirmed. Public ingress, live ticks, and end-to-end delivery still require verification.
