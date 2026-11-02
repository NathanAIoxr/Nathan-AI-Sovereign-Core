# NATHAN AI — Private A–Z Source Intake

## Purpose

An additive route under Nathan AI Main Hub: `app-factory/nathan-ai/source-intake/index.html`. It extends the existing `build-recovery` public metadata navigator without moving, rewriting, publishing, or silently fetching originals. It links to the existing GitHub, Airtable, Notion, and Google Drive source locations.

**Explicit owner-selected intake only.** Users export/download source files from their own authorized accounts, select individual files or entire folders, and choose a source label. All original file bytes are encrypted *before* local IndexedDB storage. SHA-256 detects identical source/path/content imports; changed files are preserved as separate entries. Filenames, paths, sizes, source labels, and hashes remain plaintext metadata inside the local browser database. Search works on metadata rather than decrypted confidential contents.

## Security and data lifecycle

- HTTPS secure context required for Web Crypto.
- AES-256-GCM, per-file random 96-bit IV. PBKDF2-SHA-256 with 250,000 iterations and a per-browser random 128-bit salt; passphrase at least 12 characters.
- Passphrase not retained in IndexedDB or sent to server. Session input is cleared after a completed import batch. Each preview/download requires passphrase input.
- Sentinel ciphertext rejects wrong passphrases when accessing an existing vault.
- Per-file import cap: 128 MiB; text preview cap: 2 MiB; browser quota and memory still limit bulk imports.
- Refuses filenames resembling private keys, recovery phrases, credential stores, and .env files. This filename filter **cannot** prove that source code is free of embedded secrets; audit code before any upload or public publication.
- No network request is performed by the intake JavaScript; no third-party APIs are invoked.
- Metadata-only JSON manifest export is NOT a full backup. Original-byte export is per-file using local decryption. Use the separate existing Creator Vault for supported ZIP original-byte backup and keep independent offline backups.
- Browser data and passphrase loss can make source copies irrecoverable; do not replace original source archives with this local copy.
- Local removal affects only the selected encrypted copy after confirmation.

## What this does not do

Does not automatically access Google Drive, Airtable, Notion, ChatGPT archives, or GitHub private repositories; does not copy all user's existing files into the public app; does not sync across devices; does not supply native mobile accounts, server authentication, third-party mining telemetry, or self-hosting.

**The code is public, owner content is not.** This PR publishes only the importer UI/code and links to source locations; no private user files, keys, credentials, financial records or unpublished manuscripts are included.

## Validation

`node --test app-factory/nathan-ai/source-intake/source-intake.test.cjs`

Static checks confirm JS syntax, interface links, encryption/deduplication markers and absence of network upload functions. They do **not** replace real browser encryption, quota, device, security, restore, or accessibility testing. Do not label production ready without those checks.
