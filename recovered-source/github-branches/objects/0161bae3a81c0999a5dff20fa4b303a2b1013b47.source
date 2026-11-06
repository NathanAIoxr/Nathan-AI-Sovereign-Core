# NATHAN AI — WORDS → WORLDS · UNBOXED RESTORATION PLAN

**Audit date:** 2026-11-05  
**Source repository:** `NathanAIoxr/Nathan-AI-Sovereign-Core`  
**Implementation branch:** `feature/words-worlds-unboxed-20261105` (created from latest `main`)  
**Author concepts and original words:** Nathan Tabor. Source-original and assistant-created editor layers MUST remain distinguishable.

## 1. GitHub synchronization findings

| Program area | Current `main` before this branch | Prior draft PR #104 | Action in this branch |
|---|---|---|---|
| HOP IN chatbox | Working local chat UI, Paradox Atlas and ROOT → CLEAR → BUILD routes | Independent Words → Worlds tab, no merge | Integrate the studio on top of current `main` so those newer routes remain |
| Original David-exchange text | Not on `main` at audited path | Four preserved user messages, separate editorial index | Port originals unchanged, keep per-message ID and all repetitions |
| Original reader | No studio integrated | Adult access gate; one collapsed disclosure per record | **Display every record fully** after adult gate; no per-record collapsible component |
| Standalone archive | Not present at audited path | Full records but alphabet terms had a scroll-clipped container | Remove clipping, include Show All and shared Nathan AI appearance |
| Game | Not on `main` | One quiz round visible at a time | All six rounds simultaneously visible with independent answers and a score |
| Book series | Not on `main` | One of seven volumes visible at a time | All seven volumes, chapter lists and editable notes shown simultaneously; export one or all |
| Education | Not on `main` | One lesson, answer behind a reveal control | Five complete lessons, explanations and answers displayed together |
| Additional owner material | No scoped private intake for this studio | Exactly four transcript records | Local-only JSON import preserving all words; repeat wording allowed; repeated IDs rejected |
| Chat handoff | Max 4,000-char chat input | Studio prompt silently clipped to 4,000 | Never silently trim source/book prompts; reject oversized chat requests with an explicit export instruction |
| Quality checks | Existing Factory CI; unrelated appearance coverage issue known | New studio checks passed; overall Factory check had another failure | Port tests, expand anti-collapse invariants, add focused workflow, report CI separately |

**The 22-commit divergence reported between prior PR #104 and `main` means direct merging is not the right synchronization path.** This plan is implemented on a fresh branch based on the newer `main`, preserving the unrelated work that landed after PR #104 started.

## 2. Non-collapsing invariants

1. **Zero silent text edits.** `original_text` remains exact as obtained from the archived source. Do not paraphrase, correct spelling, normalize capitalization, or remove offensive content within the primary source.
2. **Zero duplicate-content collapse.** Two messages with identical text and different IDs remain separate ordered records. A repeated phrase is not proof the messages were identical events.
3. **No ID collision overwrite.** Importing an existing source ID fails visibly; no older record is replaced.
4. **Zero hidden cut-off.** Original source reader text is not clipped by `max-height`, `text-overflow`, editorial excerpt limits, or default-closed disclosures.
5. **Never pass original speech to a game as an instruction.** Attributed original records and derived educational material are separate types.
6. **Nothing claimed recovered without evidence.** Four transcribed messages from the visible conversation are not the user's entire history. User-loaded JSON is local-only and is not certified as platform-original bytes.
7. **No silent import limits.** If a file/record exceeds validated bounds, report the rejection; never load the first N and drop the rest.
8. **Full creative export.** All seven book plans and all note texts export as one document; individual exports are additionally available.
9. **No unprompted public release of private records.** Owner-only libraries are never automatically fetched or committed; only files deliberately selected by the owner are processed locally.
10. **Every old tool remains separate and linked.** HOP IN, ONE, Paradox Atlas, ROOT → CLEAR → BUILD, original archives and the children’s library are independent modules, not merged away.

## 3. Executed build scope

- Ported source text and source-index files to latest-`main` branch without rewriting those contents.
- Added `/studio` chat routing and Create panel while retaining newer chatbox links and features.
- Fully expanded source viewer, game, lesson and book interfaces and added local no-collapse intake/export.
- Added tests for source count, repeated wording, import collision, all-volume export and uncollapsed display.
- Added GitHub Actions focused source studio tests.

## 4. Remaining verification and expansion priorities

| Priority | Unfinished work / release gate | Completion standard |
|---|---|---|
| P0 | Verify focused GitHub Actions on this fresh PR | All source-studio and archive tests pass |
| P0 | Browser audit on mobile and desktop | Every source is readable; all volume editors usable; import/export succeeds |
| P0 | Resolve unrelated Factory appearance-check failure | Repository-wide Factory CI green (no skipping or hiding failing tests) |
| P1 | Load any additional author-approved original archives from owner-local files | Each source retains provenance, hash (if original bytes accessible) and privacy scope |
| P1 | Expand books from outlines to reviewed original chapters | Every chapter has explicit creative authorship and independently attributed sources |
| P1 | Add cross-module source references to ONE Library with owner permission | No automatic import of private records into public GitHub |
| P2 | Production persistence, accessibility, multilingual output and safe deployment | Authentication, backups, permission review, keyboard/voice/mobile tests, threat-model audit |

## 5. Truthful status

This is a **working browser-code expansion and a reviewable GitHub change**, not yet a confirmed production deployment. Passing unit tests does not prove mobile support, a live AI backend, or complete restoration of all historical materials.

**Source → Index → Relate → Derive. CREATE ONCE. TRANSFORM INTO EVERYTHING. PRESERVE THE ORIGINAL.**
