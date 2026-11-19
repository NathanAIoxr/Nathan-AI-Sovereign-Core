CREATE TABLE IF NOT EXISTS dmsp_pool_receipts (
  job_id TEXT NOT NULL REFERENCES grid_build_queue(job_id),
  script_name TEXT NOT NULL REFERENCES dmsp_worker_pool(script_name),
  slot INTEGER NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('PASS', 'FAIL')),
  detail TEXT NOT NULL,
  build_json TEXT,
  observed_at TEXT NOT NULL,
  PRIMARY KEY (job_id, slot)
);

CREATE INDEX IF NOT EXISTS dmsp_pool_receipts_by_slot ON dmsp_pool_receipts (slot);

INSERT INTO dmsp_worker_pool (script_name, namespace, pool_state, execution_enabled, health_state)
VALUES
  ('dmsp-dit-apps', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-asset', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-automation', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-cio', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-cloud', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-compliance', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-data', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-devops', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-endpoint', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-field', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-finance', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-helpdesk', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-identity', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-incident', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-integration', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-knowledge', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-network', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-noc', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-observability', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-onboarding', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-platform', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-privacy', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-procurement', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-qa', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-recovery', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-soc', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-success', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN'),
  ('dmsp-dit-vendor', 'nathan-tabor-platforms', 'READY', 1, 'UNKNOWN')
ON CONFLICT(script_name) DO NOTHING;

INSERT INTO grid_build_queue (job_id, kind, target, state, requires_approval)
VALUES
  ('dmsp-department:apps', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-apps', 'QUEUED', 0),
  ('dmsp-department:asset', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-asset', 'QUEUED', 0),
  ('dmsp-department:automation', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-automation', 'QUEUED', 0),
  ('dmsp-department:cio', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-cio', 'QUEUED', 0),
  ('dmsp-department:cloud', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-cloud', 'QUEUED', 0),
  ('dmsp-department:compliance', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-compliance', 'QUEUED', 0),
  ('dmsp-department:data', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-data', 'QUEUED', 0),
  ('dmsp-department:devops', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-devops', 'QUEUED', 0),
  ('dmsp-department:endpoint', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-endpoint', 'QUEUED', 0),
  ('dmsp-department:field', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-field', 'QUEUED', 0),
  ('dmsp-department:finance', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-finance', 'QUEUED', 0),
  ('dmsp-department:helpdesk', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-helpdesk', 'QUEUED', 0),
  ('dmsp-department:identity', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-identity', 'QUEUED', 0),
  ('dmsp-department:incident', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-incident', 'QUEUED', 0),
  ('dmsp-department:integration', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-integration', 'QUEUED', 0),
  ('dmsp-department:knowledge', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-knowledge', 'QUEUED', 0),
  ('dmsp-department:network', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-network', 'QUEUED', 0),
  ('dmsp-department:noc', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-noc', 'QUEUED', 0),
  ('dmsp-department:observability', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-observability', 'QUEUED', 0),
  ('dmsp-department:onboarding', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-onboarding', 'QUEUED', 0),
  ('dmsp-department:platform', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-platform', 'QUEUED', 0),
  ('dmsp-department:privacy', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-privacy', 'QUEUED', 0),
  ('dmsp-department:procurement', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-procurement', 'QUEUED', 0),
  ('dmsp-department:qa', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-qa', 'QUEUED', 0),
  ('dmsp-department:recovery', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-recovery', 'QUEUED', 0),
  ('dmsp-department:soc', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-soc', 'QUEUED', 0),
  ('dmsp-department:success', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-success', 'QUEUED', 0),
  ('dmsp-department:vendor', 'DMSP_DEPARTMENT_BUILD', 'dmsp-dit-vendor', 'QUEUED', 0)
ON CONFLICT(job_id) DO NOTHING;
