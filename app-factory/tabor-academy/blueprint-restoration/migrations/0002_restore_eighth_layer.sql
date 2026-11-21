CREATE TABLE IF NOT EXISTS blueprint_lifecycle (lesson_id INTEGER PRIMARY KEY REFERENCES blueprint_lessons(id), lifecycle_state TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS blueprint_provenance (lesson_id INTEGER PRIMARY KEY REFERENCES blueprint_lessons(id), source_note TEXT NOT NULL, verification_status TEXT NOT NULL DEFAULT 'needs_review');
