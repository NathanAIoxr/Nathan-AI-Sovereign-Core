# Scrambler · TABOR 1-2-3 FACTORY

Scrambler runs a fictional route in the browser. The default uses a simulated 110 mph highway leg, a 97-minute dinner stop, and a two-minute parking-lot goodbye. The highway leg defaults to 10 minutes because the brief specified its speed and left its duration open. Change the timings or speed, play or pause, jump to a stage, or export the timeline as simulation JSON.

The playback uses a schematic canvas and an elapsed-time clock. The Cloudflare response denies geolocation to the document, and the simulator needs only first-party app files. Device privacy controls and official vendor instructions appear in the app.

The **Nathan AI route editor** turns text into a structured draft in the browser. Add one stage per line, for example `Highway at 110 mph for 10 minutes` or `Dinner for 1 hour 37 minutes`. Review the durations and speeds before applying. Scrambler shows simulated miles and splits moving time from stopped time. This editor uses a deterministic local parser.

Use **Save locally** to retain the applied route in this browser. Restore and import both open a draft for review. The app reads its saved route back to verify a save and checks imported totals against the stages. Original exports and version 2 exports are supported.

- Play locally by serving this directory over HTTP.
- Run `node --test standalone-apps/scrambler/*.test.mjs`.
- Build the Cloudflare module with `node standalone-apps/scrambler/build-worker.mjs > worker.mjs`.
- Deploy that module to `nathan-tabor-platforms/tabor-scrambler`. The Tabor Apps dispatcher mounts it at `/tabor-apps/scrambler/`.
- The recovery index is available as [recovery.html](./recovery.html).

The recovery index preserves the four-door Prowler source as a distinct edition and adds the requested six-door concept. Original private artwork and family documents remain in the owner’s archive. The source index links to the recoverable public routes.
