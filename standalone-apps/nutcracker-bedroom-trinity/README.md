# The Nathan Tabor Trinity of the Nutcracker

The Bedroom is the 18+ design collection based on the clasped bronze hands. Each concept builds to an independently deployed Cloudflare Worker. The existing Tabor Cloudflare ingress forwards the dedicated `/18-plus/bronze-hands/` paths to the three Workers.

| Concept | Source | Cloudflare |
| --- | --- | --- |
| The King Solomon Salami Stroker | [Solomon](products/solomon.json) | [king-solomon-bronze-hands](https://unified-operations-cockpit.nathantaboract.workers.dev/18-plus/bronze-hands/king-solomon-bronze-hands/) |
| The Cleopatra Clit Caresser | [Cleopatra](products/cleopatra.json) | [cleopatra-bronze-hands](https://unified-operations-cockpit.nathantaboract.workers.dev/18-plus/bronze-hands/cleopatra-bronze-hands/) |
| Finger Me Holes Til Me Holy by the Virgin Mary | [Virgin Mary](products/virgin-mary.json) | [virgin-mary-bronze-hands](https://unified-operations-cockpit.nathantaboract.workers.dev/18-plus/bronze-hands/virgin-mary-bronze-hands/) |

Run `node build.mjs` to compile all three self-contained Workers to `dist/`. Pass `solomon`, `cleopatra` or `virgin-mary` to compile one. Build and test with Node.js 22 or later. Run `node --test` after the build.

For independent deployment, upload the chosen file as the main ES module via the Cloudflare Workers for Platforms API to the `nathan-tabor-platforms` dispatch namespace. Use the filename stem as the Worker name and compatibility date `2026-11-20`. The route table is in the [Tabor app dispatcher](../tabor-app-runtime/tabor-app-dispatch.mjs). Each site's `health` endpoint returns `ok`. The server-rendered 18+ question is self-attestation. Only a host-scoped cookie records an affirmative response, and the exit control clears it.

Each age-gated page shows its own matte silicone concept rendering in the existing palette. Solomon is slate blue, Cleopatra is muted plum, and Virgin Mary is warm ivory. The design section includes the shared color and packaging study. The historical design reference is the [Taranto museum’s nutcracker in bronze and gold foil](https://museotaranto.cultura.gov.it/en/objects-on-display/nutcracker-in-bronze-and-gold-foil/). The Solomon concept cites [Proverbs 5:19 in the KJV](https://www.biblegateway.com/passage/?search=Proverbs%205%3A19&version=KJV).

The [Conductor handoff](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/handoffs/nutcracker-bedroom) records the three URLs, the material, the GitHub review, and the published renderings. Its [read-only route source](../../deployments/conductor/handoffs/nutcracker-bedroom.mjs) is deployed as a module of the Conductor Worker.
