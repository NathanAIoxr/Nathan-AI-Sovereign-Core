/** Source-separated, public-safe, additive graph of Nathan Tabor creative work. */
export const VERSION = "2026-11-18.1";
export const OWNER = "Nathan Tabor";
export const SCRIPTURE = "Isaiah 45:7 (KJV)";
export const CANON_NOTE = "Repository v2026-11-14 says SUPMALG; other references use SUPMALS. Preserve both for human review.";
export const NODES = [
  {
    "id": "nathan",
    "name": "Nathan Tabor",
    "kind": "creator",
    "summary": "Author and source owner"
  },
  {
    "id": "isaiah",
    "name": "Isaiah 45:7",
    "kind": "scriptural_anchor",
    "summary": "KJV light/darkness and peace/evil textual anchor; interpretation is separately labeled"
  },
  {
    "id": "yin-yang",
    "name": "Yin and Yang",
    "kind": "philosophical_comparison",
    "summary": "Comparative metaphor, not a claim of identical scriptural traditions"
  },
  {
    "id": "santa",
    "name": "Santa Claus",
    "kind": "persona",
    "summary": "Giving, imagination, joy, mercy; user-described creative mode"
  },
  {
    "id": "reaper",
    "name": "The Reaper",
    "kind": "persona",
    "summary": "Accountability, transformation, protective boundaries; symbolic role only"
  },
  {
    "id": "belsnickel",
    "name": "Belsnickel / Belznickle",
    "kind": "folklore_adapter",
    "summary": "Christmas folklore figure adapted in author artwork; distinct from historical folkloric claims"
  },
  {
    "id": "hh",
    "name": "HH Lifestyle",
    "kind": "original_concept",
    "summary": "Hell/Heaven and Heaven/Heaven motif; symbolic behavior and boundaries"
  },
  {
    "id": "white-dog",
    "name": "White Dog",
    "kind": "family_metaphor",
    "summary": "Positive and compassionate choices in the reported family teaching"
  },
  {
    "id": "black-dog",
    "name": "Black Dog",
    "kind": "family_metaphor",
    "summary": "Adversity, appetite, shadow, and reflection in the reported family teaching"
  },
  {
    "id": "buddy",
    "name": "Buddy Boo",
    "kind": "original_character",
    "summary": "German Shepherd mystery investigator; deductive protector"
  },
  {
    "id": "hunny",
    "name": "Hunny Zoo",
    "kind": "original_character",
    "summary": "German Shepherd mystery investigator; intuitive protector"
  },
  {
    "id": "hidden-kingdom",
    "name": "Hidden Kingdom",
    "kind": "creative_world",
    "summary": "Mystery-solving fantasy realm of Buddy Boo and Hunny Zoo"
  },
  {
    "id": "mas-spirit",
    "name": "MAS SPIRIT",
    "kind": "original_concept",
    "summary": "MORE SPIRIT and quartet family; source-specific canon"
  },
  {
    "id": "krampus",
    "name": "SANTA KRAMPUS",
    "kind": "original_character",
    "summary": "Twins of MAS member in source canon"
  },
  {
    "id": "supmark",
    "name": "SANTA SUPMARK",
    "kind": "original_character",
    "summary": "Twins of MAS member in source canon"
  },
  {
    "id": "glampus",
    "name": "SANTA GLAMPUS",
    "kind": "original_character",
    "summary": "Twins of SPIRIT member in source canon"
  },
  {
    "id": "supmalg",
    "name": "SANTA SUPMALG",
    "kind": "source_current_spelling",
    "summary": "Spelling in GitHub MAS SPIRIT canon v2026-11-14; reconcile with user if different"
  },
  {
    "id": "supmals",
    "name": "SANTA SUPMALS",
    "kind": "source_variant",
    "summary": "Earlier spelling preserved as a variant; not silently overwritten"
  },
  {
    "id": "dragon",
    "name": "Dragon",
    "kind": "symbolic_creature",
    "summary": "Power, transformation, and creative imagery"
  },
  {
    "id": "unicorn",
    "name": "Unicorn",
    "kind": "symbolic_creature",
    "summary": "Possibility, creative imagery, and discernment"
  },
  {
    "id": "dog-ai",
    "name": "DOG AI",
    "kind": "agent_role",
    "summary": "Diagnostic and repair planning role; not an autonomous person"
  },
  {
    "id": "reaper-ai",
    "name": "REAPER AI",
    "kind": "agent_role",
    "summary": "Non-destructive anomaly review and protection planning role"
  },
  {
    "id": "santa-ai",
    "name": "Santa Claus AI",
    "kind": "agent_role",
    "summary": "Creative and morale-support planning role"
  },
  {
    "id": "stacy-ai",
    "name": "Miss Stacy Clause AI",
    "kind": "agent_role",
    "summary": "Library and editorial planning role"
  },
  {
    "id": "nathan-ai",
    "name": "Nathan AI",
    "kind": "agent_role",
    "summary": "Orchestration and ownership boundary"
  },
  {
    "id": "act-ai",
    "name": "ACT AI",
    "kind": "agent_role",
    "summary": "Approved release planning role"
  },
  {
    "id": "will-ai",
    "name": "007 @Will AI",
    "kind": "agent_role",
    "summary": "Evidence and verification planning role"
  },
  {
    "id": "tabor-train",
    "name": "Tabor Train Operations",
    "kind": "existing_project",
    "summary": "RAM/OCTOPUS/CONVOY authorized task planning worker"
  },
  {
    "id": "santa-factory",
    "name": "Santa Claus Factory",
    "kind": "existing_project",
    "summary": "Existing creator browser-local Christmas concept studio"
  },
  {
    "id": "mas-archive",
    "name": "Nexus MAS SPIRIT Archive",
    "kind": "existing_project",
    "summary": "Preserved canon.json, source transcript, spelling and source annotations"
  },
  {
    "id": "library",
    "name": "Library of Tabor",
    "kind": "existing_project",
    "summary": "Creator library network; not automatically synchronized"
  }
];
export const EDGES = [
  {
    "from": "nathan",
    "to": "santa",
    "relation": "created_persona",
    "assertion": "creative_crosslink"
  },
  {
    "from": "nathan",
    "to": "reaper",
    "relation": "created_persona",
    "assertion": "creative_crosslink"
  },
  {
    "from": "isaiah",
    "to": "santa",
    "relation": "interpreted_with",
    "assertion": "creative_crosslink"
  },
  {
    "from": "isaiah",
    "to": "reaper",
    "relation": "interpreted_with",
    "assertion": "creative_crosslink"
  },
  {
    "from": "isaiah",
    "to": "yin-yang",
    "relation": "compared_to",
    "assertion": "creative_crosslink"
  },
  {
    "from": "santa",
    "to": "reaper",
    "relation": "contrasting_modes",
    "assertion": "creative_crosslink"
  },
  {
    "from": "reaper",
    "to": "belsnickel",
    "relation": "adaptation_association",
    "assertion": "creative_crosslink"
  },
  {
    "from": "santa",
    "to": "white-dog",
    "relation": "symbolic_association",
    "assertion": "creative_crosslink"
  },
  {
    "from": "reaper",
    "to": "black-dog",
    "relation": "symbolic_association",
    "assertion": "creative_crosslink"
  },
  {
    "from": "white-dog",
    "to": "black-dog",
    "relation": "complementary_family_metaphor",
    "assertion": "creative_crosslink"
  },
  {
    "from": "santa",
    "to": "hh",
    "relation": "illustrates",
    "assertion": "creative_crosslink"
  },
  {
    "from": "reaper",
    "to": "hh",
    "relation": "illustrates",
    "assertion": "creative_crosslink"
  },
  {
    "from": "buddy",
    "to": "hunny",
    "relation": "story_duo",
    "assertion": "creative_crosslink"
  },
  {
    "from": "buddy",
    "to": "hidden-kingdom",
    "relation": "character_in",
    "assertion": "creative_crosslink"
  },
  {
    "from": "hunny",
    "to": "hidden-kingdom",
    "relation": "character_in",
    "assertion": "creative_crosslink"
  },
  {
    "from": "buddy",
    "to": "dog-ai",
    "relation": "thematic_not_identity",
    "assertion": "creative_crosslink"
  },
  {
    "from": "hunny",
    "to": "white-dog",
    "relation": "thematic_not_identity",
    "assertion": "creative_crosslink"
  },
  {
    "from": "mas-spirit",
    "to": "krampus",
    "relation": "contains",
    "assertion": "creative_crosslink"
  },
  {
    "from": "mas-spirit",
    "to": "supmark",
    "relation": "contains",
    "assertion": "creative_crosslink"
  },
  {
    "from": "mas-spirit",
    "to": "glampus",
    "relation": "contains",
    "assertion": "creative_crosslink"
  },
  {
    "from": "mas-spirit",
    "to": "supmalg",
    "relation": "contains_repository_spelling",
    "assertion": "creative_crosslink"
  },
  {
    "from": "supmalg",
    "to": "supmals",
    "relation": "variant_conflict_needs_review",
    "assertion": "creative_crosslink"
  },
  {
    "from": "krampus",
    "to": "supmark",
    "relation": "twins_of_mas",
    "assertion": "creative_crosslink"
  },
  {
    "from": "glampus",
    "to": "supmalg",
    "relation": "twins_of_spirit_in_repository",
    "assertion": "creative_crosslink"
  },
  {
    "from": "mas-spirit",
    "to": "mas-archive",
    "relation": "preserved_by",
    "assertion": "creative_crosslink"
  },
  {
    "from": "santa",
    "to": "santa-ai",
    "relation": "software_role_inspired_by",
    "assertion": "creative_crosslink"
  },
  {
    "from": "reaper",
    "to": "reaper-ai",
    "relation": "software_role_inspired_by",
    "assertion": "creative_crosslink"
  },
  {
    "from": "santa-ai",
    "to": "tabor-train",
    "relation": "included_in",
    "assertion": "creative_crosslink"
  },
  {
    "from": "reaper-ai",
    "to": "tabor-train",
    "relation": "included_in",
    "assertion": "creative_crosslink"
  },
  {
    "from": "dog-ai",
    "to": "tabor-train",
    "relation": "included_in",
    "assertion": "creative_crosslink"
  },
  {
    "from": "stacy-ai",
    "to": "tabor-train",
    "relation": "included_in",
    "assertion": "creative_crosslink"
  },
  {
    "from": "nathan-ai",
    "to": "tabor-train",
    "relation": "orchestrates",
    "assertion": "creative_crosslink"
  },
  {
    "from": "act-ai",
    "to": "tabor-train",
    "relation": "included_in",
    "assertion": "creative_crosslink"
  },
  {
    "from": "will-ai",
    "to": "tabor-train",
    "relation": "included_in",
    "assertion": "creative_crosslink"
  },
  {
    "from": "santa-factory",
    "to": "santa",
    "relation": "thematically_related",
    "assertion": "creative_crosslink"
  },
  {
    "from": "unicorn",
    "to": "santa",
    "relation": "symbolic_association",
    "assertion": "creative_crosslink"
  },
  {
    "from": "dragon",
    "to": "reaper",
    "relation": "symbolic_association",
    "assertion": "creative_crosslink"
  },
  {
    "from": "library",
    "to": "mas-archive",
    "relation": "archive_crosslink",
    "assertion": "creative_crosslink"
  }
];
export const TASKS = [
  {
    "id": "PD-001",
    "title": "Reconcile MAS SPIRIT SUPMALG/SUPMALS original-source spelling",
    "lane": "library",
    "priority": 1,
    "status": "pending_review",
    "dispatch": false
  },
  {
    "id": "PD-002",
    "title": "Map Santa / Reaper source chronology with author-vs-assistant labels",
    "lane": "audit",
    "priority": 1,
    "status": "pending_review",
    "dispatch": false
  },
  {
    "id": "PD-003",
    "title": "Restore Buddy Boo and Hunny Zoo original character assets privately",
    "lane": "creative",
    "priority": 1,
    "status": "pending_review",
    "dispatch": false
  },
  {
    "id": "PD-004",
    "title": "Connect persona graph to existing Tabor Train roster via reviewed integration",
    "lane": "intake",
    "priority": 1,
    "status": "pending_review",
    "dispatch": false
  },
  {
    "id": "PD-005",
    "title": "Add read-only graph explorer and accessible mobile interface",
    "lane": "creative",
    "priority": 2,
    "status": "pending_review",
    "dispatch": false
  },
  {
    "id": "PD-006",
    "title": "Review Isaiah 45:7 KJV and Hebrew interpretation provenance",
    "lane": "language",
    "priority": 2,
    "status": "pending_review",
    "dispatch": false
  },
  {
    "id": "PD-007",
    "title": "Map white/black dog original family story into source-tagged archive",
    "lane": "library",
    "priority": 2,
    "status": "pending_review",
    "dispatch": false
  },
  {
    "id": "PD-008",
    "title": "Add MAS SPIRIT canonical relationship and revision crosswalk",
    "lane": "audit",
    "priority": 2,
    "status": "pending_review",
    "dispatch": false
  },
  {
    "id": "PD-009",
    "title": "Prepare Santa Factory integration without replacing existing studio",
    "lane": "delivery",
    "priority": 2,
    "status": "pending_review",
    "dispatch": false
  },
  {
    "id": "PD-010",
    "title": "Add test coverage for graph edges and owner authorship boundaries",
    "lane": "audit",
    "priority": 2,
    "status": "pending_review",
    "dispatch": false
  },
  {
    "id": "PD-011",
    "title": "Add authorized Cloudflare deployment health monitoring and receipts",
    "lane": "repair",
    "priority": 2,
    "status": "pending_review",
    "dispatch": false
  },
  {
    "id": "PD-012",
    "title": "Verify read-only links to Library of Tabor and other eligible products",
    "lane": "intake",
    "priority": 3,
    "status": "pending_review",
    "dispatch": false
  },
  {
    "id": "PD-013",
    "title": "Prepare exportable creator-owned graph archive and version migrations",
    "lane": "library",
    "priority": 3,
    "status": "pending_review",
    "dispatch": false
  },
  {
    "id": "PD-014",
    "title": "Review UI for no unsolicited faces and privacy-safe default content",
    "lane": "audit",
    "priority": 3,
    "status": "pending_review",
    "dispatch": false
  }
];
export const INTEGRATIONS = [
  {
    "id": "train",
    "name": "Tabor Train",
    "type": "github_path",
    "value": "app-factory/nathan-ai/operations/train-runtime",
    "mode": "reference_only"
  },
  {
    "id": "santa-factory",
    "name": "Santa Claus Factory",
    "type": "github_path",
    "value": "app-factory/sites/santa-claus-factory",
    "mode": "reference_only"
  },
  {
    "id": "mas-spirit",
    "name": "MAS SPIRIT source canon",
    "type": "github_path",
    "value": "creative-archive/nexus-mas-spirit/canon.json",
    "mode": "reference_only"
  },
  {
    "id": "library-of-tabor",
    "name": "Library of Tabor",
    "type": "cloudflare_script",
    "value": "library-of-tabor-imagination",
    "mode": "reference_only"
  },
  {
    "id": "fleet",
    "name": "Existing Nathan Fleet",
    "type": "cloudflare_script",
    "value": "nathan-ai-fleet",
    "mode": "reference_only"
  },
  {
    "id": "labs",
    "name": "Nathan Tabor Labs",
    "type": "cloudflare_script",
    "value": "nathan-tabor-labs",
    "mode": "reference_only"
  }
];
