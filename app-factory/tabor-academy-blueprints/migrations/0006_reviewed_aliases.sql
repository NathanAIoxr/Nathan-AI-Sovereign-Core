CREATE TABLE IF NOT EXISTS blueprint_aliases (
    label TEXT PRIMARY KEY COLLATE NOCASE CHECK(length(trim(label)) BETWEEN 1 AND 220),
    lesson_id INTEGER NOT NULL REFERENCES blueprint_lessons(id)
);
