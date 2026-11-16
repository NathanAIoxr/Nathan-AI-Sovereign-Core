# Grapple It by Nathan Tabor

[Play on Cloudflare](https://grapple-it.nathantaboract.workers.dev/).

## Play

- **Water-Ring Toy.** Two independent air jets lift the ring, grapple, or anchor and push it in opposite directions. Press Grapple inside reach of the target. Play Ring & Pegs, Sunken Treasure, Mini-Sub Chase, and Swinging Sea Hooks.
- **Bubble Courses.** The six existing pump-and-steer courses keep their original records.
- **Through the Ages.** Twelve missions in four chapters. Ancient Naval Warfare includes Roman Harbor, Trireme Tow, and Corvus Crossing. Castle Walls includes Lantern Ring, Stone Wall Ascent, and Moat Swing. Wild West Frontier includes Runaway Stagecoach, Saloon Chandelier, and Runaway Cattle. Modern Rescue includes Cliff Rescue Sled, Skyscraper Gap, and Cliff Hiker Rescue. Bridge drops, releases and crossings require a second timed action. Climbs, herding, and rescue lifts have their own tension or progress rules. The in-game collection links to historical sources.
- **Grape 🍇 Apple 🍎.** Curator with an apple core, apple digits, and grape limbs. Talk to the curator, play as Grape Apple, or unlock and equip toy finishes.
- **Daily Grapple.** The original deterministic course per UTC date and its medal and time records stay available.
- **Save codes.** Export or restore progress from within the game. The new format includes Water-Ring Toy records and accepts version-one save codes. A restore keeps the better record for each course.
- **Offline.** The service worker caches the game after one successful connected visit.

## GRAPPLE Arcade

The six named gear tiers contain 24 standard playable gear trials. Each uses the motion, timing, or retrieval rule printed in the Gear Locker. A player opens the next tier by clearing a trial in the current tier. The **Family Reunion** challenge awards **Tabor Survivor**, **2,500 coins**, and the **Golden Piggy Bank Ring 🐽** after consecutive Nathan AI 🚀 Full On and PK 🐽 Full Chaos wins.

- **Forms and cast.** GRAPPLE offers Male 🍇 and Female 🍎 forms. Grape 🍇 Apple 🍎 is the curator. Nathan AI 🚀 is Absolute Intelligence. PK 🐽 has Wild Card and Full Chaos modes. The Arcade displays Nathan Tabor's authored wordmark and PK wording.
- **Nine expeditions.** Roman Harbor Mooring, Roman Naval Drive-By, Harbor Wreckage Dredging, Lantern Court Traverse, Castle Battlement Hook-Climb, Frontier Stagecoach Loop, Cowboy Rodeo Lasso, Modern Cliff Rescue, and Volcano Cliff Swing. Use supplied gear to land and retrieve at least two anchors within three casts and meet the point target.
- **Three-round brackets.** Solo against Nathan AI 🚀, or local pass-and-play 2v2. Each team has two attempts per round. The 2v2 order is Grape 1, Apple 1, Grape 2, Apple 2. Aggregate score decides the bracket.
- **Progress and saves.** Browser-local scores, gear unlocks, coins, forms, and rewards travel in the same save code as the retained Bubble Toy, historical campaign, and daily records. Restore accepts both earlier save-code versions and keeps higher records. The Family Reunion sequence uses the current open session.
- **Integration events.** The arcade publishes `grapple-it:arcade` events for station setup, recorded attempts, hits/misses, and completion. Each event identifies the mode and gear; scoring runs in the arcade module.

## Run and deploy

Run `node test.mjs` and `node arcade.test.mjs`, then `node build.mjs` to generate the Worker asset module. Run `npx wrangler dev` to preview or `npx wrangler deploy` while authenticated to the owning Cloudflare account. The browser app has no package dependencies. `public/` contains the HTML, renderers and game rules.
