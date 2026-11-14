PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS nexus_sources (source_id TEXT PRIMARY KEY, title TEXT NOT NULL, kind TEXT NOT NULL, original_text TEXT, sha256 TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS nexus_nodes (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, description TEXT NOT NULL, authority TEXT NOT NULL, version TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS nexus_edges (source_node TEXT NOT NULL REFERENCES nexus_nodes(id), target_node TEXT NOT NULL REFERENCES nexus_nodes(id), relation TEXT NOT NULL, PRIMARY KEY(source_node,target_node,relation));
CREATE TABLE IF NOT EXISTS nexus_quotes (id INTEGER PRIMARY KEY, quote_text TEXT NOT NULL, source_id TEXT REFERENCES nexus_sources(source_id), source_lines TEXT NOT NULL, version TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS nexus_aliases (alias TEXT NOT NULL, canonical_node TEXT NOT NULL REFERENCES nexus_nodes(id), status TEXT NOT NULL, PRIMARY KEY(alias,canonical_node));
CREATE TABLE IF NOT EXISTS nexus_verification (id INTEGER PRIMARY KEY, question TEXT UNIQUE NOT NULL, status TEXT NOT NULL DEFAULT 'unverified');
CREATE INDEX IF NOT EXISTS idx_nexus_nodes_type ON nexus_nodes(type);
CREATE INDEX IF NOT EXISTS idx_nexus_edges_target ON nexus_edges(target_node);
