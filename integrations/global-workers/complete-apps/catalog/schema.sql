CREATE TABLE IF NOT EXISTS imported_workers (
  name TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL CHECK (source_url LIKE 'https://github.com/%'),
  endpoint TEXT NOT NULL CHECK (endpoint LIKE 'https://%.nathantaboract.workers.dev/%')
);
