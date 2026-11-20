# Tabor Academy Conductor

Use the `tabor-academy` branch and keep Academy work scoped to this directory and its existing Cloudflare resources. The public app is served by the `tabor-academy` Worker in the `tabor-academy` dispatch namespace. Its D1 binding is `LIBRARY` backed by `tabor-academy-library`.

## Workbench backlog

```sql
SELECT t.number, t.title, z.brief, z.namespace_name
FROM academy_techniques AS t
JOIN academy_technique_zones AS z USING (number)
LEFT JOIN academy_field_activities AS a USING (number)
WHERE a.number IS NULL AND t.number <> 47
ORDER BY t.number
LIMIT 5;
```

Technique 47 already has a printable lesson and sandbox. For each selected number, write a concrete finished outcome, a demonstration, and an exercise where the learner replicates and verifies the result. Use a topic-specific practice setup. Keep the existing titles and project briefs verbatim. Use safe models for hazardous tasks.

1. Add a numbered migration for the batch using `INSERT ... ON CONFLICT(number) DO NOTHING`. Run the project's Worker tests and apply the migration to the existing D1 database.
2. Update the `TECHNIQUE` binding in each corresponding `tabor-academy-<NNN>-dev` namespace. Preserve the original record fields and add `field_activity` with `outcome`, `demonstration`, and `verification`. Use `src/technique-zone.mjs` for the individual Workers.
3. Verify the exact activity on `/workbench/zones/<number>/`, and verify the guide's printable edition at `/workbench/?guide=<number>&print=1`. Record the commit, tested paths, Worker updates, and remaining count.

When the Workbench backlog is complete, continue with field guide layouts, Field Companion, and Sandbox milestones. Verify the existing Workbench and Survival catalogs stay at 101 records each. Keep private source text in the private archive and preserve the nine-line homepage opening.

## The Nathan Tabor Way curriculum

The live curriculum is at `/way/`. Its path and mission tables are `academy_way_paths` and `academy_way_missions` in the Academy D1 database. Eight path Workers run in `tabor-academy-way-<path>-dev` with script name `curriculum`.

Take a bounded mission batch when the Academy rotation selects curriculum expansion. Use the topic coverage on each path to select original exercises that fill a gap. Give each mission a finished outcome and topic-specific Build, Flip and clear, Integrate, and Verify steps. Bridge practice should identify an actual prerequisite. Keep the printed proof sheet and QI/QE prompts. Add the public rows in an incremental migration and sync the affected path Worker manifest with the existing Academy zone-worker template. Verify the exact mission at `/way/<path>/<mission>/` and its public catalog entry. Preserve the independent Workbench and Survival catalogs and their existing priorities.

## Gaslighting, deflection, and plain truth

Continue this unit under the existing hourly Academy rotation. Keep each mission independently addressable, with a related lesson and a discoverable entry in the [Academy map](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/map/). Use the existing language, humanities, computing, and life destinations so those links return to working subject paths. Keep this unit's work rotating alongside Workbench, Survival, and the other Academy lanes.

Read the live `/way/catalog.json` before selecting work. Pick the first backlog batch whose accepted result is missing. Carry one batch through a reusable migration or scoped code change, the relevant tests, any existing path Worker manifest sync, and live checks. When another run already delivered a batch, verify its receipt and continue to the next. Record commit, URLs, lesson slugs, checks, and any specific blocker. If a source is missing, use a different eligible batch and leave a retrieval note for the blocked one.

The two originating lessons are `language/gaslighting-and-plain-truth` and `humanities/dine-we-the-people-and-pursuit`. Migration `0008_plain_truth_missions.sql` makes those public lessons reproducible and adds four independent practice missions. The verbatim case and instructor guide are already in the private Academy archive. Keep private transcript lines, private correspondence, and private source archives out of GitHub, the public catalog, and scenario examples. Use public records and clearly fictional case material for public exercises. Keep Nathan's words attributed and exact wherever publication is already authorized.

| Order | Backlog batch | Accepted result |
| --- | --- | --- |
| 1 | Distinguish evasive replies | Publish an independently linked classification drill covering direct answer, factual error, deflection, talking past someone, mind-reading, and misrepresentation. Include an answer key grounded in each fictional turn. Treat gaslighting as manipulation affecting trust in one's perceptions. |
| 2 | Check contradictory AI answers | Publish a companion exercise with an exact prompt and two fixed AI outputs. Learners classify claims as supported, contradicted, or unresolved, then write a sourced correction. Link both directions with the existing AI record-check exercise where the map supports it. |
| 3 | Hear it, say it back | Connect Talking Mammals to Nathan's QI and QE through a separate listening practice for dropped qualifiers, incorrect readbacks, and confirmation. Supply sample dialogue and a printable proof sheet. |
| 4 | Read the changed words | Build a public-source packet for the Virginia Declaration, Jefferson's rough draft, and the adopted Declaration. Compare what the words actually say, then mark where stronger claims about editing and motive require evidence. Link to the Diné civics lesson and The Time of Peace. |
| 5 | Whose record survives | Connect The War of Mammals, including The Truthful Twin Thrones, to a fictional record-restoration exercise. Use verified publicly available material or a clearly labeled original teaching scenario. Publish a separate timeline and correction log. |
| 6 | Voice Box and source provenance | Build and test an exercise that retains exact source wording and records a human correction alongside it. Use fictional material for the public demonstration and include a printable account of the edit. |
| 7 | Plain-truth capstone | Publish a case packet that asks students to rebuild a conversation, check a source, answer directly, and issue a correction. Provide worked answers and a self-check. Telling the truth takes no credential or coursework. |
| 8 | Academy map and return paths | Check that all delivered lessons can be found by title and topic, preserve the return trail, link to their anchors, and remain usable in the printable views. Repair broken links and record the tested path. |

For the definitions and AI behavior, use the [APA Dictionary of Psychology](https://dictionary.apa.org/gaslight) and [NIST AI 600‑1, section 2.2](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf). For civics, use the [Virginia Declaration of Rights](https://www.archives.gov/founding-docs/virginia-declaration-of-rights), [Jefferson rough draft](https://www.loc.gov/item/mtjbib000156/), [final Declaration](https://www.archives.gov/founding-docs/declaration-transcript), [Constitution](https://www.archives.gov/founding-docs/constitution-transcript), [Diné Fundamental Laws](https://courts.navajo-nsn.gov/dine.htm), and [Navajo Nation Treaty of 1868](https://courts.navajo-nsn.gov/Treaty1868.htm).


### Talking Mammals handoff

The Academy Conductor owns follow-up under **Gaslighting, deflection, and plain truth, batch 3**. Keep the existing rotation. Check the live catalog for the accepted result before starting a batch.

- Live lesson: [the academy for TALKING MAMMALS](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/talking-mammals/). The lesson covers manners and muscle memory, the walking gas factory, **I TALKED TO MY DOG LIKE A HUMAN**, the conversation flipped, the cats' boundaries, and Nathan's **chief herder of cats** story. The field exercise asks learners to distinguish what they saw from what they inferred and then reverse the direction.
- Release evidence: [lesson source commit](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/commit/c0dc58f527a33d7109ca2a37444866fc61335c5f) and [passing Academy checks](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/actions/runs/44751938672). The current lesson, Academy map, and way catalog responded successfully during handoff.
- Private archive: Academy D1 table `academy_history_sources`, slug `talking-mammals`, 11,680 bytes, SHA-256 `e29c699f308603f96966c734ff043d324d0b84c2f85dc1d9ab87a34397130dfb`. Use the reference for integrity checks. Keep the submitted transcript in its private archive.
- Next accepted result: Publish **Hear it, say it back** as its own language practice. Use short, fictional dialogue to test a dropped qualifier, an incorrect readback, and a direct confirmation. Use QI to check the exact words and QE to notice how the other person responds. Include a printable proof sheet and link both directions between the practice and Talking Mammals. Verify the new mission, its Academy map and way-catalog links, the lesson's return link, and the existing private-source boundary. Record the commit, routes, and test result when complete.

## 101 Biblical Realities · KJV

Course home: [101 Biblical Realities · KJV](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/way/biblical-realities/). Start with mission `biblical-realities-zero`. Migration `0009_biblical_realities.sql` installs five topic paths and their 101 independently addressable numbered lessons, a separate KJV expansion path with 12 initial lessons, and the course index. The topic numbers and titles come from the supplied 101-entry index. The public exercises use KJV passages and original Academy teaching material. The exact submitted file is in the private Academy source archive under `biblical-realities-101-submitted-source`.

Source edition: [eBible King James (Authorized) Version, ENGKJV](https://ebible.org/eng-kjv2006/), standardized KJV text. Preserve KJV wording in quotes and name interpretive or historical claims in the exercise rather than presenting them as part of a verse. Read the complete passage for decisions about genre, speaker, context, or an apparent contradiction. Use reading and on-paper comparisons for spiritual, health, and mortality topics.

### KJV expansion backlog

After reviewing recent live releases, keep the next missing KJV batch in the Academy Conductor rotation with the plain-truth, Workbench, Survival, and humanities lanes. Use the existing production Worker and D1 curriculum. Run one bounded batch of three to five new lessons, spaced across book families, then post a versioned receipt in the GitHub branch. Keep each lesson independently addressable and connect it with one existing companion. Verify all new and changed links in the live course, map, and public catalog, and confirm the archive stays private.

| Order | Scope | First coverage to add |
| --- | --- | --- |
| 1 | Law and narrative foundations | Genesis through Deuteronomy. Add creation and covenant comparisons, a law versus narrative distinction, and lessons on whose testimony a passage records. |
| 2 | Histories and return | Joshua through Esther. Build pairs from Joshua and Judges, Samuel and Kings, Kings and Chronicles, and Ezra, Nehemiah, and Esther. Keep separate accounts traceable. |
| 3 | Poetry and wisdom | Job, Psalms, Proverbs, Ecclesiastes, and Song of Solomon. Compare who speaks, repetition, irony, lament, and imagery. |
| 4 | Prophetic books | Isaiah through Malachi in KJV order, including the minor prophets. Add historical setting only where the text or an attributable source establishes it. |
| 5 | Gospels and Acts | Matthew through Acts. Compare parallel accounts using exact KJV references and leave differences visible. |
| 6 | Letters and Revelation | Romans through Revelation. Identify recipient, question, genre, and how each cross-reference supports the reading. |

Track coverage by book, chapter and verse range. Count a book as touched only when its reference appears in a verified released exercise. For every unfinished book, select its next uncovered section and add distinct exercises that build on prior work. The goal is teachable passage coverage across all 66 KJV books, with optional thematic and deeper passage studies as new lessons. Keep existing lesson URLs and original course numbering intact.

## The Complete Human Learning Arc

[Academy course](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/way/human-learning-arc/) · [Separate Tabor World timeline](https://tabor-world.nathantaboract.workers.dev/human-learning-arc/)

The original [101 Hands-On Learning Methods](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/institution/learning-methods/) retain their own sequence and activities. Migration `0010_human_learning_arc.sql` publishes the submitted titles as modules 1–30 and the gap topics as 31–48, starting with the separate Zero orientation and five Academy sections. The submitted outline is archived as `complete-human-learning-arc-submitted-outline` in private Academy source storage. Use the main branch's `tabor-world/human-learning-arc/` directory for World stations and this branch's Academy migration for exercises.

Keep deep time, inference from archaeological records, living community knowledge, engineering demonstrations, and future scenarios identifiable in each lesson. Add new evidence in bounded releases for a specific region or question. Record a dated source, a replicable educational exercise, and a link to the relevant existing station or course. Good next comparisons include open-air sites across Africa and Asia, submerged landscapes and Pacific wayfinding, regional agricultural and writing histories, and accessible recovery plans for future water, food, energy and local information systems.
