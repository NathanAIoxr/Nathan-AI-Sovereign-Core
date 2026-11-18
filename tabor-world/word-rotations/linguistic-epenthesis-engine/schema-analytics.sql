-- Aggregate-only anonymous analytics. No raw word pairs, IP addresses, or tokens.
CREATE TABLE IF NOT EXISTS epenthesis_aggregate (
  event_day TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('axis','node','bridge')),
  axis TEXT NOT NULL,
  calls INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(event_day,operation,axis)
);
