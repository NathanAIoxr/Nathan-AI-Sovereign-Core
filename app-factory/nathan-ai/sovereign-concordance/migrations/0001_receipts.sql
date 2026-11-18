-- Additive only. Retain original atlas, imported Workers and fleet records.
CREATE TABLE IF NOT EXISTS sovereign_concordance_receipts (
  observed_at TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL,
  summary_json TEXT NOT NULL
);
