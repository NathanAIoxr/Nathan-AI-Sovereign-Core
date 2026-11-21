# Nathan AI Global Fleet Directory

Canonical logical location: `nathan-ai/fleet/global`

Existing D1 database: `tabor-fleet-registry` (`00e422eb-5222-4892-8f90-74aaf8ab0518`)

- `fleet_database_directory_v1`: 140 actual account database references inserted and verified.
- `fleet_collection_sources_v1`: 15 source-table pointers across six existing fleet/catalog databases inserted and verified.

These are **references** and do not duplicate database contents or deploy workers. The user's collection is described as worldwide, but geographic origin for each individual source remains `unverified` until supported by provenance. The 16,000+ claim is a reconciliation target, not a verified count of distinct live agents.

Queries:

```sql
SELECT database_name,database_id,status FROM fleet_database_directory_v1 ORDER BY database_name;
SELECT source_key,table_name,category,geographic_origin,identity_status FROM fleet_collection_sources_v1 ORDER BY source_key;
```

Existing registry counts: 1,643 observed worker identities, six declared agents, three declared bots; 29,316 evidence/event records (not distinct agents). Do not sum events, virtual slots and runtime records as identities.

No DNS zone, Worker, or new database was created. No existing data was deleted. Source of truth is the existing database; this document is a discoverability pointer.
