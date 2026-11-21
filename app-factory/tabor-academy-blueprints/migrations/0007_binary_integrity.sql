-- The empty default permits adding the column to the 30 previously reviewed rows.
-- The backfill plus the guards below make it mandatory for subsequent writes.
ALTER TABLE blueprint_lessons ADD COLUMN row_sha256 TEXT NOT NULL DEFAULT '';
ALTER TABLE blueprint_lessons ADD COLUMN version_int INTEGER NOT NULL DEFAULT 1 CHECK(version_int > 0);
UPDATE blueprint_lessons SET row_sha256='b55441ca1499a688e9dac70b647758d065738912575063fb05ed9650ed328fa2' WHERE id=1;
UPDATE blueprint_lessons SET row_sha256='b3d5abbf3c3794da4507795645fa784cfba6f574cf6bb657b90fc3935c8abbc1' WHERE id=2;
UPDATE blueprint_lessons SET row_sha256='519c7a298655a6153d9921f71c2e864ddf77eda035e1160f97fd4980a3c9c68f' WHERE id=3;
UPDATE blueprint_lessons SET row_sha256='43184ed785875fd43af219af478f5bfd3421945fbbbc95b923bdd793790dff2a' WHERE id=4;
UPDATE blueprint_lessons SET row_sha256='3ac30405aa0d7c36c8af1f79955e1802610bd8598e39bb6d66df482a53c31fbf' WHERE id=5;
UPDATE blueprint_lessons SET row_sha256='88a24bac1d2b182076373da707a625ec067f3e719d78b5408cb6b33f1a57de6a' WHERE id=6;
UPDATE blueprint_lessons SET row_sha256='44073d3909e7d8333cbb533ac00669d9bd9eed9bac286edc1d9bc5afa75c2745' WHERE id=7;
UPDATE blueprint_lessons SET row_sha256='0c748e6fb90057922e760b4096e87a8a3f1738b59450c7af82e2a12f718c1d6e' WHERE id=8;
UPDATE blueprint_lessons SET row_sha256='768c1f688be214347d4017f6f6c6318f7ec5310a61151f33a9f2797e0a6b199d' WHERE id=9;
UPDATE blueprint_lessons SET row_sha256='08159822d37506d2dabbf1d97a4032be4448c990058abed7090fad982b66157a' WHERE id=10;
UPDATE blueprint_lessons SET row_sha256='d49d650d433f344534cbf38089848b21e289b72021dc669b8c836fa05704748b' WHERE id=11;
UPDATE blueprint_lessons SET row_sha256='e66f9082b032b1c27596194586b6ff60550e0693662a652bef38b7de6c08db1e' WHERE id=12;
UPDATE blueprint_lessons SET row_sha256='e90de5d70542e40ed5bad75757a15124892033806341c5a98dacc65bab326d4b' WHERE id=13;
UPDATE blueprint_lessons SET row_sha256='95950bb5bfa62b7125923616ee39eb93c0222b72290cc96f0d4feb9d9d2fbfd2' WHERE id=14;
UPDATE blueprint_lessons SET row_sha256='8bcc8077d09e1110960a823de7b63d8f83095ff8781fdc9376df0d3e1de2569e' WHERE id=15;
UPDATE blueprint_lessons SET row_sha256='cebd6cbf90aa9d79368451f7c1d7648779d79a0688023c782577d9f982fb115b' WHERE id=16;
UPDATE blueprint_lessons SET row_sha256='4374a12c140c323e35e1c8331a04203f17a384109a819eb73934cf0cdc6015af' WHERE id=17;
UPDATE blueprint_lessons SET row_sha256='27f27dd5e5258d70b868356e963adaf26c7712063959c8df36481499941fd7e5' WHERE id=18;
UPDATE blueprint_lessons SET row_sha256='db67d7967bf84c1771e321a299783a17a70375c26e87720e1ea9667896bfa3e9' WHERE id=19;
UPDATE blueprint_lessons SET row_sha256='d88ca75831648801f35ba1843b263f1f4fda7dc5ece7b3629f22be5eb3389fb1' WHERE id=20;
UPDATE blueprint_lessons SET row_sha256='bfcaf01313b860f546b2c05f9d2db689a83c1ebda79d025ed99aaa3e9908d133' WHERE id=21;
UPDATE blueprint_lessons SET row_sha256='7be689fa478c61eaa0c2f160353c612202db1bf2276fce580f23b5b462dd8c45' WHERE id=22;
UPDATE blueprint_lessons SET row_sha256='65c6fad7f9fe3e5eff99c26a84ca3d6dc4243634b03f93bad179589feffd17a7' WHERE id=23;
UPDATE blueprint_lessons SET row_sha256='018613470babf3baabeb19863b5bb4071b86e254b0982ad341415bfe7d0d3355' WHERE id=24;
UPDATE blueprint_lessons SET row_sha256='e83bbf9fc3d11874593d866579795e28fc096779aed11314d618e1aebe0ba880' WHERE id=25;
UPDATE blueprint_lessons SET row_sha256='57bd5730339b7c34d544843abf314ad5288ec6a304c396e7350615250a7c5cc9' WHERE id=26;
UPDATE blueprint_lessons SET row_sha256='51e7a1ebe32ce1d97e67e845908512ebebd4bf91012114ccbbfa78a156fea5bb' WHERE id=27;
UPDATE blueprint_lessons SET row_sha256='c211c2f8ad5cf1e51c344fdea62b039271e93634aef3de76a5a51b36789f01eb' WHERE id=28;
UPDATE blueprint_lessons SET row_sha256='de38bba566eab8f4386afaf62ba05e4086c852dba711adba167d65788d4775d4' WHERE id=29;
UPDATE blueprint_lessons SET row_sha256='ffa724bf17c2da67fb7500963f0332e54d9cc7bbdb9d26f24b3d5323de8b785e' WHERE id=30;

CREATE TRIGGER blueprint_insert_hash_guard
BEFORE INSERT ON blueprint_lessons
WHEN length(NEW.row_sha256) != 64 OR NEW.row_sha256 GLOB '*[^0123456789abcdef]*'
BEGIN
    SELECT RAISE(ABORT, 'Missing or invalid blueprint hash');
END;
CREATE TRIGGER blueprint_update_hash_guard
BEFORE UPDATE ON blueprint_lessons
WHEN NEW.id != OLD.id OR NEW.version_int != OLD.version_int + 1
    OR length(NEW.row_sha256) != 64 OR NEW.row_sha256 GLOB '*[^0123456789abcdef]*'
BEGIN
    SELECT RAISE(ABORT, 'Invalid blueprint hash or version transition');
END;

CREATE TABLE IF NOT EXISTS blueprint_lifecycle (
    lesson_id INTEGER PRIMARY KEY REFERENCES blueprint_lessons(id),
    state TEXT NOT NULL CHECK(state IN ('verified', 'quarantined')),
    origin TEXT NOT NULL,
    verified_at INTEGER
);
CREATE UNIQUE INDEX blueprint_mechanics_hash ON blueprint_lessons(row_sha256);
CREATE TABLE blueprint_write_receipts (
    key TEXT PRIMARY KEY CHECK(length(key)=64 AND key NOT GLOB '*[^0123456789abcdef]*'),
    lesson_id INTEGER NOT NULL,
    version_int INTEGER NOT NULL CHECK(version_int > 0),
    state TEXT NOT NULL CHECK(state IN ('verified', 'quarantined', 'purged'))
);

CREATE TRIGGER blueprint_field_quota
AFTER INSERT ON blueprint_observations
BEGIN
    INSERT INTO blueprint_usage(day,action,count) VALUES (date('now'),'field',1)
    ON CONFLICT(day,action) DO UPDATE SET count=count+1 WHERE count<150;
    SELECT CASE WHEN changes()!=1 THEN RAISE(ABORT,'Academy field quota reached') END;
END;

CREATE TABLE blueprint_draft_intake (
    id TEXT PRIMARY KEY,
    payload TEXT NOT NULL CHECK(json_valid(payload)),
    lease_until INTEGER NOT NULL DEFAULT 0,
    state INTEGER NOT NULL DEFAULT 0 CHECK(state IN (-1,0,1))
);
