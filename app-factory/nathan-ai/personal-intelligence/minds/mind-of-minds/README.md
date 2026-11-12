# NATHAN AI — Mind of Minds, 763-entry extended atlas

**Additive release by Nathan Tabor.** This folder extends the existing [Personal Intelligence Builder](../../index.html) and earlier [Minds Atlas](../index.html) without replacing their source files, protected originals, existing Vault data, earlier agent configurations, or ciphers.

[Open interactive atlas](./index.html)

## Included

- `index.html`: fully self-contained browsing and deterministic workroom, with an embedded copy of the 763-entry catalog.
- `catalog.json`: complete portable 763-record registry with source IDs, categories, creator and mythology lenses, and original module links.
- `engine.js`: address checking, classification, source separation, text search, and owner-review task planning.
- `schema.sqlite.sql` and `build_sqlite.py`: reproducible SQLite schema and full-text-search database generator.
- `schema.postgres.sql`: optional relational schema for a future Postgres/pgvector-backed service.
- `engine.test.cjs`: test coverage for cardinality, BigInt boundary, source preservation, and role separation.

## Contents and counts

The 763 catalog definitions combine five workflow roles, four Renaissance figures, four separate Turtle role templates, the original twenty Omni pantheon labels, nineteen historical text-study lenses (including Jesus and Buddha), twenty-seven creator forms, three distinct Devil Dog forms, eleven Alabama legends, 544 world mythology entries, and 126 restored mind-mode definitions.

**Namespace != live minds.** The original Omni Core declares 126,000,000,000 conceptual addresses, `0..125999999999`. The existing Node Runtime has a distinct 732,000,000 logical address space. Neither declaration allocates processes. The new app creates work plans, not active external language-model agents or historical consciousness copies.

Historical people and religious figures are text-study perspectives; creature entries are comparative folklore and research leads. Creator-defined roles and identities are retained and identified separately.

## Run

Open `index.html` in a browser, or visit the folder through the project's GitHub Pages host. No network provider is required for the static catalog.

To recreate the full database:

```sh
python3 build_sqlite.py
python3 - <<'PY'
import sqlite3
db = sqlite3.connect("Personal_Intelligence_Mind_Registry.sqlite")
print(db.execute("pragma integrity_check").fetchone())
print(db.execute("select count(*) from mind_definitions").fetchone())
PY
node --test engine.test.cjs
```

The resulting `Personal_Intelligence_Mind_Registry.sqlite` is a portable, full-text-searchable SQLite database built from the checked-in 763-record catalog. Do not commit private Vault records, home addresses, proprietary manuscript originals, passwords, or downloaded private archives.

For existing Personal Intelligence note ingestion, export the catalog's CERO/UNO/DOS packets from the browser and import them using the Personal Intelligence **Backup & audit** tab. Only owner-selected notes enter local storage.

The source register distinguishes original records, evidence-reviewed claims, creator interpretations and folklore research leads. The initial comparative mythology names are *not* all independently verified.
