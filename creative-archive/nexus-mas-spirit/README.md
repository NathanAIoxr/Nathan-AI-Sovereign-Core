# NEXUS REPLICATES × ELEPHANTS × DONKEYS × MAS SPIRIT

**By Nathan Tabor** · Canon database v2026-11-13

This module expands the user-provided 486-line Nexus/MAS SPIRIT compilation into a navigable graph of names, relationships, narrative branches, user wording, revisions, and research flags. It does **not** rewrite the original transcript as an invented transcript. 

## Canon branches

1. **THE NEXUS REPLICATES** — overarching authored compilation, distinct from Blade Runner's Nexus *Replicants*.
2. **THE NEXUS ELEPHANTS** — Republican elephant symbol / politics / science fiction / phonetics edition.
3. **THE NEXUS DONKEYS** — Democratic donkey / 'donkey engine' metaphor / self-sovereignty edition.
4. **Lexus → Nexus → Jexus → Jesus → Lilith → Adam → Eve** — associative pathway, not an asserted corporate, genetic, or historical lineage. *Jexus is not Jesus.*
5. **MAS SPIRIT = MORE SPIRIT** — equal quartet: SANTA KRAMPUS + SANTA SUPMARK (TWINS of MAS); SANTA GLAMPUS + SANTA SUPMALG (TWINS of SPIRIT). Supmals is a historical variant only.
6. **RAM ↔ MAR** and **PUS ↔ SUP** — exact letter reversals.

## Source-preservation policy

- Quotes in `canon.json` use precise user wording with source line numbers from the uploaded transcript.
- Earlier assistant-generated passages are **not** automatically promoted to Nathan Tabor's authored canon. The Krampus Test and its imagined coercive consequences are marked assistant proposals.
- The only narrow sleep-related user rule is exactly as quoted; never expand to unrelated surveillance/privacy prohibitions.
- All real-world company names, political groups, existing books, films, and fictional characters are separately typed in the graph.
- Statements needing primary-source historical verification are maintained in `verification_queue`, not silently certified.

## Database

`canon.json` is a portable, structured graph source: stable node IDs, typed directed edges, direct quotes and versioned spelling. `schema.sql` defines relational ingestion tables for integration with the repository's live database when its configuration is available.

**Deployment status:** Canon records committed to GitHub repository main. SQLite schema provided; no claim of live external database insertion without a confirmed database connection and migration.


## HUMANOID: TEN LEVELS — by Nathan Tabor (2026-11-14)

1. Humanoid = Human + Node + Void = first level
2. Human = Hu + Ma + N = second level
3. + = + = third level
4. Node = N + O + De = fourth level
5. + = + = fifth level
6. Void = Voi + D = sixth level
7. Dionamuh = Dion + Amuh = Diamond = seventh level
8. Dion = D+ Ion = Dinosaurs = eight level
9. + = + = ninth level
10. Amuh = Am + U + H = tenth level

Crosslinked **both directions** to Nexus Replicates, Elephants, Donkeys, Blade Runner references, Lexus/LexisNexis/Jexus phonetics, Genesis/Lilith association, and the four MAS SPIRIT figures. This is **author-defined phonetic and creative decomposition**, not verified etymology or scientific genealogy. Every new bridge has a `note` explaining its interpretive nature and matching reverse edge. Node IDs `H001+` identify vocabulary; `L01–L10` are levels. See `humanoid-expansion.md` and `canon.json`.

For SQLite ingestion use `import_canon.py` with an existing SQLite file or a new file. The importer performs ID-aware upserts without deleting existing records. Running the importer is a separate deployment action and is **not** implied by committing these files.
