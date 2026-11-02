# EYEPRINTS × HANDPRINTS — Engineering Architecture v3

## Flow and threat model

1. **Capture (browser):** camera or file input, explicit subject and laterality, modality and provenance, original source-file SHA-256 digest; resized JPEG stored encrypted by user action. Original file bytes are never automatically transmitted or silently persisted by application code.
2. **Analysis (client):** RGB image-space luminance, contrast, clipped fraction, sharpness and edges; manually tagged observations; separate user-supplied NIR or clinical modality. All transformations run locally.
3. **Records (encrypted):** IndexedDB singleton encrypted snapshot with PBKDF2-HMAC-SHA256 + AES-256-GCM, random salt, per-save IV, associated data, local pseudonymous IDs. No remote API calls; no accounts; no cross-device sync.
4. **Presentation (client):** command center, annotated image workspace, profiles, comparative image display, ledger and documentary notes, research texts and audit log.
5. **Backup and recovery:** manually downloaded encrypted JSON; restore replaces vault after confirmation. No password recovery service and no third-party storage.

## Risk ledger

- **Biometric sensitivity:** A dorsal vein pattern or iris texture may enable tracking/identification when paired with a validated matching system. Keep all images private and use informed consent.
- **No biometric authentication:** Hand/iris evidence in v3 neither authenticates a person nor gates an encryption key. The cryptographic vault uses a user passphrase. Matching is not implemented.
- **Unaudited encryption:** Browser/PWA key handling does not provide a secure hardware enclave guarantee. PBKDF2 does not prevent all offline guessing. Protect strong passphrases and backups.
- **Photo data in bundles:** The private starter bundle stores two original source images unencrypted on disk. Its use is confined to the user's local machine.
- **Medical interpretation:** Surface imaging cannot diagnose nerves, discs, internal bone pathology, vascular insufficiency, mental states or moral status. Qualified studies and sources are distinct evidence categories.
- **Color heuristic:** `analysis.js` contains a YCbCr candidate skin-color range that is experimental and not validated across skin tones, lighting, or demographics; it does not identify a person. Its optional bounding box is not a clinical segmentation.
- **Image change:** Exposure and camera geometry confound longitudinal comparisons. v3 shows raw image metrics and explicitly disclaims physiological change estimates.
- **Storage quota and backup loss:** IndexedDB storage is not durable across browser resets or storage eviction. Export encrypted backups frequently.
- **Hosting:** HTTPS hosting is needed for phone access and PWA installation, but uploading the private bundled photos onto a static web host would publish them. The shareable source ZIP excludes them.

## Planned native and hardware adapters (not simulated)

- **iOS and Android:** native camera media pipeline, hardware-backed keystore wrapping of a random data-encryption key, OS biometric prompt, secure storage, integrity checks, permissions and accessibility.
- **NIR:** camera/LED band and power, exposure times, dark-frame subtraction, color/geometry calibration, acquisition provenance, ground-truth vessel imaging validation.
- **3D:** intrinsics, scale reference, distortion calibration and depth capture—surface geometry only.
- **Clinical:** DICOM/record import with signed source and clinician interpretation; no automatically inferred diagnosis from RGB.
- **Matching:** opt-in separate feature under consent, performance measurement, presentation-attack detection, false match and false non-match calibration and non-biometric fallback.

## Schema

`eyeprints.handprints.v3` encrypted state with `profiles[]`, `scans[]`, `ledger[]`, `documents[]`, `audit[]`, `researchNotes[]`. Every scan records `kind`, `side`, `profileId`, `created`, `modality`, `sourceName`, `image`, `sha256`, `metrics`, `verified:false`, `livenessVerified:false`. All records use UUIDs. The schema can be exported only as encrypted backup through the UI. Plaintext PNG export is a separate explicit action.

## User-facing boundaries

The KJV research module cites chapter and verse independently of imaging measurements. `observed_rgb`, `user_report`, `family_testimony`, `clinical_document`, `historical_document` and `hypothesis` are evidence descriptors, not interchangeable scientific conclusions. The project uses the phrase "the backs of your hands are the ledgers of your life" as an interpretive framework for the documented record, not a claim that camera pixels reveal everything about any person.
