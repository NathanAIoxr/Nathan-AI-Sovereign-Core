# ONE — The 33 Trial Matrix: EPOC I (Trials 1–5)

**Author:** Nathan Tabor  
**Product:** Integrated Games Factory module of **ONE — The Last App**, under **NATHAN AI → TABOR ROOT → TABOR 1–2–3 FACTORY**. Not a separate product.
**Source control:** The complete user-authored first-person specification is private source material, provided October 20, 2026. This public repository contains only a playable implementation and brief technical documentation; it does **not** include the private verbatim source. Preserve the original separately, with authorship and revision history.

## Implemented in this branch
- An accessible browser-facing **five-level Epoch/EPOC I selector** inside existing ONE.
- Deterministic, seeded pure game rules in `engine.js`; stage state, metrics and local JSON save/restore; no network calls.
- Five illustrated playable layouts in `index.html` and `game-ui.js`, using local geometric UI:
  1. **The Monolith:** strict 1×33 beam; immutable center 17; left-wing swap automatically mirrors right; only reciprocal simultaneous triple clears; both wings compress inward.
  2. **Babylon’s Gate:** 18 outer / 12 inner / three core symbol rings with three main radial paths. Match fires clockwise outer and counterclockwise inner counter-rotation; trap can consume a move.
  3. **The Rhombus of Ur:** 7×7 rotated diamond addresses; four permanent tip voids; diagonal-only swaps and slope-style refill.
  4. **Epidaurus Acoustic:** six-row V funnel with three-slot bottom trigger; bottom triple fires an upward match-type shockwave; matches at top cause a lower-board compression penalty.
  5. **Archimedes’ Spiral:** one 64-position chain mapped to an 8×8 inward spiral; one new outer-lip tile per 2 seconds while the level is active; match-3 siphons segments and compacts remaining chain; fail at slot64.
- Raw local gameplay metrics (optional): **Symmetry Delta**, **RAI**, **Misclick Vector**, **CPR**, **Panic Shift Delta**. No medical, psychiatric, IQ, or intelligence claims are inferred.
- Voluntary user-triggered **JSON save export/import**. Session and opt-in event history follow `trial-save.schema.json`.

## The original design's ambiguity ledger (unresolved / not canon)
These are IMPLEMENTATION defaults selected to make a playable prototype, not changes attributed to Nathan Tabor:
1. **Monolith count vs illustration:** the illustration is a shortened visual, but the engine uses exactly 33 slots with Nexus 17. The reciprocal swap automatically completes at the same instant; therefore computed symmetry delay is mechanically 0ms. Planning duration is a separate value; using this as a high-IQ marker would be unsound.
2. **Babylon move input:** the original defines the forced counter-rotation *after* a radial match but does not describe manual ring-selection controls. This prototype offers user-initiated ±1-slot ring turns. Three principal radial axes are mapped to offsets 0/6/12 (outer), 0/4/8 (inner), 0/1/2 (core). The display uses numeral shapes matching the original visual shorthand, not authenticated historical cuneiform.
3. **Rhombus geometry:** “49 active nodes” conflicts with four permanent voids. The engine has 49 **addressable positions**, of which 45 hold tiles and four outer tips are empty (indices 0,6,42,48 in zero-based indexing). Await author confirmation if 49 playable were intended.
4. **Epidaurus widths:** only 12 (top), 3 (bottom), and six rows are fixed in source. Provisional row widths are **12, 10, 8, 6, 4, 3** (43 total tiles) pending author confirmation. Free two-tile swaps are provisional player input.
5. **Trial objectives and budgets:** source does not assign match target counts, initial tile generation or move budgets. Current prototype uses goals 7,6,8,3,12 progress units and move budgets 25,35,35,35,unlimited respectively. These numbers are *not* new authored canon.
6. **Spiral time:** setInterval attempts a 2,000ms cadence and reconciles delayed foreground ticks. Browser timers may be throttled by the operating system; production timing must be tested on actual devices.
7. **Telemetry:** gameplay-derived ratios **are not validated psychometric measures**. Source language about elite intelligence/prefrontal function or exponentially scaling composure remains author text, not an evidence-supported diagnostic feature.

## Metrics contract

| Trial | Captured gameplay value | Mathematical interpretation |
|---|---|---|
| 1 | Symmetry Delta, player selection planning duration | Delta=0ms because the right wing auto-mirrors; planningMs=confirmationAt−firstSelectionAt |
| 2 | Rotational Accuracy Index (RAI) | progressionMoves/(progressionMoves+blockageMoves), null if no denominator |
| 3 | Misclick Vector (MV) | Count of blocked cardinal adjacency attempts in first 60,000ms; later count separate |
| 4 | Chain Potential Realization (CPR) | Top-row ≥3-combo groups of shockwave's type before detonation; counts and upper tiles detonated per strike |
| 5 | Panic Shift Delta (PSD) | nearVoidMatchRate−calmMatchRate, when each group has samples; near void = 59+ occupied tiles (≤5 slots remain) |

Details are local session telemetry. Opting in permits a detailed, bounded event log; opting out retains only necessary gameplay state. Save JSON is downloaded only on demand. No web analytics, backend, HealthKit, upload or ranking leaderboards.

## File architecture

```
app-factory/one/
  index.html                       Existing ONE shell (new Trial link)
  one.js                           Existing DO engine (open trial matrix)
  trial-matrix/
    index.html                     5 level selector and board layouts
    engine.js                      Deterministic state transitions
    game-ui.js                     Interactive view and 2-second spiral clock
    trial-save.schema.json         Versioned JSON save export
    epoch1.test.cjs                Rule/telemetry/geometry/privacy tests
    README.md                      This implementation ledger
```

## Validation and next milestone

Run `node --test app-factory/one/trial-matrix/epoch1.test.cjs`. CI is wired in the Factory quality workflow. Prototype tests are not a substitute for browser QA, WCAG keyboard-navigation testing, performance trials on real phones, full game-design balancing, or an independent psychometrics study.

*Further development should continue inside ONE, retaining every authored name and game module boundary. Stages 6–33 are not treated as implemented until their source specifications exist. Epoch II (12–16) remains an unfurnished future expansion unless author-approved rules are supplied.*
