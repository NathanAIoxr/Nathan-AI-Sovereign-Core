CREATE TABLE IF NOT EXISTS blueprint_observations (
    id TEXT PRIMARY KEY,
    fingerprint TEXT NOT NULL,
    lesson_id INTEGER REFERENCES blueprint_lessons(id),
    object_name TEXT NOT NULL CHECK (length(trim(object_name)) BETWEEN 1 AND 100),
    second_object TEXT CHECK (second_object IS NULL OR length(trim(second_object)) BETWEEN 1 AND 100),
    note TEXT NOT NULL CHECK (length(note) <= 800),
    photo_key TEXT,
    vision_suggestion TEXT,
    status TEXT NOT NULL DEFAULT 'pending_verify'
      CHECK (status IN ('pending_verify','published','archived')),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    CHECK (lesson_id IS NOT NULL OR second_object IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS blueprint_observations_feed
    ON blueprint_observations(lesson_id, status, created_at DESC);
CREATE TABLE IF NOT EXISTS blueprint_alias_candidates (
    draft_id TEXT PRIMARY KEY,
    candidate_label TEXT NOT NULL,
    matched_lesson INTEGER NOT NULL REFERENCES blueprint_lessons(id),
    similarity REAL NOT NULL CHECK (similarity > 0.94 AND similarity <= 1.01),
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS blueprint_curriculum_gaps (
    topic TEXT PRIMARY KEY,
    topic_count INTEGER NOT NULL DEFAULT 1 CHECK (topic_count > 0),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS blueprint_audit (
    record_key TEXT PRIMARY KEY,
    reason TEXT NOT NULL,
    last_seen INTEGER NOT NULL DEFAULT (unixepoch())
);
