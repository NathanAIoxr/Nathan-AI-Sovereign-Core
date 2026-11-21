CREATE TABLE IF NOT EXISTS blueprint_lessons (
 id INTEGER PRIMARY KEY,
 tier TEXT NOT NULL CHECK (tier IN ('Tier 1: Kids','Tier 2: Youth','Tier 3: Adults')),
 domain TEXT NOT NULL,
 item_a_label TEXT NOT NULL,
 item_b_label TEXT NOT NULL,
 item_c_label TEXT,
 clue_prompt TEXT NOT NULL,
 core_parts TEXT NOT NULL,
 operations TEXT NOT NULL,
 traits_attributes TEXT NOT NULL,
 scale_medium TEXT NOT NULL,
 input_output TEXT NOT NULL,
 flow_direction TEXT NOT NULL,
 modification_exemption TEXT NOT NULL,
 blind_spot_note TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_blueprint_tier ON blueprint_lessons(tier);
