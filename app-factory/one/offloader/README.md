# ONE — The Last App | SEALED VOICE BOX · iPhone Offloader Test

This is an **additive** module to existing ONE, not a new app or a replacement of the 101–901 Master Library, TABOR 1-2-3 FACTORY, or the owner's original records. Owner/architect: Nathan Tabor.

## Start on iPhone (no cable or Mac required for web test)

After this change is merged and the existing Factory website publishes, open ONE, tap **SEALED VOICE BOX · AI OFFLOADER**, and in Safari use **Share → Add to Home Screen**. Alternatively, open /app-factory/one/offloader/index.html directly from the existing approved site.

1. Enter a memorable **12+ character passphrase**. This creates or unlocks an encrypted browser vault on that device.
2. Try **OFFLOAD EXACT TEXT**. Choose a project such as **4T Clover**, paste text, and save.
3. Try **OFFLOAD SELECTED FILES** with JSON/TXT/MD/code, an image, PDF, audio or video. The original byte stream is encrypted and retained.
4. Search; select **Get exact original** to verify SHA-256 during retrieval. **Reload into AI** copies a labeled source-linked context packet (truncated derived text, never treated as the original).
5. Test **Start Voice Note → Stop & Save** only after granting microphone access; do not rely on background recording.
6. Select **Download ENCRYPTED full backup**. Save the .onevault file in **Files → iCloud Drive** or another user-chosen provider and store the passphrase separately.
7. Deliberately delete a *test item only*, then **VERIFY & RESTORE BACKUP** with its original passphrase. Restored source hashes must match. Repeating the restore skips identical IDs/hashes.

The browser's local store can be cleared by the OS, app uninstall, or Safari data clearing. Browser vault and existing ONE Master Library are currently **separate** databases. Encrypted backups protect archive files, but their security depends on passphrase strength and device hygiene. Never call a local-only record cloud-synced.

## Implemented here

- AES-256-GCM authenticated encryption of **each original and its metadata** using passphrase-derived PBKDF2 key (310,000 SHA-256 rounds, random salt; fresh IVs; item-specific AAD). Key remains in page memory only while unlocked.
- SHA-256 exact-byte integrity receipt and verification on retrieval; all original formats stored without rewriting or AI summaries.
- IndexedDB originals and metadata encrypted separately; text/JSON/HTML **derived indexing only**, with content caps to keep iPhone responsive.
- ChatGPT conversations.json and Claude-like chat_messages indexing heuristics for search only; exact export file remains unchanged.
- Explicit iPhone microphone start/stop capture where browser API available, with foreground limitation.
- Full encrypted backups over the existing tested vault-backup.js byte-preserving ZIP engine; checked restore with idempotent IDs/hash and collision preservation.
- ONE home entry and parent Factory offline service worker asset cache; no cache of private data or credentials.
- No API keys, provider passwords, private conversation data or secrets added to this public repository.

## Not implemented / release blockers

This static GitHub Pages PWA is **not a hosted private cloud supercomputer** or a signed iOS native app. Remote ONE cloud account, automatic synchronization, live provider histories, Share extension, phone-wide screen monitoring, background voice capture, WebDAV, MCP and OAuth require a private authenticated backend and/or signed native companion with explicit permissions and provider compatibility. Public GitHub **must not store** the owner's original conversation archives or API keys.

No guarantees of universal provider completeness, region-wide compliance, biometric voice authentication, browser-database persistence, or background execution.

**Next private cloud integration contract:** user account and device public-key registration → private per-tenant object store and SQL manifest → idempotent resumable upload → server SHA-256 ACK → independent encrypted backup with restore drills → scoped remote MCP tools and provider-verified capture adapters. Use the existing private ONE Universal AI Offloader v002 and Screenpipe Cloud Capture v003 research as implementation contracts; do not copy their private contents into public GitHub.

## Tests

Run from repository root:

    node --test app-factory/one/offloader/engine.test.cjs
    node --test app-factory/vault-backup.test.cjs
    node --test app-factory/one/one.test.cjs

Factory CI runs the new offloader regression tests for PRs to main. Before a public/paid release: on-device Safari and installed-PWA testing, IndexedDB quota handling, interrupted transaction/recovery, voice codec combinations, storage/export performance, credential recovery UX, accessibility, localization, cloud security assessment, and App Store review (if later packaged natively).

**Owner invariants:** CREATE ONCE · TRANSFORM INTO EVERYTHING · PRESERVE THE ORIGINAL · 1+1=2 · 1−1=0 · YES is YES / NO is NO.
