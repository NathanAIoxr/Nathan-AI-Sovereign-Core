-- NATHAN AI / ANCIENT MINDS — Fourteen-table PostgreSQL + pgvector reference.
-- Optional service schema: no external database is deployed by this commit.
-- Keep it separate from the existing ONE Federation private SQLite database.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- 01: append-only original bytes, with a source-verification checksum.
CREATE TABLE IF NOT EXISTS originals (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 filename TEXT NOT NULL,
 media_type TEXT NOT NULL DEFAULT 'text/plain',
 source_provenance TEXT NOT NULL,
 original_bytes BYTEA NOT NULL,
 sha256 TEXT GENERATED ALWAYS AS (encode(digest(original_bytes,'sha256'),'hex')) STORED,
 imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK(octet_length(original_bytes) <= 100000000)
);
CREATE OR REPLACE FUNCTION block_original_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
 RAISE EXCEPTION 'ORIGINALS are append-only. Add a new source version.';
END $$;
DROP TRIGGER IF EXISTS originals_append_only ON originals;
CREATE TRIGGER originals_append_only BEFORE UPDATE OR DELETE ON originals
FOR EACH ROW EXECUTE FUNCTION block_original_mutation();

-- 02: source references are not automatically independent corroboration.
CREATE TABLE IF NOT EXISTS source_references (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 original_id UUID NOT NULL REFERENCES originals(id),
 source_title TEXT NOT NULL,
 locator TEXT,
 attribution TEXT,
 source_kind TEXT NOT NULL CHECK(source_kind IN
   ('owner_original','dictionary','paper','book','archive','other')),
 reviewed BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 03: attested or reconstructed language labels.
CREATE TABLE IF NOT EXISTS languages (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 language_code TEXT NOT NULL UNIQUE,
 language_name TEXT NOT NULL,
 reconstruction_status TEXT NOT NULL DEFAULT 'attested'
   CHECK(reconstruction_status IN ('attested','reconstructed','uncertain'))
);
-- 04: phonetic forms: source candidate is not a verified historical etymology.
CREATE TABLE IF NOT EXISTS phonetics (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 original_id UUID NOT NULL REFERENCES originals(id),
 language_id UUID REFERENCES languages(id),
 written_form TEXT NOT NULL,
 ipa TEXT,
 candidate_root TEXT,
 annotation TEXT NOT NULL DEFAULT '',
 evidence_status TEXT NOT NULL DEFAULT 'unverified'
   CHECK(evidence_status IN ('unverified','supported','contested','rejected')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 05: timelines preserve qualified periods without inventing exact dates.
CREATE TABLE IF NOT EXISTS timelines (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 original_id UUID NOT NULL REFERENCES originals(id),
 event_description TEXT NOT NULL,
 period_label TEXT,
 earliest_year INTEGER,
 latest_year INTEGER,
 precision_label TEXT NOT NULL DEFAULT 'unknown',
 evidence_status TEXT NOT NULL DEFAULT 'unverified'
   CHECK(evidence_status IN ('unverified','supported','contested','rejected')),
 CHECK(earliest_year IS NULL OR latest_year IS NULL OR earliest_year <= latest_year)
);
-- 06: derived analysis is not the original byte source.
CREATE TABLE IF NOT EXISTS knowledge_records (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 original_id UUID NOT NULL REFERENCES originals(id),
 title TEXT NOT NULL,
 body TEXT NOT NULL,
 record_kind TEXT NOT NULL DEFAULT 'working'
   CHECK(record_kind IN ('source_index','working','interpretation','verified_reference','creative')),
 created_by TEXT NOT NULL,
 reviewed BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 07: assertion ledger.
CREATE TABLE IF NOT EXISTS claims (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 original_id UUID NOT NULL REFERENCES originals(id),
 claim_text TEXT NOT NULL,
 evidence_status TEXT NOT NULL DEFAULT 'unverified'
   CHECK(evidence_status IN ('unverified','supported','contested','rejected')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 08: evidence must point to an inspectable reference.
CREATE TABLE IF NOT EXISTS evidence (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 claim_id UUID NOT NULL REFERENCES claims(id),
 source_reference_id UUID NOT NULL REFERENCES source_references(id),
 excerpt TEXT,
 assessment TEXT NOT NULL DEFAULT 'not_reviewed'
   CHECK(assessment IN ('not_reviewed','supports','contradicts','context_only')),
 reviewer TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 09: proposed links are different from verified connections.
CREATE TABLE IF NOT EXISTS relationships (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 from_record_id UUID NOT NULL REFERENCES knowledge_records(id),
 to_record_id UUID NOT NULL REFERENCES knowledge_records(id),
 relation_type TEXT NOT NULL,
 evidence_status TEXT NOT NULL DEFAULT 'proposed'
   CHECK(evidence_status IN ('proposed','supported','contested','rejected')),
 rationale TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK(from_record_id <> to_record_id)
);
-- 10: author-defined Cero 0.0 / Uno 1.0 / Dos 2.0 classification.
CREATE TABLE IF NOT EXISTS cero_uno_dos (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 original_id UUID NOT NULL REFERENCES originals(id),
 knowledge_record_id UUID REFERENCES knowledge_records(id),
 tier TEXT NOT NULL CHECK(tier IN ('0.0','1.0','2.0')),
 label TEXT NOT NULL,
 custom_code TEXT,
 owner_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 11: base-12 numeric derivation, not replacement of source decimal.
CREATE TABLE IF NOT EXISTS duo_codes (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 original_id UUID NOT NULL REFERENCES originals(id),
 decimal_value BIGINT NOT NULL CHECK(decimal_value >= 0),
 base INTEGER NOT NULL DEFAULT 12 CHECK(base = 12),
 duodecimal_representation TEXT NOT NULL,
 meaning TEXT NOT NULL DEFAULT 'derived numeric representation',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 12: bounded job queue; no uncontrolled recursive dispatch.
CREATE TABLE IF NOT EXISTS worker_jobs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 original_id UUID NOT NULL REFERENCES originals(id),
 worker_name TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'queued'
   CHECK(status IN ('queued','running','done','failed','needs_review','cancelled')),
 payload JSONB NOT NULL DEFAULT '{}'::jsonb,
 attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 started_at TIMESTAMPTZ,
 finished_at TIMESTAMPTZ
);
-- 13: worker outcome audit.
CREATE TABLE IF NOT EXISTS worker_runs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 worker_job_id UUID NOT NULL REFERENCES worker_jobs(id),
 worker_name TEXT NOT NULL,
 outcome TEXT NOT NULL CHECK(outcome IN ('done','failed','needs_review','skipped')),
 derived_count INTEGER NOT NULL DEFAULT 0 CHECK(derived_count >= 0),
 summary TEXT NOT NULL,
 run_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 14: optional vector retrieval of derived knowledge (not original bytes).
CREATE TABLE IF NOT EXISTS embeddings (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 knowledge_record_id UUID NOT NULL REFERENCES knowledge_records(id),
 model_name TEXT NOT NULL,
 embedding vector(384) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(knowledge_record_id,model_name)
);

CREATE INDEX IF NOT EXISTS originals_sha_idx ON originals(sha256);
CREATE INDEX IF NOT EXISTS worker_jobs_ready_idx ON worker_jobs(status,created_at) WHERE status='queued';
CREATE INDEX IF NOT EXISTS knowledge_source_idx ON knowledge_records(original_id);
CREATE INDEX IF NOT EXISTS phonetics_source_idx ON phonetics(original_id);
CREATE INDEX IF NOT EXISTS relationships_candidate_idx ON relationships(evidence_status);
-- ANN index depends on local pgvector version and operational needs:
-- CREATE INDEX embeddings_cosine_hnsw ON embeddings USING hnsw (embedding vector_cosine_ops);
COMMIT;
