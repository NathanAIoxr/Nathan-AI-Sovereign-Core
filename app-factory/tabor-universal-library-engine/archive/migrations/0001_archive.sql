CREATE TABLE IF NOT EXISTS archive_works (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  language TEXT NOT NULL,
  class TEXT NOT NULL,
  vault TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('edition','artifact','collection','research')),
  state TEXT NOT NULL CHECK(state IN ('source-edition','surviving-witness','collection-guide','lost-work-dossier')),
  description TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_reference TEXT NOT NULL,
  rights_note TEXT NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS archive_class_title ON archive_works(class, title, id);
CREATE INDEX IF NOT EXISTS archive_vault_title ON archive_works(vault, title, id);

CREATE TABLE IF NOT EXISTS archive_editions (
  work_id TEXT NOT NULL REFERENCES archive_works(id),
  edition_id TEXT NOT NULL,
  label TEXT NOT NULL,
  source_url TEXT NOT NULL,
  sha256 TEXT NOT NULL CHECK(length(sha256)=64 AND sha256 NOT GLOB '*[^0-9a-f]*'),
  bytes INTEGER NOT NULL CHECK(bytes > 0),
  rights_note TEXT NOT NULL,
  captured_utc TEXT NOT NULL,
  country TEXT CHECK(country IS NULL OR length(country) = 2),
  PRIMARY KEY(work_id, edition_id),
  UNIQUE(work_id, sha256)
) STRICT;

CREATE TABLE IF NOT EXISTS archive_witnesses (
  work_id TEXT NOT NULL REFERENCES archive_works(id),
  id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('object','catalog','edition','indirect-attestation','context','editorial')),
  label TEXT NOT NULL,
  source_family TEXT NOT NULL,
  source_url TEXT NOT NULL,
  locator TEXT NOT NULL,
  claim TEXT NOT NULL,
  PRIMARY KEY(work_id, id)
) STRICT;

CREATE TABLE IF NOT EXISTS archive_receipts (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL,
  edition_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('published')),
  sha256 TEXT NOT NULL,
  recorded_utc TEXT NOT NULL,
  FOREIGN KEY(work_id, edition_id) REFERENCES archive_editions(work_id, edition_id)
) STRICT;

CREATE TRIGGER IF NOT EXISTS archive_editions_immutable_update
BEFORE UPDATE ON archive_editions BEGIN SELECT RAISE(ABORT, 'publish a new edition'); END;
CREATE TRIGGER IF NOT EXISTS archive_editions_immutable_delete
BEFORE DELETE ON archive_editions BEGIN SELECT RAISE(ABORT, 'immutable edition'); END;
CREATE TRIGGER IF NOT EXISTS archive_receipts_immutable_update
BEFORE UPDATE ON archive_receipts BEGIN SELECT RAISE(ABORT, 'immutable receipt'); END;
CREATE TRIGGER IF NOT EXISTS archive_receipts_immutable_delete
BEFORE DELETE ON archive_receipts BEGIN SELECT RAISE(ABORT, 'immutable receipt'); END;
