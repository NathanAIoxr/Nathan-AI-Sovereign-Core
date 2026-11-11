-- Optional PostgreSQL schema; not deployed by this commit.
CREATE TABLE IF NOT EXISTS mespark_nodes (
 id UUID PRIMARY KEY,
 name TEXT NOT NULL,
 attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
 latitude DOUBLE PRECISION CHECK (latitude BETWEEN -90 AND 90),
 longitude DOUBLE PRECISION CHECK (longitude BETWEEN -180 AND 180),
 evidence_class TEXT NOT NULL CHECK (evidence_class IN ('personal-memory','documented','hypothesis','analogy','fiction')),
 source_uri TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mespark_nodes_attributes_gin ON mespark_nodes USING GIN (attributes);
CREATE TABLE IF NOT EXISTS mespark_edges (
 id UUID PRIMARY KEY,
 source_id UUID NOT NULL REFERENCES mespark_nodes(id) ON DELETE CASCADE,
 target_id UUID NOT NULL REFERENCES mespark_nodes(id) ON DELETE CASCADE,
 relation TEXT NOT NULL,
 evidence_class TEXT NOT NULL,
 source_uri TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
