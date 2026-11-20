CREATE TABLE IF NOT EXISTS artifact_scroll_write_budget (
  utc_day TEXT PRIMARY KEY,
  accepted INTEGER NOT NULL
);
CREATE TRIGGER IF NOT EXISTS artifact_scroll_budget_limit
BEFORE INSERT ON artifact_scroll_ledger
WHEN COALESCE(
  (SELECT accepted FROM artifact_scroll_write_budget WHERE utc_day = date('now')), 0
) >= 1000
BEGIN
  SELECT RAISE(ABORT, 'artifact_scroll_daily_budget');
END;
CREATE TRIGGER IF NOT EXISTS artifact_scroll_budget_count
AFTER INSERT ON artifact_scroll_ledger
BEGIN
  INSERT INTO artifact_scroll_write_budget(utc_day, accepted) VALUES (date('now'), 1)
  ON CONFLICT(utc_day) DO UPDATE SET accepted=accepted+1;
END;
