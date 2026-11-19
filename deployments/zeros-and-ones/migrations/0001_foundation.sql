CREATE TABLE IF NOT EXISTS route_registry (
    method TEXT NOT NULL,
    path TEXT NOT NULL CHECK (substr(path, 1, 1) = '/'),
    handler TEXT NOT NULL,
    PRIMARY KEY (method, path)
);

CREATE TABLE IF NOT EXISTS lookup_values (
    namespace TEXT NOT NULL,
    code TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (namespace, code)
);

CREATE INDEX IF NOT EXISTS route_registry_handler_idx
    ON route_registry (handler);

INSERT INTO route_registry (method, path, handler)
VALUES ('GET', '/health', 'health')
ON CONFLICT (method, path) DO NOTHING;

INSERT INTO lookup_values (namespace, code, value)
VALUES ('system', 'schema_version', '1')
ON CONFLICT (namespace, code) DO NOTHING;
