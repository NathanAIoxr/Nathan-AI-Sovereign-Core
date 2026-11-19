CREATE TABLE IF NOT EXISTS program_directory (
  id TEXT PRIMARY KEY NOT NULL,
  display_order INTEGER NOT NULL,
  provenance_url TEXT
);
INSERT OR IGNORE INTO program_directory VALUES
  ('christmas-toy-drive',1,'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/christmas-toy-drive'),
  ('cup-of-hope',2,NULL),
  ('plate-of-love',3,NULL);
