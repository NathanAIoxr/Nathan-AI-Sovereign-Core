# Nathan AI / ONE — The Brainstormer Creative Arcade v0.0.3

A self-contained, local-first creative studio and six-game idea playground. Works as a standalone HTML page, without external scripts, sign-in, cloud uploads, or a required server. Original user-supplied material remains distinct from generated/derived material and is never silently overwritten.

## Quick start

1. Open **NathanAI_Brainstormer_Creative_Arcade_v003.html** in a modern browser. It runs with browser JavaScript enabled and no network connection.
2. In **Brainstormer**, type raw ideas; choose `story`, `layout`, `holiday`, `calendar`, `phrasing`, `character`, or `scene`; generate **5, 7, or 12** directions. Every option is kept in the Idea Garage.
3. Open **Creative Arcade** and play one of six games; each completed activity can save its output as an idea and award creative XP.
4. Use **Communication Academy** to practice expressing the original input through structured scaffolds. Send any version to the Idea Garage or scrapbook.
5. Open **Digital Workspace** for text blocks, caption blocks, quotations, local photos, visual themes, print output, and a refrigerator-paper preview.
6. Open **Calendar Engine** for the 25-day Christmas grid, a 12-month year navigator, recurring birthdays, and `.ics` export.
7. Use **Integrity & Export** for a full project JSON backup, a portable HTML package with the project embedded, email-ready text, and an on-demand SHA-256 fingerprint.

**Important:** Browser-local storage availability varies by browser/device and local-file security rules. Export an HTML or JSON copy after making meaningful work. The software has no server-side recovery system.

## Six playable creative activities

| Game | Interaction | XP reward |
|---|---|---:|
| Spark Sprint | Provide a spark and generate 5, 7, or 12 directions | 20 |
| Remix Relay | Join two different archived ideas and add your connecting sentence | 30 |
| Story Ladder | Write a beginning, middle, and ending | 35 |
| Alphabet Adventure | Fill an A–Z letter with an original line starting with it | 15 per newly completed letter |
| Mirror Maze | Reverse words/characters, reflect on the meaning | 25 |
| 25-Day Christmas Quest | Make a memory or creative piece for each day and place it on the December calendar | 10 per newly completed day |

Achievements (badges) unlock from creating ideas, making pages, adding dates, remixing, story-building, the A–Z journey, and completing the Christmas 25-day matrix. Creative XP celebrates completed activities; it is not a correctness or truth rating. Revisions to the same A–Z letter or Christmas date do not grant duplicate XP.

## Seven major tabs

- **01 — Brainstormer:** transparent offline template generator with seven creative modes.
- **02 — Creative Arcade:** six structured mini-games with XP, levels, badge milestones, and a recent activity ledger.
- **03 — Communication Academy:** eight tools: spoken scaffold, short form, explanation outline, clarifying questions, acrostic outline, user-guided phonetic notes, reverse word order, reverse line order.
- **04 — Idea Garage:** full search, filters, favorites, statuses, sorting, and handoffs. New generated ideas are automatically preserved.
- **05 — Digital Workspace:** additive scrapbook block editor; change page title, color theme, decorative mark, captions, quotations, photos (PNG/JPEG/WebP/GIF under 1.5 MB each), arrange/remove blocks, print or save a PDF with your browser's print command.
- **06 — Calendar Engine:** 25-day Christmas matrix and all-month calendar, yearly recurring dates, `.ics` file creation, user-created events, and direct idea handoffs.
- **07 — Integrity & Export:** structured portable project export, local JSON import with checksum validation, one-file portable HTML export, email-ready message text, project SHA-256 fingerprint, and explicit project reset.

## Four-engine architecture

```
Nathan AI / ONE
  ├─ The Brainstormer (ideas + creative games + communication training)
  ├─ Digital Workspace (no-scraps scrapbook and writing structure)
  ├─ Multi-Epoch Calendar Engine (25-day Christmas + all-month view)
  └─ Local Integrity & Packaging (save, import/export, hash, portable HTML)
```

Idea Garage is the durable bridge between all engines; the Creative Arcade and Communication Academy are additive interfaces for the Brainstormer, not replacements for the four-engine design.

## Compatibility and code

- **HTML v003** is additive to `NathanAI_Brainstormer_Offline_v001.html`. Original generation modes, Idea Garage, canvas, calendar, and the v1 package format remain intact.
- Existing `NathanAI-Brainstormer-v1` JSON packages can be imported into v003. Additional v003 fields are optional and do not require transforming older data.
- Existing `NathanAI_Brainstormer_Python_v002.py` remains unchanged and is provided as a separate Python companion for programmatic generation and project storage. The v003 games currently run in the browser and have **not** been ported into the Python class.
- `brainstormer_v003_extensions.js` contains the additive interface and game logic. The standalone HTML includes it inline, with no external script needed.
- `build_brainstormer_v003.py` can reproduce the HTML by applying the additive changes to v001 in the same directory.

## Data and integrity

- The app saves to browser-local storage when permitted. It does not send data to a cloud provider.
- Photos are embedded as base64 data URLs within project exports; large quantities of images can exceed browser-local storage limits. Back up frequently.
- The SHA-256 checksum detects changes to an exported project's bytes. It is **not** a signature, copy protection system, identity verification, or evidence of authorship.
- Email sharing is manual: use **Copy email summary** and attach the exported HTML or JSON from your mail application.
- Calendar `.ics` files are exported locally and require importing into your own calendar application. No background reminders are created.
- The Communication Academy's phonetic mode supplies editable **scaffolding**, not a validated phonetic transcription or speech-to-text system.
- Creative generation is **rule/template-based**. No local LLM, remote LLM, real-time collaboration, automatic emailing, voice recognition, or cross-device sync is claimed.
- This is a local reference implementation, **not yet integrated into a live GitHub repository or deployed**.

## Tested

Browser-based functional tests covered: all seven tabs; generation of twelve or five ideas; original-input escaping; Story Ladder, Alphabet Adventure, Christmas Quest, Spark Sprint, Remix Relay and Mirror Maze; XP and duplicate-day scoring; garage search/favorites; communication transformations and archive; edited scrapbook blocks and visual themes; image embedding; recurring calendar entries; `.ics` export; SHA-256; JSON export; embedded HTML portability; and a 390-pixel-wide mobile viewport. JavaScript syntax checks and browser tests passed.

This folder is structured for code review and possible GitHub integration. The user's choice of a repository license has **not** been assumed.