CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  scope TEXT NOT NULL,
  recorded_at_utc TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed')),
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64)
);

CREATE TABLE IF NOT EXISTS messages (
  case_id TEXT NOT NULL REFERENCES cases(id),
  id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  speaker TEXT NOT NULL CHECK (speaker IN ('user', 'assistant')),
  quote_kind TEXT NOT NULL CHECK (quote_kind IN ('verbatim', 'verbatim_excerpt')),
  body TEXT NOT NULL,
  PRIMARY KEY (case_id, id),
  UNIQUE (case_id, sequence)
);

CREATE TABLE IF NOT EXISTS findings (
  case_id TEXT NOT NULL REFERENCES cases(id),
  id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('documented', 'open', 'user_account')),
  finding TEXT NOT NULL,
  PRIMARY KEY (case_id, id)
);

CREATE TABLE IF NOT EXISTS sources (
  case_id TEXT NOT NULL REFERENCES cases(id),
  id TEXT NOT NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL,
  url TEXT,
  observation TEXT NOT NULL,
  PRIMARY KEY (case_id, id)
);

CREATE TABLE IF NOT EXISTS finding_messages (
  case_id TEXT NOT NULL,
  finding_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  PRIMARY KEY (case_id, finding_id, message_id),
  FOREIGN KEY (case_id, finding_id) REFERENCES findings(case_id, id),
  FOREIGN KEY (case_id, message_id) REFERENCES messages(case_id, id)
);

CREATE TABLE IF NOT EXISTS finding_sources (
  case_id TEXT NOT NULL,
  finding_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  PRIMARY KEY (case_id, finding_id, source_id),
  FOREIGN KEY (case_id, finding_id) REFERENCES findings(case_id, id),
  FOREIGN KEY (case_id, source_id) REFERENCES sources(case_id, id)
);

CREATE VIEW IF NOT EXISTS timeline AS
SELECT case_id, sequence, id, speaker, quote_kind, body FROM messages;

CREATE VIEW IF NOT EXISTS finding_evidence AS
SELECT f.case_id, f.id AS finding_id, f.status, f.finding,
       'conversation' AS evidence_type, m.id AS evidence_id,
       m.speaker AS attribution, m.body AS evidence_text, NULL AS source_url
FROM findings f
JOIN finding_messages rel ON rel.case_id = f.case_id AND rel.finding_id = f.id
JOIN messages m ON m.case_id = rel.case_id AND m.id = rel.message_id
UNION ALL
SELECT f.case_id, f.id, f.status, f.finding,
       'source', s.id, s.title, s.observation, s.url
FROM findings f
JOIN finding_sources rel ON rel.case_id = f.case_id AND rel.finding_id = f.id
JOIN sources s ON s.case_id = rel.case_id AND s.id = rel.source_id;
