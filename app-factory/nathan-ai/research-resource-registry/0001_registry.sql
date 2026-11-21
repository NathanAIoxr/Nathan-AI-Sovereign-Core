CREATE TABLE IF NOT EXISTS research_opportunities (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    sponsor TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'open', 'unsolved', 'claim_under_review', 'nomination_closed', 'completed', 'check_track'
    )),
    award_usd INTEGER CHECK (award_usd >= 0),
    award_basis TEXT CHECK (award_basis IN ('per_problem', 'per_award', 'per_scroll', 'pool')),
    deadline_local TEXT,
    deadline_timezone TEXT,
    status_note TEXT NOT NULL,
    official_url TEXT NOT NULL CHECK (official_url LIKE 'https://%'),
    checked_on TEXT NOT NULL,
    CHECK ((award_usd IS NULL) = (award_basis IS NULL)),
    CHECK (deadline_timezone IS NULL OR deadline_local IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS research_references (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('workspace', 'software', 'dataset', 'disclosure_policy', 'rules', 'source')),
    url TEXT NOT NULL CHECK (url LIKE 'https://%')
);

CREATE TABLE IF NOT EXISTS compute_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('cloud_cpu', 'physical_hpc', 'gpu', 'quantum', 'owner_device')),
    state TEXT NOT NULL CHECK (state IN ('verified', 'requires_registration')),
    capacity_note TEXT NOT NULL,
    workspace_id TEXT REFERENCES research_references(id)
);

CREATE TABLE IF NOT EXISTS research_assignments (
    id TEXT PRIMARY KEY,
    opportunity_id TEXT NOT NULL REFERENCES research_opportunities(id),
    compute_id TEXT NOT NULL REFERENCES compute_profiles(id),
    reference_id TEXT REFERENCES research_references(id),
    deliverable TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'planned' CHECK (state IN ('planned', 'in_progress', 'completed', 'cancelled')),
    UNIQUE (opportunity_id, compute_id, deliverable)
);

CREATE TABLE IF NOT EXISTS account_assets (
    source TEXT NOT NULL,
    external_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    display_name TEXT NOT NULL,
    observed_at TEXT NOT NULL,
    PRIMARY KEY (source, external_id)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS inventory_snapshots (
    source TEXT PRIMARY KEY,
    inventory_count INTEGER NOT NULL CHECK (inventory_count >= 0),
    observed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS compute_receipts (
    run_id TEXT PRIMARY KEY,
    compute_id TEXT NOT NULL REFERENCES compute_profiles(id),
    observed_at TEXT NOT NULL,
    terms INTEGER NOT NULL CHECK (terms > 0),
    operations INTEGER NOT NULL CHECK (operations > 0),
    checksum INTEGER NOT NULL,
    sha256 TEXT NOT NULL CHECK (length(sha256) = 64),
    replay_verified INTEGER NOT NULL CHECK (replay_verified IN (0, 1))
);

CREATE INDEX IF NOT EXISTS research_opportunities_deadline ON research_opportunities(status, deadline_local);
CREATE INDEX IF NOT EXISTS research_assignments_compute ON research_assignments(compute_id, state);
CREATE INDEX IF NOT EXISTS account_assets_kind ON account_assets(kind, display_name);

CREATE VIEW IF NOT EXISTS research_workboard AS
SELECT a.id, o.title AS opportunity, o.status AS opportunity_status,
       c.name AS compute, c.state AS compute_state, a.state AS assignment_state,
       a.deliverable, r.url AS resource_url
FROM research_assignments a
JOIN research_opportunities o ON o.id = a.opportunity_id
JOIN compute_profiles c ON c.id = a.compute_id
LEFT JOIN research_references r ON r.id = a.reference_id;
