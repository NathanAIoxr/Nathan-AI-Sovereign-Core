CREATE TABLE IF NOT EXISTS grapple_bee_runs (
  checked_at INTEGER PRIMARY KEY,
  status TEXT NOT NULL CHECK(status IN ('pass','fail')),
  results TEXT NOT NULL CHECK(json_valid(results))
);
