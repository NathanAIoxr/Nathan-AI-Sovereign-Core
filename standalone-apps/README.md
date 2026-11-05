# Nathan AI — Standalone GitHub Programs

**Source-preserving extension** of Websites, My Desktop, Universal Workspace Apps, Nine Independent Website Studios, ONE and Factory.

## What has been created
- A standalone directory page at \`standalone-apps/index.html\`.
- **One dedicated public GitHub entry address per distinct eligible original published browser program**, at \`standalone-apps/<source-path-without-html-extension>/index.html\`.
- Each independent entry loads the **unchanged existing original** in a same-origin frame, with "Open Original" and "GitHub Original Source" links. This preserves original code paths, assets, program names and behavior.
- Each entry has a manually initiated, title-and-path-only HOP IN Interactive Chatbox handoff. The Chatbox drafts the program context for review; it **never** sends or submits automatically.
- The machine-readable \`catalog.json\` preserves the two existing registry identities, source blob SHA at the audit commit, statuses, original locations and new standalone locations.

## Important operational distinctions
A standalone GitHub **launch URL** is an independent way to open an existing browser program. It does **not** imply the application was copied and repackaged with its assets as a self-contained offline or mobile installable product. Dynamic modules, asset paths and model services remain those of the original source. Users can open the original directly if it does not support embedding. Product stages remain as recorded; no new malware protection, private backend, commercial deployment or full historical source recovery is implied.

The Website and Apps registries overlap. This release deduplicates by the **actual original HTML source path**, not by project names. Named website studios continue to have their own program identities. Source listings marked as restricted/private, historical unpublished research, testing-only or bundled native-app HTML resource copies are not given new public launch entries. The original registry rows are unchanged.

## Canonical source
- \`app-factory/nathan-ai/websites/registry.js\`
- \`app-factory/nathan-ai/universal-workspace/app-registry.json\`
- \`app-factory/sites/sites-data.js\`
- Existing originals under \`app-factory/\`, \`archive-index/\` and the repository home.

No existing source file is deleted, moved, replaced or normalized; new paths are solely standalone launch entries and an additive Chatbox bridge script.

## Verification
From the repo root run:

\`\`\`sh
node --test standalone-apps/standalone.test.cjs
node --test app-factory/nathan-ai/websites/site.test.cjs app-factory/nathan-ai/universal-workspace/apps.test.mjs app-factory/nathan-ai/hop-in/chatbox/engine.test.cjs
\`\`\`

The test suite validates every generated source URL and standalone HTML, source file SHA at the catalog snapshot, uniqueness, relative asset URLs, preservation of website/app registries, HOP IN draft-only behavior, and absence of secret/credential handling.

## Open
GitHub source: \`https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/standalone-apps\`.

Expected public Pages address after successful deployment:
\`https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/standalone-apps/\`.

**Creator policy: BUILD · CLEAR · PRESERVE THE ORIGINAL · YES IS YES — NO IS NO.**
