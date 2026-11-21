CREATE TABLE IF NOT EXISTS classroom_rooms (
    room_hash TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    revision INTEGER NOT NULL DEFAULT 0,
    investigative INTEGER NOT NULL DEFAULT 1 CHECK (investigative IN (0,1)),
    lesson_id INTEGER REFERENCES blueprint_lessons(id),
    revealed INTEGER NOT NULL DEFAULT 0 CHECK (revealed IN (0,1))
);
CREATE INDEX IF NOT EXISTS classroom_rooms_expires ON classroom_rooms(expires_at);

CREATE TABLE IF NOT EXISTS blueprint_drafts (
    draft_id TEXT PRIMARY KEY,
    payload TEXT NOT NULL CHECK (json_valid(payload)),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    dispatched_at INTEGER
);

CREATE TABLE IF NOT EXISTS blueprint_media (
    lesson_id INTEGER PRIMARY KEY REFERENCES blueprint_lessons(id),
    object_key TEXT NOT NULL UNIQUE,
    alt_text TEXT NOT NULL
);
