# Private ONE v025 · Strategy Campaign

This module now includes the 33-guardian campaign, focus abilities, tactical stances, forecasts, seeded daily challenges, mastery contracts and public-board analysis. See [the private v025 field manual](../../../README_PRIVATE_V025.md) for all campaign rules, guardian behavior, version boundaries and build commands. Classic practice remains available.

# THE 33 — 33 Games. 33 Levels. ONE APP.

By Nathan Tabor · NATHAN AI → TABOR ROOT → TABOR WORLD™ · integrated into ONE.

All 33 stages are playable locally. Download, play, hints, Study/Inspect controls, automatic dead-board reshuffles, and retries are free. No purchases, paid currency, external accounts, analytics, or network calls are part of this game. The earlier $4.99 proposal is superseded.

## Run and validate

Prerequisites: Node 22+ and Python 3. No dependency installation or build step.

```sh
# From the repository root
python3 -m http.server 8000 --bind 127.0.0.1
node --test app-factory/one/trial-matrix/*.test.cjs
node --test app-factory/quality.test.cjs app-factory/core/root-contracts.test.cjs app-factory/one/one.test.cjs app-factory/one/library/library.test.cjs app-factory/one/trials/trials.test.cjs
```

The game entry is `app-factory/one/trial-matrix/index.html`; ONE's home links directly to it. The older `one/trials/` module remains separate and preserves its private-source import workflow.

## Source and implementation boundary

The first five names and layouts retain the existing source implementation. The supplied brief defines the three 11-stage epochs, free play, rewards, and categories of mechanics for later stages. The private v023 source was **not** available in this checkout. Names 6–32, exact boards, budgets, targets, and detailed rules are new implementation choices based on that brief, not a recovery or reproduction of private v023 canon. Zenith Zero comes from the supplied brief. Existing private manuscripts and archives remain outside this repository.

The 33-layer cryptographic engine pasted separately is unrelated to the game rules and has not been substituted for them. Historical names here are game themes, not claims of verified historical ancestry for software.

## Controls and rules

Select two tiles to swap. Stages 6–33 accept adjacent swaps only (except explicit bridges and cross-plane neighbors); nonmatching swaps return without spending a move. The left-hand chamber controls both sides in Huygens. Babylon uses ring buttons; the original Monolith, Rhombus and Funnel retain their original input rules. Free hint highlights a legal move and describes it; Play hinted move executes it. On the spiral, a hint can be unavailable until the next timed feed. Memory starts visible, hides only when requested, and can always be studied again.

Stages 6–33 resolve matches and cascades deterministically from their seed, preserving fixed cells and voids. Cascades score 10 per tile times cascade depth. Goals count tiles unless the stage specifies rooms, value, balanced contributions, target symbols or seals. The finite move budget is per attempt, never a paid restriction. A bounded cascade limit stabilizes rare pathological cascades without awarding extra matches. Dead-board reshuffles cost nothing; objective-critical reshuffles preserve visited rooms, seals, locked tiles, and player contributions. The engine searches for an objective-bearing move before leaving a room, balance, or seal board ready.

The 4 × 4 × 2 × 2 Tesseract is a discrete projection, with all four planes visible and no claim of rendering physical four-dimensional space. Cooperation is local pass-and-play for two people; the rival is a deterministic local opponent, not an online player. Stroop uses a readable word/ink conflict without flashing. Hidden weights are game state and can be inspected freely. Gameplay counters do not establish IQ or a medical finding.

## Level atlas

| # | Epoch | Stage | Board | Objective | Move budget |
|---|---|---|---|---|---|
| 1 | I | THE MONOLITH | 1 × 33 | 7 | 25 |
| 2 | I | BABYLON’S GATE | 18 outer + 12 inner + 3 core | 6 | 35 |
| 3 | I | THE RHOMBUS OF UR | 7 × 7 / 49 addresses / 4 corner-tip voids | 8 | 35 |
| 4 | I | EPIDAURUS ACOUSTIC | 6-row funnel / 12 to 3 | 3 | 35 |
| 5 | I | ARCHIMEDES’ SPIRAL | 1 × 64 path in 8 × 8 | 12 | Timed feed |
| 6 | I | NILE WATERWAYS | 6 × 7 waterways | 36 | 45 |
| 7 | I | MAYAN CALENDARS | 6 × 8 / two calendars | 36 | 45 |
| 8 | I | MNEMOSYNE’S MEMORY | 6 × 6 memory board | 36 | 45 |
| 9 | I | CAESAR’S CIPHER | 6 × 6 cipher | 36 | 45 |
| 10 | I | KNOSSOS LABYRINTH | 9 × 9 / nine rooms | 9 | 50 |
| 11 | I | ROSETTA TRILINGUAL | 6 × 6 / three scripts | 36 | 45 |
| 12 | II | NEWTON’S INVERSION | 7 × 7 inverted gravity | 36 | 45 |
| 13 | II | ARKWRIGHT’S ASSEMBLY | 6 × 8 assembly line | 36 | 45 |
| 14 | II | BABBAGE’S ENGINE | 7 × 7 programmed gravity | 36 | 45 |
| 15 | II | ENIGMA ROTORS | 7 × 7 rotating cipher | 36 | 45 |
| 16 | II | MENDELEEV’S TABLE | 6 × 7 weighted values | 90 | 45 |
| 17 | II | TESLA’S ALTERNATOR | 7 × 7 alternating gravity | 36 | 45 |
| 18 | II | TURING’S FEEDBACK | 7 × 7 feedback loop | 36 | 45 |
| 19 | II | VON NEUMANN’S RIVAL | 7 × 7 local strategy | 36 | 45 |
| 20 | II | SHANNON’S CHANNEL | 6 × 7 channel | 36 | 45 |
| 21 | II | APOLLO GUIDANCE | 7 × 7 guided gravity | 36 | 45 |
| 22 | II | NASH EQUILIBRIUM | 6 × 8 / balanced sectors | 30 | 45 |
| 23 | III | SCHRÖDINGER’S TILES | 7 × 7 dual-state tiles | 36 | 45 |
| 24 | III | TESSERACT PROJECTION | 4 × 4 × 2 × 2 / four planes | 36 | 45 |
| 25 | III | STROOP INTERFERENCE | 6 × 7 word / ink board | 36 | 45 |
| 26 | III | ARCHIMEDES’ HIDDEN WEIGHTS | 7 × 7 weighted board | 100 | 45 |
| 27 | III | PILLARS OF CONSTANTINOPLE | 7 × 7 / immutable columns | 36 | 45 |
| 28 | III | HUYGENS’ RESONANCE | 6 × 8 paired chambers | 36 | 45 |
| 29 | III | MAXWELL’S GATE | 7 × 7 sorting gate | 36 | 45 |
| 30 | III | CHRONOS RESERVE | 7 × 7 / reserve row | 36 | 45 |
| 31 | III | ARIADNE’S BRIDGES | 7 × 7 / crossing bridges | 36 | 45 |
| 32 | III | CONCORDIA COOPERATION | 6 × 8 / local two-player | 30 | 45 |
| 33 | III | ZENITH ZERO | 7 × 7 / 33 seals | 33 | 70 |

### Stage mechanics

- **01 · THE MONOLITH:** Left swap auto-mirrors right; compass at slot 17 never moves.
- **02 · BABYLON’S GATE:** Align core-to-outer axes. Each match counter-rotates the geared rings.
- **03 · THE RHOMBUS OF UR:** Only 45° diagonal neighboring swaps; pieces flow along sloped diagonals.
- **04 · EPIDAURUS ACOUSTIC:** Match the 3-cell input bed; the upward shockwave amplifies across wider rows.
- **05 · ARCHIMEDES’ SPIRAL:** 1 new tile at the outer lip every 2 seconds; entering slot 64 fails.
- **06 · NILE WATERWAYS:** Matches flow east along each canal; vertical matches open the sluices.
- **07 · MAYAN CALENDARS:** Swap within each four-column calendar. Every match advances the left calendar and reverses the right.
- **08 · MNEMOSYNE’S MEMORY:** Study the symbols, then hide them voluntarily. Selected tiles and free Study remain available; match by symbol.
- **09 · CAESAR’S CIPHER:** Symbols are encoded by a visible rotating key. After each successful move the key advances and each row shifts its symbol values by its row number.
- **10 · KNOSSOS LABYRINTH:** Each 3 × 3 room is isolated: swaps, matches and gravity stay inside it. Clear matches in all nine rooms.
- **11 · ROSETTA TRILINGUAL:** Rows use three different scripts for the same four values. Match by value across scripts using the legend.
- **12 · NEWTON’S INVERSION:** After a match tiles rise and refill from below.
- **13 · ARKWRIGHT’S ASSEMBLY:** After cascades, the selected row advances one slot on the conveyor.
- **14 · BABBAGE’S ENGINE:** Gravity follows the published cycle: down, left, up, right, then repeats each move.
- **15 · ENIGMA ROTORS:** After each successful move, the next rotor column advances its values by one. Rotor position is shown.
- **16 · MENDELEEV’S TABLE:** Clear matching symbols. Values change each turn: the target is earned value, with every cleared symbol worth 1–4 points.
- **17 · TESLA’S ALTERNATOR:** Odd moves pull downward, even moves pull upward. The displayed current predicts the next fall.
- **18 · TURING’S FEEDBACK:** The last cleared symbol becomes the target for your next move. The first move accepts any symbol; other clears score but do not advance the target.
- **19 · VON NEUMANN’S RIVAL:** Reach 36 cleared tiles before the visible deterministic rival reaches 60. The rival gains 1–4 points after your move.
- **20 · SHANNON’S CHANNEL:** Only rows of at least three transmit progress. Vertical clears still score and refill but carry no progress.
- **21 · APOLLO GUIDANCE:** Gravity follows the next visible guidance arrow. Every third move skips one direction in the cycle.
- **22 · NASH EQUILIBRIUM:** Clear at least 15 tiles from each half. Progress counts each half up to 15 so one sector cannot substitute for the other.
- **23 · SCHRÖDINGER’S TILES:** Every tile has a light and dark value. Choose the active state before swapping; matches use that state. Both states travel together.
- **24 · TESSERACT PROJECTION:** Four visible 4 × 4 planes represent x,y,z,w. Swap one step on any axis, including cross-plane counterparts; triples run along x or y within a plane.
- **25 · STROOP INTERFERENCE:** Match the printed word, ignoring its deliberately different ink color. There is no flashing or hidden timing test.
- **26 · ARCHIMEDES’ HIDDEN WEIGHTS:** Each tile carries a fixed weight of 1–4. Weights travel with tiles; Inspect reveals them freely. Progress counts cleared weight, not tile count.
- **27 · PILLARS OF CONSTANTINOPLE:** Columns 3 and 5 cannot be swapped or cleared. Make matches in the remaining vertical channels.
- **28 · HUYGENS’ RESONANCE:** Swap in the left chamber and the counterpart swap occurs in the right. Only matches with matching positions in both chambers clear.
- **29 · MAXWELL’S GATE:** Only the visible gate symbol advances progress. The gate changes after a qualifying move; other symbols still clear and score.
- **30 · CHRONOS RESERVE:** The bottom row is reserved and cannot be swapped or cleared until you have made two successful moves. Then it opens permanently.
- **31 · ARIADNE’S BRIDGES:** Structural voids divide the board. Swap adjacent tiles or use the four published bridge links to cross the gaps.
- **32 · CONCORDIA COOPERATION:** Two local players share the board and alternate successful moves. Each must clear 15 tiles; the turn and both contributions remain visible.
- **33 · ZENITH ZERO:** Clear all 33 marked seals through matches. Cleared seals stay gone while tiles refill. Reduce the seal count to zero.

## Earned progression and backup

The free starter gift is 100 coins and 3 gems. First completion of each stage earns 100 coins and 1 gem, except that completing an entire epoch awards 5 gems for its final completed stage. All 33 completions total 3,400 coins and 48 gems including the starter gift. Replays can improve score, move record and stars, but do not duplicate completion rewards. Stars are 3 within the first third of a finite move budget, 2 within the first two thirds, otherwise 1; completing the timed spiral in classic practice earns 3 stars. Campaign stars use the campaign player-turn budget. Rewards are local game counters; there is no checkout or paid hint path.

All stages are available from the selector. Continue recommends the earliest unfinished stage, and completion marks the atlas with earned stars. There are no energy limits, paywalls, or currency spending requirements.

Browser localStorage under `one.private.v025.progress.v1` saves the current board and profile after actions. Export JSON includes both. Import accepts the new progress envelope and original session-only saves. Invalid imports leave the running session and profile unchanged. A malformed existing browser save is preserved rather than overwritten automatically; the UI reports the issue. If browser storage is unavailable, play remains possible and export is the backup path. Both games retain a previous distinct autosave and expose explicit recovery. Recovery/import preserves a malformed primary’s exact bytes under a separate key and offers a download. If saving a backup fails, the current primary remains intact. Browser storage can be cleared, so keep an independent export.

Detailed action history is opt-in per new trial. Basic completion counters are retained for progress. No mouse/camera monitoring, covert stress detection, uploads, clinical inference, or invisible flicker. The spiral has manual pause and automatic hidden-tab pause. It counts active time, preserves the remaining feed fraction, and reopens saved sessions paused. Browser scheduling is not a calibrated psychometric timer.

## Files and validation coverage

- `engine.js`: existing five geometry engines, 33-stage registry, shared save/restore and free-hint search.
- `expansion.js`: stages 6–33, per-stage topology/modifiers, match resolution, objectives, gravity, cascades, hints and dead-board recovery.
- `profile.js`: pure starter gift, completion awards, stars, replay protection and progress validation.
- `game-ui.js`, `index.html`: stage atlas, campaign swipe/keyboard input, transactional turns, attempt reviews, pause and explicit JSON transfer.
- `save-store.js`: validated two-generation local saves, explicit recovery and damaged-byte preservation, shared by the campaign and Studio.
- `active-clock.js`: active-time feed intervals with fractional pause/resume.
- `resilience.test.cjs`: recovery generations, write failures, damaged saves and clock boundaries.
- `trial-save.schema.json`: session format including expansion boards; runtime validation additionally checks exact stage dimensions/topology.
- `epoch1.test.cjs`: retained first-five geometry and privacy checks.
- `all-levels.test.cjs`: real completion of all 33 stages, multiple seeds for expansion levels, deterministic restore after every action, modifier rules, invalid actions/imports and earned rewards.

The private validation command above runs all trial-matrix test files, including campaign, Studio and resilience coverage. Rule tests are not a substitute for production balancing, independent accessibility assessment or validated psychometrics. The new titles and numeric budgets are adjustable implementation choices.

## The original design's ambiguity ledger (unresolved / not canon)
These are IMPLEMENTATION defaults selected to make a playable prototype, not changes attributed to Nathan Tabor:
1. **Monolith count vs illustration:** the illustration is a shortened visual, but the engine uses exactly 33 slots with Nexus 17. The reciprocal swap automatically completes at the same instant; therefore computed symmetry delay is mechanically 0ms. Planning duration is a separate value; using this as a high-IQ marker would be unsound.
2. **Babylon move input:** the original defines the forced counter-rotation *after* a radial match but does not describe manual ring-selection controls. This prototype offers user-initiated ±1-slot ring turns. Three principal radial axes are mapped to offsets 0/6/12 (outer), 0/4/8 (inner), 0/1/2 (core). The display uses numeral shapes matching the original visual shorthand, not authenticated historical cuneiform.
3. **Rhombus geometry:** “49 active nodes” conflicts with four permanent voids. The engine has 49 **addressable positions**, of which 45 hold tiles and four outer tips are empty (indices 0,6,42,48 in zero-based indexing). Await author confirmation if 49 playable were intended.
4. **Epidaurus widths:** only 12 (top), 3 (bottom), and six rows are fixed in source. Provisional row widths are **12, 10, 8, 6, 4, 3** (43 total tiles) pending author confirmation. Free two-tile swaps are provisional player input.
5. **Trial objectives and budgets:** source does not assign match target counts, initial tile generation or move budgets. Current prototype uses goals 7,6,8,3,12 progress units and move budgets 25,35,35,35,unlimited respectively. These numbers are *not* new authored canon.
6. **Spiral time:** the UI polls an active-time clock. Each 2,000 ms of active time injects a tile. Manual pause and hidden tabs freeze the board and clock, preserving the remaining interval. Foreground scheduling delays are reconciled; no offline or hidden-tab feed debt is applied.
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
