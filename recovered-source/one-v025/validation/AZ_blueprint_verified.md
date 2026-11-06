# Private ONE v025 — Match-3 A–Z Structural Gateway

26 engineering systems, 52 forward/reverse inspection entries. Reverse inspection is read-only and never reverses gameplay. Only the supplied reverse endpoints Z: Zero Clearing and A: Absolute Arrival are treated as original names; the other reverse names are explicit implementation-defined verification labels.

## FORWARD A · Alpha Foundation

Application architecture — Separate pure rules, browser presentation, progression and inspection.

Engine mapping: studio-engine.js / studio-ui.js; engine.js / strategy.js.

Check: Supported schema and complete engine API.

Label source: user supplied.

## FORWARD B · Blueprint Alignment

Board generation — Seeded generation creates a stable, playable opening.

Engine mapping: studio-engine.js: initial, stableFill, recover.

Check: 64 cells, no initial free triples, at least one legal move.

Label source: user supplied.

## FORWARD C · Core Compliance

Cell and tile models — Stable tile identities carry a symbol and optional earned power.

Engine mapping: studio-engine.js: tile, validate.

Check: Unique IDs, bounded symbols, supported power types.

Label source: user supplied.

## FORWARD D · Deterministic Direction

Drag-and-swap input — Pointer gestures and keyboard/click selection enter the same swap transaction.

Engine mapping: studio-ui.js: pointer handlers, play.

Check: Actual pointer gesture count; keyboard-native tile controls.

Label source: user supplied.

## FORWARD E · Energy Engine

Event sequencing — One committed rule transaction is presented before new input is accepted.

Engine mapping: studio-ui.js: locked; studio-engine.js: swap.

Check: UI lock state and atomic rule-phase status.

Label source: user supplied.

## FORWARD F · Facilitation Force

Falling gems and gravity — Surviving tiles preserve order and fall into cleared cells; new tiles enter above.

Engine mapping: studio-engine.js: settle.

Check: Every settled column contains eight valid tiles.

Label source: user supplied.

## FORWARD G · Grid Geometry

Grid coordinates — Row/column and linear-index conversions preserve position.

Engine mapping: studio-engine.js: adjacent, groups.

Check: Index → row/column → index round-trips for all 64 cells.

Label source: user supplied.

## FORWARD H · Homeplace Harmony

Hint detection — Hints enumerate productive adjacent swaps without predicting refills.

Engine mapping: studio-engine.js: moves.

Check: A hint is present while active and is geometrically adjacent.

Label source: user supplied.

## FORWARD I · Invariant Integrity

Invalid-swap rollback — A nonmatching swap restores the exact previous board and spends no move.

Engine mapping: studio-engine.js: swap / lastTurn.

Check: Rejected transaction signatures agree.

Label source: user supplied.

## FORWARD J · Judiciary Justice

Journey and progression — Score targets, retries and local win records make progress visible.

Engine mapping: studio-ui.js: recordOutcome; profile.js: award.

Check: Nonnegative score, budget and local run records.

Label source: user supplied.

## FORWARD K · Key Lockout

Keyframe animations — Swaps, clear flashes and tile arrival animate with a reduced-motion path.

Engine mapping: studio-ui.js: animateTurn; studio/index.html: keyframes.

Check: Rendered animations exercised or reduced-motion alternative selected.

Label source: user supplied.

## FORWARD L · Literalist Logic

Legal-move solver — Every proposed move is checked against adjacency, matches and powers.

Engine mapping: studio-engine.js: moves.

Check: All current candidates are legal adjacent pairs.

Label source: user supplied.

## FORWARD M · Mastery Mind

Match detection — Maximal horizontal/vertical runs merge into connected clear components.

Engine mapping: studio-engine.js: groups, components.

Check: Settled board has no unresolved normal match.

Label source: user supplied.

## FORWARD N · Nomad Navigation

Neighbor validation — Edges cannot wrap into a false neighbor and diagonals are rejected.

Engine mapping: studio-engine.js: adjacent.

Check: Row-wrap and diagonal counterexamples are rejected.

Label source: user supplied.

## FORWARD O · Order Observation

Objectives and outcomes — Target completion wins; exhausting moves below target loses.

Engine mapping: studio-engine.js: swap, validate.

Check: Outcome is consistent with current score and move budget.

Label source: user supplied.

## FORWARD P · Protection Protocol

Power gems and boosters — Four-runs make line powers, intersections make blasts, five-runs make spectra.

Engine mapping: studio-engine.js: creations, powerSwap, effects.

Check: Current power types are supported; creation/activation counts are real.

Label source: user supplied.

## FORWARD Q · Query Precision

Quality assurance — Structural validation and executable rule/browser tests catch broken behavior.

Engine mapping: studio-engine.js: validate; studio.test.cjs; validation/studio-browser-check.cjs.

Check: Current state round-trips; full regression results remain a separate artifact.

Label source: user supplied.

## FORWARD R · Replication Rite

Cascade resolution — Clear, activate, score, fall, refill and repeat to a stable board.

Engine mapping: studio-engine.js: swap, effects, settle.

Check: No unresolved match; bounded cascade traces and counters.

Label source: user supplied.

## FORWARD S · Sovereign Stream

Sound and accessibility — Opt-in generated sound, labeled native buttons, live status and reduced motion.

Engine mapping: studio-ui.js; studio/index.html.

Check: Current DOM labels, status announcements and explicit sound preference.

Label source: user supplied.

## FORWARD T · Target Triumph

Turns and timers — Only accepted swaps spend turns; animation delays never change game rules.

Engine mapping: studio-engine.js: swap; studio-ui.js: animateTurn.

Check: Moves remain within budget, independent of rendering delays.

Label source: user supplied.

## FORWARD U · Unified Utility

User interface and HUD — The score, turns, target and outcome reflect the current engine state.

Engine mapping: studio-ui.js: renderHUD.

Check: Displayed HUD matches current engine counters.

Label source: user supplied.

## FORWARD V · Vector Velocity

Visual effects — Original CSS gems, clear flashes and earned-power badges expose real events.

Engine mapping: studio/index.html; studio-ui.js: renderBoard, animateTurn.

Check: All 64 rendered cells have distinct accessible identities.

Label source: user supplied.

## FORWARD W · Western Warfare

Win/loss states — Terminal states are immutable until a new attempt is explicitly started.

Engine mapping: studio-engine.js: swap, validate.

Check: Terminal status is valid; replay remains a separate action.

Label source: user supplied.

## FORWARD X · Xerox Exactness

Export/import and persistence — Versioned JSON transfers full state; malformed imports preserve the running game.

Engine mapping: studio-engine.js: save, restore; studio-ui.js: import/export.

Check: Save/restore preserves the exact current session.

Label source: user supplied.

## FORWARD Y · Yielding Light

Yield and game balancing — Six symbols, visible targets and earned powers create measurable tradeoffs.

Engine mapping: studio-engine.js: COLORS, initial, swap.

Check: Six-color rules and positive explicit target/budget.

Label source: user supplied.

## FORWARD Z · Zenith Zero

Zero-deadlock recovery — A dead board reshuffles without spending a move or resetting score.

Engine mapping: studio-engine.js: recover.

Check: An active settled board has at least one productive move.

Label source: user supplied.

## REVERSE Z · Zero Clearing

Zero-deadlock recovery — Verify zero-deadlock recovery without changing game state. A dead board reshuffles without spending a move or resetting score.

Engine mapping: studio-engine.js: recover.

Check: An active settled board has at least one productive move.

Label source: user supplied.

## REVERSE Y · Yield and game balancing · verification

Yield and game balancing — Verify yield and game balancing without changing game state. Six symbols, visible targets and earned powers create measurable tradeoffs.

Engine mapping: studio-engine.js: COLORS, initial, swap.

Check: Six-color rules and positive explicit target/budget.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE X · Export/import and persistence · verification

Export/import and persistence — Verify export/import and persistence without changing game state. Versioned JSON transfers full state; malformed imports preserve the running game.

Engine mapping: studio-engine.js: save, restore; studio-ui.js: import/export.

Check: Save/restore preserves the exact current session.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE W · Win/loss states · verification

Win/loss states — Verify win/loss states without changing game state. Terminal states are immutable until a new attempt is explicitly started.

Engine mapping: studio-engine.js: swap, validate.

Check: Terminal status is valid; replay remains a separate action.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE V · Visual effects · verification

Visual effects — Verify visual effects without changing game state. Original CSS gems, clear flashes and earned-power badges expose real events.

Engine mapping: studio/index.html; studio-ui.js: renderBoard, animateTurn.

Check: All 64 rendered cells have distinct accessible identities.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE U · User interface and HUD · verification

User interface and HUD — Verify user interface and hud without changing game state. The score, turns, target and outcome reflect the current engine state.

Engine mapping: studio-ui.js: renderHUD.

Check: Displayed HUD matches current engine counters.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE T · Turns and timers · verification

Turns and timers — Verify turns and timers without changing game state. Only accepted swaps spend turns; animation delays never change game rules.

Engine mapping: studio-engine.js: swap; studio-ui.js: animateTurn.

Check: Moves remain within budget, independent of rendering delays.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE S · Sound and accessibility · verification

Sound and accessibility — Verify sound and accessibility without changing game state. Opt-in generated sound, labeled native buttons, live status and reduced motion.

Engine mapping: studio-ui.js; studio/index.html.

Check: Current DOM labels, status announcements and explicit sound preference.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE R · Cascade resolution · verification

Cascade resolution — Verify cascade resolution without changing game state. Clear, activate, score, fall, refill and repeat to a stable board.

Engine mapping: studio-engine.js: swap, effects, settle.

Check: No unresolved match; bounded cascade traces and counters.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE Q · Quality assurance · verification

Quality assurance — Verify quality assurance without changing game state. Structural validation and executable rule/browser tests catch broken behavior.

Engine mapping: studio-engine.js: validate; studio.test.cjs; validation/studio-browser-check.cjs.

Check: Current state round-trips; full regression results remain a separate artifact.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE P · Power gems and boosters · verification

Power gems and boosters — Verify power gems and boosters without changing game state. Four-runs make line powers, intersections make blasts, five-runs make spectra.

Engine mapping: studio-engine.js: creations, powerSwap, effects.

Check: Current power types are supported; creation/activation counts are real.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE O · Objectives and outcomes · verification

Objectives and outcomes — Verify objectives and outcomes without changing game state. Target completion wins; exhausting moves below target loses.

Engine mapping: studio-engine.js: swap, validate.

Check: Outcome is consistent with current score and move budget.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE N · Neighbor validation · verification

Neighbor validation — Verify neighbor validation without changing game state. Edges cannot wrap into a false neighbor and diagonals are rejected.

Engine mapping: studio-engine.js: adjacent.

Check: Row-wrap and diagonal counterexamples are rejected.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE M · Match detection · verification

Match detection — Verify match detection without changing game state. Maximal horizontal/vertical runs merge into connected clear components.

Engine mapping: studio-engine.js: groups, components.

Check: Settled board has no unresolved normal match.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE L · Legal-move solver · verification

Legal-move solver — Verify legal-move solver without changing game state. Every proposed move is checked against adjacency, matches and powers.

Engine mapping: studio-engine.js: moves.

Check: All current candidates are legal adjacent pairs.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE K · Keyframe animations · verification

Keyframe animations — Verify keyframe animations without changing game state. Swaps, clear flashes and tile arrival animate with a reduced-motion path.

Engine mapping: studio-ui.js: animateTurn; studio/index.html: keyframes.

Check: Rendered animations exercised or reduced-motion alternative selected.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE J · Journey and progression · verification

Journey and progression — Verify journey and progression without changing game state. Score targets, retries and local win records make progress visible.

Engine mapping: studio-ui.js: recordOutcome; profile.js: award.

Check: Nonnegative score, budget and local run records.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE I · Invalid-swap rollback · verification

Invalid-swap rollback — Verify invalid-swap rollback without changing game state. A nonmatching swap restores the exact previous board and spends no move.

Engine mapping: studio-engine.js: swap / lastTurn.

Check: Rejected transaction signatures agree.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE H · Hint detection · verification

Hint detection — Verify hint detection without changing game state. Hints enumerate productive adjacent swaps without predicting refills.

Engine mapping: studio-engine.js: moves.

Check: A hint is present while active and is geometrically adjacent.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE G · Grid coordinates · verification

Grid coordinates — Verify grid coordinates without changing game state. Row/column and linear-index conversions preserve position.

Engine mapping: studio-engine.js: adjacent, groups.

Check: Index → row/column → index round-trips for all 64 cells.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE F · Falling gems and gravity · verification

Falling gems and gravity — Verify falling gems and gravity without changing game state. Surviving tiles preserve order and fall into cleared cells; new tiles enter above.

Engine mapping: studio-engine.js: settle.

Check: Every settled column contains eight valid tiles.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE E · Event sequencing · verification

Event sequencing — Verify event sequencing without changing game state. One committed rule transaction is presented before new input is accepted.

Engine mapping: studio-ui.js: locked; studio-engine.js: swap.

Check: UI lock state and atomic rule-phase status.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE D · Drag-and-swap input · verification

Drag-and-swap input — Verify drag-and-swap input without changing game state. Pointer gestures and keyboard/click selection enter the same swap transaction.

Engine mapping: studio-ui.js: pointer handlers, play.

Check: Actual pointer gesture count; keyboard-native tile controls.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE C · Cell and tile models · verification

Cell and tile models — Verify cell and tile models without changing game state. Stable tile identities carry a symbol and optional earned power.

Engine mapping: studio-engine.js: tile, validate.

Check: Unique IDs, bounded symbols, supported power types.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE B · Board generation · verification

Board generation — Verify board generation without changing game state. Seeded generation creates a stable, playable opening.

Engine mapping: studio-engine.js: initial, stableFill, recover.

Check: 64 cells, no initial free triples, at least one legal move.

Label source: implementation-defined verification label; original reverse name not supplied.

## REVERSE A · Absolute Arrival

Application architecture — Verify application architecture without changing game state. Separate pure rules, browser presentation, progression and inspection.

Engine mapping: studio-engine.js / studio-ui.js; engine.js / strategy.js.

Check: Supported schema and complete engine API.

Label source: user supplied.

