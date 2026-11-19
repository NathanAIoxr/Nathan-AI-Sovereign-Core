CREATE TABLE IF NOT EXISTS editions (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL
);
INSERT OR IGNORE INTO editions VALUES ('conservative-voice','The Conservative Voice');
CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY,
  edition TEXT NOT NULL REFERENCES editions(id),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  byline TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('draft','published','withdrawn')),
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  UNIQUE(edition,slug)
);
CREATE INDEX IF NOT EXISTS published_editions ON pages(edition,status,updated_at DESC,id DESC);
INSERT OR IGNORE INTO pages(edition,slug,title,byline,body,status,updated_at)
VALUES ('conservative-voice','about-the-archive','About The Conservative Voice archive','Archive note','Nathan Tabor founded TheConservativeVoice.com in 2004. Its public publishing model gave individual writers and organizations a way to submit articles. This archive records that history and connects readers with available sources.','published',0);
