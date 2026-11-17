# v.7 Tabor Universal Library Engine by Nathan Tabor

The workspace uses the 45/10/45 layout on wider screens. On phones the play area, bridge and controls follow normal page scrolling. Select a cartridge, interact in the upper panel, and complete the sequence below to load another top attempt. Device tilt is opt-in and direction controls are available. The original Hook & Ring, Grapple It, BIBLeTopia, Tracker Ball, and Dual-Screen Arcade releases are linked from the workspace.

## Catalog

- 101 numbered slots.
- Items 65–101 retain the original title, description, number, and class from Nathan Tabor's supplied ledger.
- Items 1–64 come from the Tracker Ball branch supplement. The separate 101-entry Tabor World numbering is kept alongside it.
- 13 runnable numbered cartridges include the #101 loader and the #81 Circuit Lab preset. Five supplemental drills include Hook & Ring, Grapple It, BIBLeTopia, Sword-Play, and Fishing-Rod Line Release.
- Classroom models are simplified, use normalized quantities, and describe their own controls. The personal vault saves tagged text notes in the current browser. The Cast presents authored or rule-triggered lines.

## Code and build

The build reads Tracker Ball quaternion and digit input modules, the existing TactileCore/Hook & Ring touch helpers, and Grapple It's fixed-step clock and rope. It builds the Arcade bridge and timing rules directly from the original Dual-Screen Arcade source. The generated browser module is checked in for static hosts. Regenerate it with the build command when changing the original Arcade bridge or timing rules. The bundled Worker is ignored in Git.

From the repository root, run:

    node app-factory/tabor-universal-library-engine/build.mjs
    node --test app-factory/tabor-universal-library-engine/test.mjs

Run a development server from the repository root after building. Open app-factory/tabor-universal-library-engine/public/index.html. To deploy using Wrangler in this project directory, build first, then run wrangler deploy.

Circuit Lab accepts the LC_TK_CIRCUITS_V7 schema from public/catalog.json. Imported packs affect the current browser session. Physics parameters and text are validated before use.

Official classification outline: https://www.loc.gov/aba/cataloging/classification/lcco/

## Tabor World

Open the World link in the engine or use /world/ on the deployed Worker. The registry has an Elements view with the 118 atomic-number references and a link to IUPAC, and a Non-elements view for material, physical, symbolic, narrative, geographic, anatomical, and software records. The browser can compare two records and follow recorded links.

The source catalog and cast/props come from GitHub PR #273 (source commit be390336dad6076f930ed1f8dc9f3cf771ed6629). The build also includes the unchanged public Cosmic Body and meSPARK Worlds Atlas JSON from their repository paths. The Worlds Atlas source notes that its coordinates can be anchors for fictional and mythological settings. The Cosmic Body source tiers remain visible.

## Release ledger

Tabor World presents its catalog as the **Library of Tabor**. The launch directory records the address, observed access, and check date for each destination. It does not configure access on sibling Workers. The animated hero observes reduced-motion preferences and can be paused in the browser.

The deployment exposes three read-only URLs: /api/health, /api/releases, and /api/destinations. Static hosts read the corresponding JSON files under public/world/ without needing a Worker. When the owner says “keep going,” start with the next list in public/world/release-ledger.json, confirm the deployed release via /api/health, and record completed work in the history list. New browser or provider test results should report their date and scope.
