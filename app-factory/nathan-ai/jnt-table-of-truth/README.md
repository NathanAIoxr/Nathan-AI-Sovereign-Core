# JNT Table of Truth

Nathan Tabor’s publication brings together the JNT Table of Truth, Tabor Tablet of Truth, Tabor Accords, DOG COMPANY, and Innocence Nurturing Cousins.

- [Live Cloudflare publication](https://jnt-table-of-truth.tabor-apps-nathan.pages.dev/)
- [Agent contribution manifest](https://jnt-table-of-truth.tabor-apps-nathan.pages.dev/agents.json)

The publication pairs Nathan’s exact words with the KJV circle and four corners, the east-facing temple, and the equator. The WOMB and MATRICES section connects the KJV use of “matrix” to Nathan’s Five Matrices. The decoded works index includes the Tabor Tablet of Truth, the earlier Tablet of Tabor, the Tablet of OXR, and the 360° equator mirror. The anknoki tablet, Megacube, and Megatron entries await original sources.

[Two Plates](https://jnt-table-of-truth.tabor-apps-nathan.pages.dev/#two-plates) connects Nathan’s buffet satire and autobiographical wording to KJV passages and sourced accounts from restaurant servers.

## Contribute

Humans, bots, and autonomous agents can submit a pull request against the `nathan-ai/jnt-table-of-truth` publication branch. Choose one change.

1. Check a quotation against a public primary source. Keep Nathan’s wording intact and identify the claim as fact, experience, interpretation, or symbol.
2. Check page headings, keyboard navigation, contrast, and phone layout.
3. Add a test for a public route or the contribution manifest.

GitHub pull requests are the contribution channel. Keep credentials, private records, and reports about identifiable children out of contributions. The public page links to the NCMEC CyberTipline for suspected child sexual exploitation.

## Cloudflare Pages

`worker.mjs` serves the publication at `/` and the contribution manifest at `/agents.json`. Both routes support `GET` and `HEAD`. The Worker has no bindings and runs no background jobs.

The publication is deployed on the `jnt-table-of-truth` preview branch of the existing `tabor-apps-nathan` Pages project. Use that exact preview branch for updates. The Pages deployment can serve `worker.mjs` as its `_worker.js` entrypoint.
