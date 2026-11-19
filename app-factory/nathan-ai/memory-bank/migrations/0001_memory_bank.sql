CREATE TABLE IF NOT EXISTS personal_intelligence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL DEFAULT 'general',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    source_ai TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memory_category_id
    ON personal_intelligence(category COLLATE NOCASE, id);

CREATE INDEX IF NOT EXISTS idx_memory_identity
    ON personal_intelligence(category, title);
