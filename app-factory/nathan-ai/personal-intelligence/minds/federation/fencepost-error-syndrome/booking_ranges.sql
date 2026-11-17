-- PostgreSQL reference migration. Apply only to an explicitly selected app DB.
-- Role executing this migration needs permission to install btree_gist.
BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE IF NOT EXISTS sovereign_booking (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    resource text NOT NULL CHECK (length(trim(resource)) > 0),
    period daterange NOT NULL,
    CHECK (NOT isempty(period) AND NOT lower_inf(period) AND NOT upper_inf(period)),
    CHECK (lower_inc(period) AND NOT upper_inc(period)),
    EXCLUDE USING gist (resource WITH =, period WITH &&)
);
-- daterange canonicalizes discrete dates to [). tsrange/tstzrange need an
-- explicit CHECK on bound flags; define local-time/DST semantics before use.
COMMIT;
