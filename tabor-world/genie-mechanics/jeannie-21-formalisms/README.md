# NATHAN AI — Genie Mechanics, 21 Formalisms

Preserves all 21 supplied speculative physics, mathematical, computing, symbolic and neural mappings as individually indexed entries. Four engineering tracks: gesture and eye-tracking; programmable matter and spatial hardware; AI/translation/simulation; security/governance.

## Implemented
- Immutable 21-formalism JSON catalog and four-layer inventory.
- Stateless software-only containment and gesture engine: seal/unseal, arm-fold, blink, allowlisted command, snapshot, restore, revoke, violation lock.
- Worker API: GET /health, /api/formalisms, /api/formalisms/:id, /api/layers, /api/state; POST /api/step.
- Node tests: `node --test test.mjs`.
- Wrangler: `npx wrangler deploy`.

## Important distinction
This is **fiction-inspired simulation**, not real conjuration, teleportation, optical invisibility, perfect translation or physical quantum manipulation. `authorized:true` is only a demo flag supplied by the caller; it does **not** authenticate anyone and must not control real devices. No biometric collection, physical machine actuation, autonomous cloning or blockchain execution. Physical sensor adapters, verified cryptographic identity, consent, encrypted persistence, and production quality tests remain separate implementation work.

## Example
POST /api/step with `{"event":{"type":"unseal","authorized":true}}`. Pass the returned `state` in each following call with `arm-fold`, `blink`, then `{"type":"command","action":"set-color","value":"pink"}`.
