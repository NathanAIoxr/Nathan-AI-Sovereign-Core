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

## Run and deploy

Run `node test.mjs`, then `node build.mjs` to generate the Worker asset module. Run `npx wrangler dev` to preview or `npx wrangler deploy` while authenticated to the owning Cloudflare account. The browser app has no package dependencies. `public/` contains the HTML, renderers and game rules.
