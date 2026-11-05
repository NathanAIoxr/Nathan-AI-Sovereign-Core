# NATHAN AI 🚀 — Consumer Editions

**Creator:** John Nathan Tabor  
**Date:** November 5, 2026  
**Source:** \`app-factory/nathan-ai/consumer/\`  
**Status:** Source-backed **consumer app portal** for existing previews, not a finished universal mobile distribution platform or blanket compliance declaration.

**[Open the browser app](./index.html)** · [Plain-language consumer notices](./CONSUMER_NOTICE.md) · [Developer build and recovery status](../program-jobs/)

## What is built

- Thirteen verified local source routes, categorized by **consumer job** rather than engineering filename.
- Search, task-category and source-stage filters, plus a product-details screen that states the actual purpose and limitations for each application.
- Additional review step before launching **sensitive local-data** or **developer/security preview** apps. It is an acknowledgement, **not** legal consent, parental authorization, age verification or identity verification.
- A **manually chosen** region guide for U.S. federal law, California, EU/EEA, UK, Canada, Brazil, Australia, New Zealand, South Africa, Singapore, India and other regions. Every entry links to official sources, with a distinct requirements checklist.
- Eight launch evidence gates for actual commercial release: publisher identity, verified privacy behavior, children, commerce, truth in claims, AI, accessibility, and security/recovery.
- Full exact attributed creator wording on the global/international metaphor in a separate creator note, with a factual clarification. Science and jurisdictional rules are not changed by creative terminology.
- Standalone web-app manifest and responsive, keyboard-operable directory interface. **Explicitly opt-in offline cache** for only eight public directory resources (the page, scripts and dated metadata); users can remove that cache. It does not cache linked apps, private source, health records, security samples or vault contents. Browser support and offline availability must still be independently tested; not a native app guarantee.
- Thirteen individually sourced privacy/data-practice records distinguish known local storage and input features from unknown runtime/server behaviors. These do **not** replace a completed formal privacy policy or vendor/host audit.
- No analytics, geolocation, tracking query or account form **added by this directory**. Linked modules may differ; hosting requests and normal browser activity can still be processed.

## Existing products in this release directory

| Consumer category | Source routes |
| --- | --- |
| ONE hub | ONE — The Last App |
| Private storage | ONE — Sealed Voice Box |
| Books and knowledge | ONE Library Mind; 101-Action Chronicle; Taborite Universal Language Matrix |
| Creative learning | Six Dogs; Nathan AI Anatomy A–Z |
| Safety and research previews | Hall of Mirrors; Five Equal Guardians |
| Sensitive personal tools | EYEPRINTS × HANDPRINTS; ONE — Health & Recovery |
| Creator workbench | Master Program Jobs Atlas |

All links lead to actual existing HTML source. **A route is not proof that every feature is production-complete, or that a linked tool is safe for handling arbitrary data.**

## Design and source principles

1. **1 + 1 = 2 — BUILD. 1 − 1 = 0 — CLEAR.**
2. **YES IS YES. NO IS NO.**
3. Preserve the original authored words, source bytes, source filenames, design elements and permissions wherever possible.
4. Do not call illustrative threat classification "antivirus"; do not call a creative health framework a clinical diagnosis; do not relabel incomplete books as finished.
5. Distinguish creative religious and cosmological interpretations from verifiable scientific facts and regulatory definitions.
6. Do not assume a user has consented to anything merely by selecting a region or opening a source link.

## Run locally

From the repository root:

    python3 -m http.server 8765

Open \`http://localhost:8765/app-factory/nathan-ai/consumer/\`. The app reads \`products.json\` and \`jurisdictions.json\` from the same site and does not need a server-side account, billing service or geolocation feature.

After source publication, the corresponding GitHub Pages location is:

https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/consumer/

That is a source-derived public path. Confirm deployment before advertising the URL as a live service.

## Verify source and tests

    node --test app-factory/nathan-ai/consumer/engine.test.cjs app-factory/nathan-ai/consumer/offline-privacy.test.cjs
    node --test app-factory/one/library-mind/search-core.test.cjs
    node --test app-factory/nathan-ai/anatomy/source-core.test.cjs
    node --test app-factory/quality.test.cjs

The first test checks record schemas, local route existence, unsafe URLs, completeness of release gates, routing filters, and attribution/scientific clarifications. The repository's existing visual and navigation checks run in Factory CI. Browser/assistive-technology testing and local legal review remain needed; no WCAG conformance claim is made.

## Before selling or collecting anything

**Not done:** publisher legal identity/contact verification, per-product controller/service data-flow inventory, actual payment terms, applicable consent and children workflows, regional privacy rights processing, independent security review, accessibility conformance audit, translations, native store package signing, and release-specific professional legal review.

These must be addressed before making a real commercial or regulated consumer offering, especially across jurisdictions. A wall of generic disclaimers cannot substitute for compliant operation.

[Detailed notice](./CONSUMER_NOTICE.md) · [Products data](./products.json) · [Regions and release gates](./jurisdictions.json) · [Original applications](../program-jobs/README.md)
