# ⚡ DRAFT POOL — Universal Game Drafting Engine

**Creator:** Nathan Tabor · **Parent:** TABOR 1-2-3 FACTORY · **Status:** Original standalone browser application **in a private conversation ZIP**, not yet published as a runnable GitHub Pages game.

## Verified independent build

A full runnable ZIP named `TABOR_DRAFT_POOL_V1.zip` was generated in this ChatGPT conversation. It contains:

- `index.html`: mobile-responsive playable draft room
- `ui.js`: interactive rosters, countdown clock, custom pool importer, local browser save/resume, export/import JSON
- `engine.js`: deterministic universal draft state machine
- `test.cjs`: **14 passing Node.js unit tests**
- `README.md`: instructions and limitations

The GitHub text-content connector could not reliably copy the local multi-file source. **Do not mark those source files as committed or deployment as complete.** Download the verified ZIP and import it into this folder with a binary/file-capable GitHub client or ChatGPT Work, then rerun all tests.

## Game architecture

Any owner-authorized draftable entity (fictional hero, historical figure, custom game, esports competitor) has stable `id, name, role, cost, rank` fields. The engine supports snake or linear turns, salary and role caps, deterministic auto-picks, duplicate/turn validation, pick event log, revision guard, and revalidation of restored sessions by replay.

**1 + 1 = 2** protects independent manager/entity identities; **1 − 1 = 0** is not a claim that selecting a fictional character erases another human's rights. This game is voluntary, fictional drafting; the U.S. military conscription system differs legally and ethically from sports-style draft processes.

## Integration with existing Factory

The module should **reuse** the Sovereign Boxes registry, universal state engine, asset vault, and game graphics/media infrastructure before any real multiplayer backend is developed. Keep new IDs namespaced and never overwrite original `TW-001`–`TW-101` catalog entries.

### Explicit limits

This prototype is local single-device only. Real-time multiplayer would require authoritative servers, authenticated identities, authoritative deadlines, idempotency keys and reconnect state. No paid fantasy sports, athlete licensing, live market data, remote user sync or Apple/Google store publishing is implemented.

## Next steps

1. Import the five exact original files from the owner-controlled ZIP to this path.
2. Run `node --test app-factory/games/draft-pool/test.cjs`.
3. Embed into the Factory navigation and add CI for this module **after** source integration.
4. Then connect the shared game-state service, multiplayer and approved audiovisual assets.
