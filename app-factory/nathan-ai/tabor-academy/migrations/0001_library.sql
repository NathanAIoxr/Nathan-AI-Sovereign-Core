CREATE TABLE IF NOT EXISTS library_records (
  record_id TEXT PRIMARY KEY,
  loc_call_number TEXT NOT NULL,
  cud_index INTEGER NOT NULL CHECK (cud_index IN (0,1,2)),
  title_bottom TEXT NOT NULL,
  end_outcome_z TEXT NOT NULL,
  root_origin_a TEXT NOT NULL,
  verbatim_body TEXT NOT NULL,
  public_explanation TEXT NOT NULL DEFAULT '',
  sources_json TEXT NOT NULL CHECK (json_valid(sources_json)),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS pure_attributes (
  attribute_id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id TEXT NOT NULL REFERENCES library_records(record_id),
  stripped_label TEXT NOT NULL,
  core_attribute TEXT NOT NULL,
  functional_mechanic TEXT NOT NULL,
  replication_steps TEXT NOT NULL,
  UNIQUE (record_id, stripped_label)
);
CREATE TABLE IF NOT EXISTS root_lexicon (
  term TEXT PRIMARY KEY,
  phonetic_key TEXT NOT NULL,
  reverse_mapping TEXT,
  primary_root_ref TEXT,
  context_rule TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS verification_ledger (
  check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id TEXT NOT NULL REFERENCES library_records(record_id),
  protects_innocence INTEGER NOT NULL CHECK (protects_innocence IN (0,1)),
  is_replicable INTEGER NOT NULL CHECK (is_replicable IN (0,1)),
  gate_status TEXT GENERATED ALWAYS AS (
    CASE WHEN protects_innocence = 1 AND is_replicable = 1 THEN 'RETAIN_1' ELSE 'PURGE_0' END
  ) STORED
);
CREATE INDEX IF NOT EXISTS academy_verification_latest ON verification_ledger(record_id, check_id DESC);
