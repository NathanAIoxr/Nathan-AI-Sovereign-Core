-- Nathan AI / STREAMING CONSCIOUSNESS / MERU
-- Additive and reproducible SQLite research database (not a remote service).
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS sources (
  source_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  kind TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS concepts (
  concept_id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  detail TEXT NOT NULL,
  stage TEXT NOT NULL CHECK(stage IN ('CERO','UNO','DOS')),
  metadata_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_concepts_category ON concepts(category);
CREATE INDEX IF NOT EXISTS idx_concepts_stage ON concepts(stage);
CREATE TABLE IF NOT EXISTS concept_sources (
  concept_id TEXT NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(source_id),
  PRIMARY KEY (concept_id,source_id)
);
CREATE TABLE IF NOT EXISTS concept_links (
  source_id TEXT NOT NULL REFERENCES concepts(concept_id),
  target_id TEXT NOT NULL REFERENCES concepts(concept_id),
  relation TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (source_id,target_id,relation)
);
CREATE TABLE IF NOT EXISTS source_transcripts (
  transcript_id TEXT PRIMARY KEY,
  origin TEXT NOT NULL,
  content TEXT NOT NULL,
  source_edition TEXT NOT NULL
);
CREATE VIRTUAL TABLE IF NOT EXISTS concept_search USING fts5(
  concept_id UNINDEXED, label, category, detail, stage UNINDEXED
);
