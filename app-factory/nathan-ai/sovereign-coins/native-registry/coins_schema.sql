CREATE TABLE IF NOT EXISTS sovereign_coins (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  index_group TEXT NOT NULL CHECK (index_group IN ('A-Z', 'NUMBERS', 'SYMBOLS', 'NATHAN_AI_CORE', 'MATRIX21')),
  consensus_or_math TEXT NOT NULL,
  asset_class TEXT NOT NULL CHECK (asset_class IN (
    'NATIVE_COIN_ONLY', 'CONNECTED_NATIVE', 'HISTORICAL_NATIVE', 'EXCLUDED_TOKEN',
    'REVIEW_REQUIRED', 'GLYPH_REFERENCE', 'NATHAN_DESIGN'
  )),
  notes TEXT NOT NULL,
  submitted TEXT,
  submitted_seed TEXT CHECK (submitted_seed IS NULL OR json_valid(submitted_seed)),
  source_url TEXT,
  related_id TEXT,
  position INTEGER CHECK (position IS NULL OR position BETWEEN 1 AND 21),
  design_units INTEGER CHECK (design_units IS NULL OR design_units >= 0),
  CHECK ((index_group = 'MATRIX21') = (position IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_sovereign_coins_scope ON sovereign_coins(asset_class, index_group, symbol);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sovereign_coins_ring ON sovereign_coins(position) WHERE position IS NOT NULL;
