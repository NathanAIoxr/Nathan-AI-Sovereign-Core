# ONE Sovereign App Hub

[Live Cloudflare edition](https://one-sovereign-hub.nathantaboract.workers.dev/) · [Cloud ownership, free-tier boundaries and adoption guide](cloudflare/README.md) · [Public app catalog](https://one-sovereign-hub.nathantaboract.workers.dev/apps.html).

A runnable, owner-controlled “OBD for apps” built on the existing Nathan AI / ONE boundary library. The current arithmetic anchors are **1+1=2** and **1-1=0**. Individual state, permission, range, connector and storage contracts retain separate ownership.

## Run

From the repository root, with Python 3.11+:

```sh
python3 -m venv work/hub-venv
work/hub-venv/bin/pip install -r app-factory/sovereign-hub/requirements.txt
# Supply your own private random owner secret in ONE_HUB_OWNER_TOKEN.
# Keep the selected database outside this public checkout.
work/hub-venv/bin/python app-factory/sovereign-hub/server.py --db /absolute/private/path/one-hub.sqlite3
```

Open **http://127.0.0.1:8780/**. Enter the owner token to unlock the local workspace. The server restricts Host/Origin, binds to loopback, bounds request bodies and socket waits, and creates the selected SQLite file with owner-only permissions. The frontend retains the token only in memory. Register a **local bridge** connector to start storing and syncing your own records. Other connector types explicitly show `provider_required`.

The ONE App Shell seed now registers this app. Existing stored app entries remain unchanged; the new entry is added on the next shell startup. The shell-hosted page provides a public preview and a link to the separate authenticated hub runtime. Both use the same original appearance ecosystem and preserve existing app entry points.

Optional `ONE_HUB_SIGNING_KEY` is a base64url-encoded secret of at least 32 bytes. Persist it securely if issued agent tokens must survive restarts. Otherwise a new in-memory signing key invalidates prior tokens on restart. `ONE_HUB_WEBHOOK_KEYS` is a runtime JSON mapping from explicitly configured connector IDs to base64url secrets; the reserved `payments` key enables payment confirmation verification. No secret is bundled with the app.

## What is built

| Requested functionality | Executable behavior | Integration boundary |
|---|---|---|
| Agent actions / machine identity | Expiring, owner-issued capability tokens; agent Ed25519 request proofs; scoped connectors/resources; revocation; nonce replay rejection | Owner explicitly registers agent keys and capabilities |
| Shared AI context | Private owner namespaces, per-agent reader grants, exact versions, expiry and conflict rejection | Apps must request and receive a grant |
| Central diagnostic hub | Connector registry, severity-coded faults, snapshot dashboard, storage checks and an OTLP JSON metrics export | Other apps supply authorized telemetry or adapters |
| Two-way app data sync | Local durable records, immutable change cursor IDs, fixed traversal watermark, compare-and-swap writes, retry receipts, preserved conflicts and owner resolution | Third-party OAuth/token exchange belongs to the provider adapter |
| Webhooks | Signed timestamped inbox, durable event deduplication and changed-payload rejection | Per-connector provider secret is runtime configuration |
| Local bridge | `import_local_records` consumes an explicitly supplied export, with per-record transactions and resumable keys | File access is explicit; import is not all-or-nothing across a whole batch |
| Disposable micro-apps | Declarative budget split, duration and room-fit utilities; no generated-code execution | More utilities can be added to the allowlist |
| On-device / edge inference | Private local extractive summarizer; digest-pinned ONNX CPU adapter with bounded inputs | Neural weights/runtime are owner-supplied; extraction is labeled deterministic |
| Quantitative reasoning | Exact integer money, rational rounding and deterministic remainder conservation | Statistical models do not inherit mathematical certainty from this arithmetic |
| Nontextual/world-model use | Integer millimetre AABB room-fit simulation | Camera reconstruction and learned world models need actual models/sensor adapters |
| Adaptive UI | User-controlled Overview / Local Tools / Context ordering; essential controls remain available | No hidden behavioral profiling |
| Ambient/multimodal actions | Consented, typed touch/voice/gaze/gesture/sensor event contract with an action allowlist | Hardware capture is a provider capability; no microphone/camera starts automatically |
| AI discoverability / GEO | Public capability catalog, OpenAPI 3.1 schema and stateless MCP-style JSON-RPC tool surface | Ranking and recommendations are external decisions |
| Human authenticity | Registered-issuer Ed25519 claim verification, artifact-hash binding in the signed claim, expiry and invite-only membership | Assurance depends on the trusted human/hardware issuer; no default “human verified” badge |
| External payments | Exact signed payment intents and authenticated, idempotent amount-matching provider confirmations | No charge, purchase or checkout redirect occurs without an actual provider integration |
| Alternative distribution | Installable manifest, public-asset-only service worker, offline budget utility and IndexedDB outbox | Native App Intents / Android / MDM packaging needs platform tooling and permissions |
| Sovereign / offline architecture | Local SQLite, owner-specific JSON export, transparent provider status and browser queue | The browser queue is device-local plaintext; protect the device and clear shared-device data appropriately |
| Self-healing | Shared booking service automatically rebuilds a drifted derived count while preserving authoritative data; cooldown and bounded failure controls | General security patch generation/deployment is not configured |
| Booking/range correctness | Shared storage-enforced `[start,end)` bookings, fencing, atomic event/request receipts and cursor pages | The hub prefixes resources by owner using an unambiguous tuple encoding |
| Screen/session mirroring | Explicit `ScreenMirrorProvider` interface | Real WebRTC/VNC capture requires a configured implementation and OS consent |

All provider-free rows have local tests. Provider-required rows are interfaces or constrained examples, with availability stated by the public catalog. The supplied industry forecasts and links are request context, not evidence that these external services have been connected or that their forecasts are verified.

## Identity and permissions

Owners register an agent's Ed25519 public key with scopes and resource IDs through `POST /api/agents`. `POST /api/tokens` issues only a subset of registered scopes for 1–3,600 seconds. A token binds the owner, agent, audience, expiry, public-key fingerprint, scopes and resources. Agents sign a canonical tuple containing the token digest, HTTP method, exact request target, body digest, timestamp and unique nonce. The request timestamp must be within 60 seconds, and a nonce can be used only once per token.

`agent_client.py` implements that proof. It reads an owner-only private-key file and the issued token from `ONE_AGENT_TOKEN`. Neither is printed. Use a different nonce for a retry, while retaining the same command idempotency key.

```sh
work/hub-venv/bin/python app-factory/sovereign-hub/agent_client.py \
  --private-key /absolute/private/path/agent.private-key --path /api/snapshot
```

The private-key file contains the base64url encoding of the 32 raw Ed25519 private-key bytes, with mode 600. Use a mature key-management/identity provider for production custody and rotation. This local capability format is deliberately separate from OAuth/OIDC access tokens.

Scopes include diagnostics, context, sync, quantitative tools, simulation, commands, attestations, micro-apps and bookings. Connector/resource grants additionally restrict sync, diagnostics and booking access. Context has a separate per-key reader grant. Owner-only routes configure agents, grants, issuers, connectors, invitations and payment intents. Actual external purchases are not an agent capability in this reference implementation.

## Offline and conflict behavior

The service worker caches only a fixed list of public UI assets. It bypasses authenticated requests and all API paths. The outbox stores queued edits in IndexedDB with an owner label, expected remote version and stable idempotency key. Successful writes are removed; conflicts preserve local and remote values. “Keep remote” and “Use device edit” are explicit owner choices. Failed network calls preserve the queue. Reloading locks authentication; an owner session must be unlocked before syncing private data.

The browser budget utility uses integer/BigInt arithmetic offline. It does not require a server or cloud model. Local tools, local model execution and third-party API access have distinct availability states.

A browser user who can access the same OS profile can inspect IndexedDB. This app does not claim encrypted browser storage, secure hardware attestation, universal background mobile execution, or automatic access to other apps' private sandboxes.

## Diagnostic and protocol surface

- `GET /api/snapshot`, `/api/telemetry`, `/api/audit-health`, `/api/export`
- `POST /api/connectors`, `/api/faults`, `/api/commands`
- `GET/POST /api/context`; `POST /api/sync`; `GET /api/changes`; `POST /api/conflicts/resolve`
- `POST /api/agents`, `/api/tokens`, `/api/revoke`
- `POST /api/microapps`, `/api/edge-summary`, `/api/ambient`
- `POST /api/issuers`, `/api/attestations`, `/api/invites`, `/api/redeem`
- `POST /api/payment-intents`, `/api/payment-confirmations`, `/api/webhooks/{connector}`
- `POST /api/booking-fences`, `GET/POST /api/bookings`
- Public `/api/catalog`, `/.well-known/one-actions.json`, `/openapi.json`
- Authenticated `/mcp`: `initialize`, `tools/list`, `tools/call` for diagnostics, context and local micro-apps. This is a focused stateless JSON-RPC subset, with the same permissions as REST.

Webhook signatures are HMAC-SHA256 hex over `timestamp + '.' + raw_body`, with `X-Event-Time`, `X-Event-Signature` and `X-Event-ID` headers. The replay window is 300 seconds. Payment confirmations sign the canonical JSON payload and additionally verify the signed intent, owner, exact amount/currency, event ID and pending state. Expired intents require provider reconciliation; no automatic refund or irreversible effect is inferred.

Audit rows contain identifiers, action categories and timestamps, not context payloads or secrets. A hash chain plus append-only triggers detects accidental inconsistency within the database trust boundary. Independent tamper resistance needs an external trusted checkpoint or signed export.

## Verify

```sh
work/hub-venv/bin/python -m unittest discover -s app-factory/sovereign-hub -p 'test_hub.py' -v
node --test app-factory/app-shell/server.test.cjs
```

App Shell tests require Node 24+. The shared boundary acceptance runner also checks the existing Root13, eight-worker, Tech108 and unchanged Codex regressions. Real Chromium acceptance exercises owner unlock, context writes, offline queue and arithmetic, replayable sync, visible conflict resolution, public-only caching, offline reload and mobile layout. PostgreSQL boundary constraints have a separate real-database test.

For browser acceptance, install the existing boundary module's `requirements-browser.txt`, run `python -m playwright install chromium`, then:

```sh
work/hub-venv/bin/python app-factory/sovereign-hub/browser_acceptance.py \
  --screenshot work/one-hub.png --report work/one-hub-browser.json
```

Deployment remains local. Internet hosting needs a production HTTP server, TLS, identity lifecycle, rate limiting, tenant isolation review, backups, retention, secret custody and provider-specific authorization. Native distribution, commissions and payment-link rules depend on the actual platform, region and agreement. No remote deployment or external account authorization is implied by passing these tests.
