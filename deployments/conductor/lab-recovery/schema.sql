CREATE TABLE IF NOT EXISTS lab_recovery_jobs_v1 (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('integrity','launch','source','build')),
  title TEXT NOT NULL,
  task TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','verified','blocked')),
  receipt TEXT CHECK (receipt IS NULL OR json_valid(receipt)),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  lease_owner TEXT,
  lease_until INTEGER,
  next_attempt INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
) STRICT;

INSERT OR IGNORE INTO lab_recovery_jobs_v1 (id,kind,title,task) VALUES
  ('archive-integrity','integrity','Full private source archive','Read back the exact private R2 object and verify its full SHA-256.'),
  ('cero-uno-dos','launch','Cero / Uno / Dos Atlas','Verify the existing independently deployed launch.'),
  ('mind-of-minds','launch','Mind of Minds','Verify the existing independently deployed launch.'),
  ('attributes-atlas','launch','Attributes & Functionalities Atlas','Verify the existing independently deployed launch.'),
  ('acro-matrix','launch','Sovereign Acro-Matrix','Verify the existing independently deployed launch.'),
  ('brainstormer','launch','Brainstormer Creative Editions','Verify the existing independently deployed launch.'),
  ('mathematical-roots','launch','100 Mathematical Roots','Verify the existing independently deployed launch.'),
  ('mespark','launch','meSPARK Universal Memory Matrix','Verify the existing independently deployed launch.'),
  ('fiber-matrix','launch','Tabor ONE Fiber Matrix','Verify the existing independently deployed launch.'),
  ('labs-955','source','Original 955-record Labs edition','Recover the exact standalone HTML and master index and hash both files. Start from issue 523 and the private recovery archive.'),
  ('quantum-mirror-studio','source','THE LAB v1.1 Quantum & Mirror Studio','Recover the original independent handoff ZIP, hash it, and verify its edition manifests individually.'),
  ('tabor-way-180','source','The Nathan Tabor Way — The 180° App','Locate the separately named original QI/QE and 180-degree program and distinguish it from the engineering branch.'),
  ('story-engine-earlier','source','Story Engine Studio 1.0 and 2.0','Recover the exact previous browser artifacts and record their independent version provenance.'),
  ('me-thinker-original','source','ME!!! Thinker / FiveMindsAI','Recover the exact standalone source and personalities.py, preserving the five original lens labels.'),
  ('ancrobyn-original','source','ACRO-ENGINE / ANCROBYN GENERATOR','Recover a named standalone original and reconcile its source with the Acro-Matrix edition.'),
  ('source-vault-original','source','Source Vault and Yes-First Idea Vault','Recover source versions and confirm each feature using the documented handoff rather than inferring from similar titles.'),
  ('con-hunter-original','source','12-LINE CON-HUNTER & ERROR RADAR','Recover the exact project bytes and related 12-line scanner v2.1 and v2.2 artifacts. Track each version by hash.'),
  ('lab-creative-integration','build','Five-module Lab creative workflow','Use issue 523 and recovered source to ship one independently tested Lab milestone at a time with a verified GitHub and Cloudflare receipt. Preserve every independently named app.'),
  ('archive-discovery','build','Lab archive and app-station crosswalk','Bring public-safe station links and version provenance into the existing Lab directory. Keep owner-only originals in R2. Verify all published links and preserve the existing station IDs.');
