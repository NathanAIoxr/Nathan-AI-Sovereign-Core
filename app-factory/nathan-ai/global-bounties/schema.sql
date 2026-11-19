CREATE TABLE IF NOT EXISTS global_bounties (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('mathematics', 'science')),
  payout_usd INTEGER NOT NULL CHECK (payout_usd BETWEEN 0 AND 1000000000000),
  payout_kind TEXT NOT NULL CHECK (payout_kind IN ('prize', 'pool')),
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'ACTIVE_CLOSED_TO_NEW_ENTRIES', 'CLOSED', 'PAUSED')),
  deadline TEXT,
  source_url TEXT NOT NULL,
  description TEXT NOT NULL,
  checked_on TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bounties_category_status
  ON global_bounties (category, status, payout_usd DESC, id);

CREATE INDEX IF NOT EXISTS idx_bounties_status
  ON global_bounties (status, payout_kind);
