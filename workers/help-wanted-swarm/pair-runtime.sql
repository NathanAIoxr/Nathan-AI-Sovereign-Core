CREATE TABLE IF NOT EXISTS hive_owned_projects (
 id TEXT PRIMARY KEY, provider TEXT NOT NULL, title TEXT NOT NULL,
 url TEXT, probe_url TEXT, visibility TEXT NOT NULL CHECK(visibility IN ('public','private')),
 probe_at INTEGER, probe_code INTEGER, probe_status TEXT,
 discovered_at INTEGER NOT NULL DEFAULT(unixepoch())
);

CREATE INDEX IF NOT EXISTS hive_owned_projects_probe ON hive_owned_projects(probe_at,id) WHERE probe_url IS NOT NULL;

CREATE VIEW IF NOT EXISTS hive_help_wanted_pairs AS
 SELECT j.id AS id, j.title, j.url, j.scope, j.provider, j.status AS bee_status,
        'bee:' || j.id AS bee_id, 'ant:' || j.id AS ant_id,
        j.last_seen AS ant_seen, j.updated_at AS updated_at
 FROM repair_jobs j;

CREATE VIEW IF NOT EXISTS hive_owned_project_pairs AS
 SELECT p.id,p.title,p.url,p.provider,p.visibility,p.discovered_at,
        'bee:' || p.id AS bee_id, 'ant:' || p.id AS ant_id,
        p.probe_at,p.probe_code,p.probe_status
 FROM hive_owned_projects p;
