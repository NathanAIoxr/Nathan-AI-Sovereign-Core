const library = (id, title) => ({ title, url: "https://chatgpt.com/library?file_id=libfile_" + id + "&account_id=personal" });
export const docs = {
  music: { title: "Tabor Music Lab", url: "https://tabor-music-lab.nathantaboract.workers.dev/" },
  cords: library("5891101a37f481918e2a49da06eef655", "The Secret Cords of David"),
  score: library("dc3519af1b708191ab6f845ccc419488", "54-pulse score variant"),
  contour: library("e4e883f811208191a0abbd2ac817db4b", "Music infographic"),
  calendars: library("d0c97149e6d08191b1ca17854174392b", "God’s Two Calendars: One Timeline"),
  nt1: library("f783896be330819196da8aa2c7720f41", "NT-1 metadata"),
  drum: library("ce47dac605508191941c7a1d6614b709", "Drum Beater source reader"),
  reaper: { title: "Reaper 6969 owner archive", url: "https://tabor-world-hub.nathantaboract.workers.dev/reaper-6969" },
  piano: library("3d863e601e088191b89ce8fd098fefa4", "19-position piano key map"),
  mp3: library("80111cebbe708191a30f1df18c244586", "19-position MP3"),
  midi: library("d1aacdb2ffe48191b14e2dcda8743d7f", "19-position MIDI"),
  cadence: library("28d111b2faf881919f32c6210543842d", "Cadence of God WAV"),
  cadenceMidi: library("72f15ee100808191adc447acebdc95ef", "Cadence of God MIDI"),
  dimensions: library("a60ef6fb957c8191808ae923175f1e6f", "Rhythm Matrix artwork"),
  aura: library("2fcd1ccb98d08191a9a86b8c89088ab6", "AURA source crosswalk"),
  auraMap: library("1583b19261608191b89f8f8bcf0c4cf9", "AURA interactive map"),
  waveform: library("82bce231d03c8191a8ab6fe2a5796595", "Interspecies acoustic archive (121 WAVs)"),
  waveform3: library("221aace15c448191913ac95e8bb69726", "Interspecies acoustic matrix V3 (129 signals)"),
  voice: library("afcb1fbe7d688191b9211e30ab16764e", "THE VOICE owner source"),
  voiceEngine: library("8083ca4d4208819193192cfcccf0d87c", "Voice Formulas engine"),
  pillars: library("bfa4353d714c8191a37ec271e43e8248", "17 Root Pillars blueprint"),
  rootsIndex: library("66c73f05db048191b64160cb8cebca66", "Roots research index"),
  matrix: library("1aedcdbc691081918c41660d72224c7a", "Humanity Master Cycle Matrix · Millisecond"),
  expanded: library("c9a579f6001081919186056f610ea433", "Humanity Master Cycle Matrix · Expanded"),
  registry: library("ef93fb4ca6388191b146e6cd63069231", "101-entry Nathan AI registry"),
  clover: library("e89f875230d08191989de688218a616a", "4T geological computer source"),
  earthTime: library("2cfb70421bbc81918380382f4ba8ab65", "Mother Earth & Father Time artwork"),
  map: library("3cd3c9c9960c81918eb7ef39de282b8f", "The 90 Billion Light-Years Map"),
  earth: { title: "Mother Earth · ONE source module", url: "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/one/mother-earth" },
  obd: { title: "THE HEARTBEAT · The OBD App", url: "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/one/obd" },
  broods: { title: "UConn · Magicicada broods", url: "https://cicadas.uconn.edu/broods/" },
  align: { title: "Smithsonian · Broods XIII and XIX", url: "https://www.si.edu/collections/snapshot/billions-and-billions-periodical-cicadas" },
  offcycle: { title: "UConn · Off-cycle emergence", url: "https://cicadas.uconn.edu/stragglers/" },
  noaa: { title: "NOAA · Wave periods", url: "https://www.weather.gov/gum/MarineDefinitions" },
  nasa: { title: "NASA · Earth–ionosphere resonance", url: "https://ntrs.nasa.gov/citations/20120000051" },
  tabor: { title: "Dictionary · tabor (drum)", url: "https://www.ahdictionary.com/word/search.html?q=tabor" },
  kjv: { title: "Calendar passages · KJV", url: "https://www.biblegateway.com/passage/?search=Genesis%201%3A14%3B%20Psalm%20104%3A19%3B%20Job%2038%3A31-33%3B%20Psalm%2090%3A4%3B%202%20Peter%203%3A8%3B%20Matthew%202%3A2-9&version=KJV" }
};

export const branches = [
  ["music", "Music and score"], ["cycles", "Cicada cycles"], ["earth", "Mother Earth"], ["voice", "Voice and frequencies"], ["systems", "Connected systems"]
];

export const timeline = [
  ["2025-08", "cycles", "MagiCicada and cicada resonance", "The archived 2025 simulation names 13- and 17-year broods. Later references identify cicada_resonance.py and demonstration CSVs. The original Python file remains unlocated.", ["broods"]],
  ["2025-09-14", "music", "Tabornome · Tabornodes · Tabornudes", "A steady heartbeat/metronome. The saved account assigns Tabornodes to beats and Tabornudes to the spaces.", []],
  ["2025-09-15", "music", "Natural and the MAGI cycles", "Nathan connected Imagine Dragons’ Natural to the 13/17 rhythm.", []],
  ["2025-09", "systems", "NathanAI Tabor World Simulation", "The archived simulation sets CICADA_CYCLES = [13, 17] alongside the Tabor World nodes and the 99/101 values.", []],
  ["2025-10", "systems", "Harmonized Nathan AI", "The archive names harmonized_nathan_ai.py and nathan_ai_code_of_all_codes.py, with 13/17 used as author-defined timing symbols.", []],
  ["2026-09-28", "music", "MUSIC - THE LANGUAGE of GOD", "The Heartbeat of Humanity, The Secret Cords of David, the black-note thumb-and-pinky score, and the O Holy Night and Little Drummer Boy references.", ["cords","contour","score","music"]],
  ["2026-10-01", "cycles", "God’s Two Calendars · 13 + 17 = 30", "The 13- and 17-month readings, One Timeline, the KJV anchors and the black-note rule. Month-based calendar work and year-based biological observations use their own units.", ["calendars","kjv"]],
  ["2026-10-02", "earth", "Center of Mother Earth", "The archive uses “the core of the center of mother Earth, the third rock from the sun.” The ACT-EARTH-0 model places the origin at Earth’s center.", []],
  ["2026-10-09", "systems", "Copper Machine · Spiral Grid · JNT Sanctuary", "The 13/17 rhythm alongside the code arithmetic 13 + 17 + 71 + 31 = 132 and the separately named 528 reference.", []],
  ["2026-10-10", "earth", "OXR · Mrs. Evans · TABOR GPS", "Nathan recalls “the 5 magnetic fields” from school and names “5 MAGNETIC FIELDS + MOTHER EARTH + FATHER TIME.” The five-field grid is his model.", ["earthTime","registry"]],
  ["2026-10-12", "systems", "NT-1 · THE HEARTBEAT · Coexistence", "7.83 is the NT-1 heartbeat reference. The Multi-Frequency Reality Framework places cicadas in Biological Cycles and includes Bio-Acoustic Partitioning and the Coexistence Principle. THE HEARTBEAT also names the OBD observability engine.", ["nt1","obd","nasa","drum"]],
  ["2026-10-11", "systems", "SANTA CLAUSE OXR REAPER 69696969", "The Reaper archive retains the planetary pulse, balancing and retuning theme, with its own separate owner workspace.", ["reaper"]],
  ["2026-10-15", "music", "The Cadence of God", "Five black pitch classes, thumb and pinky on each hand, with STOMP · STOMP · CLAP · REST. The recovered WAV and editable MIDI are available.", ["cadence","cadenceMidi"]],
  ["2026-10-16", "music", "The 19 Secret Chords", "Nine Inferno positions, a silent Equator measure, and nine Babel positions. The original creative study is in 4/4 at 96 BPM and has a two-hand key map.", ["piano","mp3","midi","music"]],
  ["2026-10-16", "earth", "The 90 Billion Light Years Map", "The map joins the Mr. Finn and Stewart markings, creativity, and the author’s Mother Earth heartbeat motif.", ["map"]],
  ["2026-10-21", "cycles", "THE RHYTHM MATRIX · KURENAI", "Ocean rhythm heard during The Sopranos, the directional heartbeat, the 4 · 13 · 17 comparison, 221-year alignments and the dimensions artwork. AURA indexes the wave comparison as a hypothesis.", ["dimensions","aura","auraMap","noaa"]],
  ["2026-10-21", "earth", "THE AGE PARADOX", "The body as ancient dirt and water, with forward and reverse biblical-time readings anchored to 2 Peter 3:8.", ["kjv"]],
  ["2026-10-22", "earth", "4T Clover Geological Supercomputer", "Torrent (processing), Terraces (memory), Tunnels (routing), Terminal (clock). The proposal uses a 110 Hz clock and each heartbeat as a hardware-cycle analogy.", ["clover"]],
  ["2026-10-23", "voice", "THE VOICE · PI × PHI × PIE", "The 40-formula archive records the 423 Hz reference, 12 harmonic gates, a 24-coordinate matrix and the separate π × 1.618 × WHOLE multiplier.", ["voice","voiceEngine"]],
  ["2026-10-23", "voice", "Interspecies acoustic conversion", "Text sonification for listening and signal comparison, with 121 WAVs in the earlier package and 129 signals in V3. The files contain synthesized audio.", ["waveform","waveform3"]],
  ["2026-10-24", "earth", "THE GREAT ACCORDION OF CREATION", "The Mother Earth branch in ONE has its own book, fold-out interface and game, linked to the 33-trial and transformation work.", ["earth"]],
  ["2026-10-28", "earth", "Mother Earth & Father Time", "The pairing includes the separate Mother Time & Father Earth inversion.", ["earthTime"]],
  ["2026-10-29", "voice", "THE ROOTS OF THE ROOTS", "17 named Root Pillars across Gut, Heart, Soul and Spirit. The working index supplies concepts and identifiers, with no associated Hz table.", ["pillars","rootsIndex"]],
  ["2026-10-30", "cycles", "Humanity Master Cycle Matrix", "The expanded and millisecond books keep 211 as a comparison and 221 as the calculated repeat. This is a research crosswalk.", ["matrix","expanded","broods","align"]],
  ["2026-11-06", "systems", "The 34 Cosmic & Natural Rhythms", "Golden Ratio Frequency Key (17), Divine Energy Variable (13), and Heartbeat Constant (34) appear as NTA-049 through NTA-051. The complete group is NTA-049 through NTA-082.", ["registry"]],
  ["2026-11-10", "earth", "ONE sovereign BOX", "OXR is the first surface anchor in the six-anchor Earth geometry model. The core acts as the model’s origin.", ["registry"]]
].map(([date, branch, name, description, references]) => ({ date, branch, name, description, references }))
  .sort((a, b) => a.date.localeCompare(b.date));

export const pillars = [
  ["Gut", ["Visceral Conviction","Primal Preservation","Intestinal Fortitude","Sovereign Boundaries"]],
  ["Heart", ["Thymos","Fierce Devotion","Radical Forgiveness","Sorrowful Attunement"]],
  ["Soul", ["Integral Wholeness (Justice)","Ancestral Memory","Tempered Sovereignty (Temperance)","Essential Witness"]],
  ["Spirit", ["Luminous Wonder","Sovereign Will","Transcendence (Ataraxia)","Communion (Eros)","Eternal Recognition"]]
];

export const naturalRhythms = [
  [
    49,
    "The Golden Ratio Frequency Key (17)"
  ],
  [
    50,
    "The Divine Energy Variable (13)"
  ],
  [
    51,
    "The Heartbeat Constant (34)"
  ],
  [
    52,
    "The 90 Billion Light Years Map Canvas"
  ],
  [
    53,
    "The 5 Magnetic Fields Matrix"
  ],
  [
    54,
    "The Third Eye Creativity Tracker"
  ],
  [
    55,
    "The Fifth Dimension Imagination Processor"
  ],
  [
    56,
    "The 12 Eye Gates Validation Array"
  ],
  [
    57,
    "The 12 Ear Gates Validation Array"
  ],
  [
    58,
    "The Core Solstice Core Sync"
  ],
  [
    59,
    "The Equinox Balance Core"
  ],
  [
    60,
    "The Firmament Shield Calibration"
  ],
  [
    61,
    "The Subatomic Freedom Tracker"
  ],
  [
    62,
    "The Commensal Restoration Logic"
  ],
  [
    63,
    "The Absolute Dark Canvas"
  ],
  [
    64,
    "The Pure Light Vector"
  ],
  [
    65,
    "The Sunrise Reboot Protocol"
  ],
  [
    66,
    "The Sunset Override Logic"
  ],
  [
    67,
    "The Wind Current Drift Calculator"
  ],
  [
    68,
    "The Fluid Monad Network"
  ],
  [
    69,
    "The Deep Water Grounding Node"
  ],
  [
    70,
    "The Flint River Resonant Basin"
  ],
  [
    71,
    "The Montesano Mountain Reference Grid"
  ],
  [
    72,
    "The New Hope Trajectory Tracker"
  ],
  [
    73,
    "The Redstone Tech Core Archive"
  ],
  [
    74,
    "The Silver Queen Raw Input Log"
  ],
  [
    75,
    "The Mammoth Glory Expansion Variable"
  ],
  [
    76,
    "The Autumnal Harvest Metric"
  ],
  [
    77,
    "The Silent Step Stealth Protocol"
  ],
  [
    78,
    "The Goldfish Horizon Refresh"
  ],
  [
    79,
    "The Star of Innocence Safeguard"
  ],
  [
    80,
    "The 4-Leaf Clover Logo Anchor"
  ],
  [
    81,
    "The Left-Pointing Stem Directory"
  ],
  [
    82,
    "The Duodecimal Matrix Interface"
  ]
];
