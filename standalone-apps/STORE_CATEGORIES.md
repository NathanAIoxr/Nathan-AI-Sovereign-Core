# Nathan AI — Apple App Store & Google Play-style organization

**Date:** 2026-11-05. **Status:** Source-backed **editorial classification proposals** only. No native-store publication or Play Console/App Store Connect submission is implied.

This work is **additive**: existing original Websites, Apps, ONE, Factory, games, books, educational projects, independent website studios and owner-originated source material remain in their original GitHub paths. The separate \`standalone-apps\` browser catalog discovers them; it does not overwrite original labels, logic, manuscripts, or user-specific private data.

## Catalog counts and boundaries

- **139 distinct public source launch routes** tracked by the existing \`standalone-apps/catalog.json\` (which reconciles 130 Website entries and 142 overlapping Apps listings). These are routes, not assertions of 139 unique finished consumer products.
- **9 independent website studios** remain part of those 139 routes. They are **not** counted as nine more standalone apps.
- **5 additional existing Capability Atlas-reviewed public source pages** (no new standalone wrapper); their original source paths remain openable. These five were previously reviewed but absent from the 139-route standalone registry.
- **11 independent edition variants** from \`app-factory/nathan-ai/independent-editions/\`, each offering App, Game, Book and Academy modes. Variants are not new unique underlying products; historic \`hack-d-hack\` is labeled as not source-recovered.
- 357 overlapping program-jobs index records may include historic plans and references. They are **not** counted as completed published apps.
- Original source files and the 139 previously generated standalone launch pages are unchanged by category classification.

## Apple App Store model

One **primary** category and optional **secondary** category. For actual games, one or two genre subcategories. Primary **Games** is reserved for actual indexed game entry pages. Every published source route has a proposed primary; unnecessary secondary assignments are left null. An example is Library Mind → Books / Reference, or BLACKJACK!!! — The Game of LIFE → Games / Card. Category names are aligned to the Apple developer reference and do not imply store acceptance.

## Google Play model

One application type (**App** or **Game**); one App category or Games genre. Up to **five proposed discovery keywords** are recorded as \`suggestedTags\`. **These are editorial keywords and NOT guaranteed to be selectable tags in Play Console**. Play Console categories and allowed tags need review before submission. For example, SOVEREIGN DEFENDER is classified Tools, but it remains a browser research preview, not certified real-time protection.

## Existing functionality-first classification retained

The original `app-factory/nathan-ai/capability-atlas/store.html` and its `store-discovery.json` have **67 earlier source-reviewed app-store proposals**; 62 overlap the 139 standalone routes and 5 are additional public source pages. The new category layer preserves that earlier evidence and displays **29 conflicting proposals** for product review without silently modifying either category record. New editorial classifications of names and routes should not override demonstrated functions. The original Capability Atlas engine is left unchanged.

## What the user can do

The public catalog \`standalone-apps/index.html\` supports:
- Apple vs Google category browsing with independent category and genre filters.
- Apps vs Games and original standalone routes vs independently named edition variants.
- Search across exact titles, source paths, recorded statuses and proposed keyword subjects.
- Sort by title, primary category or source path.
- Each card links back to its own unchanged standalone route and original program source; edition variants link App/Game/Book/Academy independently.
- Discover historic/recovery work through the separate Program Jobs & Completion Atlas without falsely classifying it as shipped.

## Data contracts

- **Originals:** \`standalone-apps/catalog.json\` remains the source-of-truth of existing public launch locations and status labels.
- **Additive editorial metadata:** \`standalone-apps/store-taxonomy.json\` stores 139 source-matched records plus 11 edition variants and both platform category vocabulary lists.
- **Presentation:** \`standalone-apps/store-browser.js\` and \`store-browser.css\`. The original per-program \`standalone-apps/engine.js\` is not replaced.
- **Regression:** \`node --test standalone-apps/standalone.test.cjs standalone-apps/store-taxonomy.test.cjs\`.

Sources for official category structure:
- Apple: https://developer.apple.com/app-store/categories/
- Google: https://support.google.com/googleplay/android-developer/answer/9859673?hl=en

## Release requirements before external store submission

Each separately shippable product needs its own verified platform bundle, signing identity, screenshots, device/browser testing, accessibility check, age/content ratings, required privacy disclosure, permissions/consent, current copyright/source review, and Apple/Google developer-account submission. A GitHub Pages launch URL is not an iOS \`.ipa\`, Android \`.aab\`, or proof of a production backend.

**Preserve originals. Categorize the entries. Keep separate program identities. Reuse working shared technology where appropriate.**
