CREATE TABLE IF NOT EXISTS nathan_rotational_agents (id TEXT PRIMARY KEY, family TEXT NOT NULL, role TEXT NOT NULL, state TEXT NOT NULL, last_heartbeat INTEGER, last_receipt TEXT, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS nathan_rotational_events (id INTEGER PRIMARY KEY AUTOINCREMENT, agent_id TEXT NOT NULL, job_id TEXT, event TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_nathan_rotational_events_agent ON nathan_rotational_events(agent_id,created_at);
