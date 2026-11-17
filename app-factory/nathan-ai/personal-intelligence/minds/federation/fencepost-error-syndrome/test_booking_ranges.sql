-- Run only on a disposable test DB after booking_ranges.sql.
BEGIN;
DO $$
BEGIN
 INSERT INTO sovereign_booking(resource,period) VALUES
 ('test-room',daterange('2026-05-01','2026-05-03','[)')),
 ('test-room',daterange('2026-05-03','2026-05-04','[)'));
 BEGIN
  INSERT INTO sovereign_booking(resource,period) VALUES
  ('test-room',daterange('2026-05-02','2026-05-04','[)'));
  RAISE EXCEPTION 'FAIL: overlap accepted';
 EXCEPTION WHEN exclusion_violation THEN NULL;
 END;
 BEGIN
  INSERT INTO sovereign_booking(resource,period) VALUES
  ('test-room',daterange('2026-05-03','2026-05-03','[)'));
  RAISE EXCEPTION 'FAIL: empty booking accepted';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 BEGIN
  INSERT INTO sovereign_booking(resource,period) VALUES
  ('test-room',daterange(NULL,'2026-05-03','[)'));
  RAISE EXCEPTION 'FAIL: unbounded booking accepted';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 IF (SELECT COUNT(*) FROM sovereign_booking WHERE resource='test-room') <> 2 THEN
  RAISE EXCEPTION 'FAIL: expected two adjacent bookings';
 END IF;
END $$;
ROLLBACK;
