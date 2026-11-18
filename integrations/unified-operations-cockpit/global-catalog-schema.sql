-- Nathan AI Global Catalog; provisioned in Cloudflare D1
-- Database: nathan-ai-global-catalog
-- UUID: 1889fb08-9b26-45b9-8a71-f22a6ee3fc66
CREATE TABLE IF NOT EXISTS catalog_sources (
 source_id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 url TEXT NOT NULL,
 category TEXT NOT NULL,
 licensing_note TEXT NOT NULL,
 stage TEXT NOT NULL DEFAULT 'discovered',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS catalog_items (
 item_id TEXT PRIMARY KEY,
 source_id TEXT NOT NULL REFERENCES catalog_sources(source_id),
 external_id TEXT,
 name TEXT NOT NULL,
 url TEXT,
 license TEXT,
 cost_class TEXT NOT NULL DEFAULT 'unknown',
 compatibility TEXT NOT NULL DEFAULT 'unreviewed',
 state TEXT NOT NULL DEFAULT 'discovered',
 last_checked TEXT,
 UNIQUE(source_id,external_id)
);
CREATE TABLE IF NOT EXISTS catalog_batches (
 batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
 source_id TEXT,
 batch_number INTEGER NOT NULL,
 size INTEGER NOT NULL DEFAULT 20,
 state TEXT NOT NULL DEFAULT 'pending',
 started_at TEXT,
 finished_at TEXT,
 error TEXT
);
CREATE TABLE IF NOT EXISTS catalog_events (
 event_id INTEGER PRIMARY KEY AUTOINCREMENT,
 item_id TEXT,
 event_type TEXT NOT NULL,
 detail TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_catalog_items_state ON catalog_items(state,source_id);
CREATE INDEX IF NOT EXISTS idx_catalog_batches_state ON catalog_batches(state,batch_number);
