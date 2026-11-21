CREATE TABLE IF NOT EXISTS glitter_jobs (
 id INTEGER PRIMARY KEY,
 job_key TEXT NOT NULL UNIQUE,
 role TEXT NOT NULL,
 task TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','claimed','completed','failed')),
 attempt_count INTEGER NOT NULL DEFAULT 0,
 max_attempts INTEGER NOT NULL DEFAULT 3,
 claim_token TEXT,
 claimed_at TEXT,
 completed_at TEXT,
 evidence_url TEXT,
 last_error TEXT
);
INSERT OR IGNORE INTO glitter_jobs(job_key,role,task) VALUES
('glitter-restore-original-101','DATABASE','Restore original 101 activities with complete source wording and reviewed display fields'),
('glitter-restore-mayhem-101','DATABASE','Restore Little-Boy Mayhem 101 rows with safe digital-only or contained presentation'),
('glitter-verify-magic-101','DATABASE','Replace 101 Magic editorial placeholders with exact source text and reviewed fields'),
('glitter-history-sources','HISTORY','Verify dated historical claims, source links and glitter manufacture explanations'),
('glitter-particle-games','GAME','Implement score, challenge levels, accessibility and reduced-motion settings'),
('glitter-safety-review','SAFETY','Review physical activities for inhalation, ingestion, injury, contamination and environment'),
('glitter-integration-tests','TEST','Test 303 rows, unique identifiers, API filters, UI, mobile and schema'),
('glitter-cloudflare-deploy','DEPLOY','Verify isolated D1 binding, deploy Worker/static assets and attach live smoke-test receipts');
