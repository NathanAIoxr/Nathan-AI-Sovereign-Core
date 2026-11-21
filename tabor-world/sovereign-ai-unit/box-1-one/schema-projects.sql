-- Project namespaces and isolated receipt registries (additive)
CREATE TABLE IF NOT EXISTS nathan_projects (
 id TEXT PRIMARY KEY, display_name TEXT NOT NULL,
 storage_prefix TEXT NOT NULL UNIQUE, enabled INTEGER NOT NULL DEFAULT 1,
 created_at INTEGER NOT NULL
);
INSERT OR IGNORE INTO nathan_projects VALUES ('pie-pi-phi','Pie Pi Phi','projects/pie-pi-phi/',1,0);
INSERT OR IGNORE INTO nathan_projects VALUES ('supercalifragilisticexpialidocious','Supercalifragilisticexpialidocious','projects/supercalifragilisticexpialidocious/',1,0);
INSERT OR IGNORE INTO nathan_projects VALUES ('nathan-ai','NATHAN AI','projects/nathan-ai/',1,0);
