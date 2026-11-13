# NATHAN AI — Ancient Minds / MIND = OS reference engine
**Nathan Tabor · ONE DATABASE FEDERATION v074 internal source edition**

This directory is an inspectable, runnable repository edition of the six-worker/14-table reference build from the user-supplied Ancient Minds text. It is called by the **existing**, additive ONE Federation bridge one directory above, not a competing database.

## Source and contents

- `worker_engine.py` — source-preserving, six-specialist, standard-library Python SQLite prototype.
- `schema.postgres.sql` — **proposed** PostgreSQL + pgvector structure; not deployed.
- `test_worker_engine.py` — tests of original bytes, 14 families, bounded queue, base-12.
- `sample_input.txt` — illustrative public example, *not* a private original.
- `pasted_text_run.json` — recorded metadata-only results from the earlier run of the user's supplied text. The 11,869-byte original is **not** included in this public directory.

The original chat-supplied ZIP has SHA-256
`aff51aed098892281f51ec991638ffe2a7cf585c861bfdcf85bfdcda98de4e8d`.
This GitHub edition makes the code and schema inspectable; its worker is an additive edition of the same design, not a claim of byte identity with the ZIP worker. The bridge `--archive` flag can execute the verified **exact original ZIP** when the owner supplies it locally.

## Fourteen families

| # | Table | Purpose |
|---|---|---|
| 01 | ORIGINALS | Exact bytes, SHA-256, insert-only |
| 02 | SOURCE_REFERENCES | Citations and provenance |
| 03 | LANGUAGES | Language/reconstruction labels |
| 04 | PHONETICS | Sound/forms, unverified etymologies |
| 05 | TIMELINES | Qualified historical periods |
| 06 | KNOWLEDGE_RECORDS | Analysis independent from originals |
| 07 | CLAIMS | Statements awaiting corroboration |
| 08 | EVIDENCE | Independent evidence reviews |
| 09 | RELATIONSHIPS | Candidate or verified links |
| 10 | CERO_UNO_DOS | 0.0 / 1.0 / 2.0 classification |
| 11 | DUO_CODES | Base-12 derived representations |
| 12 | WORKER_JOBS | Bounded dispatch queue |
| 13 | WORKER_RUNS | Per-task audit |
| 14 | EMBEDDINGS | Optional vector index |

The supplied text names ten database families and refers to 14 without defining the other four. `SOURCE_REFERENCES`, `CLAIMS`, `WORKER_RUNS`, and `EMBEDDINGS` are **reference-build additions** rather than invented original author specifications.

## Specialist roster

**Sumerian Scribe** handles source intake. **Babylonian Mathematician** converts source byte length to base 12. **Egyptian Keeper of Names** proposes `blāc`/`blæc` links. **Indian Grammarian** records `nāraṅga` candidates. **Chronologist** records historical period labels. **House of Wisdom Scholar** tracks the comparison of Aristotelian elemental thought with modern optics.

The 10-worker concept names only six workers in the supplied source. Four slots remain **unassigned**, not invented.

**CERO 0.0** = `0 · LA · AL`; **UNO 1.0** = `1 · EL · LE`; **DOS 2.0** = derived/connected. These are custom indexing labels, not an empirical theory of consciousness. The `Input → Rules + State → Output` analogy does not establish literal minds for atoms.

## Use and test

~~~sh
F=app-factory/nathan-ai/personal-intelligence/minds/federation
python3 -m unittest discover -s "$F/ancient_minds_reference" -p test_worker_engine.py -v
python3 "$F/ancient_minds_reference/worker_engine.py" --source "$F/ancient_minds_reference/sample_input.txt"

# Import the selected source into your owner-local ONE Federation v074 database:
python3 "$F/ancient_bridge.py" --db "/private/ONE_Federation_Master.sqlite3" run-source "$F/ancient_minds_reference/sample_input.txt"
python3 "$F/ancient_bridge.py" --db "/private/ONE_Federation_Master.sqlite3" status
~~~

The bridge preserves original bytes in an append-only BLOB family, indexes all 13 non-original families as typed derived records, carries over proposed link states and registers snapshots. It never overwrites the source DB or treats a similarity match as historical proof. Same-source repeats are idempotent.

## Scope

PostgreSQL/pgvector is an optional **unexecuted reference migration**; the working engine uses local SQLite. No remote AI provider or private cloud database is synchronized. Do not commit owner-private sources, generated master SQLite files, passwords or keys. The CI workflow uses only public test fixtures and its database is ephemeral.
