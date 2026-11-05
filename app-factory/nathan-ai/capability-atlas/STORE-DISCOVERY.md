# Nathan AI — Apple / Google Play discovery overlay

**Author/owner:** John Nathan Tabor. **Scope:** Store discoverability metadata *after* attributes, characteristics and functionality. Existing products, files, original wording and independent modules are not renamed or merged.

## Platforms and restrictions (verified 2026-11-05)

- Apple: App Store Connect supports a primary category and optional secondary category. Where Games applies, up to two game subcategories are supported. Store classification must reflect the app's actual primary function.
  - Source: https://developer.apple.com/app-store/categories/
- Google Play: choose one category, with up to five tags from the eligible Play Console tag options. Categories and tags must accurately reflect the actual user experience.
  - Source: https://support.google.com/googleplay/android-developer/answer/9859673?hl=en

The category names are different: e.g. Apple's Books + Reference versus Google's Books and Reference; Apple Utilities versus Google Tools; Apple Photo & Video versus Google Photography / Video Players and Editors. They must **not** be treated as a one-to-one translation. Google Play game genres are standalone game categories; Apple's Games category can have genres.

## Three independent data layers

1. **What the code does:** functional attributes, tested operations, inputs, outputs, state and constraints. These remain in the source and Capability Atlas.
2. **What users can experience:** the existing application entrypoint, documentation and actual available features. This determines whether a proposed store category would be suitable.
3. **Where users might discover it:** Apple primary/secondary and optional game genre; Google Play one category and up to five console-approved tags. None of these labels modify the app or prove a native build exists.

## Indexed scope and review

- Every existing app-factory/.../index.html in the GitHub tree snapshot appears in the store discovery browser, **including those with no credible classification yet**.
- store-discovery.json contains a manually curated first-pass classification of 67 routes with source paths, a brief functional rationale and explicit *proposed* status.
- The remaining entrypoints are **unclassified** rather than assigned invented labels from folder names.
- All other non-entrypoint GitHub files remain in the separate full repository Capability Atlas; a source file is not necessarily a separately publishable product.
- Tags are left unselected until an app's actual feature set can be matched to the official Play Console options. Arbitrary brainstormed keywords do not count as approved tags.
- This is a discovery research artifact and planning tool, not a native iOS/Android binary, store submission, privacy/compliance approval, or live listing. If a title is only a site/prototype/reference, retain that boundary.

## Requirements before any real submission

- Select a distinct installable product and verify its actual in-app behavior, supported devices, age rating, data safety/privacy and accessibility.
- Prepare Apple/iOS and/or Android packages, developer account, store metadata, screenshots and support links for the *actual* product.
- Review platform-specific policies (especially apps involving children, health, finance, payments, user-generated content and crypto). Do not assign Kids/Medical/Finance/Games merely because a narrative uses a related word.
- Make category choices with evidence from the main experience, not content discovery speculation. Validate Play tags inside Play Console.
- Do not claim FDA clearance, verified antivirus functionality, direct brokerage, automated real-world actions, native mobile deployment or service availability that the original app does not implement.

## Run and validation

Open Store Discovery (store.html), or run locally from a static web server. It reads the same inventory.json as the Capability Atlas and store-discovery.json for manually reviewed proposals.

Run tests:
~~~sh
node --test app-factory/nathan-ai/capability-atlas/store-engine.test.cjs
~~~

The existing GitHub Actions capability audit also runs this test suite, plus the full source scan. A source-first classification can be updated without changing the product's original code.
