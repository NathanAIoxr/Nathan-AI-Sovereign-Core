-- DOG-X / Nathan AI — Wolverine-derived original software upgrade database.
-- Source is fiction/history/research. This DB never performs biological, weapon or animal modifications.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS database_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS methods (
  method_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'SAFE_DIGITAL_IMPLEMENTATION',
  CHECK (length(name)>0)
);

CREATE TABLE IF NOT EXISTS method_steps (
  method_id TEXT NOT NULL REFERENCES methods(method_id) ON DELETE RESTRICT,
  step_number INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 8),
  description TEXT NOT NULL,
  PRIMARY KEY (method_id,step_number)
);

CREATE TABLE IF NOT EXISTS upgrades (
  upgrade_id TEXT PRIMARY KEY,
  parent_concept_id TEXT NOT NULL UNIQUE,
  source_reference TEXT NOT NULL,
  source_mechanism TEXT NOT NULL,
  dog_upgrade TEXT NOT NULL,
  dog_implementation_goal TEXT NOT NULL,
  canine_avatar_interpretation TEXT NOT NULL,
  method_id TEXT NOT NULL REFERENCES methods(method_id) ON DELETE RESTRICT,
  evidence_status TEXT NOT NULL,
  primary_source_type TEXT NOT NULL,
  original_catalog_reference TEXT NOT NULL,
  executable_mode TEXT NOT NULL CHECK (executable_mode='SOFTWARE_KNOWLEDGE_MODEL_OR_LOCAL_OWNER_APPROVED_WORKFLOW_ONLY'),
  medical_procedure_verified INTEGER NOT NULL DEFAULT 0 CHECK(medical_procedure_verified=0),
  real_body_or_animal_modification INTEGER NOT NULL DEFAULT 0 CHECK(real_body_or_animal_modification=0),
  human_consent_required INTEGER NOT NULL DEFAULT 1 CHECK(human_consent_required=1),
  original_records_preserved INTEGER NOT NULL DEFAULT 1 CHECK(original_records_preserved=1)
);

CREATE TABLE IF NOT EXISTS upgrade_citations (
  upgrade_id TEXT NOT NULL REFERENCES upgrades(upgrade_id) ON DELETE CASCADE,
  source_order INTEGER NOT NULL CHECK(source_order>=1),
  url TEXT NOT NULL CHECK(url LIKE 'https://%'),
  PRIMARY KEY (upgrade_id,source_order)
);

CREATE INDEX IF NOT EXISTS idx_upgrades_method ON upgrades(method_id);
CREATE INDEX IF NOT EXISTS idx_upgrades_source ON upgrades(primary_source_type);
CREATE INDEX IF NOT EXISTS idx_upgrades_evidence ON upgrades(evidence_status);
CREATE INDEX IF NOT EXISTS idx_upgrades_canine ON upgrades(canine_avatar_interpretation);

CREATE VIEW IF NOT EXISTS full_upgrade_how_done AS
SELECT u.upgrade_id,
 u.parent_concept_id,
 u.source_reference,
 u.source_mechanism AS fiction_history_or_science_how_described,
 u.dog_upgrade,
 u.dog_implementation_goal AS how_done_in_dog_ai,
 u.canine_avatar_interpretation AS dog_avatar_feature,
 m.name AS digital_method,
 (SELECT GROUP_CONCAT(printf('%d. %s',s.step_number,s.description),char(10))
    FROM method_steps s WHERE s.method_id=m.method_id ORDER BY s.step_number) AS full_implementation_steps,
 u.evidence_status,
 u.primary_source_type,
 u.original_catalog_reference
FROM upgrades u
JOIN methods m ON m.method_id=u.method_id;

CREATE VIEW IF NOT EXISTS wolverine_core AS
SELECT * FROM full_upgrade_how_done WHERE parent_concept_id LIKE 'WOLVERINE_%';

CREATE VIEW IF NOT EXISTS canine_guardian_extensions AS
SELECT * FROM full_upgrade_how_done WHERE parent_concept_id LIKE 'DOG_AVATAR_%';

CREATE VIEW IF NOT EXISTS safe_summary AS
SELECT (SELECT COUNT(*) FROM upgrades) AS total_upgrades,
 (SELECT COUNT(*) FROM methods) AS total_digital_methods,
 (SELECT COUNT(*) FROM method_steps) AS total_documented_steps,
 (SELECT COUNT(*) FROM wolverine_core) AS wolverine_core_upgrades,
 (SELECT COUNT(*) FROM canine_guardian_extensions) AS dog_avatar_extensions,
 (SELECT COUNT(*) FROM upgrade_citations) AS cited_source_links,
 (SELECT SUM(real_body_or_animal_modification) FROM upgrades) AS physical_modifications;
