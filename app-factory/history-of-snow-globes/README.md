# The History of Snow Globes · Nathan Tabor

[Open the Book, Lab and Game](https://tabor-bridge.nathantaboract.workers.dev/history-of-snow-globes/) · [Chapter data](https://tabor-bridge.nathantaboract.workers.dev/history-of-snow-globes/chapters.json) · [Architecture diagram](https://tabor-bridge.nathantaboract.workers.dev/history-of-snow-globes/architecture.svg)

The manuscript, source links, experiment targets and controls are in `public/chapters.json`. The Canvas labs are qualitative teaching models. The reader can print the complete manuscript using Print book. The installed web app can reopen offline after a successful first load.

## Build and handoff

Run `npm test` to build and test, or `npm run build` to generate the two publishing outputs. Serve `dist/` from any HTTP static server for local testing. Cloudflare Pages can publish `dist/` with the build command `npm run build` and this folder as its project root. `wrangler.toml` points to the standalone `.release/worker.mjs` build. No runtime libraries are required.

The live deployment serves the project as its own dispatch Worker, `history-of-snow-globes`, reached through Tabor Bridge. `connect.mjs` defines the route and launch links for Tabor Bridge, Academy, Tabor World, and the Library of Tabor root pages. When redeploying an existing multi-module Worker, retain its other modules and bindings.

A verified 1878 description predates the Perzy workshop account. The 1889 souvenir association, disputed purpose of the Nimrud object, Thurneysser bird story and reported patent year are identified separately in the manuscript.

The lab tracker saves each experiment’s settings and completion locally in the current browser. The printable Lab worksheets view provides seven prediction, measurement and explanation exercises.
