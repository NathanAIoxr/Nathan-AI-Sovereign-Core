CREATE TABLE IF NOT EXISTS engine_receipts (
  seal TEXT PRIMARY KEY,
  receipt TEXT NOT NULL,
  received_day TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS engine_budget (
  day TEXT PRIMARY KEY,
  accepted INTEGER NOT NULL
);
CREATE TRIGGER IF NOT EXISTS engine_count_insert
AFTER INSERT ON engine_receipts
BEGIN
  INSERT INTO engine_budget(day, accepted) VALUES (NEW.received_day, 1)
  ON CONFLICT(day) DO UPDATE SET accepted = accepted + 1;
END;
