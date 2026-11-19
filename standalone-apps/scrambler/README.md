# Scrambler · TABOR 1-2-3 FACTORY

Scrambler runs a fictional route in the browser. The default uses a simulated 110 mph highway leg, a 97-minute dinner stop, and a two-minute parking-lot goodbye. The highway leg defaults to 10 minutes because the brief specified its speed and left its duration open. Change the timings or speed, play or pause, jump to a stage, or export the timeline as simulation JSON.

The playback uses a schematic canvas and an elapsed-time clock. It works without GPS, location prompts, map SDKs, telemetry, external requests, or saved user inputs. The Cloudflare response denies geolocation to the document. Device privacy controls and official vendor instructions appear in the app.

- Play locally by serving this directory over HTTP.
- Run `node --test standalone-apps/scrambler/timeline.test.mjs`.
- Build the Cloudflare module with `node standalone-apps/scrambler/build-worker.mjs > worker.mjs`.
- Deploy that module to `nathan-tabor-platforms/tabor-scrambler`. The Tabor Apps dispatcher mounts it at `/tabor-apps/scrambler/`.
- The recovery index is available as [recovery.html](./recovery.html).

The recovery index preserves the four-door Prowler source as a distinct edition and adds the requested six-door concept. Original private artwork and family documents remain in the owner’s archive. The source index links to the recoverable public routes.
