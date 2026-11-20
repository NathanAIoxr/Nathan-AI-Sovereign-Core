# TWEEZER-OS · TAP THAT
Staging project for zone/tweezer-tap-os.

- TIME uses a ten-second slot and a minute cron to bootstrap or recover the Durable Object alarm. Scheduling is best effort. A missed slot is visible as a gap.
- EMIT commits events and outbox entries atomically, publishes under the same event ID, and deduplicates consumption in D1. Queue send and sent receipt cannot share a transaction, so duplicate delivery is expected.
- ALIEN runs schema, smoke and manifest checks. NEILA reruns those checks in reverse order. Each result has an R2 evidence record attached to a Worker version and run. A passing rehearsal aids release review.
- TAP THAT ships an iPhone-friendly control board and a ledger of simulated commands. Cartridge tiles are a rehearsal interface. The Big Red Button persists suspension in the Durable Object. Resume re-enables event generation and flushing.

## Verify and configure
Run `node test.mjs` with Node 24. Tests use SQLite and local doubles for Cloudflare bindings.
The GitHub workflow runs the same checks for relevant pull requests or on dispatch. It uses read-only repository permissions.

The named staging D1 database, R2 bucket, queue, and dead-letter queue exist. Both SQL migrations were applied through the D1 API and the seed was verified. If adopting Wrangler migrations on this database, reconcile its migration history with the applied schema first. Cloudflare rejected creation of the staging Worker because the account reached its 500-Worker limit. Once capacity is available, set the ZONE_CONTROL_KEY Worker secret and configure an authorized staging route for the board.
The health/status output exposes the latest heartbeat, outbox count, brake state, and latest audit. The board shell can be served without a credential. All its API requests require the staging operator credential.

The release switch is a reviewed GitHub change after staging evidence exists. Platform-side staging deployment, end-to-end queue execution, and the production promotion still require verification. The current package implements fictional game events, no physical drivers.
