CREATE TABLE IF NOT EXISTS cloud_slayer_tool_upstream (
  tool_key TEXT PRIMARY KEY REFERENCES cloud_slayer_tools(tool_key) ON DELETE CASCADE,
  repository TEXT NOT NULL,
  license TEXT NOT NULL,
  license_path TEXT NOT NULL
) WITHOUT ROWID;
