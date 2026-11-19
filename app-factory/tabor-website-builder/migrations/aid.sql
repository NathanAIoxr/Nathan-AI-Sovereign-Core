CREATE TABLE IF NOT EXISTS gift_catalog (
  item_id TEXT PRIMARY KEY NOT NULL,
  program_slug TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  unit_cost_cents INTEGER NOT NULL CHECK(unit_cost_cents >= 0),
  units_available INTEGER NOT NULL DEFAULT 0 CHECK(units_available >= 0),
  units_fulfilled INTEGER NOT NULL DEFAULT 0 CHECK(units_fulfilled >= 0),
  active INTEGER NOT NULL DEFAULT 0 CHECK(active IN (0, 1))
);
CREATE TABLE IF NOT EXISTS fulfillment_pledges (
  pledge_id TEXT PRIMARY KEY NOT NULL,
  item_id TEXT NOT NULL REFERENCES gift_catalog(item_id),
  quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 100),
  status TEXT NOT NULL DEFAULT 'PLEDGED' CHECK(status IN ('PLEDGED','FULFILLED','CANCELLED')),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS pledge_item_status ON fulfillment_pledges(item_id, status);
