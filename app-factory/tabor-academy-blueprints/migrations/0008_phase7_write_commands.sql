CREATE TABLE IF NOT EXISTS blueprint_integrity_commands (
  key TEXT PRIMARY KEY CHECK(length(key)=64 AND key NOT GLOB '*[^0-9a-f]*'),
  lesson_id INTEGER NOT NULL REFERENCES blueprint_integrity(lesson_id),
  expected_version INTEGER NOT NULL CHECK(expected_version>=1),
  state INTEGER NOT NULL CHECK(state IN (-1,0,1)),
  recorded_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TRIGGER IF NOT EXISTS blueprint_integrity_execute_command
AFTER INSERT ON blueprint_integrity_commands
BEGIN
  UPDATE blueprint_integrity SET version=version+1, state=NEW.state
  WHERE lesson_id=NEW.lesson_id AND version=NEW.expected_version
    AND state<>NEW.state AND state<>-1 AND (NEW.state<>-1 OR state=0);
  SELECT CASE WHEN changes()<>1 THEN RAISE(ABORT,'Academy version or state changed') END;
  INSERT INTO blueprint_lifecycle(lesson_id,state,origin,verified_at)
    VALUES(NEW.lesson_id,CASE WHEN NEW.state=1 THEN 'verified' ELSE 'quarantined' END,'conductor',
      CASE WHEN NEW.state=1 THEN unixepoch() END)
    ON CONFLICT(lesson_id) DO UPDATE SET state=excluded.state,origin=excluded.origin,
      verified_at=excluded.verified_at;
END;
