# ONE shared Cloudflare foundation

The runnable Cloudflare edition of Nathan AI / ONE's sovereign-box hub. Current anchors are **1+1=2** and **1-1=0**. The historical declarations, existing local implementation and original `tabor-bridge` Worker remain preserved.

**Live hub:** https://one-sovereign-hub.nathantaboract.workers.dev/

**Public integration catalog:** https://one-sovereign-hub.nathantaboract.workers.dev/apps.html

## Ownership and deployment

The deployment is a separate Worker named `one-sovereign-hub`. It uses a SQLite-backed `SovereignHub` Durable Object as the authoritative owner box, D1 for reconstructible diagnostic projections, KV for public assets/configuration, a job queue plus dead-letter queue, and a two-step recovery Workflow. A cron checks health and retries a bounded outbox every six hours. Workers AI is bound but runs only on an explicit owner request.

The owner opens a private one-time setup link in their own browser, completes Turnstile and pairs a generated Ed25519 device key. The private key is nonextractable and retained in that browser's IndexedDB. The setup fragment is removed from browser history before pairing. After claiming, the bootstrap code cannot pair another device. An existing authorized owner can register another public device key through `POST /api/devices`.

This is a software device key; hardware-backed identity and human-assurance providers remain separate integrations. Preserve access to the owner browser or add a separately held device before clearing its storage. Cloudflare account administrators retain control of deployment and recovery configuration.

All private routes require an owner-device signature or an expiring agent capability plus Ed25519 proof. The proof binds the method, exact path/query, raw body digest, timestamp and unique nonce. Tokens are bound to the registered agent public key, owner, audience, scopes, resources and expiry. Nonces are checked in strongly consistent Durable Object SQLite rather than eventually consistent KV. Context also requires a per-key reader grant. Browser requests from other origins are rejected. The shared SDK works for same-origin apps and authorized backend agents; other browser origins need an explicitly designed authorization/relay integration.

Owner pairing was verified against a disposable local Workers runtime. Automatic approval review rejected submitting the actual owner setup credential to a hosted automated browser. No automated production owner pairing was performed. The real owner completes that step in their own browser.

## Functional contracts

- Immutable 0/1 arithmetic anchors and validated half-open ranges.
- Duplicate-key-rejecting JSON parser, safe integer bounds, real ISO dates, grapheme slicing and exact remainder allocation.
- Owner-controlled connector registration, scoped diagnostics and severity-coded faults.
- Context versions, reader grants and expiry.
- Sync receipts, fixed-high-water cursor traversal, durable change history and preservation of both sides of a conflict.
- Explicit owner choices for resolving conflicting local and remote edits.
- Storage-enforced non-overlapping bookings, increasing fencing tokens, atomic booking/event/response commits and safe retry replay.
- Named `cart → shipping → payment → complete` flow transitions with version checks and idempotent commands.
- Agent registration, limited capability issuance, key binding and revocation.
- Issuer signature verification, signed invitation claims and one-use redemption. Trust in an issuer must be established by the owner.
- Allowlisted budget, duration and geometric micro-apps. Camera reconstruction and physical-safety claims require appropriate providers/testing.
- A private browser outbox, offline budget arithmetic, public-only PWA caching and owner-data export.
- Local browser extractive summarization; the private text stays on that device. Explicit Workers AI calls use Cloudflare's cloud.
- Public OpenAPI, action catalog and focused stateless MCP-style JSON-RPC tools.

`/api/export` limits each table to 10,000 rows and reports its total plus a `truncated` flag. Large installations need paginated export or Cloudflare storage backup tooling. An export is not silently represented as complete when it is truncated.

## Recovery and asynchronous work

D1 is a derived operational view. Queue consumers rebuild it from authoritative Durable Object counts and verify its stored revision. Duplicate jobs are safe. Source disagreements halt recovery; no ledger is erased to make a health check green. Failed repairs have a 60-second cooldown and stop automatically after three consecutive failures. Explicit owner verification can retry after review.

The outbox retains job IDs independently of Queue retention, limits each drain to five jobs, and stops after five delivery attempts. The queue uses one consumer, batches of five, three retries, and a dead-letter queue. The recovery Workflow has a concurrency limit of one and two recorded steps: verify/repair the derived projection, then drain the outbox. The owner-facing endpoint permits four recovery starts per day.

Production checks verified a synthetic diagnostic queue job was processed and a management-triggered recovery Workflow completed successfully. These checks used the isolated `deployment-verification` namespace with zero owner records. Production owner data lives in the separate `owner` namespace.

## Free-tier boundaries

No paid subscription or R2 activation was requested. D1, KV, SQLite Durable Objects, Queues, Workflows, Turnstile and Workers AI use their free-compatible capabilities. Billing subscriptions could not be inspected through the OAuth connection, so this does not certify the account's existing billing state.

The plugin's asset-upload flow could not complete the separate upload-token exchange. The current deployment serves public UI assets through the Worker and KV, so UI requests count against the Worker request allowance. Browser PWA caching reduces repeat requests. The checked-in Wrangler configuration also supports native static assets when deploying through an authorized Wrangler/Builds connection; those native static requests have their own free hosting behavior.

Workers AI is limited by the app to five requests per day, 2,048 prompt characters and 128 output tokens per call. Cloudflare's model availability and account-wide neuron allowance also apply. These controls reduce consumption but do not imply that all other account usage is free. Billing and product usage remain visible in the owner's Cloudflare dashboard.

R2 stays disabled. External OAuth accounts, live checkout, native mobile packaging, microphone/camera/screen capture and human/hardware attestation providers require individual configuration. No purchases or third-party account access occurs automatically.

## Adoption across existing work

`build_catalog.py` inventories active public `app-factory/**/index.html` entry points and preserves their titles. The current catalog contains 333 entries. Every entry has an explicit adoption state: hub runtime, registered shell, or integration required. Historical source, book text and private data are not copied into the hosted catalog.

New apps can share `core.mjs`, `one-sdk.mjs`, capability contracts, diagnostics, sync and CI. The GitHub workflow regenerates the adoption catalog and tests the actual Workers runtime when app-factory changes. Registration alone does not retrofit an old app's internal data paths. Each existing app needs an adapter, scoped agent identity and app-specific regression evidence before claiming that it uses the gateway.

## Verify and maintain

Requires Node 24+:

```sh
cd app-factory/sovereign-hub/cloudflare
npm ci
npm test
```

Optional Chromium acceptance uses `browser_acceptance.py`, the existing Python browser-test environment, and a disposable local Miniflare instance. It verifies owner key pairing, signed UI actions, context writes, offline queue/math, sync, booking, persistent device unlock, recovery, the app catalog and mobile layout. It never consumes the production owner setup credential.

`wrangler.json` contains resource IDs and binding names; live secrets are kept in Cloudflare. It is configured for the existing v1 SQLite namespace migration. Keep `TOKEN_KEY`, `BOOTSTRAP_HASH`, `TURNSTILE_SECRET` and owner setup codes out of Git. GitHub CI is enabled through the source workflow. Future automatic deployment from GitHub requires an authorized Cloudflare Builds connection or a narrowly scoped deployment credential in GitHub secrets; no credential was copied into the repository.

## Worker bees and ant jobs

Nine bounded deterministic roles run every 15 minutes. Existing Grapple It and Hook and Ring bee services are observed through read-only service bindings. Catalog refresh uses only the fixed public repository source, at most every six hours; source hashes, adoption status, derived projection repair, outbox delivery, and receipt checks produce retained operational receipts. Each role and the entire swarm have owner-controlled pause switches, a three-attempt ceiling and a daily cycle ceiling. No bot receives owner context text or payment authority. Catalog registration does not mean every app has integrated the foundation.

The build also runs five original specialist-bee handlers through their existing proposal, approval and veto machinery on a disposable metadata-only database. `bot_build_jobs.py --owner-authorized` records those build receipts. These are deterministic jobs, not independent language models or autonomous patch deployment.

## Continuous self-healing: micro and macro

The nine-role scheduler repeats every 15 minutes while the Cloudflare account, Worker and cron remain active. There is no infinite loop within a request. Per-role failure state persists across cycles: exponential cooldown begins at one minute, caps at one hour, and escalates at three failures. Success must be checked before the incident clears. Owners retain global and individual pause controls. Operational jobs remain bounded by the existing daily cycle budget.

The fleet sentinel rotates up to four targets per 15-minute cycle with five-second deadlines, no redirects, and per-target cooldowns. Its reviewed registry includes 11 JSON service contracts and 10 public page identity checks. It also checks unregistered eligible public Workers entries from the catalog for reachability. The fixed registry continues when the catalog is unavailable. These GETs report faults on monitored services.

The owner dashboard retains the latest successful time and last actual observation for each target across multiple cycles. A cooldown deferral preserves the previous receipt and records when the probe becomes eligible again. The coverage list reports pending, healthy, attention and stale targets. A receipt becomes stale after two expected full rotations. The public health route reports configured coverage counts. The owner dashboard contains the observation details.

The catalog courier checkpoints the validated public catalog in the hub Durable Object. On the KV-backed deployment it reconstructs a corrupt or missing public catalog from that checkpoint and reports recovery only after the expected content reads back. An invalid upstream catalog leaves the published catalog and checkpoint available. The checkpoint holds public app metadata.

For individual components, import `RecoverySupervisor` from the public `one-sdk.mjs`. Supply a `check` returning a boolean and a reversible, idempotent `repair`. The supervisor prevents concurrent runs, verifies again after repair, applies cooldown, halts after the configured consecutive failure limit, and supports `stop()` and explicit `resume()`. Call `start()` to run recurring checks. No private data is transmitted by the supervisor. Adopters must bound their own callbacks and preserve application state.

```js
import {RecoverySupervisor} from './one-sdk.mjs';
const recovery = new RecoverySupervisor({
  check: async () => verifyDerivedView(),
  repair: async () => rebuildDerivedViewFromAuthoritativeState(),
  onEvent: receipt => recordRecoveryReceipt(receipt)
});
recovery.start();
// Stop during component teardown: recovery.stop();
```

This is a shared adoption surface; catalog registration alone does not install it into existing apps. Automated actions currently cover validated catalog refresh, derived D1 projection reconstruction and durable idempotent outbox delivery. Arbitrary source patches, security bypasses, financial transactions and source-data deletion are not recovery actions.

## Nathan AI Sovereign Personal Cores

Zero-Cloud and ZORRO-Cloud share the same planner, evidence gates, agent roster
and Ed25519 grant format. Each of the nine bot roles has a goal-driven counterpart
that chooses its next planning action from available evidence. The agents record
observations and proposals. Applying a repair uses the existing separately
authorized recovery workflow.

The registry links agents to existing Sovereign Boxes, Tabor Light, Guardian,
ONE Hub, Hive, Tabor World, Voice Box and Silicon-to-Source code. Links are
derived from shared attributes, characteristics, functionalities and traits.
The original identifiers and source paths remain inspectable.

### Zero-Cloud on your device

Run from this directory with Node 24. Commands read local input files and store
switches and receipts in a SQLite file on your device.

```sh
node personal-core-cli.mjs registry
node personal-core-cli.mjs run run.json ./owner-core.sqlite
node personal-core-cli.mjs status ./owner-core.sqlite
node personal-core-cli.mjs control control.json ./owner-core.sqlite
```

A local run accepts a unique key, role, goal and source-tagged observation.

```json
{"key":"run-1","role":"ant-fleet-sentinel","goal":"recover","evidence":{"state":"unknown","source":"owner-snapshot-1"}}
```

Set `role` to `"*"` in a control input such as
`{"role":"*","paused":true}` to pause all agent runs. Use a role ID for one
agent. Resume explicitly with `paused:false`. These switches are independent
of the original bot switches. Root observations supplied from a file are
identified as owner-supplied evidence.

Use `box` with `{"root":"project","value":{"existing":0,"empty":null}}`.
Objects, arrays, numbers and explicit nulls get stable addresses. Missing entries
stay absent. Use `pixel` with root, width, height, x, y and channel (or null)
to address an individual pixel or channel within a declared raster. JSON traversal
is bounded to 4,096 boxes and 32 levels.

Use `reverse` with `{"goal":"candidate","rules":[{"id":"build","produces":"candidate","requires":["source"]}],"facts":[{"id":"source","state":"verified","source":"owner-revision"}]}`.
The reverse engine searches owned, declared dependency contracts from an outcome
back to the evidence needed to support it. It chooses a supported path where
available, reports blocked or missing prerequisites, and returns an ordered plan.
A verified plan is an evidence-gate result for the supplied contract. Completion
of an external action requires a subsequent execution receipt.

### ZORRO-Cloud in the ONE Hub

Open the existing Hub on a paired owner device and load the ZORRO-Cloud agents.
Select a role and an assess or recover goal. Agents read the corresponding
durable bot receipt, check its recorded hash and freshness, and store a new
receipt under the run key. Missing, stale, or unreadable proof produces an
unknown evidence state and a held action. Paused runs are rejected. No agent
can approve its own recovery proposal through these routes.

- `GET /api/personal-core` lists the agent roster and switches for the paired owner.
- `POST /api/personal-core/control` accepts role and paused for owner control.
- `POST /api/personal-core/run` accepts key, role, goal and identity. An owner
  can provide null for identity and use the existing signed device request.
- A delegated agent uses a Hub-issued proof-bound token scoped to
  `personal-core:run` and to the named role, plus an owner-signed portable grant.
  The grant binds the issuer, subject key, audience, role, expiry and request
  contents. The receiver checks its own trusted issuers. The Hub honors its
  existing agent and token revocation controls.

The local CLI can generate a device key with `key <new-file>`, sign an
invocation with `envelope <json>` using issuer_file, subject_file, audience,
role, key and goal, and verify it with `verify <json>` using audience,
trusted_issuer and input. Keep private key files on the owning devices.
ZORRO-Cloud uses the audience `zorro-cloud:<hub-host>`. A trusted deployment
must recognize the issuer and authorize the requested operation independently.
