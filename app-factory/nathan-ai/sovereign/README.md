# Nathan AI · Sovereign Connections

Open this module from Nathan AI’s main navigation or hero. It extends the existing app with a local source graph, coin-definition matrix, life timeline, methods/questions reader, source register, independent notes and a receipt-observation ledger. It reuses the existing Voice Box, Vault, Master Library, Connected System, commerce and pricing modules through explicit navigation.

## Use the workspace

1. Open **Import & originals**, select an owner-held connection pack, read its import summary, then choose **Merge reviewed pack**. File selection alone does not save anything. The source-only default includes public catalog and implementation references; private coin definitions and personal records are not embedded in the public app.
2. Search the **Coin & source matrix**, filter by type, and open a record. Its source wording, stage, source reference and independently editable notes remain distinct.
3. In **Connections**, choose a focus record. The map visualizes up to 12 direct neighbors, and the complete relationship list follows it. Every relationship has a source or owner explanation. Add an explicit link using the form; different names, overlapping symbols and unresolved counts are not automatically merged.
4. In **Life timeline**, add sourced milestones and connect them to the records you choose. Year-only imported source material retains its wording without inventing exact dates.
5. **Methods & questions** includes imported formulas, design descriptions and unresolved source questions. These are records; the workspace does not execute proposed mining algorithms.
6. Use **Recorded amounts** for dated owner-entered observations with a receipt or source reference. Amounts are USD decimal strings converted to exact integer cents. Units stay attached to each coin and are not summed across different assets. Zero costs yield an undefined receipts/cost ratio. Claims and valuations are never automatically included as receipts, balances or profit.
7. Export a complete private JSON backup after work. Restore is additive: existing IDs and notes win; differing incoming versions are reported as conflicts. Original-file bytes still require the existing Vault or Voice Box backup controls.

## Storage and boundaries

The key/schema is `nathan-ai.sovereign-workspace.v1`. Packets contain `nodes`, `edges` and `observations` arrays. Every node has an ID, kind, title, source, source stage, original summary and independent notes. Optional symbol/date fields support coins and exact-date milestones. Edges carry source-attributed endpoint IDs. Observations reference existing coin nodes.

Import validates all content before writing. Dangling relationships, duplicate IDs, invalid dates, invalid monetary precision and oversized packets fail without changing saved data. Unknown fields such as credentials and executable links are not part of the schema. Text is rendered through DOM text nodes; imported URLs are not fetched or executed. Hardcoded links lead only to existing app modules. Updates compare the current stored snapshot to detect changes from another tab. Quota/write failures preserve saved data and the current draft. Removing an observation or connection requires confirmation and only changes this local workspace copy.

This module uses browser localStorage, not encrypted or authenticated account storage. Keep the device/browser profile private and export backups; do not enter passphrases, private keys or recovery phrases. It has no network API, wallet signing, transfer, mining, hardware tuning, biometric authentication, financial custody or automatic valuation capability. Source records are not certification of the systems they describe.

## Development

From the repository root, use the existing static server, for example `python3 -m http.server 8000 --bind 127.0.0.1`. No installation or compilation is required. Open this module through the local Nathan AI app. Do not treat loopback URLs as published previews.

Run `node --test app-factory/nathan-ai/sovereign/engine.test.cjs`. This suite is registered in the existing CI workflow and covers atomic import, graph integrity, conflict handling, exact arithmetic, stale tabs, quota failures, credential-field omission and public-seed boundaries. Onboarding’s Chromium checks also exercise the owner-held private pack; that pack is intentionally outside the checkout and is not a CI fixture.
