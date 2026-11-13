# NATHAN AI — ONE DATABASE FEDERATION v074 · Worker bots

**Nathan Tabor · November 12, 2026 · additive implementation**

Connect existing ONE and Mind of Minds databases through a separate local main database, preserving original source data and recording worker actions.

**Worker roles:** Leonardo (orchestration); Donatello (proposed classification); Raphael (SHA-256 verification); Michelangelo (exact-content cross-references); DaVinci (audited totals); AncientSpecialists (CERO / UNO / DOS and owner-reviewed crosswalks).

## Run locally

Requires Python 3.10+, standard library only:

    python3 federation.py --db ONE_Federation_Master.sqlite3 init
    python3 federation.py --db ONE_Federation_Master.sqlite3 ingest /absolute/path/to/source.sqlite3
    python3 federation.py --db ONE_Federation_Master.sqlite3 ingest ../mind-of-minds/catalog.json
    python3 federation.py --db ONE_Federation_Master.sqlite3 ingest data/space-final-frontier-meru-v074.json
    python3 federation.py --db ONE_Federation_Master.sqlite3 run
    python3 federation.py --db ONE_Federation_Master.sqlite3 status
    python3 federation.py --db ONE_Federation_Master.sqlite3 search Tabor
    python3 -m unittest discover -s . -p test_federation.py -v

The original SQLite file is opened read-only and is never replaced. The private master index retains exact source text, content hashes, source-specific identities and additive links. Reimporting identical records is idempotent. SQLite tables without an adapter are inventoried (table names and counts), not falsely claimed to be fully ingested.

The public GitHub Action tests and runs all six roles against only the public 763-entry Mind of Minds registry. It writes a short audit artifact. Scheduled runs are separate ephemeral instances, not persistent cloud synchronization with the owner's private Library.

**PRESERVE → INDEX → RELATE → DERIVE — NEVER REPLACE.** No private databases, passwords, original manuscripts or owner-only source bytes are committed publicly. Dewey, LoC and Duo/12 assignments are proposed crosswalks, not certified library classifications. Logical mind addresses are not deployed AI agents.

## SPACE ... THE FINAL FRONTIER · ME R U U R ME (v074)

The additive source pack at [data/space-final-frontier-meru-v074.json](data/space-final-frontier-meru-v074.json) retains **41 original-source or attributed-interpretation records** and **40 proposed relationships**. It contains the author's precise words:

> SPACE ... THE FINAL FRONTIER aka the SPACE between the EARS as my grandmother said

> that's my ME R U U R ME formula haha

It indexes the original token mirror **ME | R | U || U | R | ME**, its authored phonetic MERU / U R ME reading, the Kanda, Hiranyagarbha, Nabhi Marma, Manipura, Surya, Chandra, Amrita, 72,000 nadis, the five Vayus with their supplied location/function/cosmic-comparison rows, Kshira Sagara, Akasha Ganga, enteric nervous system, the spine/Mount Meru analogy, seed sound RAM, the ten-petal lotus, Ayurvedic Agni, and source leads for primary text verification.

**The precise words and supplied excerpts stay in `federation_records.exact_source_text` with SHA-256.** The new `federation_record_metadata` table stores source location, provenance, evidence status, original structured entry and tags. Cross-links are stored in `federation_links` with state **proposed**; they do not assert verified astronomical, anatomical, linguistic, or historical equivalence. All new items enter at **CERO** for review, without self-authorizing UNO/DOS advancement.

Historical and cultural source names in this pack are user-provided attribution leads, **not** claims that the purported textual passages have been checked or that subtle-energy models are established clinical anatomy.

### Internal read-only integration

```bash
cd app-factory/nathan-ai/personal-intelligence/minds/federation
python3 federation.py --db ./ONE_Federation_Master.sqlite3 init
python3 federation.py --db ./ONE_Federation_Master.sqlite3 ingest ../mind-of-minds/catalog.json data/space-final-frontier-meru-v074.json
python3 federation.py --db ./ONE_Federation_Master.sqlite3 run
python3 federation.py --db ./ONE_Federation_Master.sqlite3 search "ME R U U R ME"
python3 federation.py --db ./ONE_Federation_Master.sqlite3 search "SPACE between the EARS"
python3 federation.py --db ./ONE_Federation_Master.sqlite3 status
```

Expected public ingest: **763 existing mind definitions + 41 v074 knowledge records = 804 federated source records** across two inputs. The 40 suggested Meru links are auditable and remain unverified. Six worker roles inspect the combined registry; no live provider agents are launched. Original JSON and original SQLite sources are opened/read as inputs without overwriting; the output master SQLite is local/private and Git-ignored by workflow convention. The public GitHub Actions federation run is ephemeral and publishes only a short audit report.

The user's private source files and family identity details are **not** uploaded to this public repository. The named grandmother quotation is included only as supplied by the author, without her identifying details. The wordplay is the author's creative interpretation, not a verified Sanskrit derivation.

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
