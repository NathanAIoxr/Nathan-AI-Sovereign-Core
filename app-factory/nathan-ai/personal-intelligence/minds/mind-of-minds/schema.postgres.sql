-- Optional Postgres 15+ schema, separate from local browser Vault.
CREATE SCHEMA IF NOT EXISTS personal_intelligence;
CREATE TABLE IF NOT EXISTS personal_intelligence.mind_definitions (
 mind_id text PRIMARY KEY CHECK(length(mind_id) <= 120),
 display_name text NOT NULL,
 mind_type text NOT NULL,
 group_name text,
 purpose text,
 status text NOT NULL,
 source_id text,
 tags text[] NOT NULL DEFAULT '{}',
 definition jsonb NOT NULL,
 created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mind_definition_tags_idx ON personal_intelligence.mind_definitions USING gin (tags);
CREATE TABLE IF NOT EXISTS personal_intelligence.logical_namespaces (
 namespace_id text PRIMARY KEY,
 capacity numeric(21,0) NOT NULL,
 first_address numeric(21,0) NOT NULL DEFAULT 0,
 last_address numeric(21,0) NOT NULL,
 allocated_instances integer NOT NULL DEFAULT 0,
 CHECK(capacity > 0), CHECK(last_address = capacity - 1), CHECK(allocated_instances >= 0)
);
CREATE TABLE IF NOT EXISTS personal_intelligence.source_records (
 source_id text PRIMARY KEY,
 source_type text NOT NULL,
 original_sha256 text,
 original_verbatim text,
 privacy text NOT NULL DEFAULT 'private',
 created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS personal_intelligence.evidence_reviews (
 review_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_id text NOT NULL REFERENCES personal_intelligence.source_records(source_id),
 stage text NOT NULL CHECK(stage IN ('CERO','UNO','DOS')),
 interpretation text,
 evidence_source_ids text[] NOT NULL DEFAULT '{}',
 reviewer text NOT NULL,
 created_at timestamptz DEFAULT now(),
 CHECK(stage != 'UNO' OR cardinality(evidence_source_ids) > 0)
);
CREATE TABLE IF NOT EXISTS personal_intelligence.mind_links (
 source_mind text NOT NULL REFERENCES personal_intelligence.mind_definitions(mind_id),
 target_mind text NOT NULL REFERENCES personal_intelligence.mind_definitions(mind_id),
 relation text NOT NULL,
 relation_note text,
 PRIMARY KEY(source_mind,target_mind,relation)
);
CREATE TABLE IF NOT EXISTS personal_intelligence.proposed_jobs (
 job_id uuid PRIMARY KEY,
 mind_id text NOT NULL REFERENCES personal_intelligence.mind_definitions(mind_id),
 source_ids text[] NOT NULL DEFAULT '{}',
 prompt text NOT NULL,
 status text NOT NULL DEFAULT 'proposal',
 owner_approved boolean NOT NULL DEFAULT false,
 external_execution_log jsonb NOT NULL DEFAULT '[]'::jsonb
);
-- Optional semantic layer if pgvector is separately installed and owner-authorized.
-- CREATE EXTENSION IF NOT EXISTS vector;
-- ALTER TABLE personal_intelligence.source_records ADD COLUMN embedding vector(1536);
INSERT INTO personal_intelligence.logical_namespaces(namespace_id,capacity,last_address)
 VALUES ('OMNI_GOD',126000000000,125999999999),('NODE_RUNTIME',732000000,731999999)
 ON CONFLICT(namespace_id) DO NOTHING;
