# EYEPRINTS × HANDPRINTS · public-release boundary

This module is additive to the Nathan AI main hub. It is a functional local-first research browser app and not an approved medical device or a validated identity platform.

## Published
- RGB hand-photo import/camera intake and image-quality metrics
- Anatomy/skin visual annotations and manually sourced family life ledger
- Iris photograph geometry and normalized texture exploration (not an IrisCode)
- Local vault storage encrypted with a user passphrase; export and restore
- Source-labeled KJV/history research materials
- Educational original EYEPRINTS reference interface in `archive/`

## Private — not in this repository
- The owner's two hand photos IMG_5083.jpeg and IMG_5084.jpeg
- Private anatomical comparison images/reports and user health history
- Family medical or genealogical documentation and iris photographs
- Biometric authentication keys, credentials, record exports and production data

**For owner-only private deployment:** keep the private ZIP in a protected location; do not publicly host its photo assets. Public Nathan AI includes a disabled sample-photo loader. A user may select their own hand and iris images locally.

## Not yet implemented or validated
Real near-infrared hand-vein sensor acquisition, depth camera calibration, biometric matching/anti-spoofing, a secure-enclave integration, remote accounts, independent clinical validation, full device/browser e2e, or native App Store/Google Play shipping.

## Development commands
From this directory:
```sh
node --check app.js && node --check analysis.js && node --check vault.js
node tests/crypto.mjs
node tests/analysis.mjs
python tests/static_check.py
```
