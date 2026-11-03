# Nathan AI Codex agent instructions

Read [`CODEX.md`](./CODEX.md) before editing the ONE REALITY / ONE TIMELINE anchor.

- Preserve the canonical 141-byte UTF-8 declaration exactly unless the creator explicitly supplies a revision; version revisions instead of silently rewriting history.
- Confirm `bytes === 141`, `bits === 1128`, and the SHA-256 digest matches the declared text. Generate binary from UTF-8 bytes, not hand-copied strings.
- Read the implementation at `../octopus-root/codex.js` and its tests. Maintain all 216 original positions and their IDs; keep the new anchor separately namespaced.
- Separate creator viewpoints from empirical findings. A digest proves only that checked bytes match an expected digest; it cannot certify truth, divinity, consciousness, or physical time.
- Keep original documents, private media, credentials, and owner-only imports out of this public repository unless explicitly approved. Preserve prior source quotations separately.
- Test changes with `node --test app-factory/octopus-root/codex.test.cjs` and the relevant Nathan AI suites.

### EYEPRINTS × HANDPRINTS module

- Read [`eyeprints-handprints/README.md`](./eyeprints-handprints/README.md) and [`ARCHITECTURE.md`](./eyeprints-handprints/ARCHITECTURE.md) before editing the scanner.
- Do not include `private-samples/`, uploaded hand/iris photographs, medical documents, local vault exports, secrets, passwords or biometric templates in commits. The repository is **public**.
- Preserve KJV passages, author assertions, anatomy measurements and speculative interpretations in distinct, source-labeled records. Do not infer personality, morality, soul status, ancestry or full life history from anatomy.
- Preserve the existing Nathan AI Codex declaration and original EYEPRINTS research archive. Maintain the app's offline-first and consent-first behavior.
- Test the module from its directory: `node tests/crypto.mjs && node tests/analysis.mjs && python tests/static_check.py`. Browser/device, NIR hardware, eye-safety and production security testing remain separate release gates.
