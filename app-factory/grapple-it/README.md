# Grapple It by Nathan Tabor

Play the [Cloudflare Worker](https://grapple-it.nathantaboract.workers.dev/).

- **Bubble Toy.** The four Hook & Ring prototype courses plus Tide Gate and Midnight Reef. Tap or hold Pump Air and steer. The fewest air pumps are recorded for each course.
- **Through the Ages.** Ancient Naval Warfare, Castle Walls, Wild West Frontier and Modern Rescue. Cast while the target is inside the center bracket. Toggle Reel and Ease to keep tension in the green. Medals reward clean casts and intact lines. Each clear unlocks the next era. Clearing all four unlocks PK Wild Card.
- **Daily Grapple.** A shared deterministic course per UTC day with a medal and time record on this browser. The game retains the last 60 daily records.
- **Grape 🍇 Apple 🍎.** An apple core and apple digits, with a grape head and limbs. The curator’s collection links the fictional courses to documented history.
- **Save codes.** Export or restore progress from within the game. A restore keeps the better record for each course.
- **Offline.** The service worker caches the game after one successful connected visit.

## Run and deploy

From this directory, run `node test.mjs` for the course simulations, then `node build.mjs` to generate the Worker asset module. Run `npx wrangler dev` to preview or `npx wrangler deploy` while authenticated to the owning Cloudflare account. The browser app has no package dependencies. `public/` contains the HTML, renderers and game rules.
