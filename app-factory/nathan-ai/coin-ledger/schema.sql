CREATE TABLE IF NOT EXISTS order_engine (id TEXT PRIMARY KEY, source_url TEXT NOT NULL, imported_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS binary_ledger (slot INTEGER PRIMARY KEY CHECK(slot BETWEEN 1 AND 64), coordinate TEXT UNIQUE NOT NULL CHECK(length(coordinate)=6), ticker TEXT, name TEXT, source_status TEXT NOT NULL, CHECK((ticker IS NULL AND name IS NULL) OR (ticker IS NOT NULL AND name IS NOT NULL)));
CREATE TABLE IF NOT EXISTS cycle_clock (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, slots INTEGER NOT NULL CHECK(slots=64));
CREATE TABLE IF NOT EXISTS frequency_interface (id TEXT PRIMARY KEY, algorithm TEXT NOT NULL, difficulty_bits INTEGER NOT NULL, nonce_limit INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS gate_protocol (id TEXT PRIMARY KEY, scope TEXT NOT NULL, authorized_slots INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS lineage_archive (id TEXT PRIMARY KEY, slot INTEGER UNIQUE NOT NULL REFERENCES binary_ledger(slot), receipt TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS middle_mediator (id TEXT PRIMARY KEY, path TEXT NOT NULL, method TEXT NOT NULL, purpose TEXT NOT NULL);
CREATE TRIGGER IF NOT EXISTS lineage_no_update BEFORE UPDATE ON lineage_archive BEGIN SELECT RAISE(ABORT, 'append-only receipt'); END;
CREATE TRIGGER IF NOT EXISTS lineage_no_delete BEFORE DELETE ON lineage_archive BEGIN SELECT RAISE(ABORT, 'append-only receipt'); END;
