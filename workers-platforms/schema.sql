CREATE TABLE IF NOT EXISTS platform_record (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  title TEXT NOT NULL,
  purpose TEXT NOT NULL,
  links_json TEXT NOT NULL CHECK(json_valid(links_json))
);
