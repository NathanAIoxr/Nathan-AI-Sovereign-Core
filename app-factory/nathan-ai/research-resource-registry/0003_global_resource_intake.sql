CREATE TABLE IF NOT EXISTS global_resource_intake (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    publisher TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN (
        'compute', 'opportunity', 'dataset', 'software', 'hardware', 'workflow', 'defensive_guidance'
    )),
    region TEXT NOT NULL CHECK (region IN (
        'global', 'africa', 'asia', 'europe', 'middle_east', 'north_america', 'oceania', 'south_america'
    )),
    country_code TEXT CHECK (country_code GLOB '[A-Z][A-Z]'),
    access_model TEXT NOT NULL CHECK (access_model IN ('public_reference', 'application', 'varies_by_item')),
    official_url TEXT NOT NULL UNIQUE CHECK (official_url LIKE 'https://%'),
    summary TEXT NOT NULL,
    tags TEXT NOT NULL CHECK (json_valid(tags) AND json_type(tags) = 'array' AND json_array_length(tags) > 0),
    checked_on TEXT NOT NULL,
    intake_state TEXT NOT NULL DEFAULT 'queued'
        CHECK (intake_state IN ('queued', 'imported', 'skipped'))
);

CREATE INDEX IF NOT EXISTS global_resource_intake_lookup
ON global_resource_intake (intake_state, kind, region, id);

CREATE VIEW IF NOT EXISTS global_resource_intake_queue AS
SELECT id, title, publisher, kind, region, country_code, access_model,
       official_url, summary, tags, checked_on,
       CASE kind
           WHEN 'compute' THEN 'compute-allocation-agent'
           WHEN 'opportunity' THEN 'research-opportunity-agent'
           WHEN 'dataset' THEN 'dataset-catalog-worker'
           WHEN 'software' THEN 'software-catalog-worker'
           WHEN 'hardware' THEN 'hardware-catalog-worker'
           WHEN 'workflow' THEN 'workflow-integration-worker'
           WHEN 'defensive_guidance' THEN 'defensive-research-agent'
       END AS intake_role,
       'public_metadata' AS import_mode
FROM global_resource_intake
WHERE intake_state = 'queued';

CREATE VIEW IF NOT EXISTS global_resource_intake_tags AS
SELECT q.id, q.intake_role, q.region, tag.value AS tag
FROM global_resource_intake_queue AS q
JOIN json_each(q.tags) AS tag ON tag.type = 'text';
