# FIND THE TABOR

Nine independent editions cover spellings and genealogy, the Silk Roads in both directions, the Taborites, the Knights, the Daughters, the Tabor Light case, the books, the apps, and the websites. The original Working Studio remains the place to draft and export a research plan.

1. **1 − 1 = 0 · CLEAR.** Resolve the person, place, language, time and source before assigning a relationship. Capture disagreement and missing links as research records.
2. **1 + 1 = 2 · BUILD.** Add the dated record to its edition and cite what the source establishes.
3. **1 × 1 = 1 · INTEGRATE.** Cross-link the editions. The recovered book bytes come directly from the existing ONE archive.
4. **1 ÷ 1 = 1 · VERIFY.** Build and test each edition, check the source URLs, and compare each live release ID.

The author’s Tabor Light thesis and map are recorded alongside dated evidence. In this edition, the thesis remains open. A KJV account of radiance, the early Galilean place tradition, the Byzantine debate and the Roman feast have different dates and records. The modern Catholic texts include both the Tabor place name and Christ-centered interpretation.

## Build

From the repository root, run:

```sh
node projects/find-the-tabor/build.mjs
node projects/find-the-tabor/pages.mjs
node --test projects/find-the-tabor/test.mjs
```

Each Workers bundle has its own configuration and identity in `projects/find-the-tabor/dist/<edition>/`. Each static Cloudflare Pages package is in `dist/pages/<edition>/`. The Pages build command can pass a single edition, for example `node projects/find-the-tabor/pages.mjs light`. HTML, downloadable source text and JSON are served independently in each Pages deployment. `projects.json` defines the names used in production navigation.

The source-check Worker maintains bounded HTTP checks for curated sources in its dedicated D1 database. Apply `schema.sql` before deploying that Worker. Its schedule is 11:17 UTC daily. HTTP status measures availability. Editorial findings are updated through the source files, with review and attribution.

The raw intake is preserved in the R2 bucket `tabor-lineage-r2` under `intake/2026-11-19/Pasted-text-c661a74c.txt`, SHA-256 `c661a74c6a21a0e02955c24eba5455ec814dba3a09378af43ea52462526c3d59`.

## GitHub and Clouder

The GitHub Actions build generates each edition. The main-branch deployment job uses scoped Cloudflare credentials from repository secrets, publishes each edition to its own Pages project, and checks the live release. The scheduled GitHub source-check workflow records availability while the Cloudflare Worker deployment is pending. Clouder is the mobile client for the Cloudflare account. Its access uses the scoped token and permissions on the owner’s device.

## Portable public editions

The open editions can also run as static files on the existing GitHub Pages publication and on Cloudflare R2 public delivery. Each edition has its own entry point and data. The Cloudflare Pages projects have their own domains and use the GitHub deployment job when Pages Write credentials are configured. The raw intake lives in a separate private bucket.

- GitHub Pages: https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/projects/find-the-tabor/public/lineage/index.html
- Cloudflare R2: https://pub-75a950dc4e3b4f8cba13da7b7bceac9f.r2.dev/lineage/index.html

Run `node projects/find-the-tabor/portable.mjs` after the two build scripts to regenerate the public files.

## Assignments and publication flow

The weekly FIND THE TABOR task advances one research question. The daily source-check runner records link availability. A reviewed edit goes through the project build and its public manifest check. On main, the active Library of Tabor Assignments Worker reads the committed manifest, verifies the approved paths and SHA-256 values, and syncs changed assets into the existing public R2 bucket. A D1 receipt records the manifest, the stored file count and public parity for all nine edition health records. The provenance rules and book source files still govern editorial work.

- Flow dashboard: https://library-of-tabor-assignments.nathantaboract.workers.dev/find-the-tabor
- Receipt JSON: https://library-of-tabor-assignments.nathantaboract.workers.dev/api/find-the-tabor
- Public manifest: [release.json](public/release.json)

The sync runs every five minutes, offset from the Library assignment schedule. It uses the public GitHub repository and two project-scoped bindings. Apply `flow.sql` to the FIND THE TABOR research D1 database before configuring the Worker. When regenerating the public edition assets for a change, run `node projects/find-the-tabor/release.mjs` after `portable.mjs`.
