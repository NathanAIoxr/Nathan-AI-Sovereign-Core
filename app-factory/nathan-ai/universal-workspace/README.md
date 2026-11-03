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
