-- NATHAN AI / ONE — DRAFT Supabase catalog schema (UNAPPLIED).
-- Review the target project and ownership before execution.
-- Intentionally append-only: no UPDATE/DELETE policies granted.
-- No manuscript bodies, financial data, private keys, or passwords in this schema.
-- This migration does NOT create a Supabase project or establish app connectivity.

BEGIN;

CREATE TABLE IF NOT EXISTS public.one_catalog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  canonical_id text NOT NULL CHECK (
    char_length(canonical_id) BETWEEN 1 AND 128
    AND canonical_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$'
  ),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 500),
  department text NOT NULL CHECK (char_length(department) BETWEEN 1 AND 128),
  kind text NOT NULL CHECK (char_length(kind) BETWEEN 1 AND 128),
  source_system text NOT NULL CHECK (source_system IN (
    'GitHub','Airtable','Notion','Google Drive','Firecrawl','Private archive','Other'
  )),
  source_url text,
  source_checksum text CHECK (source_checksum IS NULL OR source_checksum ~ '^[a-f0-9]{64}$'),
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, canonical_id),
  CHECK (source_url IS NULL OR
    (char_length(source_url) <= 2048 AND source_url ~ '^https://'))
);

CREATE TABLE IF NOT EXISTS public.one_catalog_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  canonical_id text NOT NULL,
  revision bigint NOT NULL CHECK (revision >= 1),
  build_status text NOT NULL CHECK (build_status IN (
    'Cataloged','Source verified','Prototype','Local package',
    'In development','Tests passing (dated)','QA pending',
    'Not integrated','Planned','Blocked','Released verified'
  )),
  evidence_uri text CHECK (evidence_uri IS NULL OR
    (char_length(evidence_uri) <= 2048 AND evidence_uri ~ '^https://')),
  review_note text CHECK (review_note IS NULL OR char_length(review_note) <= 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, canonical_id, revision),
  FOREIGN KEY (owner_id, canonical_id)
    REFERENCES public.one_catalog_entries(owner_id, canonical_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_one_catalog_entries_owner_department
  ON public.one_catalog_entries(owner_id, department, canonical_id);
CREATE INDEX IF NOT EXISTS idx_one_catalog_revisions_owner_key
  ON public.one_catalog_revisions(owner_id, canonical_id, revision DESC);

ALTER TABLE public.one_catalog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_catalog_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_catalog_entries FORCE ROW LEVEL SECURITY;
ALTER TABLE public.one_catalog_revisions FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.one_catalog_entries FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.one_catalog_revisions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.one_catalog_entries TO authenticated;
GRANT SELECT, INSERT ON public.one_catalog_revisions TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
      AND tablename='one_catalog_entries' AND policyname='one_entries_owner_select') THEN
    CREATE POLICY one_entries_owner_select ON public.one_catalog_entries
      FOR SELECT TO authenticated USING (owner_id = (select auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
      AND tablename='one_catalog_entries' AND policyname='one_entries_owner_insert') THEN
    CREATE POLICY one_entries_owner_insert ON public.one_catalog_entries
      FOR INSERT TO authenticated WITH CHECK (owner_id = (select auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
      AND tablename='one_catalog_revisions' AND policyname='one_revisions_owner_select') THEN
    CREATE POLICY one_revisions_owner_select ON public.one_catalog_revisions
      FOR SELECT TO authenticated USING (owner_id = (select auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
      AND tablename='one_catalog_revisions' AND policyname='one_revisions_owner_insert') THEN
    CREATE POLICY one_revisions_owner_insert ON public.one_catalog_revisions
      FOR INSERT TO authenticated WITH CHECK (owner_id = (select auth.uid()));
  END IF;
END $$;

COMMIT;

-- Required independent checks before any deployment:
-- 0) No project connected/applied from this file.
-- 1) Verify user A can read/insert A's records and cannot read/insert B's.
-- 2) Verify anon cannot SELECT/INSERT and authenticated cannot UPDATE/DELETE.
-- 3) Verify revision conflicts fail safely, duplicate canonical IDs are rejected.
-- 4) Verify service_role usage is isolated to a trusted backend; it bypasses RLS.
-- 5) Verify original source bytes remain outside these tables and separately backed up.
