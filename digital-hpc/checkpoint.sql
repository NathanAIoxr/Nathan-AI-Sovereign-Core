CREATE TABLE IF NOT EXISTS checkpoint (
  key TEXT PRIMARY KEY,
  codec TEXT NOT NULL CHECK(codec IN ('json','gzip-base64')),
  body TEXT NOT NULL
);
