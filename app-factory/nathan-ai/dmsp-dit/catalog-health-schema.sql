CREATE INDEX IF NOT EXISTS dmsp_pool_receipts_by_observed_at ON dmsp_pool_receipts (observed_at);

CREATE TABLE IF NOT EXISTS dmsp_catalog_receipts (
  script_name TEXT PRIMARY KEY REFERENCES dmsp_worker_pool(script_name),
  slot INTEGER NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('PASS', 'FAIL')),
  detail TEXT NOT NULL,
  observed_at TEXT NOT NULL
);

INSERT INTO grid_build_queue (job_id, kind, target, state, requires_approval)
VALUES ('dmsp-catalog-health', 'DMSP_CATALOG_CHECK', 'nathan-tabor-platforms', 'QUEUED', 0)
ON CONFLICT(job_id) DO NOTHING;

WITH RECURSIVE shards(number) AS (
  VALUES (1)
  UNION ALL
  SELECT number + 1 FROM shards WHERE number < 989
)
UPDATE dmsp_worker_pool SET pool_state = 'READY', execution_enabled = 1
WHERE namespace = 'nathan-tabor-platforms' AND pool_state = 'REGISTERED' AND execution_enabled = 0
  AND script_name IN (
    SELECT printf('language-shard-%04d', number) FROM shards
    UNION ALL
    SELECT value FROM json_each('["bitcoin","cloud","compute","github","languages","library","memory","moment","outside-box","wordplay","world"]')
  );
