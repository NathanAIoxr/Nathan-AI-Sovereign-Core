-- 1. MASTER ARCHIVE (Z-to-A & Library of Congress Hybrid)
CREATE TABLE library_records (
    record_id TEXT PRIMARY KEY,          -- SHA-256 content hash
    loc_call_number TEXT NOT NULL,       -- Library of Congress classification
    cud_index INTEGER CHECK (cud_index IN (0, 1, 2)), -- 0=Cero, 1=Uno, 2=Dos
    title_bottom TEXT NOT NULL,          -- Anchored bottom-to-top title
    end_outcome_z TEXT NOT NULL,         -- Finished result shown first (Z)
    root_origin_a TEXT NOT NULL,         -- Verified primary source root (A)
    verbatim_body TEXT NOT NULL,         -- Unaltered spoken/written text
    created_at TEXT NOT NULL
);

-- 2. ATTRIBUTE & FUNCTIONALITY DECONSTRUCTION (Label-Stripping Layer)
CREATE TABLE pure_attributes (
    attribute_id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id TEXT NOT NULL REFERENCES library_records(record_id),
    stripped_label TEXT NOT NULL,        -- Common/institutional name removed
    core_attribute TEXT NOT NULL,        -- What it actually is
    functional_mechanic TEXT NOT NULL,   -- How it operates in reality
    replication_steps TEXT NOT NULL      -- Exact steps for user to verify/build
);

-- 3. PHONETIC & ROOT CONCORDANCE
CREATE TABLE root_lexicon (
    term TEXT PRIMARY KEY,
    phonetic_key TEXT NOT NULL,          -- Exact sound mapping
    reverse_mapping TEXT,                -- Structural/inverse analysis
    primary_root_ref TEXT,               -- KJV / Strong's / Ancient root
    context_rule TEXT NOT NULL           -- Strict homophone/usage lock
);

-- 4. DETERMINISTIC FIREWALL LOG (1+1=2 / 1-1=0)
CREATE TABLE verification_ledger (
    check_id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id TEXT NOT NULL REFERENCES library_records(record_id),
    protects_innocence INTEGER CHECK (protects_innocence IN (0, 1)),
    is_replicable INTEGER CHECK (is_replicable IN (0, 1)),
    gate_status TEXT GENERATED ALWAYS AS (
        CASE WHEN protects_innocence = 1 AND is_replicable = 1 THEN 'RETAIN_1' ELSE 'PURGE_0' END
    ) STORED
);
