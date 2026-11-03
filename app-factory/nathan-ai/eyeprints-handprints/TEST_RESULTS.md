# Test results — November 2, 2026

PASS — `node --check app.js`, `vault.js`, `analysis.js`.

PASS — `node tests/crypto.mjs`: encrypted vault create/save/restore/delete, incorrect passphrase rejection, ciphertext confidentiality, SHA-256 reference digest.

PASS — `node tests/analysis.mjs`: synthetic hand/iris measurement fixture and polar iris sampling. This test exposed a normalized-radius validation error, which was corrected.

PASS — `python tests/static_check.py`: 90 referenced UI IDs present among 96 elements; required assets and privacy exclusions verified.

NOT RUN — `tests/e2e.py`: the managed Chromium installation in this execution environment has a policy `URLBlocklist=["*"]`, which blocks every navigation URL with `ERR_BLOCKED_BY_ADMINISTRATOR`. Therefore real browser camera permissions, cross-device layout and end-to-end user flows were not validated here. Re-run this test in an unrestricted browser environment.

NOT VERIFIED — physical NIR/depth sensor acquisition, biometric identity matching, clinical claims, native mobile builds, penetration testing, security audit, and production hosting.
