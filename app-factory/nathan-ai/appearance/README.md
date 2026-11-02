# Nathan AI · Appearance Studio

A shared appearance system now covers all 28 Nathan AI HTML entry pages, including the existing book/research/game modules and the newer Assistant, Plugin Hub, Sovereign Connections, Node Runtime and Deep Archive.

## Skins and reading controls

Choose **Look & feel** in a page header, or open Appearance Studio from the main hub. The native dialog provides twelve palette choices: Original, Sovereign Midnight, Aurora, Oceanic, Library Parchment, Studio Light, Terminal, Graphite, Amethyst, Copper Sunset, High Contrast Dark and High Contrast Light.

Font (system, editorial serif, technical mono, spacious sans), text size (95/100/110/120%), density (comfortable/compact), page width (comfortable/wide/reading) and reduced interface motion are independent choices. Original preserves each page’s existing palette. Game logic, canvas artwork, original images and source wording are not rewritten. System reduced-motion preferences are always respected; this does not stop owner-started computational jobs or change game rules.

Changes preview immediately and save to the appearance-only localStorage key `nathan-ai.appearance.v1`. They restore across pages and update other open Nathan AI tabs through storage events. The existing ONE v061 shell uses a separate key and is not modified. Appearance Reset affects only these settings, never sources, wallets, projects, conversations or game saves. Storage failures retain the current visual preview and clearly report that it is not saved.

Export/import moves a small appearance-only JSON file between browsers. Only enumerated settings and one boolean are accepted; arbitrary CSS, URLs, private records and unknown content fields are not imported. Invalid files retain the current appearance. No external fonts, trackers, generated imagery or network theme services are used.

## Implementation

`engine.js` defines palettes, schema validation and token contrast calculation. `app.js` applies preferences before body render, then adds a native modal picker with keyboard focus restoration and a studio link. `shared.css` overrides supported surfaces under an app-scoped theme class, adds a six-percent outer gutter, and fixes long source identifiers/code wrapping at larger mobile text sizes. Page script references resolve relative to the one shared implementation; no copied theme engines or app-content migrations are needed.

The static local assistant server now serves `.mjs` files so the pre-existing games module works while viewing all themed pages through that server. Hidden files and Python source remain excluded.

`design-signal.json` records the composition contract used here: one primary reading/action anchor, a responsive modular grid, six-percent outer margins and explicit source/art preservation. The palette token pairs for text, muted text, accent labels and action text each meet at least 4.5:1 in tests. These token tests are scoped checks, not a certification of every legacy visual element.

## Validation

Run `node --test app-factory/nathan-ai/appearance/engine.test.cjs`. Tests cover all palettes, settings round trips, malformed/style-injection values, shared-engine coverage on every page and preference-key isolation. Chromium checks cover all twelve palette choices, all current pages at 390px with 120% text, font/density/width settings, reduced-motion preference, cross-page/cross-tab restore, settings import/export, invalid import retention and Escape/focus restoration. Visual review includes the mobile parchment picker. Existing project and ONE-shell preference values are compared before/after appearance changes and reset.
