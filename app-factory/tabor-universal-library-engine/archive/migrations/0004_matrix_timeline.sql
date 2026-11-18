CREATE TABLE IF NOT EXISTS sovereign_cells (
  matrix_row INTEGER NOT NULL CHECK(matrix_row BETWEEN 0 AND 12),
  matrix_col INTEGER NOT NULL CHECK(matrix_col BETWEEN 0 AND 12),
  unit_index INTEGER GENERATED ALWAYS AS (matrix_row * 13 + matrix_col) STORED UNIQUE,
  marker TEXT NOT NULL DEFAULT '0xFF' CHECK(marker = '0xFF'),
  PRIMARY KEY(matrix_row, matrix_col)
) STRICT;

CREATE TABLE IF NOT EXISTS sovereign_dimensions (
  dimension INTEGER PRIMARY KEY CHECK(dimension BETWEEN 0 AND 12 OR dimension BETWEEN 20 AND 29)
) STRICT;

CREATE TABLE IF NOT EXISTS sovereign_scales (
  anchor TEXT PRIMARY KEY CHECK(anchor IN ('ME_MICRO','MO_MESO','MU_MACRO','CRO_MECRO'))
) STRICT;

WITH RECURSIVE axes(n) AS (VALUES(0) UNION ALL SELECT n+1 FROM axes WHERE n < 12)
INSERT INTO sovereign_cells (matrix_row,matrix_col)
SELECT rows.n,cols.n FROM axes rows CROSS JOIN axes cols WHERE 1
ON CONFLICT(matrix_row,matrix_col) DO NOTHING;

WITH RECURSIVE numbers(n) AS (VALUES(0) UNION ALL SELECT n+1 FROM numbers WHERE n < 29)
INSERT INTO sovereign_dimensions SELECT n FROM numbers WHERE n <= 12 OR n >= 20
ON CONFLICT(dimension) DO NOTHING;

INSERT INTO sovereign_scales VALUES ('ME_MICRO'),('MO_MESO'),('MU_MACRO'),('CRO_MECRO')
ON CONFLICT(anchor) DO NOTHING;

CREATE TABLE IF NOT EXISTS sovereign_matrix_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE CHECK(length(request_id) BETWEEN 1 AND 96),
  work_id TEXT NOT NULL REFERENCES archive_works(id),
  matrix_row INTEGER NOT NULL,
  matrix_col INTEGER NOT NULL,
  dimension INTEGER NOT NULL REFERENCES sovereign_dimensions(dimension),
  scale_anchor TEXT NOT NULL REFERENCES sovereign_scales(anchor),
  timeline_tick INTEGER NOT NULL CHECK(timeline_tick BETWEEN 0 AND 9007199254740991),
  origin_row INTEGER NOT NULL,
  origin_col INTEGER NOT NULL,
  origin_dimension INTEGER NOT NULL REFERENCES sovereign_dimensions(dimension),
  origin_scale TEXT NOT NULL REFERENCES sovereign_scales(anchor),
  origin_tick INTEGER NOT NULL CHECK(origin_tick BETWEEN 0 AND 9007199254740991),
  direction TEXT GENERATED ALWAYS AS (
    CASE WHEN timeline_tick > origin_tick THEN 'FORWARD'
         WHEN timeline_tick < origin_tick THEN 'BACKWARD' ELSE 'SAME_TICK' END
  ) STORED,
  state_hash TEXT NOT NULL CHECK(length(state_hash)=64 AND state_hash NOT GLOB '*[^0-9a-f]*'),
  payload_json TEXT NOT NULL CHECK(json_valid(payload_json) AND json_type(payload_json)='object'),
  recorded_utc TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(matrix_row,matrix_col) REFERENCES sovereign_cells(matrix_row,matrix_col),
  FOREIGN KEY(origin_row,origin_col) REFERENCES sovereign_cells(matrix_row,matrix_col)
) STRICT;

CREATE INDEX IF NOT EXISTS sovereign_matrix_lookup ON sovereign_matrix_events
  (matrix_row,matrix_col,dimension,scale_anchor,timeline_tick,event_id);
CREATE INDEX IF NOT EXISTS sovereign_matrix_occupancy ON sovereign_matrix_events (dimension,scale_anchor,matrix_row,matrix_col);
CREATE INDEX IF NOT EXISTS sovereign_matrix_work ON sovereign_matrix_events (work_id,event_id);

CREATE TRIGGER IF NOT EXISTS sovereign_matrix_no_update BEFORE UPDATE ON sovereign_matrix_events
BEGIN SELECT RAISE(ABORT, 'immutable timeline event'); END;
CREATE TRIGGER IF NOT EXISTS sovereign_matrix_no_delete BEFORE DELETE ON sovereign_matrix_events
BEGIN SELECT RAISE(ABORT, 'immutable timeline event'); END;
