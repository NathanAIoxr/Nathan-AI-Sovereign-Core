CREATE TABLE IF NOT EXISTS holding_catalog_references_v1 (
 kind TEXT NOT NULL,
 source_id TEXT NOT NULL,
 slot INTEGER NOT NULL,
 canonical_catalog_ref TEXT NOT NULL,
 contents_state TEXT NOT NULL,
 launch_status TEXT NOT NULL DEFAULT 'REFERENCE_ONLY',
 PRIMARY KEY(kind,source_id)
);
INSERT OR IGNORE INTO holding_catalog_references_v1(kind,source_id,slot,canonical_catalog_ref,contents_state)
 SELECT 'book',set_id,slot,canonical_catalog_ref,contents_state FROM virtual_book_set_v1;
INSERT OR IGNORE INTO holding_catalog_references_v1(kind,source_id,slot,canonical_catalog_ref,contents_state)
 SELECT 'technology',set_id,slot,canonical_catalog_ref,contents_state FROM virtual_technology_set_v1;
