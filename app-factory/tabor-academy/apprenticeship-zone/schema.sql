CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  publisher TEXT NOT NULL,
  url TEXT NOT NULL,
  note TEXT NOT NULL,
  retrieved TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('occupation','standard','college','historical','reconstruction','living','proposal')),
  status TEXT NOT NULL,
  period TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  reference TEXT NOT NULL,
  detail TEXT NOT NULL,
  source_url TEXT NOT NULL,
  search_key TEXT NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS records_region_kind ON records(region, kind, title);
CREATE INDEX IF NOT EXISTS records_source ON records(source_id, status);
CREATE INDEX IF NOT EXISTS records_kind_title ON records(kind, title);

CREATE TABLE IF NOT EXISTS variants (
  record_id TEXT NOT NULL REFERENCES records(id),
  ordinal INTEGER NOT NULL,
  source_data TEXT NOT NULL CHECK (json_valid(source_data)),
  PRIMARY KEY(record_id, ordinal)
) STRICT;

CREATE TABLE IF NOT EXISTS import_receipts (
  id TEXT PRIMARY KEY,
  retrieved TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  notes TEXT NOT NULL
) STRICT;
