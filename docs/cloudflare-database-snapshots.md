# Tabor databases on Cloudflare

By Nathan Tabor and Nathan AI.

The D1 registry records each database, the source revision or observation time, the import hash and the live table counts. These databases are accessible from the Cloudflare account. Each source snapshot has its own D1 database.

| D1 database | Source |
| --- | --- |
| `tabor-cosmic-body` | Cosmic Body Atlas SQLite builder |
| `tabor-mind-of-minds` | Personal Intelligence Mind Registry SQLite builder |
| `tabor-nexus-canon` | Nexus and MAS SPIRIT SQLite importer |
| `tabor-modern-day-bible` | The Modern Day Bible recovered SQLite SQL |
| `tabor-language-of-sound` | Holy Bible Language of Sound SQLite SQL |
| `tabor-worlds-atlas` | meSPARK Worlds Atlas catalog and adapted reference schema |
| `tabor-historical-sports` | Historical Sports examples and adapted reference schema |
| `tabor-airtable-one-master` | ONE MASTER INDEX field-ID and record snapshot |
| `tabor-airtable-crypto-wallets` | Crypto Wallets & Assets field-ID and record snapshot |
| `tabor-airtable-crypto-mining` | Crypto Mining Operations field-ID and record snapshot |

## Rebuild

1. Build the project's SQLite database from the recorded source revision in a clean working directory. Build the two reference catalogs with `python tools/d1_reference_catalogs.py /path/to/exports`.
2. Run `python tools/d1_snapshot.py source.sqlite snapshot.sql` for a populated SQLite file. The exporter checks source integrity and foreign keys. It rebuilds FTS indexes from logical rows and checks the exported database before returning source counts and checksums.
3. For Airtable, export base and table metadata with complete field-ID record pages. Use a `schema.json` and one or more `TABLE_ID-NNN.json` arrays per table. Each record has `id`, `createdTime`, and `cellValuesByFieldId`. Each schema table has `recordCount` and an `included` flag for each field. Run `python tools/d1_airtable_snapshot.py /path/to/source snapshot.sql`. Retain attachment metadata separately from any temporary download links. Airtable remains the source for live records, formulas, and automations.
4. Import each snapshot into a clean D1 target using the Cloudflare SQL import API or `wrangler d1 execute DB_NAME --remote --file snapshot.sql`. Verify live counts and FTS lookups before recording a successful import. The export is intended for fresh targets.
5. Apply `tools/d1_database_registry.sql` to the registry and record the live counts, source hash, and source revision for each import. Existing databases can be registered from their Cloudflare metadata.

The checked-in meSPARK private index requires an owner-provided source export. The PostgreSQL migrations for Ancient Minds, meSPARK Mammal and the ONE Catalog contain PostgreSQL features such as vector search or row-level security. Their live data requires the source database or an export. Treat the SQLite copies as point-in-time snapshots.
