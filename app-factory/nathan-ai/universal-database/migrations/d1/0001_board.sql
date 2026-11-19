CREATE TABLE IF NOT EXISTS sovereign_root (
  box_id TEXT PRIMARY KEY CHECK (box_id = 'D1'),
  title TEXT NOT NULL,
  parent_seed TEXT NOT NULL CHECK (parent_seed = 'D0')
);
INSERT OR IGNORE INTO sovereign_root VALUES ('D1', 'The First Structure', 'D0');

CREATE TABLE IF NOT EXISTS dimension (
  code TEXT PRIMARY KEY,
  cycle_order INTEGER NOT NULL UNIQUE CHECK (cycle_order BETWEEN 0 AND 33),
  zone TEXT NOT NULL CHECK (zone IN ('core', 'negative', 'inverted')),
  angular_step INTEGER NOT NULL CHECK (angular_step IN (-1, 1)),
  title TEXT NOT NULL
);

WITH RECURSIVE numbers(i) AS (
  SELECT 0 UNION ALL SELECT i + 1 FROM numbers WHERE i < 33
)
INSERT OR IGNORE INTO dimension
SELECT CASE WHEN i = 0 THEN 'D0'
            WHEN i <= 12 THEN printf('-%02dD', i)
            WHEN i <= 24 THEN printf('%02dD', 25 - i)
            ELSE printf('D%d', 34 - i) END,
       i,
       CASE WHEN i BETWEEN 1 AND 12 THEN 'negative'
            WHEN i BETWEEN 13 AND 24 THEN 'inverted' ELSE 'core' END,
       CASE WHEN i BETWEEN 1 AND 24 THEN -1 ELSE 1 END,
       CASE i WHEN 0 THEN 'The Void / Origin' WHEN 33 THEN 'The First Structure'
              WHEN 11 THEN 'Below the Firmament' WHEN 12 THEN 'Firmament Rebound'
              WHEN 13 THEN 'Outer Rim' WHEN 14 THEN 'Elf Realm'
              WHEN 24 THEN 'Inverted Entry' WHEN 25 THEN 'Magnetic Threshold'
              ELSE 'Transit Ring' END
FROM numbers;

CREATE VIEW IF NOT EXISTS dimension_link AS
SELECT a.code AS source, b.code AS destination, 'down' AS direction,
       CASE WHEN a.cycle_order = 12 THEN 'FIRMAMENT_FLIP'
            WHEN a.cycle_order = 24 THEN 'MAGNETIC_FIELD' END AS event
FROM dimension a JOIN dimension b ON b.cycle_order = (a.cycle_order + 1) % 34
UNION ALL
SELECT a.code, b.code, 'up',
       CASE WHEN a.cycle_order = 13 THEN 'FIRMAMENT_FLIP'
            WHEN a.cycle_order = 25 THEN 'MAGNETIC_FIELD' END
FROM dimension a JOIN dimension b ON b.cycle_order = (a.cycle_order + 33) % 34;

CREATE TABLE IF NOT EXISTS sector (
  sector INTEGER PRIMARY KEY CHECK (sector BETWEEN 0 AND 11)
);
WITH RECURSIVE numbers(i) AS (
  SELECT 0 UNION ALL SELECT i + 1 FROM numbers WHERE i < 11
)
INSERT OR IGNORE INTO sector SELECT i FROM numbers;

CREATE TABLE IF NOT EXISTS beacon (
  code TEXT NOT NULL REFERENCES dimension(code),
  sector INTEGER NOT NULL REFERENCES sector(sector),
  title TEXT NOT NULL,
  PRIMARY KEY (code, sector)
);
INSERT OR IGNORE INTO beacon VALUES
  ('-11D', 2, 'Firmament Beacon'),
  ('11D', 9, 'Elf Beacon'),
  ('D9', 5, 'Magnetic Beacon');

CREATE VIEW IF NOT EXISTS board_cell AS
SELECT code, sector FROM dimension CROSS JOIN sector;
