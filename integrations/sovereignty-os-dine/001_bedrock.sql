CREATE TABLE IF NOT EXISTS sovereignty_dine_sources (
    source_id TEXT PRIMARY KEY NOT NULL,
    sha256 TEXT NOT NULL UNIQUE CHECK (length(sha256) = 64),
    original_markdown TEXT NOT NULL,
    source_bytes INTEGER NOT NULL
        CHECK (source_bytes = length(CAST(original_markdown AS BLOB)))
);

CREATE TABLE IF NOT EXISTS sovereignty_dine_records (
    source_id TEXT NOT NULL REFERENCES sovereignty_dine_sources(source_id),
    section TEXT NOT NULL,
    record_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    content_status TEXT NOT NULL CHECK (content_status IN (
        'source_claim', 'hypothesis_or_wordplay', 'project_proposal', 'author_framework'
    )),
    payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
    PRIMARY KEY (source_id, section, record_id),
    UNIQUE (source_id, section, ordinal)
);
