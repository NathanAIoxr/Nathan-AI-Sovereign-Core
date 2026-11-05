# NATHAN AI — Protection of Innocence: author-word preservation

**Status:** Source-preservation branch in a PUBLIC GitHub repository; merge and deployment review pending. The branch files are already publicly viewable.  
**Scope:** Four consecutive **user-authored** turns visible in a November 2026 conversation. This is **not** a complete ChatGPT account export and does not recover private source archives.

## Canonical originals and derived indexes

- [messages.json](./messages.json) — one `original_text` value per user turn; original capitalization, spelling, repetition, profanity, punctuation, curly apostrophes, and rendered line breaks are kept. The `author_verified_bytes: false` flag is deliberate: invisible formatting has not been independently compared to the original platform data.
- [index.json](./index.json) — editorial labels, sequence numbers, classifications, and cross-references. This does not modify or replace source text.
- [index.html](./index.html) — searchable viewer and A–Z word-frequency index computed from the preserved text at runtime. It never alters the original records.
- [archive.test.cjs](./archive.test.cjs) — smoke tests for source/index integrity.

The archived user message contains a reported quotation of a historical violent phrase and a disability-related slur. Two later messages contain threatening language directed at an assistant as a hypothetical human. These are kept as **attributed primary-source statements**, not approved conduct, instructions, or factual determinations about third parties.

## Source/provenance rules

1. `original_text` is the source, not a paraphrase. Corrections must be added as separate attributed records; never edit an author's original silently.
2. Source and index remain distinct. An index title, tag, or assistant analysis is never substituted for the creator's voice.
3. Distinct repetitions remain distinct. No duplicate collapse.
4. User statements about crimes, people, and history are attributed statements, not verified findings.
5. A source visible in the chat is not proof that all past chats, files, manuscripts, or media have been recovered.
6. Do not import owner-only master library files, private personal material, account data, access tokens, or credentials into this public repository. The existing ONE local-first [Master Library](../../../one/library/README.md) keeps private imports separate.
7. The material is on a proposed branch pending review; its presence here is not evidence of a merged release, public deployment, or source-byte verification.

## Where this belongs

- **Nathan AI / Protection of Innocence** — primary topical home.
- **AI accountability** — [related preserved transcript module](../../ai-accountability/README.md), linked without merging distinct originals.
- **ONE Master Library** — private originals and owner-approved index import.
- **A–Z** — generated derived lookup in the viewer; it does not invent missing source wording.

## Audit / follow-on recovery

Additional dated source messages and original documents must be fetched individually from verified primary sources and added with provenance, privacy scope, and hashes where exact source bytes exist. This folder deliberately contains only what was visible and transcribed from the present conversation. Older master archives were **not** copied here.

[Open searchable archive](./index.html) · [Open the interactive App/Game/Books/Learning studio in HOP IN](../../hop-in/chatbox/index.html#studio-panel) · [Nathan AI repository home](../../../../README.md)
