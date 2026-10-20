# ONE Trials Engine — Private 33-Stage Architecture

**Owner:** Nathan Tabor  
**Parent:** ONE — The Last App → 501 Games & Characters  
**Status:** Stages 1–3 playable prototypes, stages 4–33 preserved as owner-controlled designs

The public browser engine at [index.html](./index.html) has **no original 33-stage names or author manuscript**. These stay in the owner's private Main Database.

To load:

1. Import `ONE_MASTER_LIBRARY_PRIVATE_IMPORT_PACK_v2.json` into ONE → MASTER LIBRARY, from the same browser profile.
2. In ONE → TRIALS select **Use my ONE Library stages**, or choose the private `TRIAL_MATRIX_PRIVATE_LEVELS_v1.json` and select **Load selected stage file**.
3. Play levels 1–3. Levels 4–33 remain visibly unavailable instead of filling missing mechanics.

## Implemented first three geometry prototypes

- **Stage 1 — 1×33 strip:** eleven distinct triples, center triplet first, outward rings unlocked sequentially; win by clearing all 33 tiles.
- **Stage 2 — concentric rings:** three twelve-tile circles, select adjacent equal-symbol triples; inner and outer circle rotate in opposite directions after matches; win after seven successful matches.
- **Stage 3 — rhombus:** 7×7 coordinates with Manhattan-radius 3 masked diamond (25 cells), contiguous three-of-a-kind matching, southeast diagonal gravity rather than vertical; win after seven successful matches.

These are **prototypes** of the author's layouts, not full match-3 production designs. Rule depth, balancing, level 4–33 mechanics and visual assets are still in development. The prototype tap-to-match interface is not yet a full swap-and-cascade match-3 engine.

## Rules and author protection

- The complete October 20, 2026 author blueprint is retained verbatim in the private `THE_33_TRIAL_MATRIX_AUTHOR_SOURCE.md` document.
- Original terminology such as **psychological warfare**, flicker challenges and **IQ** remains in that source untouched. The **playable software** avoids covert emotional manipulation, high-frequency flicker, intrusive camera/cursor surveillance, and unvalidated clinical IQ claims.
- Only descriptive gameplay metrics (moves, matching accuracy and completion) are written to browser localStorage, and an optional download can be initiated; no network telemetry or data selling.
- The proposed one-time **$4.99** purchase price is a product specification, **not** an active purchase or payment feature. No advertising, subscriptions or microtransactions are implemented.
- Separate ONE Library 101–901 categories remain independent of ONE's engineering divisions. No confidential owner records should be committed to public GitHub without explicit author publication approval.
- Preserve originals and independent game save data. Local browser storage is not a guaranteed backup and not secure from another user of the same browser profile.

Test: `node --test app-factory/one/trials/trials.test.cjs`.
