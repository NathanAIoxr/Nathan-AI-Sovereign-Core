-- NATHAN AI — ONE DATABASE FEDERATION v074: Ancient Minds 14-family reference.
-- Optional PostgreSQL 15+ design ONLY; no server is deployed by this file.
-- Apply to a private, authenticated database only after owner review and backups.
-- Distinct from main SQLite federation and the parent personal_intelligence catalog.
BEGIN;
CREATE SCHEMA IF NOT EXISTS nathan_one_v074;

CREATE TABLE IF NOT EXISTS nathan_one_v074.originals (
 source_id text PRIMARY KEY,
 original_sha256 char(64) NOT NULL,
 original_bytes bytea NOT NULL,
 filename text NOT NULL,
 provenance text NOT NULL,
 imported_at timestamptz NOT NULL DEFAULT now(),
 CHECK (octet_length(original_bytes) BETWEEN 1 AND 2000000),
 CHECK (encode(digest(original_bytes,'sha256'),'hex') = original_sha256)
);
-- Requires pgcrypto for digest(...); uncomment if permitted on your server:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- If pgcrypto is not installed, defer the CHECK until extension installation.
-- This reference intentionally does not run CREATE EXTENSION on an owner server.

CREATE OR REPLACE FUNCTION nathan_one_v074.block_original_mutations()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'v074 originals are append-only'; END
$$;
DROP TRIGGER IF EXISTS block_ancient_original_change ON nathan_one_v074.originals;
CREATE TRIGGER block_ancient_original_change
BEFORE UPDATE OR DELETE ON nathan_one_v074.originals
FOR EACH ROW EXECUTE FUNCTION nathan_one_v074.block_original_mutations();

CREATE TABLE IF NOT EXISTS nathan_one_v074.source_references (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_id text NOT NULL REFERENCES nathan_one_v074.originals(source_id),
 title text NOT NULL, locator text NOT NULL,
 reviewed boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS nathan_one_v074.languages (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 language_code text NOT NULL UNIQUE,
 language_name text NOT NULL,
 status text NOT NULL CHECK (status IN ('attested','reconstructed','unverified'))
);
CREATE TABLE IF NOT EXISTS nathan_one_v074.phonetics (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_id text NOT NULL REFERENCES nathan_one_v074.originals(source_id),
 written_form text NOT NULL,
 language_code text, ipa text, annotation text NOT NULL,
 status text NOT NULL DEFAULT 'unverified'
    CHECK(status IN ('unverified','supported','contested')),
 UNIQUE(source_id,written_form)
);
CREATE TABLE IF NOT EXISTS nathan_one_v074.timelines (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_id text NOT NULL REFERENCES nathan_one_v074.originals(source_id),
 period_label text NOT NULL, assertion text NOT NULL,
 status text NOT NULL DEFAULT 'unverified'
    CHECK(status IN ('unverified','supported','contested')),
 UNIQUE(source_id,period_label)
);
CREATE TABLE IF NOT EXISTS nathan_one_v074.knowledge_records (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_id text NOT NULL REFERENCES nathan_one_v074.originals(source_id),
 role text NOT NULL, title text NOT NULL, body text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('source-index','working','interpretation','fiction')),
 reviewed boolean NOT NULL DEFAULT false,
 UNIQUE(source_id,role,title)
);
CREATE TABLE IF NOT EXISTS nathan_one_v074.claims (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_id text NOT NULL REFERENCES nathan_one_v074.originals(source_id),
 claim_text text NOT NULL,
 status text NOT NULL DEFAULT 'unverified'
    CHECK(status IN ('unverified','supported','contested')),
 UNIQUE(source_id,claim_text)
);
CREATE TABLE IF NOT EXISTS nathan_one_v074.evidence (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 claim_id bigint NOT NULL REFERENCES nathan_one_v074.claims(id),
 reference_id bigint NOT NULL REFERENCES nathan_one_v074.source_references(id),
 quote text,
 assessment text NOT NULL DEFAULT 'needs_review'
    CHECK(assessment IN ('needs_review','supports','contradicts','context'))
);
CREATE TABLE IF NOT EXISTS nathan_one_v074.relationships (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_id text NOT NULL REFERENCES nathan_one_v074.originals(source_id),
 left_record_id bigint NOT NULL REFERENCES nathan_one_v074.knowledge_records(id),
 right_record_id bigint NOT NULL REFERENCES nathan_one_v074.knowledge_records(id),
 relation_type text NOT NULL,
 status text NOT NULL DEFAULT 'proposed'
    CHECK(status IN ('proposed','evidenced','rejected')),
 rationale text NOT NULL,
 CHECK(left_record_id <> right_record_id),
 UNIQUE(source_id,left_record_id,right_record_id,relation_type)
);
CREATE TABLE IF NOT EXISTS nathan_one_v074.cero_uno_dos (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_id text NOT NULL REFERENCES nathan_one_v074.originals(source_id),
 knowledge_id bigint REFERENCES nathan_one_v074.knowledge_records(id),
 tier text NOT NULL CHECK(tier IN ('0.0','1.0','2.0')),
 label text NOT NULL, owner_reviewed boolean NOT NULL DEFAULT false,
 UNIQUE(source_id,knowledge_id,tier)
);
CREATE TABLE IF NOT EXISTS nathan_one_v074.duo_codes (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_id text NOT NULL REFERENCES nathan_one_v074.originals(source_id),
 decimal_value bigint NOT NULL CHECK(decimal_value>=0),
 base integer NOT NULL DEFAULT 12 CHECK(base=12),
 code text NOT NULL, meaning text NOT NULL,
 UNIQUE(source_id,decimal_value,meaning)
);
CREATE TABLE IF NOT EXISTS nathan_one_v074.worker_jobs (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source_id text NOT NULL REFERENCES nathan_one_v074.originals(source_id),
 name text NOT NULL,
 status text NOT NULL DEFAULT 'queued'
   CHECK(status IN ('queued','running','done','failed')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
 UNIQUE(source_id,name)
);
CREATE TABLE IF NOT EXISTS nathan_one_v074.worker_runs (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 job_id bigint NOT NULL REFERENCES nathan_one_v074.worker_jobs(id),
 name text NOT NULL, status text NOT NULL,
 output_count integer NOT NULL CHECK(output_count>=0),
 note text NOT NULL, finished_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS nathan_one_v074.embeddings (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 knowledge_id bigint NOT NULL REFERENCES nathan_one_v074.knowledge_records(id),
 model text NOT NULL,
 embedding_json jsonb NOT NULL,
 CHECK(jsonb_typeof(embedding_json)='array')
);

CREATE INDEX IF NOT EXISTS ancient_v074_knowledge_title_idx ON nathan_one_v074.knowledge_records(title);
CREATE INDEX IF NOT EXISTS ancient_v074_claim_status_idx ON nathan_one_v074.claims(status);
CREATE INDEX IF NOT EXISTS ancient_v074_phonetic_form_idx ON nathan_one_v074.phonetics(written_form);
CREATE INDEX IF NOT EXISTS ancient_v074_jobs_pending_idx ON nathan_one_v074.worker_jobs(status);

-- Vector search is optional, explicitly separate from deterministic worker logic.
-- CREATE EXTENSION IF NOT EXISTS vector;
-- ALTER TABLE nathan_one_v074.embeddings ADD COLUMN embedding vector(1536);
-- CREATE INDEX ... USING hnsw (embedding vector_cosine_ops);
-- Data grants, RLS, encrypted backups, client authentication and permissioned
-- source ingestion MUST be designed before this table handles private records.
COMMIT;
