CREATE TABLE IF NOT EXISTS worker_families (
  family_id INTEGER PRIMARY KEY, family_code TEXT NOT NULL, zone TEXT NOT NULL,
  depth_capacity INTEGER NOT NULL DEFAULT 1332
);
CREATE TABLE IF NOT EXISTS clover_matrix (
  node_id INTEGER PRIMARY KEY, quadrant TEXT NOT NULL,
  family_id INTEGER NOT NULL REFERENCES worker_families(family_id),
  duodecimal_coord TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS council_archetypes (
  archetype_id TEXT PRIMARY KEY, category TEXT NOT NULL, name TEXT NOT NULL,
  zone TEXT NOT NULL, primary_function TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS factory_101_apps (
  app_id INTEGER PRIMARY KEY, app_slug TEXT NOT NULL UNIQUE,
  app_title TEXT NOT NULL, zone TEXT NOT NULL, route_path TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS axis_dual_bus (
  id INTEGER PRIMARY KEY, zone TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'FORWARD' CHECK (direction IN ('FORWARD','MIRROR_VERIFIED','QUARANTINED')),
  family_id INTEGER NOT NULL REFERENCES worker_families(family_id),
  clover_node INTEGER NOT NULL REFERENCES clover_matrix(node_id),
  duodecimal_id TEXT NOT NULL, locale TEXT NOT NULL, payload TEXT NOT NULL,
  sha256_hash TEXT NOT NULL, updated_at TEXT NOT NULL,
  UNIQUE (zone, locale, sha256_hash)
);
CREATE INDEX IF NOT EXISTS axis_pending ON axis_dual_bus(id) WHERE direction = 'FORWARD';
CREATE TABLE IF NOT EXISTS database_snapshots (
  snapshot_id TEXT PRIMARY KEY, row_count INTEGER NOT NULL, root_hash TEXT NOT NULL,
  manifest TEXT NOT NULL, r2_key TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tabor_light_vault (
  record_id TEXT PRIMARY KEY, collection_type TEXT NOT NULL, title TEXT NOT NULL,
  raw_text_preserved TEXT NOT NULL, reverse_text TEXT NOT NULL, first_letter_code TEXT NOT NULL,
  sha256_hash TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS supernode_registry (
  logical_address INTEGER PRIMARY KEY CHECK(logical_address BETWEEN 1 AND 732000000),
  source_record INTEGER NOT NULL UNIQUE REFERENCES axis_dual_bus(id),
  clover_node INTEGER NOT NULL, family_id INTEGER NOT NULL,
  duodecimal_addr TEXT NOT NULL, owner_checksum TEXT NOT NULL
);
WITH RECURSIVE family(id) AS (SELECT 1 UNION ALL SELECT id + 1 FROM family WHERE id < 172)
INSERT OR IGNORE INTO worker_families (family_id, family_code, zone)
SELECT id, printf('SOVEREIGN_FAMILY_%03d', id),
       CASE (id - 1) % 3 WHEN 0 THEN 'HIVE_ABOVE' WHEN 1 THEN 'ANTHILL_MIDDLE' ELSE 'CATACOMB_BELOW' END
FROM family WHERE id < 164;
INSERT OR IGNORE INTO worker_families (family_id, family_code, zone) VALUES
  (164,'EDGE_GATEKEEPERS','HIVE_ABOVE'), (165,'D1_SNAPSHOT_KEEPERS','CATACOMB_BELOW'),
  (166,'R2_VAULT_ARCHIVERS','CATACOMB_BELOW'), (167,'PORTFOLIO_ROUTER_BEES','HIVE_ABOVE'),
  (168,'WORLDWIDE_INTAKE_ANTS','ANTHILL_MIDDLE'), (169,'DYNAMIC_WORKER_BUNDLERS','HIVE_ABOVE'),
  (170,'MIRROR_AUDIT_SENTINELS','ANTHILL_MIDDLE'), (171,'ROLLBACK_HEALERS','CATACOMB_BELOW'),
  (172,'CROSS_PLATFORM_BRIDGES','HIVE_ABOVE');
WITH RECURSIVE nodes(id) AS (SELECT 1 UNION ALL SELECT id + 1 FROM nodes WHERE id < 1382),
  base12(id, n, digits) AS (
    SELECT id, id, '' FROM nodes
    UNION ALL SELECT id, n / 12, substr('0123456789AB', (n % 12) + 1, 1) || digits FROM base12 WHERE n > 0
  )
INSERT OR IGNORE INTO clover_matrix
SELECT id, CASE (id - 1) % 4 WHEN 0 THEN 'TRUTH' WHEN 1 THEN 'TIME'
           WHEN 2 THEN 'TRAVEL' ELSE 'TRANSFIGURATION' END,
       ((id - 1) % 172) + 1, digits FROM base12 WHERE n = 0;
INSERT OR IGNORE INTO factory_101_apps VALUES
  (1, 'one-the-last-app', 'ONE — The Last App', 'HIVE_ABOVE', '/apps/one'),
  (2, 'make-ai-yours', 'MAKE AI YOURS — Powered by NATHAN AI', 'HIVE_ABOVE', '/apps/make-ai-yours'),
  (3, 'icu-buddy', 'BUDDY AI (THE iCU APP)', 'HIVE_ABOVE', '/apps/icu-buddy'),
  (4, 'mad-man-app', 'MAD MAN APP', 'HIVE_ABOVE', '/apps/mad-man'),
  (5, 'tabor-light-bible', 'The Modern Day Bible — Tabor Light', 'CATACOMB_BELOW', '/apps/tabor-light'),
  (6, 'mespark-matrix', 'meSPARK & Memory Matrix', 'CATACOMB_BELOW', '/apps/mespark'),
  (7, 'mammal-lineage', 'MAMMAL Ancestral Lineage', 'CATACOMB_BELOW', '/apps/mammal'),
  (8, 'gathering-circle', 'The Gathering Circle', 'HIVE_ABOVE', '/apps/gathering-circle'),
  (9, 'universal-obd', 'Nathan AI Universal OBD Diagnostics', 'ANTHILL_MIDDLE', '/apps/obd'),
  (10, 'tabor-logistics', 'Tabor Logistics & Fleet Dispatch', 'ANTHILL_MIDDLE', '/apps/logistics'),
  (11, 'icarus-baseball', 'The Icarus''s of Baseball', 'HIVE_ABOVE', '/apps/icarus-baseball'),
  (12, 'aters-universe', 'The Complete Aters Alphabet Universe', 'HIVE_ABOVE', '/apps/aters'),
  (13, 'gang-builder', 'The Gang Builder', 'ANTHILL_MIDDLE', '/apps/gang-builder'),
  (14, 'godtabor-portal', 'GODTABOR: Literal, Figurative & Mythological Portal', 'HIVE_ABOVE', '/godtabor.html');
INSERT OR IGNORE INTO council_archetypes VALUES
  ('hist-01', 'HISTORICAL_12', 'Cleopatra VII', 'HIVE_ABOVE', 'Polyglot Diplomacy & Zero-Trust Ciphers'),
  ('hist-02', 'HISTORICAL_12', 'Leonardo da Vinci', 'ANTHILL_MIDDLE', 'Anatomical Octo-Builders & Mirror Blueprints'),
  ('hist-03', 'HISTORICAL_12', 'Nikola Tesla', 'CATACOMB_BELOW', 'Wireless Resonance & P2P Mesh Compute'),
  ('hist-04', 'HISTORICAL_12', 'Ada Lovelace', 'ANTHILL_MIDDLE', 'Symbolic Loops & Poetic-to-Binary Compilers'),
  ('hist-05', 'HISTORICAL_12', 'Sun Tzu', 'CATACOMB_BELOW', 'Ghost Scouts & Pre-Battle Simulation Gates'),
  ('hist-06', 'HISTORICAL_12', 'Archimedes', 'HIVE_ABOVE', 'Fulcrum Multipliers & WASM Compression'),
  ('hist-07', 'HISTORICAL_12', 'Hypatia of Alexandria', 'CATACOMB_BELOW', 'Unburnable Library & Geometric Indexing'),
  ('hist-08', 'HISTORICAL_12', 'Imhotep', 'ANTHILL_MIDDLE', 'Stone-Cut Schemas & System Diagnostics'),
  ('hist-09', 'HISTORICAL_12', 'Ibn al-Haytham (Alhazen)', 'ANTHILL_MIDDLE', 'Camera Obscura Visual Verification Gates'),
  ('hist-10', 'HISTORICAL_12', 'Wu Zetian', 'HIVE_ABOVE', 'Bronze-Urn Intake & Meritocratic Scheduling'),
  ('hist-11', 'HISTORICAL_12', 'Alan Turing', 'ANTHILL_MIDDLE', 'Parallel Permutations & Self-Organizing Grids'),
  ('hist-12', 'HISTORICAL_12', 'Harriet Tubman', 'CATACOMB_BELOW', 'Zero-Trace Extraction & Safe-House Routing'),
  ('myth-01', 'MYTHIC_12', 'Zeus', 'HIVE_ABOVE', 'Instantaneous Broadcast & Perimeter Defense'),
  ('myth-02', 'MYTHIC_12', 'Odin', 'CATACOMB_BELOW', 'Twin-Raven Telemetry & Root Memory Wells'),
  ('myth-03', 'MYTHIC_12', 'Thoth', 'ANTHILL_MIDDLE', 'Precision Scribe Ledger & Truth Verification'),
  ('myth-04', 'MYTHIC_12', 'Hephaestus', 'ANTHILL_MIDDLE', 'Subterranean Forge & Self-Moving Automata'),
  ('myth-05', 'MYTHIC_12', 'Shiva', 'CATACOMB_BELOW', 'Creation-Destruction Loop & Instant Purge'),
  ('myth-06', 'MYTHIC_12', 'Ganesha', 'HIVE_ABOVE', 'Threshold Gatekeeper & Obstacle Clearing'),
  ('myth-07', 'MYTHIC_12', 'Athena', 'ANTHILL_MIDDLE', 'Tactical Loom & Night-Ops Scouts'),
  ('myth-08', 'MYTHIC_12', 'Isis', 'CATACOMB_BELOW', 'Fragment Reassembly & Root-Name Authority'),
  ('myth-09', 'MYTHIC_12', 'Saraswati', 'HIVE_ABOVE', 'Noise-Filtering Streams & Syntax Compilers'),
  ('myth-10', 'MYTHIC_12', 'Freya', 'HIVE_ABOVE', 'Stealth Edge Runners & Priority Selection'),
  ('myth-11', 'MYTHIC_12', 'Amaterasu', 'HIVE_ABOVE', 'Photographic State Reflection & Cave Fail-Safe'),
  ('myth-12', 'MYTHIC_12', 'Kali', 'CATACOMB_BELOW', 'Zero-Mercy Garbage Collection & Quarantine');
