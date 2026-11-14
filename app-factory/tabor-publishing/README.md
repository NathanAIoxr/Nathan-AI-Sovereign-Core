# TABOR Publishing — Brand Registry and AI Worker Assignments
**Attributed concept owner:** Nathan Tabor (user assertion)  
**Prepared:** 2026-11-14  
**Status:** Proposed GitHub registry; NOT a synchronized private database, live agent farm, published content library, trademark clearance, or digital signature.

## Mandate
Preserve the user's TABORBOY, TABORGIRL, TABORMAN, TABORWOMAN, TABORTRANS and all later names as independent proposed publications, applications, or editorial zones. Each gets a dedicated *logical* writing worker specification, with shared fact-checking, provenance, editorial review, rights review and release gates. These are task specifications, not running autonomous agents.

## Record count
82 unique proposed brands in 6 divisions. All are represented in `brand-registry.json`.

## Required editorial deliverables PER brand
1. Identity brief (exact brand name, audience, mission, tone, exclusions, distribution formats).
2. 12-issue magazine editorial calendar and 24 article pitches, labeled as proposals rather than completed writing.
3. App product requirements: navigation, user stories, accessibility, safety, privacy, content moderation and age-appropriate access.
4. First issue outline plus 3 original article drafts, distinctly marked AI-assisted drafts pending Nathan Tabor's approval.
5. Source bibliography with citation fields, date checks, work-level rights check, and uncertainty register.
6. Publishing QA checklist, cover art brief (no copied copyrighted cover), and fact-check record.
7. Review/approval record: author attribution, editor approval, legal clearance, release authorization.

## Worker topology (logical assignments, NOT deployed agents)
- `worker-<brand-slug>`: one brand-specific editorial planner and draft worker for each of the 82 records.
- `worker-archive-provenance`: sources, dates, issue-level provenance and archive-to-edition links.
- `worker-rights-and-trademark`: flags copyright/trademark issues for professional or owner review; never declares legal clearance automatically.
- `worker-standards-factcheck`: reconciles historical assertions against primary sources.
- `worker-age-and-safety`: keeps TABORKID(S), TABORYOUTH, TABORTEEN, TABORBABY separate from adult-only material; no cross-promotion of adult content.
- `worker-app-spec`: common application template, shared records, search, editorial and age-safe navigation.
- `worker-release-gate`: validates tests, sign-off, publication and database-sync evidence before changing status.

## Work order
**Phase 0 — Catalog:** Verify the original uploaded list of 101 vintage titles separately; do not mark every item defunct, public-domain, or trademark-free without title/issue-level evidence. The original list belongs to the owner's supplied reference material and is not silently replaced.
**Phase 1 — Brand specification:** Produce editorial briefs, audience segmentation, app specifications and issue calendars for every record.
**Phase 2 — Sources:** Pull from lawful historical archives, identify exact issues/pages and distinguish discoverable versus reusable works.
**Phase 3 — Draft:** Write original material; clearly separate quotation, sourced history, fictional stories and brand copy.
**Phase 4 — Review:** Human editorial approval, rights checks, accessibility, QA, child-safety controls.
**Phase 5 — Publish:** Explicit release approval; sync to real master database through an authenticated service with readback verification. The private DB is not accessible from this GitHub coordination commit.

## Data model and state rules
`brand-registry.json` is the authoritative proposed records artifact **within this branch**, not the private main database. No external worker assignment, CI worker run, editorial draft, signed legal document, active trademark, database sync, or app deployment is implied by the presence of a record.

Valid work states: `not_started`, `draft`, `in_review`, `approved`, `released`. A state may advance only with a dated evidence reference and named reviewer.
Automated services must not assume consent to continuous execution, expense, distribution or unattended publication.

## Provenance and signing
**Author attribution requested by user:** Nathan Tabor.  
**Documentation prepared with:** ChatGPT (AI-assisted).  
**Publication signature:** NOT APPLIED. A textual name/attribution is not Nathan Tabor's personal signature, and a Git commit hash is an integrity reference, not a cryptographic signature. Obtain his explicit signing/approval mechanism for any signed publishing release. Never store private keys or signing credentials in this repository.

## Registry divisions
### foundational
- TABORBOY
- TABORGIRL
- TABORMAN
- TABORWOMAN
- TABORTRANS
- TABORALL
- TABORNONBINARY
- TABORQUEER
- TABORPRIDE
- TABORFLUID
- TABORINTERSEX
- TABORHUMAN
- TABORPERSON
- TABORSELF

### age-community
- TABORKID
- TABORKIDS
- TABORYOUTH
- TABORTEEN
- TABORGUYS
- TABORGALS
- TABORFOLKS
- TABORELDER
- TABORSENIOR
- TABORBABY
- TABORADULT
- TABORFAMILY
- TABORGENERATION

### personas
- TABORBOSS
- TABORHERO
- TABORLEGEND
- TABORREBEL
- TABOROUTLAW
- TABORJOKER
- TABORFOOL
- TABORGENIUS
- TABORNERD
- TABORDOG
- TABORSOUL
- TABORSPIRIT

### publishing
- TABORZINE
- TABORPOST
- TABORPRESS
- TABORTIMES
- TABORCHRONICLE
- TABORDIGEST
- TABORWEEKLY
- TABORDAILY
- TABORPULP
- TABORCOMIX
- TABORBOOK
- TABORMAG
- TABORNEWS
- TABORCOMICS
- TABORCLASSICS
- TABORARCHIVE
- TABORPRINT
- TABORLIBRARY
- TABORWORDS

### lifestyle
- TABORHOME
- TABORAUTO
- TABORRIDE
- TABORPLAY
- TABORGAME
- TABORSOUND
- TABORBEAT
- TABORTRUE
- TABORWORLD
- TABORRAW
- TABORGOLD
- TABORFIT
- TABORSPORT
- TABORSTYLE
- TABORBEAUTY
- TABORHEALTH
- TABORLOVE
- TABORLIFE
- TABORTRAVEL
- TABORMUSIC
- TABORART

### technology
- TABORTECH
- TABORAI
- TABORVERSE

## Next implementation contract
Connect authenticated publishing database with audited upserts keyed by brand ID, read back inserted records, attach revision hashes, and require review approvals. Only after run logs show services active may the system say workers are running 24/7.
