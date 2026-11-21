CREATE TABLE IF NOT EXISTS archive_sources (
  work_id TEXT PRIMARY KEY REFERENCES archive_works(id),
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  material TEXT NOT NULL,
  holding TEXT NOT NULL,
  dating TEXT NOT NULL,
  shelfmark TEXT NOT NULL,
  snapshot TEXT NOT NULL,
  UNIQUE(provider, external_id)
) STRICT;
CREATE INDEX IF NOT EXISTS archive_sources_material ON archive_sources(material, provider, work_id);

CREATE TABLE IF NOT EXISTS archive_edition_formats (
  work_id TEXT NOT NULL,
  edition_id TEXT NOT NULL,
  format TEXT NOT NULL CHECK(format IN ('ocr','atf','tei')),
  PRIMARY KEY(work_id, edition_id),
  FOREIGN KEY(work_id, edition_id) REFERENCES archive_editions(work_id, edition_id)
) STRICT;

CREATE TABLE IF NOT EXISTS archive_import_receipts (
  batch_sha TEXT PRIMARY KEY CHECK(length(batch_sha)=64),
  provider TEXT NOT NULL,
  submitted INTEGER NOT NULL,
  recorded_utc TEXT NOT NULL
) STRICT;

CREATE VIRTUAL TABLE IF NOT EXISTS archive_search USING fts5(
  id UNINDEXED, title, author, description, source_reference,
  tokenize = 'unicode61'
);
CREATE TRIGGER IF NOT EXISTS archive_search_insert
AFTER INSERT ON archive_works BEGIN
  INSERT INTO archive_search VALUES (NEW.id,NEW.title,NEW.author,NEW.description,NEW.source_reference);
END;
CREATE TRIGGER IF NOT EXISTS archive_search_change
AFTER UPDATE ON archive_works BEGIN
  DELETE FROM archive_search WHERE id=OLD.id;
  INSERT INTO archive_search VALUES (NEW.id,NEW.title,NEW.author,NEW.description,NEW.source_reference);
END;
CREATE TRIGGER IF NOT EXISTS archive_search_remove
AFTER DELETE ON archive_works BEGIN DELETE FROM archive_search WHERE id=OLD.id; END;
INSERT INTO archive_search
SELECT id,title,author,description,source_reference FROM archive_works WHERE id NOT IN (SELECT id FROM archive_search);
