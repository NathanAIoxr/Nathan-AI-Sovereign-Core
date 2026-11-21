CREATE TABLE IF NOT EXISTS blueprint_usage (
    day TEXT NOT NULL,
    action TEXT NOT NULL,
    count INTEGER NOT NULL,
    PRIMARY KEY (day, action)
);
CREATE TABLE IF NOT EXISTS blueprint_health (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    checked_at INTEGER NOT NULL,
    healthy INTEGER NOT NULL,
    detail TEXT NOT NULL
);
