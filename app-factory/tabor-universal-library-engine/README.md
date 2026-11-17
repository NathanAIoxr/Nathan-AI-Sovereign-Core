# v.7 Tabor Universal Library Engine by Nathan Tabor

The portrait workspace uses the 45/10/45 layout. Select a cartridge, interact in the upper panel, and complete the sequence below to load another top attempt. Device tilt is opt-in and direction controls are available. The original Hook & Ring, Grapple It, BIBLeTopia, Tracker Ball, and Dual-Screen Arcade releases are linked from the workspace.

## Catalog

- 101 numbered slots.
- Items 65–101 retain the original title, description, number, and class from Nathan Tabor's supplied ledger.
- The 64 earlier slots are reserved for the original source.
- 13 runnable numbered cartridges include the #101 loader and the #81 Circuit Lab preset. Five supplemental drills include Hook & Ring, Grapple It, BIBLeTopia, Sword-Play, and Fishing-Rod Line Release.
- Classroom models are simplified, use normalized quantities, and describe their own controls. The personal vault saves tagged text notes in the current browser. The Cast presents authored or rule-triggered lines.

## Code and build

The build reads Tracker Ball quaternion and digit input modules, the existing TactileCore/Hook & Ring touch helpers, and Grapple It's fixed-step clock and rope. It builds the Arcade bridge and timing rules directly from the original Dual-Screen Arcade source. The generated extraction and Worker are ignored in Git.

From the repository root, run:

    node app-factory/tabor-universal-library-engine/build.mjs
    node --test app-factory/tabor-universal-library-engine/test.mjs

Run a development server from the repository root after building. Open app-factory/tabor-universal-library-engine/public/index.html. To deploy using Wrangler in this project directory, build first, then run wrangler deploy.

Circuit Lab accepts the LC_TK_CIRCUITS_V7 schema from public/catalog.json. Imported packs affect the current browser session. Physics parameters and text are validated before use.

Official classification outline: https://www.loc.gov/aba/cataloging/classification/lcco/
