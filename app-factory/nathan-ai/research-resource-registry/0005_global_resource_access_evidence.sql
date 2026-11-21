CREATE TABLE IF NOT EXISTS global_resource_access_evidence (
    source_id TEXT PRIMARY KEY REFERENCES global_resource_intake(id),
    batch_id TEXT NOT NULL,
    availability TEXT NOT NULL CHECK (availability IN (
        'open_source', 'open_design', 'public_data', 'free_api_key'
    )),
    license_label TEXT NOT NULL,
    terms_url TEXT NOT NULL CHECK (terms_url LIKE 'https://%'),
    access_note TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS global_resource_access_evidence_batch
ON global_resource_access_evidence (batch_id, source_id);

CREATE VIEW IF NOT EXISTS global_resource_free_intake_queue AS
SELECT q.*, e.batch_id, e.availability, e.license_label, e.terms_url, e.access_note
FROM global_resource_intake_queue AS q
JOIN global_resource_access_evidence AS e ON e.source_id = q.id;
