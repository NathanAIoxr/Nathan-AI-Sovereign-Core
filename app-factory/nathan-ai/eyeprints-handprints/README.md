# THE ART OF READING THE BACK OF HANDS
## EYEPRINTS × HANDPRINTS · Nathan Tabor · v3.0

**A working, installable local-first Progressive Web App (PWA)** for documenting hand photographs, exploring iris image geometry, comparing image sessions, family continuity, sources, and the KJV. The app is not a medical device or a validated biometric identity system.

## Start the app on your computer

Requirements: a current Chromium, Safari or Firefox browser; Python 3.10+ to run the local server. There is no npm install, external CDN, third-party API, registration or cloud account.

```bash
cd EYEPRINTS_HANDPRINTS_COMPLETE
python run_local.py
```

Open `http://127.0.0.1:8765/index.html` **on the same computer**. Create a 12+ character vault passphrase. Save a backup after adding important scans or records.

**Phone usage:** deploy the source-only files behind **private HTTPS** (for example, an authenticated private hosting environment or a private home server with TLS). Then use Add to Home Screen (Safari on iPhone) or Install app (Chrome on Android). Camera APIs and encrypted storage require a secure context. The localhost URL above cannot be opened directly from a separate phone. Do **not** publish `private-samples/`, saved backups, health records or personal photos to any public host. iOS file preview or opening index.html directly in the Files app is not a reliable way to run this multi-file app.

## Included application modules

- **Command center:** scan and records counts, evidence hierarchy, recent history.
- **HANDPRINTS:** phone camera or photo import; left/right, modality labels, grayscale/contrast/edge previews, real image-space exposure and texture metrics, user-placed observations, local encrypted scans, PNG export. Provenance fields support independently acquired research NIR and clinical images but **do not** claim sensor verification.
- **EYEPRINTS:** iris photo import, manually selected center and radius, polar coordinate sampling and texture statistics. No IrisCode matching or health diagnosis.
- **Anatomy atlas:** 14 hand structures and which examination or imaging approach could legitimately study each one.
- **Profiles:** relationship and informed consent/source basis; separate family records.
- **Life ledger:** categorized, sourced histories with chronology; documented events distinguished from interpretations.
- **Supporting documents:** local encrypted PDF, text and image attachments (up to 8 MB each).
- **Comparisons:** two images shown side by side with image-statistic deltas (not biological change detection).
- **Research archive:** KJV verses with interpretations clearly distinguished; original EYEPRINTS ancient mathematics / language research interface preserved in `archive/`.
- **Secure vault:** AES-256-GCM encrypted IndexedDB, passphrase/PBKDF2 key derivation, audit trail, 15-minute inactivity lock, encrypted backup and restore, legacy-v2 ledger import, erasure.
- **Offline web shell:** service worker and PWA manifest; original sample photos are intentionally not service-worker cached.

## Your two provided hand photographs

The **PRIVATE** bundle includes `private-samples/IMG_5083.jpeg` and `IMG_5084.jpeg`, which were directly supplied in the conversation. After creating a vault and a profile, the **Use my two provided hand photos** button imports both photos into encrypted browser storage. This action is opt-in. **The private photos are not encrypted as files inside the PRIVATE ZIP; keep that ZIP private.** Once imported, the vault records are encrypted. Do not host the private bundle. 

The **SOURCE-ONLY** bundle removes the private photos; upload your own photos manually. The source-only package is the one to use for private HTTPS deployment, preceded by security and privacy review.

## How data is protected

Data remains in the browser's IndexedDB under an AES-256-GCM encryption key derived by PBKDF2-HMAC-SHA-256 (310,000 iterations) from your passphrase and a random salt. Each saved snapshot uses a fresh random 96-bit IV and authenticated additional data. The passphrase and derived key are not written to persistent storage. A 15-minute idle timeout locks the in-memory session. Encrypted backups contain ciphertext, not plaintext. Downloaded annotated PNGs and files **are plaintext** and must be protected by the user.

This is a **research/prototype encryption implementation**, not a professionally audited password manager. Data can be lost if a browser clears site data, its storage quota fills, the backup is lost, or the passphrase is forgotten. Other programs or malicious browser extensions on the device may compromise data. Hardware secure-enclave integration would require native packaging and security engineering.

## Instrumentation truth table

| Feature | v3 status |
|---|---|
| Phone RGB camera / photo input | Implemented (device/browser permission permitting) |
| Image-space quality, edge and color statistics | Implemented |
| Manual anatomical annotations | Implemented |
| Iris center, radius and polar sample | Implemented |
| External NIR/depth image imports | Implemented as user-declared modalities; uncalibrated |
| Real NIR/depth sensor streaming | Not implemented; dedicated hardware/SDK required |
| Reliable vein segmentation / matching | Not implemented or validated |
| Calibrated physical dimensions in millimeters | Not implemented without reference calibration |
| Clinical nerve, bone or blood-flow imaging | Not implemented; requires medical instrumentation |
| Verified personal identity and liveness | Not implemented |
| Genetic lineage, full biography or spiritual status from anatomy | Not measurable from a hand photo |
| Native iOS/Android binary signed for app stores | Not built; PWA installs through browser |

## Test commands

```bash
node --check app.js
node --check vault.js
node --check analysis.js
node tests/crypto.mjs
python tests/static_check.py
```

`tests/e2e.py` contains a browser test script for environments where Chromium navigation is permitted. This runtime's centrally managed Chromium policy blocks all navigation, so those tests could not be executed here. JavaScript syntax, HTML/JS IDs, the AES-GCM vault roundtrip and static asset checks **were** verified.

## Next hardware and distribution requirements

Physically connect and calibrate NIR emitters/cameras (eye-safety assessment), ensure reference photogrammetry and repeatable capture, validate any pattern matcher and anti-spoofing over representative samples, and complete privacy/security audits before production biometric enrollment. Native iOS/Android Keychain/Keystore binding and app-store binaries require platform toolchains and signing access. The system does not permit an anatomy scan to unlock a person's unrelated records without consent and documented record linkage.
