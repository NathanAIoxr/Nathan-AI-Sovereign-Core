# Nathan AI 🚀 — Universal Workspace

A local-first, no-token-credit-meter workspace. Open [index.html](./index.html) through the Nathan AI hub.

## Working offline-friendly capabilities

- Paste or import a text file (2 MB maximum, text only), inspect word/line/character counts.
- Deterministically extract up to five key sentences from the original, displayed as passages instead of purported generative summaries.
- Literal substring passage search; locally inspect matches.
- Paste and compare two AI responses, report word counts, overlapping vocabulary and differences.
- Export source text, extracted passages or response comparison in a downloadable TXT file.
- No API calls, accounts, token-credit deductions or user-data transmission from this module.
- No automatic persistence in browser storage. Clearing the page clears unsaved text. Source and derivatives remain under the user's control.

## Meaning of “remove all tokens”

No token-balance, token-credit purchase, text-generation billing meter, or artificial credit check is present in this module. The implementation does not claim that transformer models can run without internal tokens, that paid providers provide free computation, or that credentials and security tokens can be removed safely. The optional separately configured model adapter in `../assistant/` retains its existing required permissions and provider-cost disclosure.

## Verified boundaries

This is an additive extension, not a live provider-backed multi-model service, PDF renderer, speech-to-text engine, video editor, image model, Web search crawler or translator. Text file formats are treated as untrusted plain text; imported HTML is never executed. Original Nathan AI modules and original source records are left intact. External AI content is compared only when the user explicitly pastes it.

## Test

Run `node --test app-factory/nathan-ai/universal-workspace/engine.test.cjs`. Manual browser checks are required for file input, accessibility and downloads.


## One workspace, separate apps — shared-core integration

The additive app directory preserves the existing source inspection, search, passages, comparison and exports. It registers 139 existing HTML source entry points plus three shared-core standalone tools; this is not a count of 142 finished products. Existing v061 source IDs remain unchanged. Four embedded native resource pages are identified as native source, not installed native binaries.

- Library Catalog: `archive-index/loc-b8/apps/catalog/`
- Project Completion: `archive-index/loc-b8/apps/completion/`
- Backup & Restore: `archive-index/loc-b8/apps/backup/`

All three tools reuse the same source catalog/identity, review persistence, completion evidence and backup engines. Open them inside the workspace or through their independent launch URLs. Each launch has a distinct browser-app manifest; signed native/store packaging remains a separate project.

`app-registry.json` retains each original route and its status. Existing source routes are not automatically marked complete. The registry points to the existing ONE v061 interface as a shared foundation for its 58 original registered consumers. The new catalog core is shared by three tools. Private providers, cloud sync, game rules and unpublished source holdings are not silently merged or released.

Tests: `node --test app-factory/nathan-ai/universal-workspace/apps.test.mjs archive-index/loc-b8/*.test.mjs` plus the original workspace and Codex regression suites.

The app-directory extension loads first-party public route metadata and selected app pages. Earlier no-network capability statements describe the unchanged source inspection engine. Source text from that engine is not forwarded to an embedded app. See `archive-index/loc-b8/BROWSER_VERIFICATION.md` for the shared-tool acceptance results and remaining release checks.
