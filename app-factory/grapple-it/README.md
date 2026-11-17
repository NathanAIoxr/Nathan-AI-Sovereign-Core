# Grapple It by Nathan Tabor

Play on [Cloudflare](https://grapple-it.nathantaboract.workers.dev/).

| Mode | How it plays |
| --- | --- |
| Water-Ring Toy | Use two independent air jets and Grapple to play Ring & Pegs, Sunken Treasure, Mini-Sub Chase, and Swinging Sea Hooks. |
| Bubble Courses | Pump air and steer through Harbor Lift, Canal Crossing, Orchard Lift, Sunken Salvage, Tide Gate and Midnight Reef. The fewest pumps are recorded separately for each course. |
| Catch & Swing | On each of those six courses, move the ball through its anchors, latch to the last anchor, build a pendulum swing, and release into the goal. A missed release returns the ball to the anchor for another attempt. |
| Through the Ages | Sixteen missions: the twelve original missions across Ancient Naval Warfare, Castle Walls, Wild West Frontier, and Modern Rescue, plus Salvage Pier, Night Market, Floodgate, and Hog Wild. Bridge crossings, climbs, herding and rescue lifts keep their distinct actions. Medals reward clean casts and intact lines. Campaign progression and the original four-headline-course condition for PK Wild Card carry forward. |
| Toss & Target Arcade | Thirty-two playable cartridges across seven eras. Five reusable rule sets handle arc flight and drift, rotation and landing, pendulum release, rhythm timing, and ordered precision tracing. Three attempts earn medals and open the next era. Turn on PK Wild Card after opening Hog Wild. |
| Daily Grapple | The deterministic UTC challenge continues its original rotation. The most recent 60 dated records are kept on this browser. Players may also post a replay-checked result to the D1 leaderboard. |

Talk to the curator, play as Grape Apple, or unlock four toy finishes. The Grape-Apple Curator uses an apple core, grapes for the head and limbs, and small apples for the fingers and toes. The Male and Female GRAPPLE form options share scoring and progression. Nathan Tabor’s GRAPPLE notation and PK origin line are preserved in the game. The Curator’s collection credits published historical references and describes the fictional courses.

## Controls and progress

Water-Ring Toy, Bubble Courses and Catch & Swing support touch, mouse and keyboard. On the arcade board, aim with drag or with the two sliders. For tracing, draw through the numbered checkpoints in order, or use the sliders and Mark checkpoint. Use Release or Strike for timing challenges. The five arcade rule sets are arcade simulations for scored props and targets.

The game saves on this device. Save codes transfer Water-Ring Toy, Bubble Courses, campaign, daily, Catch & Swing and arcade records, plus the selected form. Existing versions 1 and 2 still import. Records merge by the best result for each course. The service worker caches the game for offline play after a connected visit.

## Gear Trials & Tournaments

Gear Trials adds time-and-retrieve challenges alongside the Toss & Target cartridges. The six named gear tiers contain 24 standard playable gear trials. Each uses the motion, timing, or retrieval rule printed in the Gear Locker. A player opens the next tier by clearing a trial in the current tier. The **Family Reunion** challenge awards **Tabor Survivor**, **2,500 coins**, and the **Golden Piggy Bank Ring 🐽** after consecutive Nathan AI 🚀 Full On and PK 🐽 Full Chaos wins.

- **Forms and cast.** GRAPPLE offers Male 🍇 and Female 🍎 forms. Grape 🍇 Apple 🍎 is the curator. Nathan AI 🚀 is Absolute Intelligence. PK 🐽 has Wild Card and Full Chaos modes. The Arcade displays Nathan Tabor's authored wordmark and PK wording.
- **Nine expeditions.** Roman Harbor Mooring, Roman Naval Drive-By, Harbor Wreckage Dredging, Lantern Court Traverse, Castle Battlement Hook-Climb, Frontier Stagecoach Loop, Cowboy Rodeo Lasso, Modern Cliff Rescue, and Volcano Cliff Swing. Use supplied gear to land and retrieve at least two anchors within three casts and meet the point target.
- **Three-round brackets.** Solo against Nathan AI 🚀, or local pass-and-play 2v2. Each team has two attempts per round. The 2v2 order is Grape 1, Apple 1, Grape 2, Apple 2. Aggregate score decides the bracket.
- **Progress and saves.** Browser-local scores, gear unlocks, coins, forms, and rewards travel in the same save code as the retained Bubble Toy, historical campaign, and daily records. Restore accepts save-code versions 1 through 4 and keeps higher records. The Family Reunion sequence uses the current open session.
- **Integration events.** The arcade publishes `grapple-it:arcade` events for station setup, recorded attempts, hits/misses, and completion. Each event identifies the mode and gear; scoring runs in the arcade module.

## Run and deploy

From this directory, run `node test.mjs` and `node arcade.test.mjs` for the rule and course simulations, then `node build.mjs` to generate the Worker asset module. Use `npx wrangler dev` to preview or `npx wrangler deploy` with access to the existing `grapple-it` Worker. The browser game has no package dependencies.

## Physics and input

- The gameplay clocks advance in 240 fixed steps per second of simulated time. Rendering remains on the display clock. Long pauses are capped, and backgrounding a tab clears held input. Catch & Swing uses a 16-node constrained rope around the existing pendulum and a swept goal check in flight.
- Toss & Target uses the Hook & Ring One Euro filter and 50 ms contact history with a 16 ms lift-off guard. A release in the outer 5% cancels without using a shot. Gesture feedback uses the existing Tabor Tracker Ball classifier and reports approximate millimeters at the browser's CSS reference scale, release speed, rotation and power. Haptics use browser vibration where supported. Buttons, sliders and key controls remain available.
- The Precision Circuit brings Skip-Stones, Frisbee Chains, Bolas, Chain Wrap, Snowball Toss, Cupid Hearts, Pumpkin-Stem Hook and a Fourth of July Sparkler Ring into the five existing cartridge engines.
- Universal Bridge pairs any Toss & Target cartridge with a sequence puzzle. Completing the sequence adds one shot, one damage buff and one shield. Those rounds have their own score and do not affect single-cartridge medals.
- Daily Grapple uses the original UTC course rotation. On a successful run, the browser can submit a bounded timeline of casts, reels and eases. The Worker replays the same physics and derives medal and duration. D1 retains the best posted score per browser ID per date. The board is ranked by medal and simulation time. Only an explicit post sends the replay and display name. The D1 record contains the browser ID, date, display name and verified result. Online submissions and reads are rate limited.

Apply the D1 migration with `npx wrangler d1 migrations apply grapple-it --remote` before deploying with a new database. On Node with SQLite available, `node technology.test.mjs` exercises the timing, release guard, rope, bridge, replay and database ranking paths.

## Release Bees

The separate `grapple-it-bees` Worker runs launch, Daily Grapple API, offline shell, and mobile-runtime checks every five minutes. Its service binding reads the production Grapple It Worker. The latest public status is at [Grapple It Bee status](https://grapple-it-bees.nathantaboract.workers.dev/status). The last seven days of receipts are kept in `grapple_bee_runs`, separate from scores. The endpoint marks records older than thirteen minutes as stale.

Run `node release.test.mjs` for animation lifecycle, offline recovery, and passing and failing Bee receipts. Deploy the Bee Worker from `bee/` after applying `bee/migration.sql` to the Grapple It database.

## 101 Applications

Nathan Tabor's catalog maps 101 characters, objects, places, concepts, recordings, workflows, datasets, and other entities onto the five existing physics chassis. The Library of Tabor uses 21 subject classes. See the [source classification outline](https://www.loc.gov/aba/cataloging/classification/lcco/). Three-digit numbers are game entry IDs. Filter by subject, entity type or mechanic, inspect the entry's attributes and traits, and launch its configured challenge. Each entry has a shareable deep link and separate medal in the save code. The Universal Bridge sequence game can pair with any entry.

Run `node --test atlas.test.mjs` to verify coverage, search, score restoration, and that every challenge is winnable.
