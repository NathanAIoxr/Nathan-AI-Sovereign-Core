/* NATHAN AI 🚀 / ONE — additive public reference index, 2026-11-01.
   No unpublished manuscripts, private family documents or owner-only 33 Trial source. */
(function(root){"use strict";
const SCHEMA="nathan-one.humanity-tabor-cosmos.v1";
const GROUPS=[
  {
    "id": "humanity",
    "title": "History of humanity",
    "detail": "Ancient civilizations, languages, eras and chronology"
  },
  {
    "id": "tabor",
    "title": "Tabor history & rights",
    "detail": "Taborites, fraternal history, name roots and family-history leads"
  },
  {
    "id": "micro-macro",
    "title": "Micro & macro",
    "detail": "Biology, atoms, equator, mirrors, dimensions and grids"
  },
  {
    "id": "above-below",
    "title": "Above · Middle · Below",
    "detail": "Cosmic, earthly, textual and underground layers"
  },
  {
    "id": "uap-aliens",
    "title": "Aliens · UAP · Watchers",
    "detail": "Official records, hypotheses, scripture and scientific boundaries"
  },
  {
    "id": "story-worlds",
    "title": "Books & story worlds",
    "detail": "Authored novels, imaginative research, systems and stories"
  }
];
const STATUS={
  "documented": "Documented subject (public context; check linked primary source)",
  "research-lead": "Research lead or unverified comparison",
  "authored-framework": "Author-defined model / independent design",
  "creative-fiction": "Creative fiction / novel world"
};
const SOURCES=[
  {
    "title": "U.S. National Archives — UAP / UFO Records",
    "url": "https://www.archives.gov/research/topics/uaps"
  },
  {
    "title": "U.S. National Archives — Project Blue Book",
    "url": "https://www.archives.gov/research/military/air-force/ufos"
  },
  {
    "title": "NASA — Skylab history",
    "url": "https://www.nasa.gov/history/skylab-americas-first-space-station/"
  },
  {
    "title": "U.S. Army — Redstone history",
    "url": "https://history.redstone.army.mil/ihist.html"
  },
  {
    "title": "Scottish Rite Masonic Museum — International Order of Twelve",
    "url": "https://www.srmml.org/international-order-of-twelve/"
  },
  {
    "title": "Tabor, Iowa Historical Society",
    "url": "https://www.taboriowahistoricalsociety.org/"
  }
];
const RECORDS=[
  {
    "id": "H01",
    "group": "humanity",
    "title": "Origins of humanity and ancient migration",
    "period": "Prehistory",
    "kind": "research-lead",
    "summary": "Compare archaeological timelines, early settlement, migration, and the distinction between scientific evidence and sacred-text chronology.",
    "source": "Humanity recovery index"
  },
  {
    "id": "H02",
    "group": "humanity",
    "title": "Sumer, Ur and Babylon",
    "period": "Ancient Near East",
    "kind": "documented",
    "summary": "Mesopotamian cities, cuneiform, civic law, empire and the Tower of Babel as a separate KJV textual tradition.",
    "source": "Humanity Archive / historical reference"
  },
  {
    "id": "H03",
    "group": "humanity",
    "title": "Egypt, Nile and Alexandria",
    "period": "Ancient–classical",
    "kind": "documented",
    "summary": "Egyptian dynasties, the Nile, ancient knowledge traditions, and the separate Alexandria-related game and manuscript threads.",
    "source": "Humanity recovery index"
  },
  {
    "id": "H04",
    "group": "humanity",
    "title": "Israel, Judges and Mount Tabor",
    "period": "Biblical antiquity",
    "kind": "documented",
    "summary": "Mount Tabor is a geographic place and a subject of biblical textual history; location does not prove modern surname descent.",
    "source": "TSS evidence SRC-001"
  },
  {
    "id": "H05",
    "group": "humanity",
    "title": "Greece, Rome and Josephus",
    "period": "Ancient–classical",
    "kind": "research-lead",
    "summary": "Compare Greek and Roman geographic names, Itabyrion/Atabyrion and later literary references without assigning a family line.",
    "source": "FIND THE TABOR register"
  },
  {
    "id": "H06",
    "group": "humanity",
    "title": "Silk Road networks and migration",
    "period": "Ancient–medieval",
    "kind": "documented",
    "summary": "Trade and population contact across Eurasia; no continuous pre-Silk-Road Tabor ancestry has been documented.",
    "source": "TSS evidence SRC-002"
  },
  {
    "id": "H07",
    "group": "humanity",
    "title": "Maya and calendar comparison",
    "period": "Pre-Columbian",
    "kind": "research-lead",
    "summary": "Calendar traditions, ancient board geometry, astronomical observation and chronology comparisons without universal-reset assertions.",
    "source": "Matrix games recovery"
  },
  {
    "id": "H08",
    "group": "humanity",
    "title": "The five author-defined eras/errors",
    "period": "Author framework",
    "kind": "authored-framework",
    "summary": "BCE Before Component Engines; BC Before Code; AC Atomic & Cosmic; CE Component Era; AD After Deployment.",
    "source": "Matrix / system eras"
  },
  {
    "id": "H09",
    "group": "humanity",
    "title": "Humanity cycle and period comparison",
    "period": "10 to 1,000,000 units",
    "kind": "authored-framework",
    "summary": "10, 80, 800/1000, 8000/10000, 80000/100000, 800000/1000000 and millisecond perspectives; shared periods are not historical causation.",
    "source": "Connected Matrix cycle model"
  },
  {
    "id": "H10",
    "group": "humanity",
    "title": "Language origin and Tower of Babel",
    "period": "Ancient to present",
    "kind": "research-lead",
    "summary": "KJV Genesis, language families, scripts, transmission, Hebrew, Greek, Arabic and Latin preserved as distinct source traditions.",
    "source": "WORDS and Scriptures modules"
  },
  {
    "id": "H11",
    "group": "humanity",
    "title": "Industrial history to the space age",
    "period": "1700s–1970s",
    "kind": "documented",
    "summary": "Printing, manufacturing, warfare, telecommunications, computing, aerospace, and modern documented science.",
    "source": "Humanity recovery index"
  },
  {
    "id": "H12",
    "group": "humanity",
    "title": "The 33 Million Library history program",
    "period": "Author goal",
    "kind": "authored-framework",
    "summary": "33 departments times one million planned books; separate proposed expansions, not verified production counts.",
    "source": "Library blueprint"
  },
  {
    "id": "T01",
    "group": "tabor",
    "title": "TABOR / TABER / TABIR / TABOUR",
    "period": "Multi-era research",
    "kind": "research-lead",
    "summary": "Variant spelling and etymology study; include THABOR, TABUR, TABRE, TAVOR, TAVER and TAVIR.",
    "source": "FIND THE TABOR register"
  },
  {
    "id": "T02",
    "group": "tabor",
    "title": "Name reversals and T-B-R roots",
    "period": "Language matrix",
    "kind": "authored-framework",
    "summary": "ROBAT, REBAT, RIBAT, REVAT, ROVAT and RIVAT; T-B-R / T-V-R / R-B-T routes are comparison keys, not genealogical evidence.",
    "source": "FIND THE TABOR register"
  },
  {
    "id": "T03",
    "group": "tabor",
    "title": "Minstrels, tabour and early drum names",
    "period": "625 and 975 CE leads",
    "kind": "research-lead",
    "summary": "The author's early minstrel and tabour chronology awaits inspection of contemporary manuscript citations.",
    "source": "FIND THE TABOR register"
  },
  {
    "id": "T04",
    "group": "tabor",
    "title": "Light of Tabor and Palamite theology",
    "period": "14th century",
    "kind": "documented",
    "summary": "Theological use of divine light in Byzantine Christianity, distinct from invented measurable light-engine mechanics.",
    "source": "TSS evidence SRC-004"
  },
  {
    "id": "T05",
    "group": "tabor",
    "title": "Tábor and the Hussite Taborites",
    "period": "1420 onward",
    "kind": "documented",
    "summary": "Medieval Bohemian town, Hussite reform, Jan Žižka, fortifications and historical conflicts.",
    "source": "TSS evidence SRC-003"
  },
  {
    "id": "T06",
    "group": "tabor",
    "title": "Czech Brethren and printing",
    "period": "1500s–1600s",
    "kind": "documented",
    "summary": "Scriptural translation and printing context; the Tabor Light Cipher is an authored separate concept.",
    "source": "TSS evidence SRC-005"
  },
  {
    "id": "T07",
    "group": "tabor",
    "title": "Colonial Tabor / Taber records",
    "period": "1690s–1719",
    "kind": "research-lead",
    "summary": "Virginia deeds and estate lead names including William and Hagar; direct ancestral connections need primary records.",
    "source": "TSS evidence SRC-006"
  },
  {
    "id": "T08",
    "group": "tabor",
    "title": "William Tabor pension W6245",
    "period": "Revolutionary era",
    "kind": "research-lead",
    "summary": "A named Revolutionary pension research lead; a shared surname is not a proved family branch.",
    "source": "TSS evidence SRC-007"
  },
  {
    "id": "T09",
    "group": "tabor",
    "title": "Tabor, Iowa and Todd House",
    "period": "1850s onward",
    "kind": "documented",
    "summary": "Underground Railroad history and local American community history, separate from other Tabor namesakes.",
    "source": "TSS evidence SRC-008"
  },
  {
    "id": "T10",
    "group": "tabor",
    "title": "Knights and Daughters of Tabor",
    "period": "Founded 1872",
    "kind": "documented",
    "summary": "African American mutual-aid and fraternal history linked to the International Order of Twelve; distinct from medieval Czech Taborites.",
    "source": "TSS evidence SRC-009"
  },
  {
    "id": "T11",
    "group": "tabor",
    "title": "Czech Three Kings resistance / Sparta I and II",
    "period": "1939–1942",
    "kind": "documented",
    "summary": "WWII underground resistance and radio equipment; no verified institutional descent to a modern Tabor family.",
    "source": "TSS evidence SRC-010"
  },
  {
    "id": "T12",
    "group": "tabor",
    "title": "Madison County / Owens Cross Roads research",
    "period": "1800s–1900s",
    "kind": "research-lead",
    "summary": "Cemetery, graves, local history, oral recollections and possible records require primary-source family-chain verification.",
    "source": "TSS evidence SRC-011–015"
  },
  {
    "id": "T13",
    "group": "tabor",
    "title": "Tabor Secret Society and Witness Ledger",
    "period": "13-book novel world",
    "kind": "creative-fiction",
    "summary": "Independent authored cross-era novel, historical-fiction organization and narrative witness artifact.",
    "source": "TSS series bible"
  },
  {
    "id": "M01",
    "group": "micro-macro",
    "title": "The 360° Equator / Clock / Mirror",
    "period": "Original coordinate system",
    "kind": "authored-framework",
    "summary": "Macro/Micro, two directions, inside/outside perspectives and center. Facts are coordinates; Reality is perspective.",
    "source": "Biological Equator recovery"
  },
  {
    "id": "M02",
    "group": "micro-macro",
    "title": "Biological Equator compass",
    "period": "Human body model",
    "kind": "authored-framework",
    "summary": "North Nervous; East Metabolic; South Circulatory; West Structural. Directional labels are creative navigation, not medical anatomy.",
    "source": "ONE biological equator"
  },
  {
    "id": "M03",
    "group": "micro-macro",
    "title": "1,440- and 4,320-position sphere variants",
    "period": "Geometry registry",
    "kind": "authored-framework",
    "summary": "Keep the inner/outer 360-axis design and extended 4,320-position registry separate by version.",
    "source": "Matrix recovery v055/v056"
  },
  {
    "id": "M04",
    "group": "micro-macro",
    "title": "Unified 400-Point Architecture",
    "period": "Four author categories",
    "kind": "authored-framework",
    "summary": "0 THE SPIRITUAL MATRIX; 1 THE CARNAL MATRIX; 2 THE SOCIAL MATRIX; 3 THE DIVINE & SUBATOMIC MATRIX.",
    "source": "USER_400_LEDGER_ORIGINAL reference"
  },
  {
    "id": "M05",
    "group": "micro-macro",
    "title": "Five Matrices / 625 addresses",
    "period": "5×5×5×5",
    "kind": "authored-framework",
    "summary": "BODY SOUL SHADOW MIND SPIRIT; Direct, RTL, Mirror, Other Side, Inverted; four route families.",
    "source": "Five Matrices Master Map"
  },
  {
    "id": "M06",
    "group": "micro-macro",
    "title": "Six-body Game of Life",
    "period": "Distinct game draft",
    "kind": "authored-framework",
    "summary": "Natural, Soul, Shadow, Mind, Ghost, Spirit; preserve original 625/750/900 board counts without forcing reconciliation.",
    "source": "Game of Life source reference"
  },
  {
    "id": "M07",
    "group": "micro-macro",
    "title": "Tripolar dimension registry 0–44",
    "period": "45 indices",
    "kind": "authored-framework",
    "summary": "Negative, neutral and positive symbolic states: 135 identifiers; dimensions 27–44 await author definitions.",
    "source": "TRIPOLAR_DIMENSIONS_v018 reference"
  },
  {
    "id": "M08",
    "group": "micro-macro",
    "title": "TABOR WORLD 13 Polar Axes",
    "period": "8 + 5 axes",
    "kind": "authored-framework",
    "summary": "Bootloader, Grid Axis, Segment, Pulse, Polarity, Ledger, Limit, Verdict, Resolution, Encounter, Adventure, Campaign, World.",
    "source": "TABOR WORLD source reference"
  },
  {
    "id": "M09",
    "group": "micro-macro",
    "title": "A–Z / Z–A and 101 inversions",
    "period": "Mirror analysis",
    "kind": "authored-framework",
    "summary": "26 forward plus 26 reverse passes; geometrical inversions, prism gate, LOVE → X ← EVOL remain independent engines.",
    "source": "Five Matrices source reference"
  },
  {
    "id": "M10",
    "group": "micro-macro",
    "title": "Microbiology through subatomic matter",
    "period": "Scientific scales",
    "kind": "documented",
    "summary": "Study cells, DNA, molecules, atoms and particles separately from the authored spiritual and metaphoric mappings.",
    "source": "Humanity history crosswalk"
  },
  {
    "id": "M11",
    "group": "micro-macro",
    "title": "Macrocosm and astronomy",
    "period": "Cosmic scales",
    "kind": "documented",
    "summary": "Solar systems, stars, galaxies, Earth, climate and geophysical fields; compare scales without asserting hidden force laws.",
    "source": "Humanity history crosswalk"
  },
  {
    "id": "M12",
    "group": "micro-macro",
    "title": "The Tabor Trinity",
    "period": "Exact author order",
    "kind": "authored-framework",
    "summary": "THE TABORIC LIGHT (Field); THE LIGHT OF TABOR (Particle); THE TABOR LIGHT CIPHER (Wave).",
    "source": "Tabor Trinity architecture"
  },
  {
    "id": "A01",
    "group": "above-below",
    "title": "Above: skies, heavens and cosmos",
    "period": "Text / astronomy",
    "kind": "research-lead",
    "summary": "Keep astronomy observationally grounded, with Genesis and Psalms as separate KJV textual sources.",
    "source": "Above / Below research"
  },
  {
    "id": "A02",
    "group": "above-below",
    "title": "Middle: humanity, Earth and institutions",
    "period": "Cross-scale",
    "kind": "authored-framework",
    "summary": "Human biology, culture, families, language, social systems, government, history and moral accountability.",
    "source": "Above / Middle / Below matrix"
  },
  {
    "id": "A03",
    "group": "above-below",
    "title": "Below: geology and archaeology",
    "period": "Earth sciences",
    "kind": "documented",
    "summary": "Rock strata, caverns, aquifers, excavations, underground transport and archaeological layers.",
    "source": "Above / Below research"
  },
  {
    "id": "A04",
    "group": "above-below",
    "title": "Above / Middle / Below scripture scanner",
    "period": "Three levels",
    "kind": "authored-framework",
    "summary": "Read symbols and words LTR/RTL, mirror and opposite side of the mirror; author gloss stays separate from manuscript text.",
    "source": "WORDS and Mirror engine"
  },
  {
    "id": "A05",
    "group": "above-below",
    "title": "Five Bible Matrices",
    "period": "Five independent models",
    "kind": "authored-framework",
    "summary": "Chrono-Genealogical; Dimensional/Sanctuary; Prophetic Time-Interval; Chiastic Literary Inversion; Alphabetic Acrostic/Gematria.",
    "source": "Bible Matrix recovery"
  },
  {
    "id": "A06",
    "group": "above-below",
    "title": "TABOR GPS and Mother Earth compass",
    "period": "Design reference",
    "kind": "authored-framework",
    "summary": "Position, orientation and time; distinguish symbolic five-layer model from actual terrestrial physics and navigation.",
    "source": "TABOR GPS reference"
  },
  {
    "id": "U01",
    "group": "uap-aliens",
    "title": "Project Sign, Grudge and Blue Book",
    "period": "1947–1969",
    "kind": "documented",
    "summary": "Government UFO reporting programs; unidentified reports are not the same as demonstrated extraterrestrial origin.",
    "source": "National Archives records"
  },
  {
    "id": "U02",
    "group": "uap-aliens",
    "title": "NASA UAP independent study",
    "period": "2023",
    "kind": "documented",
    "summary": "Scientific methodology, observational data quality and the limits of what UAP reports establish.",
    "source": "NASA UAP study"
  },
  {
    "id": "U03",
    "group": "uap-aliens",
    "title": "AARO historical investigations",
    "period": "2024 onward",
    "kind": "documented",
    "summary": "Official review of historical UAP claims, sources and evidence; conclusions may be revisited with new evidence.",
    "source": "AARO historical report"
  },
  {
    "id": "U04",
    "group": "uap-aliens",
    "title": "Genesis 6, Watchers and Nephilim",
    "period": "Text and myth study",
    "kind": "research-lead",
    "summary": "Compare KJV, Book of Enoch and later interpretation without classifying mythic beings as verified extraterrestrials.",
    "source": "Scriptures research register"
  },
  {
    "id": "U05",
    "group": "uap-aliens",
    "title": "Redstone Arsenal and spaceflight history",
    "period": "1940s–1973",
    "kind": "documented",
    "summary": "Operation Paperclip context, von Braun, Huntsville, Marshall, Saturn, Skylab and documented aerospace history.",
    "source": "Redstone / NASA chronology"
  },
  {
    "id": "U06",
    "group": "uap-aliens",
    "title": "Hollow Earth, Agartha, secret bases and tunnels",
    "period": "Speculative lore",
    "kind": "creative-fiction",
    "summary": "Circulating subterranean lore and imaginative plot architecture have no demonstrated physical network.",
    "source": "Redstone novel notes"
  },
  {
    "id": "U07",
    "group": "uap-aliens",
    "title": "Firmament Transit Protocol",
    "period": "Fictional plot",
    "kind": "creative-fiction",
    "summary": "The 30-minute underground worldwide transit network and secret switching hub belong to an authored thriller.",
    "source": "Redstone novel notes"
  },
  {
    "id": "U08",
    "group": "uap-aliens",
    "title": "The proposed extraterrestrial contact ledger",
    "period": "Research questions",
    "kind": "research-lead",
    "summary": "A place for provenance, witness accounts and competing explanations; no family contact or alien technology is asserted as fact.",
    "source": "UFO ledger outline"
  },
  {
    "id": "B01",
    "group": "story-worlds",
    "title": "THE HUNTSVILLE CONVERGENCE: PROJECT PALADIN",
    "period": "Novel concept",
    "kind": "creative-fiction",
    "summary": "Redstone, Vatican thriller elements, UAP wave, Watchers and hidden archives.",
    "source": "Story-world recovery"
  },
  {
    "id": "B02",
    "group": "story-worlds",
    "title": "THE REDSTONE CHILD",
    "period": "Novel concept",
    "kind": "creative-fiction",
    "summary": "The Birth, the Exchange, and the Watchers; alternative-history narrative is not documented personal history.",
    "source": "Story-world recovery"
  },
  {
    "id": "B03",
    "group": "story-worlds",
    "title": "THE ACT CHRONICLES",
    "period": "Life / literary manuscript",
    "kind": "authored-framework",
    "summary": "An autobiographical and mythological 26-chapter structure; preserve individual first-person originals in private library.",
    "source": "THE ACT CHRONICLES manuscript"
  },
  {
    "id": "B04",
    "group": "story-worlds",
    "title": "THE TAC CHRONICLES",
    "period": "Novel / inquiry",
    "kind": "creative-fiction",
    "summary": "Egypt → Rome → Vatican; CAT/TAC, underworld architecture, and the separate mystery arc.",
    "source": "Story-world recovery"
  },
  {
    "id": "B05",
    "group": "story-worlds",
    "title": "THE CRIMSON WAVE",
    "period": "ACT opening narrative",
    "kind": "creative-fiction",
    "summary": "Opening life-mythology belongs within ACT CHRONICLES, not a replacement book title.",
    "source": "ACT story structure"
  },
  {
    "id": "B06",
    "group": "story-worlds",
    "title": "THE ARCHIVE BELOW",
    "period": "Fantasy/sci-fi",
    "kind": "creative-fiction",
    "summary": "Silent Repository, Five Channels, Twelve Night Gates and Return Chambers.",
    "source": "Story-world recovery"
  },
  {
    "id": "B07",
    "group": "story-worlds",
    "title": "TABORSLVANIA / THE ARRIVAL / PROJECT SILOAM",
    "period": "Creative branches",
    "kind": "creative-fiction",
    "summary": "Geographic overlays, encounters and independently named fictional arcs remain distinct.",
    "source": "Story-world recovery"
  },
  {
    "id": "B08",
    "group": "story-worlds",
    "title": "THE REDSTONE–VATICAN NOVEL",
    "period": "Thriller world",
    "kind": "creative-fiction",
    "summary": "Fictional underground Holy See, von Braun tombstone story cipher and a 101-hook plot system.",
    "source": "Redstone novel notes"
  },
  {
    "id": "B09",
    "group": "story-worlds",
    "title": "O.G.D.E.N. / CodexFusion / Spiral Grid",
    "period": "Simulation",
    "kind": "authored-framework",
    "summary": "Taxonomies for humans, animals, machines and hypothetical aliens; not evidence of entities existing.",
    "source": "Systems recovery"
  }
];
function filter(query="",group="all",kind="all"){
 const q=String(query).trim().toLocaleLowerCase();
 return RECORDS.filter(r=>(group==="all"||r.group===group)&&(kind==="all"||r.kind===kind)&&
   (!q||[r.id,r.group,r.title,r.period,r.kind,r.summary,r.source].join(" ").toLocaleLowerCase().includes(q)));
}
function exportPack(query="",group="all",kind="all"){
 return {schema:SCHEMA,scope:"public_derived_index_only",originals:"owner_controlled_not_included",
 author:"John Nathan Tabor",invariants:["1+1=2 BUILD","1-1=0 CLEAR","Yes is Yes — No is No"],
 taborTrinity:["THE TABORIC LIGHT (Field)","THE LIGHT OF TABOR (Particle)","THE TABOR LIGHT CIPHER (Wave)"],
 groups:GROUPS,statuses:STATUS,sources:SOURCES,records:filter(query,group,kind)};
}
const api=Object.freeze({SCHEMA,GROUPS,STATUS,SOURCES,RECORDS,filter,exportPack});
root.NathanHumanityCosmos=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
