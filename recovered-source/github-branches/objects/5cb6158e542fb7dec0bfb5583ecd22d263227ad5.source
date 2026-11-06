# ONE — THE LAST APP · MICRO → MACRO SOVEREIGN COMPUTER

**Owner:** Nathan Tabor  
**Parent:** ONE → TABOR 1-2-3 FACTORY → NATHAN AI SEALED VOICE BOX  
**Defense:** THE NATHAN TABOR HALL OF MIRRORS  
**Shape:** Tabor Time-Traveling Tabernacle: four-leaf clover, four T's, one authorized central nexus.

**Core invariants**
- **1 + 1 = 2:** preserve each original, attach non-destructive indexes, references and versions. Do not silently replace.
- **1 − 1 = 0:** deletion is explicit, scoped, authorized, auditable, and reflected in active backups according to policy.
- **YES is YES / NO is NO:** default no capture, no publishing, no recording of unrelated material, no third-party model transfer.
- **No pay-to-play tokens:** do not use in-app currency, collectible crypto tokens, or token-balance UI. Technical bearer/access tokens for authentication and model-token metering inside third-party AI infrastructure cannot literally be removed without removing those features.
- **One source; many views:** the same immutable file can appear as a cabinet item, library chapter, photo album entry, audio clip, code module, chat transcript, timeline entry or project node; each view references the same source.

## MICRO — exact byte → identity → evidence

| Layer | Concrete representation | Acceptance criterion |
|---|---|---|
| 0. Physical compute | Cloud server CPU/RAM/SSD, optional GPU only when workload justifies it; an iPhone acts as secure terminal | Measured throughput, power and deployment costs |
| 1. Binary source | Original file, byte sequence, byte count, MIME, SHA-256 | Import → export bytes match exactly |
| 2. Source identity | Random UUID, owner/project scope, source provider, capture method, timestamp, coverage | Distinct originals not merged due to same filename |
| 3. Storage crypto | Local AES-256-GCM with random nonce and device/vault key hierarchy; separate metadata encryption | Tampering and wrong credentials rejected |
| 4. Index | Derived text and search catalog, language tags, source pointers | Delete/rebuild derived index without changing source hash |
| 5. Relation | Typed edges: origin, reply, attachment, parent, version, duplicate, project | Same source linked to multiple collections without copying |
| 6. Deterministic math | Reversible decimal ↔ base-12 ID conversions; owner Dewey-style hierarchy | 101/101 registry addresses round-trip exactly |
| 7. Mirror views | Original, forward, reversed and typographic upside-down display | Source stored once; transformations explicitly NOT encryption |
| 8. Audit | Event IDs, device ID, consent decision, receipts and redacted security logs | Sequence and hash evidence survive restore |
| 9. Recovery | Encrypted, independent source backup, manifest, verified restore, conflict-preserving import | Backward restore and adversarial corruption tests pass |

On-device browser storage is a testing fallback, not the sole production copy. Move to encrypted native SQLite and iOS Keychain / Android Keystore in the signed mobile clients. Preserve original SQLite source branches and private archives by import into a *new* audited staging namespace; no destructive rename or replacement.

## THE FOUR T'S — independent logical cores with ONE nexus

1. **TORRENT (processing):** deterministic parser, import scanner, exact byte checksum, optional user-approved AI inference/transcription, background cloud workers with measured CPU/GPU budget.
2. **TERRACES (memory):** private tenant-isolated SQL ledger, immutable original blob store, derivation indexes, source version graph, encrypted backups and restore drills.
3. **TUNNELS (routing):** authenticated TLS APIs, durable queue, resumable chunk uploads, idempotency keys, sync receipts, device revocation and granular connector grants.
4. **TERMINAL (user command):** accessible iPhone/Android/browser/desktop client, Share/Send target, microphone only with explicit start/stop, source-first cabinet/library/album/timeline views, full export and account deletion.

**CENTRAL NEXUS:** owner authorization and project graph. Browser and native client interfaces share schemas; infrastructure runs on a real server. A 4-leaf clover is the app topology, not a claim of naturally faster motherboard hardware.

## MACRO — production cloud topology

```
iOS / Android / Web / macOS / Windows / Linux
  |       explicit Share / user-selected export / authorized adapter
  v
ONE TERMINAL (signed client + offline encrypted upload queue)
  |
  | HTTPS TLS + per-user device authorization + bounded requests
  v
TUNNELS: API gateway, rate limits, OAuth/OIDC/PKCE, upload ACK
  |                        |
  |                  HALL OF MIRRORS
  |                  decoys and monitored isolated test segments
  |                  (never have production vault credentials)
  v
TORRENT: intake validation + dedup manifest + authorized work queue
  |
  v
TERRACES: SQL manifest + encrypted immutable object blobs + project graph
  |                  |
  |                  +--> derived search and optional inference
  +--> independent encrypted backup + restore-test store
  |
  v
TERMINAL: VERIFIED ON SERVER → VERIFIED IN BACKUP
```

**Hall of Mirrors:** 5,000,000 is a lazily addressed *logical decoy space*, not 5,000,000 spun-up Linux/Docker proxy instances on a single machine. Deploy bounded isolated honeypots, service-level rate limits and deception-aware telemetry only after threat modeling. **BOOM = locally authorized block, revoke, isolate, alert, patch and preserve evidence**, never hacking back or firing network packets into a third party's machines. No claim of live enforcement before integration testing.

## SOURCE CAPTURE — any device, any AI that permits capture

- ONE-native AI tools: capture the original input and actual available responses directly, including attachments and version edits.
- Existing ChatGPT, Claude, Gemini, Grok, Copilot, and future apps: user-approved Share/Send, provider history export, authorized connector/MCP invocation, or consented browser extension using supported host permissions.
- Official consumer chat accounts are **not** generally accessible in real time to a generic model API key. A browser iframe or embedded WebView cannot override cross-origin restrictions, provider terms, OS sandboxes or native app permissions.
- Screen or audio capture needs user-visible OS authorization and specific platform support; no guarantee of silent background reading across every phone.
- Inbound capture fidelity is labeled **exact source bytes**, **provider export of unknown completeness**, **selected text**, **rendered partial**, or **link only**. Do not call anything “full conversation” without evidence.

## DATA, SECURITY, DEVICES AND DEPLOYMENT

- **Private backend:** PostgreSQL + private object storage + background worker queue + encrypted offsite backup, deployed in an owner-approved account; reverse proxy, secrets manager and audit trail. SQLite is valid for the device; backend capacity and hardware follow measured load, not fixed rack specs.
- **Credentials:** deployment domain and TLS; database account; object-store scoped credential; OIDC/passkey issuer/client IDs; server-only encrypt/backup keys; optional APNs/FCM keys for push; Apple/Google signing credentials for native stores; optional per-provider OAuth identities and optional AI inference keys.
- **Security:** scope checks on every read/write, tenant separation, CSRF/SSRF/zip-bomb/injection resistance, no secrets in Git or JS bundles; explicit author control for every external AI reload.
- **Availability:** foreground upload first, resumable offline queue, checksum validation before “Saved”; remote server ACK before “Cloud Verified”; independent restore confirmation before “Backed Up.” Never collapse these states into one false toast.
- **Universal:** browser PWA first; signed native iOS and Android Share extensions for incoming content; desktop shell/native extension where needed; RTL/unicode and accessibility, jurisdiction-sensitive retention and consent, provider-specific capability matrix.
- **Minimum deployment:** provision private cloud (not done); test restore and authorization; deploy secure HTTPS endpoint; connect client; then add native and provider integrations. No feature should claim to be active before deployed.
- **Hardware optimizations:** ECC RAM, NVMe durability, CPU/RAM memory sizing, WAL separation, huge pages, filesystem alignment, PgBouncer and optional GPUS are *measured tuning choices*. Never treat 1T1C physical DRAM addressing as directly accessible from an unprivileged application.
- **Experimental water/stone computing:** hydraulic logic and silt-storage concepts may be simulated or prototyped independently; no historical proof that Egypt's pyramids were data-processing computers or that ancient soil contains recoverable ancestral memories. These concepts are not dependencies for the phone app or deployed cloud system.

## VERIFICATION — forwards, backwards, upside down, cross-device

1. Save text/audio/image/code/JSON/ZIP; exact byte hash and all metadata survive export and restore.
2. Reverse traversal returns correct records; duplicate import does not overwrite; competing versions coexist.
3. Unicode/emoji/RTL/upside-down transformations cannot change source bytes.
4. Wrong key, tampered blob, tampered manifest and forged server receipt fail closed.
5. iPhone offline → online retry 100 times still makes one cloud original; no false success notification.
6. Two accounts, two devices and scoped external AI connectors cannot access each other's content.
7. A simulated intrusion into a decoy cannot reach vault credentials and is contained by local enforcement rules.
8. A separate backup system restores source bytes and graph references after deleting the primary testing database.
9. Performance tests scale from one iPhone and one cloud instance to measured concurrency; optimize from profiling.
10. Preserve all original author inputs and record what is tested versus designed.

**STATUS AT COMMIT:** Existing encrypted ONE Offloader is a browser-local test module; Hall of Mirrors provides 5 million *logical* IDs and a 101-name indexing/mirror demo. A production private cloud, live infrastructure moat, provider-wide automatic sync and native cross-platform app are specified here but **not yet installed or deployed**.
