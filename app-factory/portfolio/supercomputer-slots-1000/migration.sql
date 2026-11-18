-- Additive metadata-only ledger. Does not deploy 1,000 computers.
-- Execute against existing tabor-fleet-registry D1. Existing fleet_entry 505 records remain untouched.
CREATE TABLE IF NOT EXISTS virtual_app_v1 (
 app_id TEXT PRIMARY KEY,
 title TEXT NOT NULL,
 worker_name TEXT NOT NULL,
 public_url TEXT NOT NULL
) STRICT;
INSERT OR IGNORE INTO virtual_app_v1 (app_id,title,worker_name,public_url) VALUES
 ('bibletopia','Bible Topia','bibletopia','https://bibletopia.nathantaboract.workers.dev/'),
 ('tabor-world','Tabor World','tabor-world','https://tabor-world.nathantaboract.workers.dev/'),
 ('grapple-it','Grapple It','grapple-it','https://grapple-it.nathantaboract.workers.dev/'),
 ('hook-and-ring','Hook & Ring','hook-and-ring','https://hook-and-ring.nathantaboract.workers.dev/'),
 ('tabor-tracker-ball','Tabor Track Baller','tabor-tracker-ball','https://tabor-tracker-ball.nathantaboract.workers.dev/');
CREATE TABLE IF NOT EXISTS virtual_book_set_v1 (
 set_id TEXT PRIMARY KEY,
 slot INTEGER NOT NULL UNIQUE CHECK(slot BETWEEN 1 AND 1000),
 canonical_catalog_ref TEXT NOT NULL,
 contents_state TEXT NOT NULL CHECK(contents_state='reference_only')
) STRICT;
CREATE TABLE IF NOT EXISTS virtual_technology_set_v1 (
 set_id TEXT PRIMARY KEY,
 slot INTEGER NOT NULL UNIQUE CHECK(slot BETWEEN 1 AND 1000),
 canonical_catalog_ref TEXT NOT NULL,
 contents_state TEXT NOT NULL CHECK(contents_state='reference_only')
) STRICT;
CREATE TABLE IF NOT EXISTS virtual_supercomputer_slot_v1 (
 slot INTEGER PRIMARY KEY CHECK(slot BETWEEN 1 AND 1000),
 node_id TEXT NOT NULL UNIQUE,
 app_id TEXT NOT NULL REFERENCES virtual_app_v1(app_id),
 book_set_id TEXT NOT NULL UNIQUE REFERENCES virtual_book_set_v1(set_id),
 technology_set_id TEXT NOT NULL UNIQUE REFERENCES virtual_technology_set_v1(set_id),
 allocation_kind TEXT NOT NULL CHECK(allocation_kind='logical'),
 deployment_state TEXT NOT NULL CHECK(deployment_state='indexed_only'),
 FOREIGN KEY(book_set_id) REFERENCES virtual_book_set_v1(set_id)
) STRICT;
-- Three independent sets of 1,000 records, without copying original files.
INSERT OR IGNORE INTO virtual_book_set_v1(set_id,slot,canonical_catalog_ref,contents_state)
WITH d(x) AS (VALUES(0),(1),(2),(3),(4),(5),(6),(7),(8),(9)),
 nums(n) AS (SELECT 1+a.x+10*b.x+100*c.x FROM d a CROSS JOIN d b CROSS JOIN d c)
SELECT 'books-'||printf('%04d',n),n,'app-factory/nathan-ai/original-works/manifest.json;app-factory/one/taborite-language-matrix/books/;app-factory/one/library-mind/','reference_only' FROM nums;
INSERT OR IGNORE INTO virtual_technology_set_v1(set_id,slot,canonical_catalog_ref,contents_state)
WITH d(x) AS (VALUES(0),(1),(2),(3),(4),(5),(6),(7),(8),(9)),
 nums(n) AS (SELECT 1+a.x+10*b.x+100*c.x FROM d a CROSS JOIN d b CROSS JOIN d c)
SELECT 'tech-'||printf('%04d',n),n,'app-factory/grapple-it/;app-factory/tabor-tracker-ball/;standalone-apps/hook-and-ring/;app-factory/nathan-ai/sovereign-supercomputer/','reference_only' FROM nums;
INSERT OR IGNORE INTO virtual_supercomputer_slot_v1(slot,node_id,app_id,book_set_id,technology_set_id,allocation_kind,deployment_state)
WITH d(x) AS (VALUES(0),(1),(2),(3),(4),(5),(6),(7),(8),(9)),
 nums(n) AS (SELECT 1+a.x+10*b.x+100*c.x FROM d a CROSS JOIN d b CROSS JOIN d c)
SELECT n,'sc-'||printf('%04d',n),
 CASE (n-1)%5 WHEN 0 THEN 'bibletopia' WHEN 1 THEN 'tabor-world' WHEN 2 THEN 'grapple-it' WHEN 3 THEN 'hook-and-ring' ELSE 'tabor-tracker-ball' END,
 'books-'||printf('%04d',n),'tech-'||printf('%04d',n),'logical','indexed_only' FROM nums;
CREATE INDEX IF NOT EXISTS idx_virtual_supercomputer_app_v1 ON virtual_supercomputer_slot_v1(app_id);
