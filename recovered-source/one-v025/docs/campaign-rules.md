# Private ONE v025 — THE 33 Strategy Campaign

By Nathan Tabor · NATHAN AI → TABOR ROOT → TABOR WORLD™.

This private working version retains the entire ONE app and all 33 classic stages, and adds a full 33-guardian strategy campaign. All development in this expansion is under `/workspace/private/ONE_v025`. The separate Git checkout is preserved; this build does not publish or upload anything.

## Open and run

- ONE master: `app-factory/one/index.html`, then the Trials tab.
- Standalone game in the exported package: `THE_33_PRIVATE_v025.html`.
- Source game: `app-factory/one/trial-matrix/index.html`.
- Engineering Studio: `app-factory/one/trial-matrix/studio/index.html`, or `AZ_STUDIO_PRIVATE_v025.html` in the exported package.
- All 52 layers: `AZ_52_LAYERS_v025.json`. Full engineering blueprint: `AZ_TECHNICAL_BLUEPRINT_v025.md`.

From the extracted package root, run `python3 -m http.server 8002 --bind 127.0.0.1`. Use its paths locally. The standalone HTML embeds every game script and does not require a service, account, package installation, or external assets. Browser handling of directly opened local files varies; local serving is the tested path.

Node 22+ runs the rules tests. Python 3 handles local serving and packaging. Neither is needed by a browser already displaying the bundled game.

## Rootkeep: settlement → team → stage → battle → rewards

Open `ROOTKEEP_PRIVATE_v025.html` in the exported package, or `app-factory/one/trial-matrix/realm/index.html` from the source app. ONE and both existing games link to it. It is a companion RPG loop; the original 33 cognitive trials and A–Z Studio remain playable.

Rootkeep contains a skippable three-move guest tutorial, seven upgradable buildings, ten earned heroes, five elemental support troops, a 33-stage world map, and deterministic seven-row/five-lane battles. Build, train, fight, then use the rewards. Workshop, automation rules and reminders are optional collapsed controls. Full rules and replay commands are in [ROOTKEEP.md](rootkeep.md).

Both games remain $0 to play. Rootkeep has no energy gates, paid summons, accounts or construction waits. Its local save uses `one.private.v025.realm.v1` separately from the cognitive campaign. Excess food and iron go into a 48-hour inbox. A saved crafting pack makes a batch atomically. Auto-play respects the selected opening-lane filter, can conserve skills for the last wave and avoids healing a healthy party. Hero skills and primary combat controls stay in a bottom thumb dock.

The browser client is self-contained: no external textures or silent asset downloads are needed. This is a browser package, not an App Store binary. It implements local play and exports replay data; it does not claim a hosted authoritative server, online alliance results, or background mobile push delivery. Utility reminders are explicit browser opt-ins while open, with calendar export available for device scheduling.

The preceding complete private v025 package is preserved at `/workspace/private/history/v025-before-realm/`.

## The Tabor Decimal System — by Nathan Tabor

The custom framework now powers explicit binary gates, exact positional combat scaling, purpose-based asset lookup and conserved capacity handling. Rootkeep exposes it in one optional, credited panel. Existing active saves and replays remain compatible; current Storehouse limits and surplus protection remain in place. See [TABOR_DECIMAL_SYSTEM.md](tabor-decimal-system.md) for implementation details and scope. The uploaded source is preserved byte-for-byte under `references/tabor-decimal/`, and the prior complete v025 build is preserved in `/workspace/private/history/v025-before-tabor-decimal/`.

## What v025 adds

- **Campaign and practice:** retain classic rules or add a contested-board guardian duel. Both are free, and all stages are available immediately.
- **33 guardians:** every stage has a named opponent, field manual, and optional mastery contract. Stages 11, 22 and 33 are three-phase bosses with changing symbol shields.
- **Four temperaments:** Collectors favor tile count; Saboteurs contest your objectives and contract openings; Architects favor long/multiple groups; Echo guardians follow your last-cleared symbol, allowing deliberate baiting.
- **Reactive opponents:** Ancient guardians commit to an announced opening. Industrial guardians can replan at reduced attack strength if that opening disappears. Grandmaster guardians and Future bosses in their final phase hunt a fresh opening. The opponent executes real legal board moves, changes the remaining opportunities, and advances shared mechanisms. Concordia uses echo strikes to preserve alternating human players.
- **Tactical stances:** Balanced preserves full base damage; Precision rewards long opening runs; Cascade rewards score beyond the opening baseline; Fortify trades damage for shield.
- **Focus powers:** Ward, Gambit and Transmute use a finite, earned-in-play resource, not purchased currency. One ability per player turn. Fixed tiles and structural voids are never bypassed.
- **Symbol forecasts:** commit to the most common symbol in the opening clear before playing it. Correct calls add damage and focus; misses lose focus. The player chooses whether to make a forecast.
- **Strategy lab:** compare five candidate openings with visible objective gain, contract gain, and contested guardian cells. No RNG peeking, refill simulation, or promised future cascades. Hidden memory tiles must be studied before player analysis; unknown weights remain unknown.
- **Daily seeds:** date, stage and difficulty generate a reproducible UTC challenge. There is no online leaderboard or server-backed competition.
- **Persistent mastery:** campaign difficulty medals, best turns and contract achievement survive local saves and JSON export/import. Existing classic saves and profiles remain importable. Completion rewards are never duplicated by a campaign replay.
- **Precise controls:** campaign swipes, tap-to-deselect, directional keyboard focus, Home/End and Escape. Stage-specific movement rules remain enforced. Following a drag, the next deliberate tap works immediately.
- **Active-time spiral:** manual pause freezes board input and the entropy feed. Hidden tabs pause automatically. Resuming preserves the unused part of the 2,000 ms interval, without injecting time spent in the background. Saved spiral sessions reopen paused. Other stages remain untimed.
- **Recoverable saves:** both games keep the previous distinct validated autosave. Recovery retains the current valid state as the alternate copy. Invalid originals remain untouched during ordinary play; recovery/import preserves their exact bytes separately, with a download action. Redundant reloads do not consume the useful recovery generation.
- **Transactional turns:** both browser games resolve a turn on a validated temporary state and commit only after resolution succeeds. An unexpected engine exception preserves the live board and last saved state.
- **Attempt review:** completion and defeat show a nearby summary, targeted retry advice, same-seed replay and direct next-trial navigation. Difficulty medals and optional contract achievements remain part of the existing profile.
- **Usable on phones:** quick Board/Guardian/Hint/Play/Guide controls, local feedback beside the board, and responsive layouts.

## A–Z Structural Gateway Studio

A separate original 8×8 Match-3 workbench lives alongside THE 33, linked from ONE and the campaign. It implements adjacent drag/click/keyboard swaps, exact invalid-swap rollback, six symbols, gravity, cascading score, earned line/blast/spectrum powers and their combinations, animation input lockout, optional generated audio, reduced-motion presentation, local persistence and JSON transfer.

Four-runs earn a row/column power. Intersections earn a 3×3 blast. Five-runs earn a spectrum. A spectrum swapped with a normal gem clears that symbol; two spectra clear the board. Spectrum+power converts the target symbol into that power, then resolves its chain. Earned powers are protected in their creation wave. Each cleared tile scores `10 × cascade depth`; activations add 25. The goal is 1,200 in 30 accepted moves. Cascade resolution is bounded to 32 waves and traces to eight frames; overflow is stabilized without awarding unperformed clears. Dead-board recovery preserves score, moves and tile IDs, shuffling first and regenerating colors only when repeated shuffles fail.

The inspector contains all 26 supplied forward labels and 26 reverse entries in Z–A order. The supplied reverse endpoint names are preserved. The other 24 reverse labels are implementation-defined verification labels, explicitly marked in the UI, JSON and technical blueprint. Reverse inspection is a read-only view, not a reversal operation. Pass denotes an observed invariant; Ready denotes a feature not yet exercised in this browser session. Runtime checks are not mislabeled as 52 regression tests. Downloadable JSON includes labels, definitions, engine mappings, check descriptions and provenance.

Studio uses separate storage `one.private.v025.studio.v1`; it does not alter campaign rewards. Its artwork and rules are original local implementations. The six linked engines/artwork examples are user-supplied development references, not imported code/assets or independently verified license claims. Follow the linked current license before importing any third-party material.

## Exact campaign rules

A win requires **both** the board objective and zero guardian health. A loss occurs at zero player health, the campaign player-turn budget, or the spiral’s entropy void. The classic move cap is replaced by the campaign budget; shared guardian turns do not consume the player-turn budget.

| Difficulty | Player health | Guardian health | Player turns | Attack scale | Cadence |
|---|---:|---:|---:|---:|---|
| Explorer | 220 | 60 | 90 | ×0.65 | Every second player turn |
| Tactician | 150 | 100 | 75 | ×1 | Every player turn |
| Grandmaster | 110 | 150 | 60 | ×1.25 | Every player turn |

Bosses add 30 health. Their shield follows the visible phase and halves damage from its matching dominant opening symbol. Three phases divide the health bar into thirds. A defeated guardian stops acting while you finish any remaining board work.

A productive player turn deals `min(24, 6 + floor(sqrt(score gained)))` base damage. Precision multiplies by 1.3 for an opening run of 4+, otherwise 0.9. Cascade multiplies by 1.25 when score exceeds the opening baseline (10 per tile in stages 6–33; 100 per structural group in stages 1–5), otherwise 0.8. Fortify multiplies damage by 0.75 and adds 5 shield. Multiplications are rounded as applied.

A productive turn gains 1 focus plus 1 for an opening run of 4+; focus caps at 6. Ward costs 3 and gives 16 shield up to 36. Gambit costs 2, multiplies next-turn outgoing damage by 1.5 and incoming by 1.35. Transmute costs 3 and advances one selected active symbol by one, applying the same change to the corresponding resonance tile. Abilities do not spend a board turn and only one is allowed before the next player move.

Forecast ties use the first value in `△ ○ □ ◇` order. A correct call gives 5 damage and 1 focus, and a miss costs 1 focus. A forecast cannot be revised until the next accepted board move. Nonmatching swaps in stages 6–33 return without spending a turn; the original geometry engines retain their original setup moves.

The guardian’s damage is `round((4 + min(12, opening tiles / 2)) × difficulty × adaptation × gambit)`, at least 1. Adaptation uses 0.7 when applicable. Shield absorbs incoming damage first. Guardians choose only from the current board and never read future refill randomness. They can read concealed memory symbols, just as the player can with free Study. Intent markers describe an opening, not a guarantee that gravity will leave it available.

Rooms, balanced sectors and seals are shared board-state objectives: guardian clears also advance those physical objectives. Ordinary scores and target/value points remain the player’s own. Guardian turns never earn the player score or focus. Opening-based mastery counters and optional contracts are not IQ or medical measures.

## Stage field manual

### 01 · THE MONOLITH

Guardian: **The Counterweight** · Collector.

Build repeated values near the anchor before committing a mirrored clear. A wide clear is valuable, but keeping a second triple ready maintains pressure.

Optional mastery: Make four productive mirrored swaps.

### 02 · BABYLON’S GATE

Guardian: **The Gatekeeper** · Saboteur.

Choose one core symbol and count how far both rings must travel. The biggest immediate radial clear can expose a stronger guardian alignment.

Optional mastery: Score using both outer and inner ring controls.

### 03 · THE RHOMBUS OF UR

Guardian: **The Surveyor** · Architect.

Read the diagonal lanes, not the visual horizontal rows. A lower clear changes two sloping supply lanes; inspect both before choosing.

Optional mastery: Make four productive diagonal swaps.

### 04 · EPIDAURUS ACOUSTIC

Guardian: **The Echo** · Echo.

Choose the bottom-bed symbol by the number of matching tiles above it. Bank upper combinations before firing; an early small shockwave can waste setup.

Optional mastery: Fire three root-bed shockwaves.

### 05 · ARCHIMEDES’ SPIRAL

Guardian: **The Maw** · Collector.

Keep matching opportunities near the outer feed. A large clear buys time. Three separated copies can be compressed with setup swaps; fewer than three copies need another feed.

Optional mastery: Clear five matching spiral segments.

### 06 · NILE WATERWAYS

Guardian: **The Sluicekeeper** · Saboteur.

Eastern gravity can create follow-up rows without vertical falling. Compare the guardian’s marked cells with the lane you are about to drain.

Optional mastery: Clear both a horizontal and a vertical match.

### 07 · MAYAN CALENDARS

Guardian: **The Clocksmith** · Architect.

Plan where the counter-rotation will place your remaining pairs. A short clear on the quiet calendar can deny the guardian a large one.

Optional mastery: Clear matches in both calendars.

### 08 · MNEMOSYNE’S MEMORY

Guardian: **The Archivist** · Echo.

Study a move, hide the board, then execute your plan from memory. Study is always free. Rebuild your mental map after a cascade changes the board.

Optional mastery: Make two productive moves while symbols are hidden.

### 09 · CAESAR’S CIPHER

Guardian: **The Scribe** · Collector.

Use the visible key to read the current board, then anticipate row shifts. An apparent letter pair can stop being a pair after the next row-dependent change.

Optional mastery: Score under three different cipher keys.

### 10 · KNOSSOS LABYRINTH

Guardian: **The Minotaur** · Saboteur.

Leave completed rooms and search for an unvisited room first. A room already solved can still supply combat damage while you prepare another room.

Optional mastery: Complete all nine rooms.

### 11 · ROSETTA TRILINGUAL

Guardian: **The Three Tongues** · Architect · Epoch boss.

Use the legend to translate values before comparing neighboring rows. This guardian is an epoch boss: its visible shield symbol changes as its health falls.

Optional mastery: Clear tiles from all three scripts.

### 12 · NEWTON’S INVERSION

Guardian: **The Counterfall** · Echo.

Refill comes from below: top-row opportunities are the destination, not the source. The guardian shares the board; denying its best upper match can be stronger than raw damage.

Optional mastery: Clear three tiles from the top row.

### 13 · ARKWRIGHT’S ASSEMBLY

Guardian: **The Overseer** · Collector.

Look beyond the conveyor’s current row: movement creates the next opening. Long lines charge focus faster, but the shifted row may hand a line to your opponent.

Optional mastery: Make two opening matches of four or more.

### 14 · BABBAGE’S ENGINE

Guardian: **The Automaton** · Saboteur.

Read the next gravity before choosing the source of a cascade. Guardian moves also advance the shared mechanism. Its turn can change your next direction.

Optional mastery: Score under all four programmed gravity directions.

### 15 · ENIGMA ROTORS

Guardian: **The Cipherwright** · Architect.

Watch the announced rotor column, then compare possible lines after its shift. Do not value a pair solely by its current value when the rotor will change it.

Optional mastery: Score while three different rotor columns are next.

### 16 · MENDELEEV’S TABLE

Guardian: **The Alchemist** · Echo.

Compare value per clear, not only the number of cleared tiles. Focus and damage come from a productive turn; high-value objectives still decide the board win.

Optional mastery: Clear six opening tiles currently worth at least three.

### 17 · TESLA’S ALTERNATOR

Guardian: **The Alternator** · Collector.

Think in two-turn supply lines: gravity reverses after every shared-board move. Denying a guardian turn can preserve a polarity that would otherwise reverse.

Optional mastery: Score with both gravity polarities.

### 18 · TURING’S FEEDBACK

Guardian: **The Predictor** · Saboteur.

Leave a supply of the next target rather than emptying one symbol indiscriminately. Large off-target clears can win a combat exchange while delaying the board objective.

Optional mastery: Make three productive target-symbol moves.

### 19 · VON NEUMANN’S RIVAL

Guardian: **The Gamekeeper** · Architect.

Use the intent marker to decide which match to take away. Industrial guardians can adapt to a disrupted plan, but their replacement attack is weaker.

Optional mastery: Disrupt three announced guardian moves.

### 20 · SHANNON’S CHANNEL

Guardian: **The Noise** · Echo.

Vertical clears can rebuild the board, but only horizontal groups transmit progress. A vertical denial move may be correct even when it yields no objective points.

Optional mastery: Clear fifteen opening tiles in horizontal lines.

### 21 · APOLLO GUIDANCE

Guardian: **The Navigator** · Collector.

The guidance cycle skips a direction every third shared turn. Use the current announcement, not a memorized four-step cycle.

Optional mastery: Score under three guidance directions.

### 22 · NASH EQUILIBRIUM

Guardian: **The Negotiator** · Saboteur · Epoch boss.

Protect the less-developed sector; the completed half cannot finish the board for you. This boss contests high-value matches. Defensive stance preserves time to restore balance.

Optional mastery: Score from both sectors.

### 23 · SCHRÖDINGER’S TILES

Guardian: **The Observer** · Architect.

Read both values before moving a tile; both travel together. Changing phase reveals different openings for free; the guardian can still return to its committed phase.

Optional mastery: Score in both light and dark states.

### 24 · TESSERACT PROJECTION

Guardian: **The Fold** · Echo.

Cross-plane swaps move one coordinate while preserving the other three. A remote counterpart can complete a line that ordinary grid adjacency cannot reach.

Optional mastery: Clear tiles from all four projected planes.

### 25 · STROOP INTERFERENCE

Guardian: **The Contradiction** · Collector.

Say the printed word internally before choosing; ink is a deliberate distraction. The analysis describes values, never assumes that the ink color is the matching value.

Optional mastery: Clear all four printed words.

### 26 · ARCHIMEDES’ HIDDEN WEIGHTS

Guardian: **The Silent Mass** · Saboteur.

Inspect freely, then choose whether a heavy group or a denial move is more valuable. Unknown weights are not exposed by the public-information analysis.

Optional mastery: Clear four opening tiles with weight four.

### 27 · PILLARS OF CONSTANTINOPLE

Guardian: **The Sentinel** · Architect.

Fixed pillars split falling lanes and cannot be removed by an ability. An isolated column needs vertical preparation rather than a horizontal rescue.

Optional mastery: Clear tiles from three movable columns.

### 28 · HUYGENS’ RESONANCE

Guardian: **The Twin** · Echo.

Read both chambers before swapping; only corresponding matched positions clear. Transmutation changes both counterparts together, preserving the stage’s symmetry.

Optional mastery: Make four productive synchronized moves.

### 29 · MAXWELL’S GATE

Guardian: **The Demon** · Collector.

Prepare the next gate symbol before consuming the current one. Off-target damage is allowed, but it cannot substitute for the gate’s objective.

Optional mastery: Make three productive gate-symbol moves.

### 30 · CHRONOS RESERVE

Guardian: **The Timekeeper** · Saboteur.

Use the first two moves to prepare the row above the reserve. The reserve remains protected until its rule opens it; abilities cannot bypass it.

Optional mastery: Clear three tiles from the released reserve row.

### 31 · ARIADNE’S BRIDGES

Guardian: **The Threadcutter** · Architect.

Read the bridge endpoints as neighbors even though they look separated. Bridges permit swaps, not gravity; supply still stops at structural voids.

Optional mastery: Make a productive swap across a published bridge.

### 32 · CONCORDIA COOPERATION

Guardian: **The Chorus** · Echo.

Discuss the shared target, then let the other player execute their own turn. The guardian makes echo strikes here without taking a board turn, so human roles keep alternating.

Optional mastery: Have both local players make a productive move.

### 33 · ZENITH ZERO

Guardian: **The Null King** · Collector · Epoch boss.

Reduce the seals while managing focus and reading the boss’s changing shield. A win requires all seals gone and the guardian defeated. Finish one objective while maintaining the other.

Optional mastery: Make three correct symbol forecasts.

## Saves and privacy

V025 uses `one.private.v025.progress.v1` in browser localStorage, keeping its live state separate from the earlier prototype. Export includes the complete current session, profile, campaign choices, guardian intent, focus, health and mastery. Local storage is not a remote Main Database sync and can be cleared by the browser. Keep an independent JSON backup. Invalid imports preserve the current game. A malformed existing save is not overwritten automatically, and unavailable storage still permits play and export. Each game uses its own `.backup` recovery copy and `.damaged` preserved original alongside the primary key. Recover previous autosave explicitly restores that older generation; it does not merge progress from two runs. If preserving a backup fails because storage is full, the primary remains intact and the interface requests a JSON export. These copies share browser storage limits; an exported JSON file is the independent backup. The previous packaged v025 build is retained separately in `/workspace/private/history/v025-before-refinement/`.

This package is a new private development version based on the available working ONE source. It does not claim to recover an unavailable earlier private package or manuscript. Historical and fictional guardian names are game themes. No network telemetry, payments, hidden physiological measurements, or standardized cognitive assessment is implemented.

## Validation and reproducible build

```sh
node --test app-factory/one/trial-matrix/*.test.cjs app-factory/one/one.test.cjs app-factory/one/library/library.test.cjs app-factory/one/trials/trials.test.cjs app-factory/quality.test.cjs app-factory/core/root-contracts.test.cjs
# Optional browser validation in an environment with Playwright and Chromium:
node validation/browser-check.cjs
node validation/studio-browser-check.cjs
node validation/resilience-browser-check.cjs
node validation/realm-browser-check.cjs
node validation/tabor-browser-check.cjs
python3 build_private_v025.py
```

The browser check expects the local Python server on port 8002; set `ONE_V025_URL` and `CHROMIUM_PATH` to use another local server or Chromium installation. Browser tooling is only needed for development validation, not playing the game.

`build_private_v025.py` creates self-contained campaign and Studio HTML files, the 52-layer JSON, engineering blueprint and a full private ONE ZIP outside the source directory, then verifies archive CRCs and every file’s SHA-256 digest. `BASE_SNAPSHOT_SHA256.json` records the preserved starting source. `preserved/ONE_BASE_BEFORE_v025.zip` contains those original bytes, verified against all recorded SHA-256 hashes. `VERSION.json` identifies this version and its boundaries. Tests cover actual classic and campaign wins on all 33 stages, exact resume, both victory requirements, defeat, live guardian board changes, fair analysis, ability costs, hidden-memory execution, forecasts, seeds, malformed data and mastery migration.

Refinement validation covers active-time pause/resume and fractional intervals, simulated hidden-tab events, paused reload, damaged-save recovery and byte preservation, quota failures, atomic invalid imports, swipe/cancel/focus behavior, immediate post-swipe input, and injected resolution exceptions in both browser engines. Browser campaign completion uses a controlled clock with explicit spiral feed advances so rendering speed cannot change the tested puzzle.
