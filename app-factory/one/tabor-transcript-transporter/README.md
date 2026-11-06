# The Tabor Transcript Transporter

**Creator:** Nathan Tabor · **Identity:** The Transcriber · **Parent:** ONE / TABOR App Factory

**Current status:** Additive local-first browser prototype; works with the existing DUMMIE packaging engine. **Not an authenticated Amazon KDP integration** and does not publish a book.

## Where to find it

- App: [Open the Transporter interface](./index.html)
- ONE home: [ONE](../index.html) (new doorway in this branch)
- Shared packaging engine: [DUMMIE Publisher](../../dummie-publisher/README.md)
- Official KDP account: https://kdp.amazon.com/

## The three steps

1. **Preserve:** Paste original transcript/manuscript or import a local TXT/Markdown file. You can also select one conversation from a compatible ChatGPT `conversations.json` export. The selected current conversation branch and user/assistant role options are preserved; the full export is **not** placed in a book package.
2. **Transform:** Add title, author, subtitle, description, keywords, cover image and reviewed disclosure status. Inspect detected chapters, produce EPUB and Word, and review a separate derived working manuscript. The sealed source snapshot stays distinct from edits.
3. **Transport:** Generate one local ZIP with `SOURCE/TRANSCRIPT-ORIGINAL.txt`, `SOURCE/WORKING-MANUSCRIPT.txt`, `KDP/<slug>.epub`, `KDP/<slug>-print-draft.docx`, `KDP/kdp-listing.json`, an optional unmodified cover, and instructions. After rights and disclosure review, open the official KDP dashboard for manual submission.

## Full-spectrum reading system

There are **38 user-defined lens slots**. This is the creator's own transcription/reading classification framework, **not** a claim that medical literature recognizes 38 types of dyslexia. Lens names and descriptions are saved only in this browser profile. The visual-pattern scanner exposes explicit minimal edit operations; for example **SVIRS → VIRUS** is one deleted S and one inserted U, rather than an unexplained correction. It shows original and candidate separately; it never alters the source automatically.

## Safety, limits, and accuracy

- This module is additive. Original manuscript text is never silently rewritten and existing DUMMIE and ONE engines remain untouched.
- No credentials, ChatGPT export archives, private manuscript contents, KDP passwords, or cover binaries are committed to public GitHub or sent to the provider by this module.
- Browser import currently accepts TXT, MD and compatible ChatGPT conversations JSON (24 MiB file cap); more formats and large exports are future work.
- The EPUB is a simple, uncompressed local EPUB 3 package with XHTML chapters, navigation and metadata. Verify the generated file with a standards-aware EPUB validator and Kindle Previewer before shipping.
- The DOCX is a **print interior draft**, not a validated paperback/hardcover layout; trim size, margins, bleed, page count, hyphenation, embedded fonts, cover/spine and KDP print preview require review.
- Cover JPEG/PNG is included in a separate folder for manual review, **not embedded in EPUB**. Check dimensions and image rights independently.
- KDP metadata/disclosure selection is a prepared reminder, not a submitted KDP field. Rights, generated text, images and translations must be reviewed accurately by the author on KDP.
- The browser cannot access all ChatGPT conversations automatically, does not authenticate to Amazon, cannot bypass KDP approval, and **does not publish books**.
- No analytics or online sync. Keep independent copies of the original manuscript, complete export and generated package.

## Tests

Run from repository root:

```bash
node --test app-factory/one/tabor-transcript-transporter/engine.test.cjs
node --test app-factory/dummie-publisher/publisher.test.cjs
```

## Roadmap

- EPUBCheck + Kindle Previewer verification workflow and practical accessibility QC.
- Comprehensive cover and print-dimension checks with KDP specifications kept current.
- Native DOCX/HTML/ZIP input and large-archive streaming extraction.
- User-approved private synchronization and robust per-file integrity manifests.
- Separate, terms-compliant assisted KDP handoff; only claim an uploaded/published state upon confirmed Amazon evidence.
