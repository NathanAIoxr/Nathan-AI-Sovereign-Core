CREATE TABLE IF NOT EXISTS taborboy_profiles (
  id TEXT PRIMARY KEY,
  identity_blank TEXT NOT NULL DEFAULT '_ _ _ _ _ _',
  mode TEXT NOT NULL DEFAULT 'I_AM' CHECK (mode IN ('I_AM','I_AM_BECOMING','STACKED')),
  zone_masthead TEXT NOT NULL,
  demographic_tier TEXT NOT NULL,
  skimmer_paradox_state TEXT NOT NULL,
  motion_vector_json TEXT NOT NULL CHECK (json_valid(motion_vector_json)),
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS taborboy_events (
  event_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES taborboy_profiles(id),
  action_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS taborboy_profiles_recency ON taborboy_profiles(updated_at DESC,id);
CREATE TABLE IF NOT EXISTS build_status (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  verified_at INTEGER NOT NULL
);
