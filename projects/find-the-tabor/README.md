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

Use the Cloudflare GitHub integration to build from the repository and create independently managed Cloudflare projects. Clouder is the mobile client for the connected Cloudflare account. Access in Clouder uses the token and permissions on the owner’s device. GitHub credentials stay with the provider integration.
