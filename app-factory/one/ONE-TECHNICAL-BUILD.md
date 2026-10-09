# ONE — The Last App, by Nathan Tabor
## Native personal operating system / sovereign shell — full implementation brief

**Repo:** `app-factory/one/` in TABOR 1-2-3 FACTORY
**Separate product:** ONE is not a rebrand of the Factory. They share permitted TABOR ROOT services, while ONE has its own release, data permissions and lifecycle.
**UX:** iPhone-first; Android counterpart with common behavior and honest platform differences.
**Product motto:** Your world. Your choice. One control panel.

## What is ACTUALLY available in this repository
- `index.html` + `one.js`: responsive browser prototype.
- All 26 A–Z domains, architecture 101/201/.../901, 19 explicit provider descriptors.
- Local notes, tasks and event records in browser localStorage.
- DO command parser: `add task`, `note`, `run morning/work/sleep`, `open`, `show`, `zero mode`.
- Three **local-only** flows, audit history and user-triggered navigation to Factory, Vault and Maps.
- Deliberate denials for unsupported payments, bookings, messaging, OAuth and system-wide control.
- No third-party services have been authenticated; no access to other apps' private data.

## What ONE fundamentally is
1. **Orchestrator:** Access external services using officially supported APIs, verified user-scoped tokens, App Intents/Shortcuts, explicit user interaction or app/site deep links.
2. **Replacement:** Offer built-in private modules for tasks, notes, planning, calendar (local first), document/media viewing, projects, routines, search and basic tools.
3. **Sovereign permissions:** Every connected provider and operation has scope (read vs approved write), expiry, reason, account, device and revoke action.
4. **Zero Mode:** Limit ONE's OWN connectivity, notifications, workflows and data processing. Never claim to silence unrelated apps or operating-system services without relevant native OS support and user settings.
5. **Root:** ONE may reference Factory projects and originals through explicit cross-product grants; it must not silently pool user accounts or publish data.

## Architectural divisions (ONE-specific 101–901, different from Factory creative catalog)
101 Zero-UI | 201 Official orchestration | 301 Private vault | 401 Workflows/event queues | 501 Secure compute | 601 Identity/consent | 701 Payments | 801 Intent/routing | 901 Native OS/hardware.

## Real platform capabilities
### iOS app with SwiftUI + native frameworks
- EventKit calendar and reminders require appropriate authorization for each action.
- Contacts framework may authorize selected contacts only. Use purpose strings and revocation controls.
- HealthKit: user-granted types for steps/workouts, type-specific read/write and HealthKit capability; no browsing the Health app without explicit grant.
- FileImporter / security-scoped URLs: user-picked files and supported File Provider integrations, **not unrestricted scanning of Apple Notes or every app's container**.
- PhotosUI/PhotoKit: limited selection or appropriately authorized library read.
- App Intents and Shortcuts: expose native ONE actions, call supported OS actions or cooperating third-party intents; unavailable shortcuts cannot be invoked by guessing.
- AuthenticationServices and ASWebAuthenticationSession for OAuth authorization with PKCE. Tokens in appropriately scoped Keychain entries, server-side confidential tokens encrypted using managed keys. Secure Enclave may protect cryptographic keys; it is not a generic password/token container.
- BackgroundTasks for eligible deferred work only, subject to iOS quotas and conditions. No persistent omniscient background listener; no global overlay or arbitrary installed-app inventory.
- CoreBluetooth, Matter/HomeKit only with appropriate entitlements/consent. Critical device actions require confirmations.
- Use native share extensions and optional widgets for ease; ONE **cannot replace SpringBoard or forcibly uninstall apps**.

### Android with Kotlin + Jetpack Compose
- Calendar, contacts, file/photo picker, Health Connect and runtime permission requests as applicable.
- Android App Links/Intents for user-initiated routing; integrations through official provider APIs.
- WorkManager for eligible background work and foreground-service policy where appropriate.
- Installed-app visibility is sensitive: scoped `<queries>` preferred. `QUERY_ALL_PACKAGES` restricted and requires a qualifying use case/declaration for Google Play; a user-friendly launcher feature is not blanket permission to read app data.
- AccessibilityService is for legitimate accessibility purposes, not a covert universal controller.
- Android cannot read sandboxed third-party app files or force actions in arbitrary services.

### Web/PWA
- Local modules, HTML file selection, optional Web Share / service worker / notification permission on supported platforms.
- No HealthKit, EventKit, direct OS notification interception, app inventory or device Keychain APIs from this standalone web page.
- Do not claim browser localStorage is encrypted at rest or fully private on a shared device. Production user data belongs in encrypted, authenticated storage with export/erasure.

## Product connector contracts
Each adapter must declare:
`id, provider, capability, data_types, supported_platforms, auth_type, scopes_read[], scopes_write[], requires_reconfirmation, review_status, terms_link, account_id, granted_at, expires_at, last_sync_at, revoke_handler`.

**Connection state machine:**
`unavailable → available_unconnected → authorizing → connected_readonly / connected_action → expired / revoked / error`.
Do not show "Connected" without an actual successful authorization callback validated by backend.

**Actions:** `Intent {domain, verb, targets, parameters, user_context, estimated_fee, risk, consent_refs}` → validate schema → resolve provider → plan → preview → approve → execute with idempotency key → verify result → durable audit / rollback where possible. If unsupported, return blocked + safe handoff; never fake action success.

**Risk tiers:** R0 view / navigate, R1 local reversible updates, R2 external writes/messages, R3 bookings/payment, R4 irreversible/safety-critical. R2-R4 should have explicit foreground confirmation and verification. Never send money or unlock a door based solely on a natural-language utterance.

## Built-in ONE domains: A–Z
A accounts and identity; B banking and bills; C calendar and commitments; D documents and data; E exercise and health; F family and contacts; G groceries and home; H habits and routines; I information and search; J jobs and work; K knowledge; L location and travel; M media and music; N notifications and signals; O organization and systems; P privacy and permissions; Q quick actions; R relationships and social; S security and safety; T time and focus; U utilities; V vision and goals; W wealth and assets; X experiments; Y you and profile; Z Zero Mode.

## Multi-tenant production schema draft
`users(id, identity_provider, created_at)`
`one_workspaces(id, owner_id, key_ref, region, retention_policy)`
`one_memberships(workspace_id, user_id, role)`
`one_connectors(id, workspace_id, provider, external_account_ref, status, read_scopes, write_scopes, token_secret_ref, expires_at)`
`one_grants(id, connector_id, user_id, action_scope, data_scope, starts_at, expires_at, revoked_at)`
`one_objects(id, workspace_id, domain, type, ciphertext_ref, source_ref, version, retention)`
`one_workflows(id, workspace_id, owner_id, steps_json, active, review_state)`
`one_workflow_runs(id, workflow_id, requested_by, approval_state, status, error, created_at)`
`one_actions(id, workspace_id, actor_id, intent_json, risk, approval_ref, idempotency_key, outcome, timestamps)`
`one_devices(id, user_id, platform, push_token_ref, capability_manifest, last_seen)`
`one_vault_links(workspace_id, factory_workspace_ref, factory_asset_ref, permission_ref)`
Apply row-level security or equivalent backend enforcement and tenant isolation; never trust a client-supplied workspace ID without session ACL checks.

## User-facing launch slices for Work
1. **M0** Today: current PWA demo with readme/tests, transparent platform boundaries.
2. **M1** Real SwiftUI and Compose companion shells with calendar, contacts, files and task adapters. Platform-specific permissions and empty states.
3. **M2** Sign in, private workspaces, passkeys, tenant isolation, encryption, consent/revoke UI, restoration and backups.
4. **M3** Official OAuth connectors for Google/Microsoft calendar/files/email and GitHub; safe read-only default; documented disconnected experiences.
5. **M4** Flow runner (manual and authorized scheduled), durable queue, preview/confirm/verify ledger.
6. **M5** Health, home, and media integrations, each conditional on platform, review, permissions and user needs.
7. **M6** Financial read services then regulated, confirmed write capabilities. Never hidden endpoints, banking impersonation or password harvesting.
8. **M7** Intelligent routing with small on-device intent model plus optional cloud model requiring distinct consent/budgets; do not send secrets to model provider by default.
9. **M8** Accessibility, localization, security audits, threat modeling, App Store and Play policy review, cloud builds and staged publishing.

## Specific acceptance criteria
- Onboarding works with only iPhone controls, no Mac required to use the app. Building/signing may require hosted Mac CI.
- A user's A–Z choices determine displayed tiles; no unsolicited "friend" persona, dark patterns or engagement addiction loops.
- Two independent users cannot list, search, edit, trigger, or export each other's files or accounts without explicit invitations.
- All connected app access is visible, limited and revocable. Changes can expire on a date or be scoped to a single project/file.
- Every real provider API call is auditable with status, trigger, scope, cost, source and result.
- No wrong-platform promises: iOS app inventory, arbitrary notification feed interception and OS-level universal overlays are not implemented as fictitious features.
- R3/R4 external actions cannot proceed without explicit confirmations.
- All local data can be exported/imported with integrity checks; backup is complete and includes the original bytes if media is included.
- No confidential user files, provider tokens or personal events are committed into the public GitHub repository.
- Works with existing Factory Creator Vault and app portfolio through owner-approved references, without merging product identities.
- Native tests, CI, 2-user isolation, approval replay tests, service outages, permission denial and revocation paths all pass before "production ready" status.

## Official docs to check at implementation
[Apple HealthKit authorization](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data)
[Apple App Intents](https://developer.apple.com/documentation/appintents)
[Apple FileImporter](https://developer.apple.com/documentation/swiftui/fileimporter)
[Apple BackgroundTasks](https://developer.apple.com/documentation/backgroundtasks)
[Android package visibility](https://developer.android.com/training/package-visibility)
[Google Play package visibility policy](https://support.google.com/googleplay/android-developer/answer/18258653)
[Android Health Connect](https://developer.android.com/health-and-fitness/guides/health-connect)
