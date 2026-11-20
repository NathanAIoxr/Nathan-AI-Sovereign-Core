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

## Edge runtime for TAP THAT and TWEEZER-OS

- TIME uses a ten-second slot and a minute cron to bootstrap or recover the Durable Object alarm. Scheduling is best effort. A missed slot is visible as a gap.
- EMIT commits sealed events and outbox entries in the same D1 transaction. The queue consumer verifies SHA-256 seals, batches idempotent receipts, and retries failed deliveries. It archives dead letters in private R2. Optional TAP SIM webhooks use a single configured HTTPS URL, an HMAC signature, and an event idempotency key. A subscriber must deduplicate by that key.
- ALIEN runs schema, smoke and manifest checks. NEILA repeats the checks in reverse order, linking its first result to the final ALIEN result. Each event has a paired SHA-256 Merkle root linked to the previous event root plus a private write-once evidence object. Apply R2 Bucket Lock to the `neila/` prefix before accepting events.
- TAP THAT ships an iPhone-friendly control board. Its Durable Object accepts hibernating binary WebSockets. The motion permission button translates local acceleration into a simulated flinch signal. Raw accelerometer readings stay in the browser. Cartridge input falls back to HTTP with the same event ID. Vibration depends on browser support. The board controls fictional events in the simulator.
- The Big Red Button holds the zone immediately. When the app switch is live, two missed 10-second heartbeats or a failed NEILA check put the switch in `RESTORE_PENDING` and request a D1 restore. The private rollback receipt is retained outside D1. An alarm detects a gap when the platform next invokes the Worker. Scheduled alarms and mobile network latency are best effort.

## Verify and configure
Run `node test.mjs` with Node 24. Tests use SQLite and local doubles for Cloudflare bindings.
The GitHub workflow runs the same checks for relevant pull requests or on dispatch. It uses read-only repository permissions.

Use the resources in `wrangler.edge.toml` and apply the D1 migrations before starting TIME. Set `ACCESS_AUDIENCE` to the Access application's audience and configure its policies for the authorized operators. Automated clients can enter with an Access service policy and only use status, socket and simulated tap operations. `ZONE_ADMINS` is a comma-separated allowlist of human Access identities. The legacy `ZONE_CONTROL_KEY` is available for staging API access and carries no launch authority. Browser access uses the Cloudflare Access session.

The app phase advances only after a current-version ALIEN/NEILA pass, a fresh heartbeat, two different Access admins approving within ten minutes, and an actual D1 Time Travel bookmark. Set the encrypted `D1_TIME_TRAVEL_TOKEN` to enable that path. The database target is fixed in the deployment bindings. `ZONE_KV` mirrors the exact pre-launch bookmark and the Durable Object holds the authoritative switch state. The switch controls this project's runtime phase. DNS and promotion of the staging Git branch are separate release actions.

Set `EMIT_WEBHOOK_URL` and encrypted `EMIT_WEBHOOK_KEY` together to connect a subscriber. The runtime reports queue receipt counts at `/health` and authenticated run details at `/status`.

When standard Worker slots are full, deploy `zone-tweezer-tap-edge` to `tweezer-tap-os-holding` and use `src/relay.mjs` as the existing Train Worker's entrypoint. The relay exposes the fixed `/tabor-sites/tweezer-tap-os` path, accepts the two queue batches and minute cron, and forwards them over the namespace binding. Set the same encrypted `RELAY_KEY` on both Workers. The relay has no staging D1, R2, KV, or Durable Object bindings. It passes through the existing Train routes.

[Open the Access-protected rehearsal board](https://tabor-train-operations.nathantaboract.workers.dev/tabor-sites/tweezer-tap-os/).
