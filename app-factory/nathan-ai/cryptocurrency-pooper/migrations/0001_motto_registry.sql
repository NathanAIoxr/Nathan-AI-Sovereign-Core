CREATE TABLE IF NOT EXISTS academy_mottos_v1 (
  motto_id TEXT PRIMARY KEY,
  body_json TEXT NOT NULL CHECK (json_valid(body_json)),
  body_sha256 TEXT NOT NULL CHECK (length(body_sha256) = 64)
) STRICT;

CREATE TABLE IF NOT EXISTS academy_motto_worker_links_v1 (
  motto_id TEXT NOT NULL REFERENCES academy_mottos_v1(motto_id),
  project_id TEXT NOT NULL,
  dispatch_namespace TEXT NOT NULL,
  worker_name TEXT NOT NULL,
  PRIMARY KEY (motto_id, dispatch_namespace, worker_name)
) STRICT;
