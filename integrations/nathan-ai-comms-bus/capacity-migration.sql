-- This migration only adds tables owned by the communications bus.
-- Existing books, source catalogs, fleet records, and historical messages are untouched.
CREATE TABLE IF NOT EXISTS scheduler_receipts (
  bucket_utc TEXT PRIMARY KEY,
  observed_at TEXT NOT NULL,
  action TEXT NOT NULL,
  state TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scheduler_receipts_time
  ON scheduler_receipts(observed_at DESC);
CREATE TABLE IF NOT EXISTS local_queue_daily (
  day_utc TEXT PRIMARY KEY,
  accepted INTEGER NOT NULL DEFAULT 0 CHECK(accepted >= 0),
  last_accepted_at TEXT
);
CREATE TABLE IF NOT EXISTS usage_observations (
  id TEXT PRIMARY KEY,
  observed_at TEXT NOT NULL,
  provenance TEXT NOT NULL CHECK(provenance IN ('user_entered', 'billing_api_verified')),
  workers_requests INTEGER,
  workers_cpu_ms INTEGER,
  queue_operations INTEGER,
  notes TEXT
);
-- Never auto-delete messages, source catalogs, or user-authored works.
