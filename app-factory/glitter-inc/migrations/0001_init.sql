CREATE TABLE IF NOT EXISTS glitter_activities (
 id INTEGER PRIMARY KEY,
 collection TEXT NOT NULL,
 source_number INTEGER NOT NULL,
 category TEXT NOT NULL,
 title TEXT NOT NULL,
 original_text TEXT NOT NULL,
 presentation_mode TEXT NOT NULL CHECK(presentation_mode IN ('digital_only','contained','review_required')),
 materials TEXT NOT NULL DEFAULT 'N/A',
 instructions TEXT NOT NULL DEFAULT 'N/A',
 safety_note TEXT NOT NULL DEFAULT 'N/A',
 age_group TEXT NOT NULL DEFAULT 'All ages with appropriate supervision',
 simulation_id TEXT NOT NULL DEFAULT 'sparkle-preview',
 review_status TEXT NOT NULL DEFAULT 'pending',
 UNIQUE(collection,source_number)
);
CREATE INDEX IF NOT EXISTS glitter_category_idx ON glitter_activities(collection,category);
