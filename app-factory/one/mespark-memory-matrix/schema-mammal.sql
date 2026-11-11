-- MAMMAL / meSPARK Then & Now: optional PostgreSQL schema.
-- Additive migration only. NOT applied to a live PostgreSQL instance.
-- Do not place private recollections in the public repository.
CREATE TABLE IF NOT EXISTS mammal_historical_records (
  record_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('road','address','landmark','postal','phone','other')),
  historical_identifier TEXT NOT NULL,
  later_identifier TEXT,
  era_label TEXT NOT NULL DEFAULT 'Through 1985',
  start_year INTEGER,
  end_year INTEGER CHECK (end_year IS NULL OR end_year <= 9999),
  evidence_status TEXT NOT NULL DEFAULT 'unresolved'
    CHECK (evidence_status IN ('conflict','unresolved','recollection','support')),
  source_type TEXT,
  source_url TEXT,
  historical_notes TEXT,
  private_record BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mammal_date_order CHECK (start_year IS NULL OR end_year IS NULL OR start_year <= end_year)
);
CREATE INDEX IF NOT EXISTS mammal_historical_records_history_idx
  ON mammal_historical_records (end_year, category);
CREATE INDEX IF NOT EXISTS mammal_historical_records_evidence_idx
  ON mammal_historical_records (evidence_status, private_record);
CREATE TABLE IF NOT EXISTS mammal_historical_sources (
  source_id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES mammal_historical_records(record_id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  source_url TEXT,
  captured_at TIMESTAMPTZ,
  source_excerpt TEXT,
  assessment TEXT CHECK (assessment IN ('supports','contradicts','context','untested')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS mammal_historical_change_log (
  change_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES mammal_historical_records(record_id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_kind TEXT NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  evidence_note TEXT
);
-- Access control: policies are intentionally deny-by-default pending real
-- application authentication and an owner-scoped authorization design.
ALTER TABLE mammal_historical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE mammal_historical_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE mammal_historical_change_log ENABLE ROW LEVEL SECURITY;
-- A public read-only view contains only non-private records and avoids
-- revealing contact information in private text/notes.
CREATE OR REPLACE VIEW mammal_public_crosswalk AS
SELECT record_id, title, category, historical_identifier,
       later_identifier, era_label, evidence_status, source_type, source_url
FROM mammal_historical_records
WHERE private_record IS FALSE
  AND category NOT IN ('address','phone');
-- NOTE: A plain view is not an RLS security boundary if granted broadly.
-- Do not grant access until authenticated roles and exposure are audited.
