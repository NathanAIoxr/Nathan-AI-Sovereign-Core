-- NATHAN AI / Historical sports reference universe
-- Standalone PostgreSQL example. Not an executed migration.
-- NO blanket 111-year public-domain or trademark immunity is asserted.
CREATE TABLE IF NOT EXISTS master_universe_teams (
  team_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  record_kind TEXT NOT NULL CHECK (record_kind IN ('historical','simulation','fictional')),
  provenance_label TEXT NOT NULL CHECK (provenance_label IN ('VERIFIED HISTORICAL','HISTORICAL — GAPS','GENERATED FILL-IN','FICTIONAL')),
  founding_year INTEGER,
  simulation_year INTEGER,
  legacy_anchor_team_id TEXT,
  reference_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  rights_status TEXT NOT NULL DEFAULT 'needs-review'
    CHECK (rights_status IN ('needs-review','review-in-progress','licensed','counsel-cleared')),
  rights_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  rights_review_reference TEXT,
  original_research_notes TEXT NOT NULL DEFAULT '',
  CONSTRAINT valid_founding_year CHECK (founding_year IS NULL OR founding_year BETWEEN 1800 AND 3000),
  CONSTRAINT valid_sim_year CHECK (simulation_year IS NULL OR simulation_year BETWEEN 1800 AND 3000),
  CONSTRAINT historical_type CHECK (
     (record_kind='historical' AND provenance_label IN ('VERIFIED HISTORICAL','HISTORICAL — GAPS'))
  OR (record_kind='simulation' AND provenance_label='GENERATED FILL-IN')
  OR (record_kind='fictional' AND provenance_label='FICTIONAL')),
  CONSTRAINT do_not_backdate_generated CHECK (
    record_kind='historical' OR founding_year IS NULL),
  CONSTRAINT simulations_explicit CHECK (
    record_kind<>'simulation' OR (simulation_year IS NOT NULL AND legacy_anchor_team_id IS NOT NULL))
);

-- 1915 is a FROZEN historical-universe snapshot for the 2026 game design.
-- This view does not mean the names, logos, kits or marks are available for use.
CREATE OR REPLACE VIEW verified_pre_1916_history AS
SELECT * FROM master_universe_teams
WHERE record_kind = 'historical'
  AND provenance_label = 'VERIFIED HISTORICAL'
  AND founding_year <= 1915
  AND jsonb_array_length(reference_urls) > 0;

-- Everything needing research or falling outside the archival gate stays visible.
CREATE OR REPLACE VIEW teams_on_research_hold AS
SELECT * FROM master_universe_teams
WHERE record_kind = 'historical'
  AND NOT (
    provenance_label='VERIFIED HISTORICAL'
    AND founding_year <= 1915
    AND jsonb_array_length(reference_urls)>0
  );

-- Generated expansion teams remain creative records, never historical evidence.
CREATE OR REPLACE VIEW generated_fill_ins AS
SELECT * FROM master_universe_teams
WHERE record_kind = 'simulation'
  AND provenance_label = 'GENERATED FILL-IN';

-- rights_status is only a process label: even a document in this field is not
-- a legal determination by database logic. Human review remains mandatory.
-- DO NOT run: DELETE FROM master_universe_teams WHERE founding_year > 1915;
