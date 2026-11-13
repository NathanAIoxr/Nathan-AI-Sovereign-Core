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


## NATHAN AI — ONE DATABASE FEDERATION v074 / Ancient Minds

[Ancient Minds v074 adapter](./ancient_bridge.py) · [Bridge tests](./test_ancient_bridge.py) · [14-table reference source](./ancient_minds_reference/README.md).

The new Ancient Minds system plugs into **this existing ONE Federation**—there is no replacement or separate master database. It runs six user-supplied specialist roles through the local source-preserving reference and imports every one of the 14 native SQLite table families into the **same** private ONE master. Four unnamed specialist positions stay vacant.

- SHA-256-verifies and retains source bytes in an append-only `federation_ancient_originals` table with update/delete guards
- Indexes non-original rows as typed derived federation records with preserved per-row hashes, source IDs, CERO/UNO/DOS tiers and audit snapshots
- Imports relationships as **proposed**, not automatically proven; preserves source originals independently
- Uses stable ID-by-owner-file-SHA for repeatable runs and does not create duplicates
- Integrates with existing Leonardo/Donatello/Raphael/Michelangelo/DaVinci/AncientSpecialists worker roles, without reauthoring their code
- Includes an optional PostgreSQL + pgvector **schema reference**, not an external deployment

Use your owner-approved **private** federation database:

~~~sh
F=app-factory/nathan-ai/personal-intelligence/minds/federation
python3 "$F/ancient_bridge.py" --db "/private/ONE_Federation_Master.sqlite3" run-source "/path/to/owner-original.txt"
python3 "$F/ancient_bridge.py" --db "/private/ONE_Federation_Master.sqlite3" status
# Or import an already-produced Ancient Minds SQLite source read-only:
python3 "$F/ancient_bridge.py" --db "/private/ONE_Federation_Master.sqlite3" ingest-ancient "/path/to/private-ancient.sqlite3"
~~~

An exact owner-held reference ZIP can optionally be run with `--archive /path/to/Nathan_Mind_OS_Ancient_Minds_Reference_Build.zip`, after its SHA-256 is checked. GitHub Actions only processes the public 763-entry registry plus the public Ancient Minds sample, in an **ephemeral** CI database. It does **not** synchronize or publish the private master.
