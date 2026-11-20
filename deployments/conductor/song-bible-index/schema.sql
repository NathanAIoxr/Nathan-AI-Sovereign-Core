CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE CHECK (url LIKE 'https://%')
) STRICT;

CREATE TABLE IF NOT EXISTS recordings (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  year INTEGER CHECK (year BETWEEN 1000 AND 9999),
  year_kind TEXT NOT NULL CHECK (year_kind IN ('recorded','released','issued','unknown')),
  version TEXT NOT NULL,
  genre TEXT NOT NULL,
  theme TEXT NOT NULL,
  note TEXT NOT NULL,
  CHECK ((year IS NULL) = (year_kind = 'unknown'))
) STRICT;

CREATE TABLE IF NOT EXISTS recording_sources (
  recording_id TEXT NOT NULL REFERENCES recordings(id),
  source_id TEXT NOT NULL REFERENCES sources(id),
  role TEXT NOT NULL CHECK (role IN ('recording','text','analysis')),
  PRIMARY KEY (recording_id, source_id, role)
) STRICT;

CREATE TABLE IF NOT EXISTS passages (
  id TEXT PRIMARY KEY NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  source_id TEXT NOT NULL REFERENCES sources(id)
) STRICT;

CREATE TABLE IF NOT EXISTS comparisons (
  recording_id TEXT NOT NULL REFERENCES recordings(id),
  passage_id TEXT NOT NULL REFERENCES passages(id),
  relationship TEXT NOT NULL CHECK (relationship IN
    ('text_setting','retelling','allusion','thematic_parallel')),
  evidence_source_id TEXT NOT NULL REFERENCES sources(id),
  rationale TEXT NOT NULL,
  PRIMARY KEY (recording_id, passage_id)
) STRICT;

CREATE INDEX IF NOT EXISTS recordings_by_artist ON recordings(artist,title);
CREATE INDEX IF NOT EXISTS recordings_by_year ON recordings(year,id);
CREATE INDEX IF NOT EXISTS comparisons_by_passage ON comparisons(passage_id,relationship);
