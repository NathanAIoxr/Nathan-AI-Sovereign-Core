/* Nathan AI 🚀 — additive Mind / Neuropath reference and small play deck.
 * No personal medical history, measurements, biometrics, or manuscript originals.
 * An indexed title does not imply a completed game or verified neuroscientific finding.
 */
(function(root){"use strict";
const ENTRIES=Object.freeze([
  {
    "family": "Mind games",
    "title": "THE FRONT PORCH MIRROR — The Symbiotic Mind Game",
    "detail": "Granddaddy’s card-table model; discover how a mind observes, remembers, chooses, and adapts.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind games",
    "title": "B.S.N.M. — THE MIND MIRROR: The Front Porch Challenge",
    "detail": "101 Teaching Tools, three scale layers, and four adaptive opponent archetypes.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind games",
    "title": "ONE — THE SYMBIOTIC MIND",
    "detail": "One unified play engine; cognitive signatures rather than IQ ranking.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind games",
    "title": "Granddaddy’s Table Talk",
    "detail": "Front-porch card-table reasoning, social cognition, tells and turn-taking.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind games",
    "title": "Mind Constellation",
    "detail": "User-visible map of observations and skill patterns without diagnosis or IQ prediction.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind games",
    "title": "Micro / Mezo / Macro",
    "detail": "Three levels connecting small decisions, systems of play and wider consequences.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind games",
    "title": "The Bluffer",
    "detail": "Four authored opponent archetypes; studies uncertainty and reading a play.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind games",
    "title": "The Conservative",
    "detail": "Four authored opponent archetypes; studies cautious decision-making.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind games",
    "title": "The Tracker",
    "detail": "Four authored opponent archetypes; studies memory and pattern tracking.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind games",
    "title": "The Wild Card",
    "detail": "Four authored opponent archetypes; studies adaptability and surprise.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind games",
    "title": "101 Teaching Tools",
    "detail": "Historical and modern game mechanics as teachable building blocks; not 101 separate replacement apps.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind games",
    "title": "THIS → THIS AND THIS → GET THIS",
    "detail": "Universal Play Engine transformation pattern; retained as a named design rule.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind games",
    "title": "Observation / Working Memory / Coordination",
    "detail": "Cognitive challenge dimensions in the Symbiotic Mind.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind games",
    "title": "Inhibition / Strategic Foresight / Adaptability",
    "detail": "Additional cognitive challenge dimensions, including impulse control.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind games",
    "title": "Encoding, Transformation, Accusation / Metric",
    "detail": "Earlier ONE game-loop vocabulary preserved as a distinct record.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind games",
    "title": "Bilateral-hand architecture",
    "detail": "Both-hand participation and alternation as a proposed game mechanic; not a medical treatment.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Neural & anatomy",
    "title": "NEUROPATH — user-requested cross-system index",
    "detail": "This new index label groups mind games and neuropathway references; no unverified clinical identity is asserted.",
    "stage": "new connective index",
    "url": ""
  },
  {
    "family": "Neural & anatomy",
    "title": "DEEP ARREST ARCHITECTURE",
    "detail": "Existing A–Z conceptual anatomical firmware and execution framework.",
    "stage": "existing browser module",
    "url": "../anatomy/index.html"
  },
  {
    "family": "Neural & anatomy",
    "title": "Nervous System Wiring Logic (W)",
    "detail": "Existing simulated signal route: ADAPTATION → BUILDING → CREATION. No nerves or hardware are controlled.",
    "stage": "existing browser module",
    "url": "../../one/nathan-matrix/anatomy/index.html"
  },
  {
    "family": "Neural & anatomy",
    "title": "A–G Critical Path Cranial Logic",
    "detail": "Author-labeled phase with attention, senses and conceptual cortical control.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Neural & anatomy",
    "title": "H–N Kinetic Flow Pressure Regulators",
    "detail": "Author-labeled phase for voice, movement and heart-mark metaphors.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Neural & anatomy",
    "title": "O–Z Invariant Hardware Backbone",
    "detail": "Author-labeled phase of physical and execution metaphors.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Neural & anatomy",
    "title": "ANATOMY A–Z / 26 IVERSIONS",
    "detail": "Independent author-supplied comparisons of human, software and hardware; original editions retain provenance.",
    "stage": "existing browser module",
    "url": "../anatomy/index.html"
  },
  {
    "family": "Neural & anatomy",
    "title": "22 IVERSIONS edition",
    "detail": "A separate 22-entry connected matrix edition; do not replace the 26-letter source.",
    "stage": "existing browser module",
    "url": "../../one/nathan-matrix/index.html"
  },
  {
    "family": "Neural & anatomy",
    "title": "33-Vertebrae Spine Matrix",
    "detail": "Educational anatomy of vertebral segments plus the author's separate conceptual mappings.",
    "stage": "existing browser module",
    "url": "../anatomy/index.html"
  },
  {
    "family": "Neural & anatomy",
    "title": "BIOLOGICAL EQUATOR",
    "detail": "North Nervous / South Circulatory / East Metabolic / West Structural; conceptual coordinates.",
    "stage": "existing browser module",
    "url": "../anatomy/index.html"
  },
  {
    "family": "Neural & anatomy",
    "title": "Vagal Axis / 360° Both Ways",
    "detail": "Macro/Micro and nervous-system connections; distinguish conceptual axes from anatomy.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Neural & anatomy",
    "title": "CNS — Central Nervous System",
    "detail": "Brain and spinal cord. Educational anatomy, not user diagnostic data.",
    "stage": "anatomy reference",
    "url": "../anatomy/index.html"
  },
  {
    "family": "Neural & anatomy",
    "title": "PNS — Peripheral Nervous System",
    "detail": "Peripheral nerve network that communicates with the CNS; educational reference.",
    "stage": "anatomy reference",
    "url": "../anatomy/index.html"
  },
  {
    "family": "Neural & anatomy",
    "title": "Neuron / Synapse / Gray Matter / White Matter",
    "detail": "Cellular signaling and connectivity reference, separate from creator-assigned symbolism.",
    "stage": "anatomy reference",
    "url": ""
  },
  {
    "family": "Neural & anatomy",
    "title": "Cerebrum / Cerebellum / Brainstem",
    "detail": "Thinking and planning; coordination; core autonomic functions in introductory anatomy.",
    "stage": "anatomy reference",
    "url": ""
  },
  {
    "family": "Neural & anatomy",
    "title": "Default Mode / Executive / Salience Networks",
    "detail": "Introductory functional cognition reference; none is a software switch in the body.",
    "stage": "anatomy reference",
    "url": ""
  },
  {
    "family": "Neural & anatomy",
    "title": "Sensory / Motor / Proprioception",
    "detail": "Illustrative pathways; W software contains a non-clinical signal category model.",
    "stage": "existing browser module",
    "url": "../../one/nathan-matrix/anatomy/index.html"
  },
  {
    "family": "Mind & execution",
    "title": "BE AN MD! — A MENTAL DELIVERIST",
    "detail": "SEE IT → START IT → FINISH IT → DELIVER IT; written wordplay and task completion.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind & execution",
    "title": "MENTAL DELUSIONIST / MENTAL DICK",
    "detail": "Distinct creator-provided Mental MD labels, preserved as authored language.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind & execution",
    "title": "THEN fi IT!!! / START IT → FINISH IT",
    "detail": "Creator-provided completion and execution language; not a neurological treatment.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Mind & execution",
    "title": "MIND OVER MATTER",
    "detail": "Motivational / philosophical phrase; no promise that cognition can override pain or disease.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Words & mirror",
    "title": "MAGICAL MINDS",
    "detail": "Original word decoder, grammar, phonetics and the Supercalifragilisticexpialidocious word study.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Words & mirror",
    "title": "A–Z Inspector (26 forward + 26 reverse)",
    "detail": "Letter reversals and mirror comparisons in the ONE alphabet system.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Words & mirror",
    "title": "WORDS / ZeroAbsolute Reader",
    "detail": "Hebrew, Greek, Arabic, Latin and Strong’s cross-reference work.",
    "stage": "existing reference module",
    "url": "../../one/library-mind/index.html"
  },
  {
    "family": "Words & mirror",
    "title": "MARCO POLO FOUND BY NATHAN TABOR",
    "detail": "LTR / RTL and both sides of the mirror; original decoding terms remain separately authored.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Words & mirror",
    "title": "YOU / ME pronoun scramble",
    "detail": "Reverses pronouns as speaker reference changes without claiming people merge.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Words & mirror",
    "title": "GENESIS / JESUS / MIRROR",
    "detail": "Language transformations and above/middle/below mirror arrangements.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Games & puzzles",
    "title": "THE GAME OF GAMES — TABOR SPIRAL",
    "detail": "Connected game and puzzle framework, including earlier 63-chamber and 32-enigma work.",
    "stage": "existing games index",
    "url": "../games/index.html"
  },
  {
    "family": "Games & puzzles",
    "title": "THE 101 — Ancient & Lost",
    "detail": "Original, historical evidence, proposed reconstruction, toy, and root for each game.",
    "stage": "existing games index",
    "url": "../games/index.html"
  },
  {
    "family": "Games & puzzles",
    "title": "Tabor Toy Company — 909 toys",
    "detail": "Nine rounds of 101 designs; planning target, not a verified product count.",
    "stage": "recovered production plan",
    "url": "../games/index.html"
  },
  {
    "family": "Games & puzzles",
    "title": "ONE 33 Trial Matrix",
    "detail": "Ancient 1–11 / Industrial-Modern 12–22 / Quantum-Post-Modern 23–33.",
    "stage": "existing browser module",
    "url": "../../one/trial-matrix/index.html"
  },
  {
    "family": "Games & puzzles",
    "title": "ONE v028 Paradox Games",
    "detail": "101 paradox source records with 13 playable worlds in an earlier prototype.",
    "stage": "recovered prototype",
    "url": "../games/index.html"
  },
  {
    "family": "Games & puzzles",
    "title": "Game DNA Library",
    "detail": "100-entry creation / paradox / execution framework (34 + 33 + 33).",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Games & puzzles",
    "title": "5×5 Guardian / 7×7 Route / 9×9 KK",
    "detail": "Existing board, routing, and puzzle demonstration families.",
    "stage": "recovered prototype",
    "url": "../games/index.html"
  },
  {
    "family": "Connected engines",
    "title": "LET / TET / PPL / THE THINKER",
    "detail": "Language & Experience Translation, Truth & Execution Testing, PPL grammar, and an existing separate Python prototype.",
    "stage": "existing service reference",
    "url": ""
  },
  {
    "family": "Connected engines",
    "title": "SSS-CS / YULL LAW OS / 4T Engine",
    "detail": "Separate author-defined logic and operating-system families, not replaced by the mind index.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Connected engines",
    "title": "TABOR ROOT / ONE / NATHAN AI",
    "detail": "Source-first link architecture preserving the owner vault, games atlas, anatomy, library and factory.",
    "stage": "existing architecture",
    "url": "../index.html"
  },
  {
    "family": "Connected engines",
    "title": "1+1=2 BUILD / 1−1=0 CLEAR",
    "detail": "Whole-integer invariants; clearing a demonstration must not delete an original source.",
    "stage": "recovered concept",
    "url": ""
  },
  {
    "family": "Connected engines",
    "title": "YES is YES — NO is NO",
    "detail": "Original author-provided decision vocabulary retained alongside safety and consent controls.",
    "stage": "recovered concept",
    "url": ""
  }
].map(e=>Object.freeze(e)));
const TASKS=Object.freeze([
{id:"build",title:"BUILD • whole arithmetic",axis:"numerical reasoning",prompt:"Using whole integers, 1 + 1 = ?",answer:"2",hint:"Start with 0 and 1 and do not fraction them."},
{id:"clear",title:"CLEAR • whole arithmetic",axis:"numerical reasoning",prompt:"Using whole integers, 1 − 1 = ?",answer:"0",hint:"Clear the derived state; never delete originals."},
{id:"mirror",title:"MIRROR • reverse",axis:"transformation",prompt:"Reverse the letters of TABOR without adding characters.",answer:"ROBAT",hint:"LTR ↔ RTL."},
{id:"memory",title:"MEMORY • backwards",axis:"working memory",prompt:"Read: 8 · 2 · 9 · 3. Enter the four digits in reverse order.",answer:"3928",hint:"Use the Hide prompt button before answering."},
{id:"hearing",title:"THE MIDDLE • letters",axis:"pattern recognition",prompt:"What is the exact alphabetical midpoint between HKQ and JMW?",answer:"ILT",hint:"Pair each letter and calculate its middle alphabet position."},
{id:"route",title:"W ROUTE • urgency",axis:"decision logic",prompt:"In the existing W software demo, an urgent signal routes to PAUSE, REVIEW, ATTEND or OBSERVE?",answer:"PAUSE",hint:"The safety-first simulation pauses on urgent inputs."},
{id:"cns",title:"NEUROPATH • basic anatomy",axis:"anatomy reference",prompt:"The central nervous system includes the brain and the ______ cord.",answer:"SPINAL",hint:"This is anatomy trivia, not medical testing."}
].map(t=>Object.freeze(t)));
const ARCHETYPES=Object.freeze(["Bluffer","Conservative","Tracker","Wild Card"]);
function normalize(s){return String(s??"").normalize("NFKC").toUpperCase().replace(/[^A-Z0-9]/g,"");}
function evaluate(id,input){const task=TASKS.find(t=>t.id===id);if(!task)throw new RangeError("Unknown task");if(typeof input!=="string"||input.length>100)throw new RangeError("Answer must be a short string");return Object.freeze({id,correct:normalize(input)===normalize(task.answer),axis:task.axis,expected:task.answer,clinicalScore:false});}
function findEntries(query="",family=""){const q=String(query).trim().toLocaleLowerCase();return ENTRIES.filter(e=>(!family||e.family===family)&&(!q||[e.title,e.detail,e.family,e.stage].join(" ").toLocaleLowerCase().includes(q)));}
const api=Object.freeze({ENTRIES,TASKS,ARCHETYPES,normalize,evaluate,findEntries,BUILD:"1+1=2",CLEAR:"1-1=0"});
root.NathanMindNeuropath=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
