CREATE TABLE IF NOT EXISTS nathan_coin_catalog (catalog_id TEXT PRIMARY KEY,family TEXT NOT NULL,ticker TEXT NOT NULL,display_name TEXT NOT NULL,source_label TEXT NOT NULL,verification TEXT NOT NULL DEFAULT 'concept_record_only',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_nathan_coin_catalog_family ON nathan_coin_catalog(family,ticker);
