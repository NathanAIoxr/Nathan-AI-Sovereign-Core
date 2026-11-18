CREATE TABLE IF NOT EXISTS tabor_library_assignment_runs (
  tick INTEGER PRIMARY KEY,
  payload TEXT NOT NULL CHECK (json_valid(payload))
);
