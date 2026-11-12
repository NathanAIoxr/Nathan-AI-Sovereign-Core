# NATHAN AI — ONE Federation worker bots

**Nathan Tabor · November 12, 2026 · additive implementation**

Connect existing ONE and Mind of Minds databases through a separate local main database, preserving original source data and recording worker actions.

**Worker roles:** Leonardo (orchestration); Donatello (proposed classification); Raphael (SHA-256 verification); Michelangelo (exact-content cross-references); DaVinci (audited totals); AncientSpecialists (CERO / UNO / DOS and owner-reviewed crosswalks).

## Run locally

Requires Python 3.10+, standard library only:

    python3 federation.py --db ONE_Federation_Master.sqlite3 init
    python3 federation.py --db ONE_Federation_Master.sqlite3 ingest /absolute/path/to/source.sqlite3
    python3 federation.py --db ONE_Federation_Master.sqlite3 ingest ../mind-of-minds/catalog.json
    python3 federation.py --db ONE_Federation_Master.sqlite3 run
    python3 federation.py --db ONE_Federation_Master.sqlite3 status
    python3 federation.py --db ONE_Federation_Master.sqlite3 search Tabor
    python3 -m unittest discover -s . -p test_federation.py -v

The original SQLite file is opened read-only and is never replaced. The private master index retains exact source text, content hashes, source-specific identities and additive links. Reimporting identical records is idempotent. SQLite tables without an adapter are inventoried (table names and counts), not falsely claimed to be fully ingested.

The public GitHub Action tests and runs all six roles against only the public 763-entry Mind of Minds registry. It writes a short audit artifact. Scheduled runs are separate ephemeral instances, not persistent cloud synchronization with the owner's private Library.

**PRESERVE → INDEX → RELATE → DERIVE — NEVER REPLACE.** No private databases, passwords, original manuscripts or owner-only source bytes are committed publicly. Dewey, LoC and Duo/12 assignments are proposed crosswalks, not certified library classifications. Logical mind addresses are not deployed AI agents.
