(function(root,factory){"use strict";const catalog=factory();if(typeof module==="object"&&module.exports)module.exports=catalog;root.NathanChildrenCatalog=catalog;})(typeof window!=="undefined"?window:globalThis,function(){"use strict";
const SECTIONS=["Children’s Books & Fiction","Guardians & Protection","Games, Learning & Holidays","Community & Child Wellbeing"];
const raw=String.raw\`
Perfect Pumpkin Kids™|0|working app/prototype|World studio; 37 factions and 233 characters reported; “ALL KIDS ARE PERFECT.”
THE PUMPKIN FRUIT FAMILY — Can You Escape and Defeat THE FRUIT ABORTIONIST?|0|publisher story/game bible|Nineteen family groups, bees and pollination; transformative friendship; thirteen powers must each reach 100%.
THE LITTLE TOPLESS PUMPKIN|0|ongoing story universe|Children’s story world with Halloween, illustrations and game development.
THE BLACK WIDOWS AND WHITE WIDOWS|0|series / draft material|Thirteen-book intended series; Black Widows of White Willows and White Widows of Black Willows join colored W clans to protect innocence and the voiceless.
The Little Ants That Flew|0|story draft / library record|Independent D27 children’s story, insect biology and activity-book development.
HONEYSUCKLE LANE|0|planned series / original opening|Eight-book animal/family series: Rachel, Pudgy Bill, Mary, Star, Silver, Cupcake, Buddy and Hunny.
MY LIFE WITH MAMMALS|0|illustrated manuscript and title plan|Champ, Ace, Stewart/Stewie, Mr. Finn, Collyn, Shawna, Nathan and The Mammal Bond; companion Mammals: We’re All Mammals!
TABORTALES™ — Where the Bible and Nature Meet Up|0|story world / educational app concepts|Tater the Drummer Boy, Buddy German Shepherd, Moe garbanzo bean, Paulie, Chief Cocoa; Ecosystem Genesis, Division of the Red Matrix and Nativity.
THE FIVE AND THE EYE THAT BLINKED|0|planned eight-book children’s series|Five children including a wheelchair user; separate from the adult THE TWINKLING manuscripts.
CEDAR MANOR|0|eight-book outline|The Spark in the Dark; The Academy of False Suns; The Children of the Sun; The Forbidden Chronicles; The Kingdom of the Hollowed; The War of Eight Roots; The Fall of the False Sun; The Heart of the World.
THE OG FAMILY|0|twelve-book proposed foundation|DOG and CAT narrative, confronting deception and exploitation.
THE ACT CHRONICLES / CATS & DOGS|0|manuscript opening / family fantasy concept|ACT Chronicles, Accords, Tabors and Strategies; CATS / DOGS derived story architecture; original ACT opening independent.
THE DOOR THAT STAYED OPEN|0|short-book draft|Protecting innocence and creating space for unheard voices.
THE ROOM OF MANY VOICES|0|short-book draft|Protecting innocence and unheard voices.
BEE THE MIRACLE|0|creative story family|Poetry, sayings, kindness and nature-oriented children’s stories.
BUDDY THE RED-NOSED GERMAN SHEPHERD|0|source title / development|Family-focused title; full manuscript not audited.
BELZNICKLE — THE NAME BEHIND THE NAME|0|family fantasy / story concept|Belznickle/Pelznickle Knecht Ruprecht and equal twin Miss Belznickle; winter guardians with Buddy, Hunny, elves and creatures.
HANSEL AND GRETEL — THE SERIES|0|series concept|Named independent adaptation; source text not yet audited.
THE ADVENTURES OF PRICK & DICK|0|series concept|Named story family; manuscript status unverified.
THE INDOCTRINATION AND PROGRAMMING OF JOHN NATHAN TABOR|0|starter collection|Cartoon-linked collection of twelve supplied Saturday-morning entries plus OCCHIO; do not equate entries with completed books.
THE OG FAMILY / The Color of Truth: The Innocence Matrix|0|draft and proposed companion|Related eight-chapter draft and twelve-place DOG/OG narrative; link but do not collapse them.
THE RAINBOW MATTER CHRONICLES / THE ONE|1|thirty-book series bible / partial manuscript|Thirty proposed books: ten matter colors times three orders; three opening chapters for Book One, outlines for Books Two–Thirty.
THE BLACK TIME WIDOW|1|story bible and opening manuscript|Guardian-of-innocence saga; author’s origin account and fictional expansion clearly separated.
THE CHURCH OF INNOCENCE|1|framework / essays / artwork|Care, accountability, biblical study, James 1:27 and protecting children before reputations.
PROJECT INNOCENCE / INNOCENCE NODE SYSTEM|1|concept / module plans|Symbolic name/node-design tools, not an autonomous real-world safeguarding service.
ONE MATRIX — INNOCENCE PROTECTION|1|prototype|Symbolic playable rescue and restoration scenario; not real-world autonomous protection.
HEALERS & PROTECTORS|1|proposed cooperative game|Cooperative rescue/restoration; preserve Ropato/Otapor and Maters & Taters as earlier independent sources.
STORY BLUEPRINT — DEFEAT EVIL AT THE ROOT|1|prototype|Factory narrative generator for root-cause resolution, lasting protection and accountability.
SIN — SAVING INNOCENCE NOW|1|blueprint|Original authored acronym and connected innocence-protection plan.
BAM BAM’s and MAB MAB’s|1|author canonical character rule|Protectors of innocence within Rainbow Matter and the ONE creative system.
THE TABOR SECRET SOCIETY|1|fictional adult / general series|Thirteen-part mystery around institutions, innocence, disclosure and accountability; not automatically child-directed.
THE NOVELS OF TRUTH — THE THIRTEEN OPERAS OF HUMAN HISTORY|1|historical investigation / general|History investigation with attention to who suffered, resisted and was protected; not automatically child-directed.
TABOR TEXTING / GUARDRAIL AI|1|technical concept|Privacy and child-safety communication concepts; no verified operational safeguarding.
THE HOLIDAY TRIVIA FESTIVE OLYMPICS TOURNAMENT|2|tournament design|Twenty-six original holiday A–Z teams, four divisions; restored E Evergreen Emeralds.
THE SANTA REVOLUTION / MRS CLAUS VS MR CLAUS|2|story and game assets|North Pole / South Pole story and game work; original roster and source preserved independently.
THE SACRED ALPHABET LIST|2|alphabet canon|Twenty-six original titles plus separately preserved plural and numbered # versions.
THE NATIVITY A–Z ALPHABET|2|alphabet story layer|Independent twenty-six title KJV-inspired Nativity sequence; preserve unconventional source spellings.
THE LIVING WORD GAME|2|game package|Bible and educational question-bank, guide and interactive game package.
DAVID VS GOLIATH|2|educational story/game artifacts|Story bible, scripture and interactive research/learning challenges.
MAGICAL MINDS|2|book/app development|Word decoder, 34-letter Supercalifragilisticexpialidocious story and mirror A–Z language exercises.
WORDS / ZEROABSOLUTE READER|2|educational app family|Hebrew/Greek/Latin/Arabic, Strong’s, RTL/LTR reader and original word-analysis games.
365 JOY CIRCLE / HANDLING LIFE / CHRISTMAS TOY DRIVE|3|nonprofit plans / demonstrations|Year-round giving and toy drive concept; not evidence of an operational charity or donations.
BRIGHT TREE VILLAGE — EWOK LIVING|3|community / fiction concept|Family treehouse community and story-hut designs; third-party influences need rights review.
CHRISTMAS COMMUNITIES 24/7/365|3|community concept|Year-round family and community experience.
HEALERS & PROTECTORS — RESCUE & RESTORE|3|linked protection theme|Compassion, collaboration and restoration; no claim of automatic real-world intervention.
NEXUS — FAMILY TREE OF LIGHT|3|early story concept|Child-oriented ancestor, empathy and kindness storytelling, with Personal Spark, Echo, Travel, Skill, Dream and Recipe ideas.\`;
const projects=raw.trim().split("\n").map((line,i)=>{const [title,s,stage,scope]=line.split("|");return Object.freeze({id:"NT-CIP-"+String(i+1).padStart(3,"0"),title,section:SECTIONS[Number(s)],stage,scope,sourceStatus:"Recovered working catalog; full original source not embedded"})});
const familyGroups=["Pumpkin Carving Kids","Pumpkin Spice Kids","Pumpkin Guts Kids","Pumpkin Pie Kids","Pumpkin Seed Kids","Pumpkin Vine Kids","Pumpkin Flower Kids","Pumpkin Dirt Kids","Pumpkin Leaves Kids","Pumpkin Root Kids","Pumpkin Tendrils Kids","Pumpkin Node Kids","Pumpkin Skin Kids","Pumpkin STEM Kids","Pumpkin RIBS Kids","Pumpkin Flesh Kids","Pumpkin Pollen Donors Daddies","Pumpkin Fruit Makers Mommies","Pumpkin Pulp Cousins"];
const powers=["Garden Balance","Friendship & Trust","Ancient Knowledge","Pollination Power","Seed & New Life","Root & Soil Health","Vine & Family Unity","Energy & Growth","Protection & Safety","Wisdom & Understanding","Empathy & Compassion","Freedom & Forgiveness","Identity & Sovereignty"];
const authorLines=["PROTECT NO ONE BUT INNOCENCE","Nobody gets permission to destroy somebody else’s innocence.","ALL KIDS ARE PERFECT","BAM BAM’s and MAB MAB’s are the protectors of innocence.","Yes is Yes — No is No.","They were all coming together to fight for innocence and the voiceless","ALL KIDS ARE PERFECT. BE YOURSELF. EVERYBODY BELONGS."];
return Object.freeze({schema:"nathan-ai.children-innocence.public.v1",date:"2026-11-01",publicOnly:true,author:"Nathan Tabor",sourceNote:"User-authorized additive catalog from recovered project metadata; original private work is not published here.",counts:{projectFamilies:projects.length,privateAssetRecordsReported:598,distinctPrivateFilenamesReported:556},sections:SECTIONS,projects,authorLines,pumpkin:{groups:familyGroups,powers,unlockRule:"All 13 powers individually reach 100% (13 × 100 = 1300 percentage points)."},boundaries:["Public metadata is not a complete private manuscript archive.","Source status is not a claim of publication or deployment.","Private recovery JSON must be selected locally by its owner; it is never uploaded.","Adult/general stories are kept distinct from children’s reading.","The illustrated guardians are fiction; real-world child safety requires appropriate human action."]});});