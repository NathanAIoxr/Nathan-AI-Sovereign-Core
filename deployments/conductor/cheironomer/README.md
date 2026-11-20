# The Grand Unified Cheironomer

Nathan AI’s Cheironomer connects the existing sparse Holding Zones, the Conductor’s TIME Durable Object, the private Holding Vault provenance graph, and the TAP THAT command deck. The virtual address space is 126,732,000,000 identities. D1 materializes an identity when operators approve that identity’s manifest.

## Control and provenance

- **1 + 1 = 2.** A signed-in operator proposes a normalized command and receives an ALIEN SHA-256 digest. A second Cloudflare Access identity supplies that digest before NEILA admits the operation. SQLite serializes approval through `sibling_hold`. Proposals expire after ten minutes.
- **1 − 1 = 0.** KILL advances the Durable Object brake generation. It blocks new commands and cancels unapplied queued commands from earlier generations. An operation already admitted to the commit stage completes its idempotent projection. KV mirrors the authoritative brake. ARM takes two identities.
- **TIME and EMIT.** The named Cheironomer object uses a ten-second alarm and a one-minute integrity review. It writes forward and reverse SHA-256 seals to D1 and R2. The `cheironomer/seals/` prefix has seven-day Bucket Lock. The standard Tabor Train Worker relays EMIT_BUS to the dispatch Conductor with a dedicated encrypted key. It acknowledges only after the receipt commits and uses a dead-letter queue. The existing minute Cron wakes TIME, and Durable Object alarms run the ten-second cadence. The existing 15-minute ZoneClock is independent.
- **Readers.** The three roles consume Holding Vault provenance in bounded pages. The existing GitHub and Cloudflare readers populate that graph. A terminal-root label requires a completed static source scan with no detected outbound reference. Outside links stay recorded as boundaries.
- **Voice and telemetry.** Voice-to-Vault uses Whisper and Llama. The transcript and extraction stay private and wait for dual proof. Sensor JSON can be proposed from the authenticated operator route. TAP THAT and TWEEZER-OS tiles record gesture events. Audio files are accepted up to 1 MiB. Inspect the canonical proposal and verify its digest in the operator deck before sending the second proof.
- **DNS.** `batch_zones.sh` accepts 1–10 registered, owner-authorized domains. It stages pending zones, applies Full (strict) to pending zones, and emits a HOLDING registration payload. An optional origin record in the pending-zone manifest stages Orange Cloud proxying, the Tabor Train holding relay route, and a cloned owner Access policy. Nameserver delegation and live routing evidence are required before promotion. The verifier requires an account-scoped DNS read credential, checks the active zone, apex Orange Cloud record, Tabor Train holding relay route, and Access application. No placeholder hostname is submitted to the provider.
- **Recovery.** The watchdog brakes when the last sealed D1 event and R2 object disagree. Time Travel is an explicit command against an isolated recovery database. It does not restore the shared Conductor ledger.

## Deployment stages

Provision existing account resources, replicate and clone source in the monorepo, build and bundle with Wrangler, migrate D1, inject encrypted credentials, dry-run, deploy, canary-test health, cut over, promote eligible domains, activate, bind, purge selected domain URLs when necessary, and wake TIME. The live HTTPS deck is:

https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/cheironomer/

`operator/` uses Cloudflare Access. Both approval identities must be entitled by the Access policy. Register an additional operator through Access when needed.

```sh
bash deployments/conductor/cheironomer/provision.sh
bash deployments/conductor/cheironomer/deploy.sh --dry-run
bash deployments/conductor/cheironomer/deploy.sh --activate
```

The GitHub workflow runs zone-branch checks, release from main, and an explicitly dispatched fallback HTTP pull drain. The dispatch Worker producer is bound to `nathan-ai-cheironomer-events`. The queue receives a TIME canary every five minutes. Git credentials stay encrypted. Voice records stay in D1. The `export-voice-proof` dispatch and main-branch Cheironomer changes run the same OIDC proof export. It uses the GitHub Contents API to publish up to 1,000 approved digests and receipt timestamps. An empty vault leaves the repository untouched.

Use `tunnel.sh` on hardware you manage with its authorized Cloudflare Tunnel name and configuration. It validates local ingress and starts the named tunnel.

`batch_zones.sh domains.txt --dry-run 1` previews the first ten registered domains without credentials. `--stage` uses the configured account, applies Full (strict) and Always Use HTTPS to pending zones, records nameserver and route evidence in D1, and seeds the per-domain `ZONE_STATUS:` KV key. An owner JSON manifest can supply origin records and an Access policy source. The command returns a registration payload for the dual-proof deck. Existing active zones remain under their current operator workflow.

The native relay requires both a LIVE per-domain KV value and a LIVE D1 decision from the unpaused Conductor before passing a managed route to its origin.

## Verified receipts

- The operator-only `risk/gate`, `risk/status?id=…`, and `risk/settle` routes model a simulation. They accept finite base-unit inputs at six decimal places and enforce a 0.025 fee-adjusted probability-gap hurdle. That gap measures probability points. No connector places a wager, transfers funds, or controls mining hardware. Simulated intents lapse after ten minutes, and the watchdog appends their expiry receipts.
- Voice approval writes the transcript and a sealed provenance row together. Each GitHub export verifies the stored transcript against both provenance hashes and publishes approved digest metadata. `operator/voice/text` accepts text through the same private dual-proof path.
- The DNS relay rechecks the canonical provisioning receipt and the sovereign decision that authorized each LIVE route. Failed integrity checks quarantine the domain. The relay strips inbound `X-Conductor-*` headers, and a configured per-domain `CHEIR_ORIGIN_KEYS` entry signs live origin requests. The origin must use `verifyOriginRequest` with an atomic nonce-consumption store. The 30-second signature binds the destination hostname, method, path, query, body digest and nonce. Forwarding requires an installed key.
- D1 triggers stop ordinary SQL UPDATE, DELETE and REPLACE on verified ledger rows. Infrastructure administrators with schema or restore privileges control those D1 safeguards. Previously sealed R2 audit records supply separate evidence.
