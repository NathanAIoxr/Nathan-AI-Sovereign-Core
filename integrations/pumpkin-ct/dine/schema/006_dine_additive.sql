-- Additive Diné education/product/content schema. Do not touch other tables.
CREATE TABLE IF NOT EXISTS dine_modules (
  module_id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT', source_ref TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS dine_content (
  content_id TEXT PRIMARY KEY, module_id TEXT NOT NULL, title TEXT NOT NULL,
  content_type TEXT NOT NULL, body TEXT NOT NULL DEFAULT '',
  source_url TEXT, provenance TEXT, contributor TEXT, rights_scope TEXT,
  review_status TEXT NOT NULL DEFAULT 'DRAFT', culturally_sensitive INTEGER NOT NULL DEFAULT 0,
  approved_for_publication INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(module_id) REFERENCES dine_modules(module_id)
);
CREATE TABLE IF NOT EXISTS dine_products (
  sku TEXT PRIMARY KEY, module_id TEXT NOT NULL, title TEXT NOT NULL,
  fulfillment_mode TEXT NOT NULL, pricing_status TEXT NOT NULL DEFAULT 'UNAPPROVED',
  church_payout_rule TEXT, contributor_payment_rule TEXT, approved INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(module_id) REFERENCES dine_modules(module_id)
);
CREATE TABLE IF NOT EXISTS dine_source_archive (
  source_id TEXT PRIMARY KEY, exact_text TEXT NOT NULL,
  source_kind TEXT NOT NULL, completeness TEXT NOT NULL,
  added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dine_content_review ON dine_content(review_status,approved_for_publication);
