-- Additive restoration and provenance, no destructive migration.
CREATE TABLE IF NOT EXISTS nathan_project_restore_events (
 event_id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL,
 source_kind TEXT NOT NULL,
 source_ref TEXT NOT NULL,
 source_sha TEXT,
 restore_state TEXT NOT NULL CHECK(restore_state IN ('DISCOVERED','REVIEW','VERIFIED','RESTORED','BLOCKED')),
 evidence_json TEXT NOT NULL DEFAULT '{}',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_nathan_restore_project ON nathan_project_restore_events(project_id,restore_state);
CREATE TABLE IF NOT EXISTS nathan_cross_project_links (
 link_id TEXT PRIMARY KEY,
 from_project TEXT NOT NULL,
 to_project TEXT NOT NULL,
 relation TEXT NOT NULL,
 provenance TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'HOLD' CHECK(state IN ('HOLD','REVIEW','ACTIVE')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS nathan_audit_gate_events (
 event_id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL,
 operation TEXT NOT NULL,
 authorized INTEGER NOT NULL DEFAULT 0 CHECK(authorized IN (0,1)),
 evidence_verified INTEGER NOT NULL DEFAULT 0 CHECK(evidence_verified IN (0,1)),
 loss_limit_exceeded INTEGER NOT NULL DEFAULT 0 CHECK(loss_limit_exceeded IN (0,1)),
 emotional_override INTEGER NOT NULL DEFAULT 0 CHECK(emotional_override IN (0,1)),
 decision TEXT NOT NULL CHECK(decision IN ('HOLD','REVIEW','ALLOW')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
