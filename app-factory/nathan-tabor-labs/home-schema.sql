CREATE TABLE IF NOT EXISTS home_pulses (
  slot INTEGER PRIMARY KEY,
  scheduled_ms INTEGER NOT NULL,
  result TEXT NOT NULL CHECK (json_valid(result))
);
