# ONE — Health & Recovery (E / 301)
**By Nathan Tabor** · In-app module of **ONE — The Last App**, not a separate product.

## Current working slice (browser preview)
The ONE homepage links to `health/index.html`. In its own secure browser origin on the user's trusted device, the module can:
- Create or unlock a health-only vault with a user-held 12+ character passphrase. Key derivation: PBKDF2-SHA256, 310,000 iterations, random salt; content protection: AES-256-GCM with a fresh nonce per encrypted blob.
- Import manually selected original files, entire extracted folders and ordinary stored/deflated ZIPs. Sources are hashed with SHA-256, duplicate content is skipped and CRC32 checks are applied to extracted ZIP members. No filenames or health bytes are added to this public repository.
- Preserve every original byte and its encrypted filename, source path, receipt timestamp, declared provenance and review state. The original is not silently edited to fit an AI interpretation.
- Add distinct private recovery-timeline entries and authored bath-formula notes. They remain **personal testimony/author notes** until separately verified.
- Organize, search, and view local sources; export a full portable ZIP of originals and authored notes after explicit approval; reimport that export.
- Lock the vault and erase stored health records on this browser with double confirmation.

## User's next step to import the recovered archives
1. Open **ONE → E · Health & Recovery** on a trusted, private device over HTTPS.
2. Set a **new, memorable passphrase** of at least 12 characters and keep it secure. Losing the passphrase loses access to the on-device encrypted collection. There is no password recovery server.
3. Use **Import ZIP archive(s)** and select the previously recovered 36-file master ZIP **on the user's device**. The app cannot silently read ChatGPT files, browse private accounts, or access arbitrary computer folders.
4. Review the imported private categories, save follow-up notes or bath versions, and optionally export the full archive as an **unencrypted portable ZIP** to secure storage.

No healthcare data has been uploaded merely because the code has been published. The source files are NOT committed to GitHub. The ZIP and original health assets are not held by this public repo.

## Source separation (mandatory)
- **Personal account:** dated/user-attributed narrative; never replace with a guessed clinician statement.
- **Clinical record:** user-selected authentic source, with date, issuer and integrity hash; do not assert independent verification from appearance alone.
- **Authored bath formula:** exact author's original content with revisions and source links; no invented missing ingredients, quantities, safety testing or efficacy claims.
- **Bathtub product:** separate engineering specification/prototype; electrical/water device safety and regulatory evaluation required before physical manufacture/use.
- **Technical catalog:** reference index, not proof that each indexed source exists.
- **Interpretive/creative materials:** never silently become clinical facts.

ONE's Living Archetype Mirror reflects intended user meaning by default. Only user-selected adversarial/brainstorming modes introduce counter-positions. No clinical inference or AI rewriting is implemented in this slice.

## Platform and security limitations
- This is a static web/PWA prototype, not HealthKit, Android Health Connect, EMR access, secure cloud sync or a medical device.
- The browser must support WebCrypto, IndexedDB and secure HTTPS context. Original bytes are encrypted *before* being placed into IndexedDB, but plaintext exists transiently in the unlocked browser tab during use.
- ZIP deflate import requires native `DecompressionStream('deflate-raw')`; if unsupported, extract the ZIP yourself and select the folder.
- One-import limit: 500 members; 100 MB/file; 155 MB uncompressed/archive. Existing Factory `vault-backup.js` enforces a separate ~140 MB portable backup limit.
- **Exported ZIPs are NOT encrypted** and should be handled as private records. The passphrase is never synced and lost keys are unrecoverable.
- There is no idle auto-lock yet, and this browser prototype has not undergone a production-grade security assessment, HIPAA compliance review, on-device accessibility QA, or independent penetration testing. Do not describe it as a certified health records vault.
- No medical recommendations, treatment verification, third-party authorization or remote writes are offered.

## Next development stages
1. Real source-to-timeline citation linking, chronological versioning, redaction, owner-only sharing/revocation, search inside encrypted documents.
2. Confirmed privacy/backup threat model, cryptographic backup export, multi-device sync using authenticated user-held encryption, and 2-user tenant isolation.
3. Opt-in native Apple HealthKit / Android Health Connect adapters, explicit read-only data scopes and revoke, never implicit consent.
4. Clinical record provenance and reconciliation workflow: user records vs clinician evidence vs notes; appointment preparation (no autonomous treatment changes).
5. Bath temperature product and water/electrical risk-tracking lab with independent safety review, separate from health advice.

## Reproducibility
Run `node --test app-factory/one/health/health.test.cjs` from repository root, and existing ONE + Factory tests. Test suite checks source ZIP integrity, traversal rejection, metadata taxonomy and UI registration. Browser WebCrypto/IndexedDB end-to-end and native device tests remain to do.

**Code/public build status is distinct from private-content import status.**
