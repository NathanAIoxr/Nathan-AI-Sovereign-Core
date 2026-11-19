# Public app routes on Tabor Bridge

- [The Two-Plate Reckoning](https://tabor-bridge.nathantaboract.workers.dev/two-plate-reckoning/) · [Source](../two-plate-reckoning/)
- [Sorting Hats & Hatettes](https://tabor-bridge.nathantaboract.workers.dev/sorting-hats-hatettes/) · [Source](../sorting-hats-hatettes/)

Build each project to its named .mjs file. Deploy `serve-projects.mjs` as `tabor-bridge.js` beside the previous main module as `bridge-original.mjs` and retain the Worker settings and bindings. All other paths are delegated to the existing bridge module.
