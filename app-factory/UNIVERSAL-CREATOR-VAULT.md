# TABOR 1-2-3 FACTORY™ — UNIVERSAL CREATOR VAULT
## Import once, organize, reuse, update, connect, and launch.
Version: 2026-10-09

### Product promise
The Vault is not exclusively the founder's archive and is not a central directory of other people's private information. It is the **personal asset manager for every person who chooses to use the Factory**. Each user owns and controls their own materials: images, video, audio, books, scripts, notes, PDF documents, editable templates, models, code, inventions, game assets, prompts, data, photographs, and files from compatible AI providers.

All content is private by default. Explicit owner permission is required before publishing or sharing. A Vault asset can be linked to many Factory projects without making new source copies.

### What is implemented today (browser-only)
1. `vault.html` and `vault.js`: import multiple files, Factory starter asset ZIP, ChatGPT `conversations.json` or an export ZIP; browser ZIP support has size/algorithm limits and degrades gracefully.
2. Store original binary files and chat text in local IndexedDB, *not* in a public GitHub repository.
3. Hash to detect repeated originals where possible; gracefully skip duplicates; treat large-file name/size match as approximate.
4. Organize originals into named project collections. Assign tags, search filenames, tags, projects and conversation text, and filter media types.
5. Display local image thumbnails; preview images, videos, audio and smaller text files; download original; optionally remove a local copy.
6. Make a Factory project from a chat or original asset; link one item to multiple projects through Vault references in the current local project list.
7. Export index metadata JSON. **This index does not back up original bytes.** Retain original imports or download assets individually.
8. Open the Vault directly from Factory Home.

Current limits: one local store per browser profile; no login, no multi-device identity, no encrypted cloud backup, no actual provider connector, no automatic background import, no collaborative ACL, no automatic build or publishing. Shared-device users can access the same browser data; this is not a secure multi-user account. Browsers may evict storage. A ChatGPT data export may omit separately stored generated images; import those originals separately. No claim is made that the app already imported every ChatGPT conversation or image.

### Multi-tenant production requirements — to build next
**Authentication**: independent user account; passkeys / OAuth, verified sessions and account recovery. Never let the client select an arbitrary user ID for an API call. Derive workspace membership from the session on every request.

**Private storage**: private object buckets with encrypted objects at rest and TLS transport; malware scanning; checksum; owner/workspace metadata; per-object ACL; signed, short-lived upload/download URLs; safe previews (no executable HTML/SVG or scripts rendered with elevated origin). Do not put private contents in public GitHub.

**Account/workspace model**:
- `users(id, email, status)`
- `workspaces(id, owner_id, plan, retention, encryption_key_ref)`
- `memberships(workspace_id, user_id, role)` role in owner/editor/viewer
- `projects(id, workspace_id, name, status, category)`
- `assets(id, workspace_id, owner_id, mime, filename, content_sha256, source, created_at, deleted_at, permissions)`
- `asset_versions(id, asset_id, version_no, object_key, size, sha256, timestamp)`
- `asset_links(asset_id, project_id, purpose, version_pinned)`
- `provider_connections(id, workspace_id, provider, consent_scopes, encrypted_token_ref, cursor, refresh_status)`
- `sync_jobs(id, connection_id, cursor_from, cursor_to, status, last_error, billed_bytes)`
- `activity_log(id, workspace_id, actor_id, object_id, event, timestamp)`

**API endpoints** (authenticated):
- `GET /v1/me/workspaces`
- `GET /v1/workspaces/:wid/assets?cursor=...&q=...`
- `POST /v1/workspaces/:wid/assets/init-upload` -> signed upload URL plus quotas (validate workspace membership)
- `POST /v1/workspaces/:wid/assets/complete-upload` -> verify actual content hash, MIME/size, scan result, persist
- `GET /v1/workspaces/:wid/assets/:assetId/download` -> short-lived download URL after ACL check
- `POST /v1/workspaces/:wid/projects/:pid/assets/:aid/link`
- `POST /v1/workspaces/:wid/connections/:provider/start` -> OAuth with state + PKCE, exact scopes and consent
- `POST /v1/workspaces/:wid/connections/:id/sync` -> manually queue sync with idempotency
- `GET /v1/workspaces/:wid/sync-jobs/:jid` -> progress and source attribution
- `DELETE /v1/workspaces/:wid/connections/:id` -> revoke credentials, disconnect
- `POST /v1/workspaces/:wid/exports`, `DELETE /v1/workspaces/:wid/assets/:aid`, `DELETE /v1/workspaces/:wid` -> user-controlled export/deletion

**Automated ongoing synchronization**, where technically and contractually supported:
- Use explicit consent and scoped OAuth (e.g. user selects a specific folder or library).
- Subscribe to provider notifications/webhooks where available; otherwise incremental polling per allowed provider API rate limits.
- Record provider cursor, high-water mark and per-asset provider ID. Renew tokens securely and handle disconnects/revocations.
- For new/changed files: queue a job, fetch only authorized files, hash, deduplicate by workspace + hash, append asset version if changed, update search index and pinned project links.
- For deleted remote files: don't destroy Vault copies silently; prompt about retention policy.
- User decides frequency: manual, hourly/daily if supported, or notifications; show fees, storage and transfer before costly jobs.
- Respect service API terms; do not scrape or claim ChatGPT account access without a supported authorization route.
- "Sync from any AI": publish a documented `tabor123.project.v1` and `tabor123.asset-pack.v1` interchange format; support direct handoff only when an AI application permits authorized actions. Otherwise file/share import remains the universal fallback.

**Creative pipeline**: `create → attach existing assets → compose/edit/generate selectively → render/test → explicit release approval → build → store/provider review and publishing`. Each build logs exact input asset versions and licensing.

**Privacy, safety and policy**: no cross-workspace enumeration, tenant isolation tests, encryption, auditable share grants, age-aware defaults, copyright/licensing provenance, opt-in AI indexing, retrievable exports, deletion/retention controls, quotas and incident response.

### iPhone-first usability
Users have five simple controls: **Import**, **Find**, **Reuse**, **Sync**, **Publish**. Show clear states for:
- Available now: import, browse, local tags/collections and export.
- Needs connection: account/cloud backup and provider sync.
- Needs approval: any public release, purchase or irreversible deletion.
- Never promise that local processing or Wi-Fi removes compute/storage fees.

### First private archive pack
A starter archive of 15 previously created files was prepared in the conversation's download area, **not placed in this public repository**. It includes original PNG art, existing Python/HTML source files and a playable archive. Only a partial sample of the user's ChatGPT materials has been recovered; it is not a full history or every generated image. The user can import it into the Vault.

### Acceptance criteria for multi-user release
- User A cannot read, list, preview, download or overwrite a single private asset of User B without an explicit permission grant.
- Viewer cannot change originals, editor cannot modify billing/ownership, owner can revoke shared access.
- User can connect/disconnect providers, view sync history, pause background sync and revoke tokens.
- Repeated sync creates no duplicate assets; edited remote files create versions; destructive remote actions are not silently mirrored.
- Large assets resume upload; network errors don't corrupt original; iPhone low-storage warnings occur before import.
- User can export all bytes and metadata, then delete account data; actual export and deletion confirmed, not merely requested.
- No private file appears on a public webpage or GitHub without user opt-in.
