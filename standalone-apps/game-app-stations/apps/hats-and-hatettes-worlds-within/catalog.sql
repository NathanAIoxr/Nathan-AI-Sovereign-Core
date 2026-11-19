CREATE TABLE IF NOT EXISTS expedition (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  realm_group TEXT NOT NULL CHECK (realm_group IN ('water','cave','tree','myth')),
  evidence TEXT NOT NULL,
  place TEXT NOT NULL,
  source TEXT,
  context TEXT NOT NULL,
  lore TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pair (
  id TEXT PRIMARY KEY,
  realm TEXT NOT NULL REFERENCES expedition(id),
  variant INTEGER NOT NULL CHECK (variant >= 0 AND variant < 128),
  hat TEXT NOT NULL,
  hatette TEXT NOT NULL,
  UNIQUE (realm,variant)
);

CREATE TABLE IF NOT EXISTS headwear_style (
  name TEXT PRIMARY KEY,
  family TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS museum_object (
  object_id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  dating TEXT NOT NULL,
  culture TEXT NOT NULL,
  department TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS expedition_group_idx ON expedition(realm_group,id);
CREATE INDEX IF NOT EXISTS museum_kind_idx ON museum_object(kind,object_id);
