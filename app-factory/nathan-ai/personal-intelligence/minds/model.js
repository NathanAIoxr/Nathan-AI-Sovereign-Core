/* NATHAN AI — personal intelligence mind atlas. Additive metadata and pure local simulations.
   The 126B namespace comes from the existing Omni God engine; do not allocate 126B agents. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanMindAtlas=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const SCHEMA='nathan.personal-intelligence.mind-atlas.v1';
const TIERS=Object.freeze([
{id:'0.0',name:'CERO',meaning:'Original source intake, exact bytes or unchanged author text',status:'source-preserved',allowed:'Import, hash, cite, index',forbidden:'Change or erase original input'},
{id:'1.0',name:'UNO',meaning:'Structured annotations, classification candidates and reviewed evidence',status:'review-required',allowed:'Assign user-selected Dewey / Library of Congress / Duo / custom decimal labels',forbidden:'Call a guessed shelf code independently verified'},
{id:'2.0',name:'DOS',meaning:'Proposed cross-links and derived synthesis, always traceable to originals',status:'candidate-links',allowed:'Suggest relationships and draft derived work',forbidden:'Overwrite sources or turn resemblance into proof'}
]);
const PIPELINE=Object.freeze([
{id:'archivist',name:'Archivist',role:'Intake and preservation',read:'Original source file or note',write:'New reference metadata; no original edits',tier:'0.0'},
{id:'leonardo',name:'Leonardo (Turtle orchestration)',role:'Routes approved tasks, sequences roles and applies stop/approval rules',read:'Unchanged source metadata',write:'Task plan only',tier:'0.0'},
{id:'raphael',name:'Raphael (Turtle validation)',role:'Flags unsupported interpretations and contradictory claims; does not delete source',read:'Candidate annotations and supporting evidence',write:'Review flags and citations',tier:'1.0'},
{id:'donatello',name:'Donatello (Turtle classification)',role:'Organizes Cero/Uno/Dos and catalog-code proposals',read:'Source IDs and approved tags',write:'Classifications as separate records',tier:'1.0'},
{id:'michelangelo',name:'Michelangelo (Turtle cross-reference)',role:'Finds lateral and phonetic connections, marked proposed until checked',read:'Indexed source summaries',write:'Proposed typed relationship edges',tier:'2.0'},
{id:'davinci',name:'Leonardo da Vinci (Master architect)',role:'Synthesizes approved material across science, mechanical design, language and geometry',read:'Source and derived records with provenance',write:'Derived blueprint/draft only',tier:'2.0'}
]);
const RENAISSANCE=Object.freeze([
{name:'Leonardo',role:'Mirror / Navel',method:'Horizontal, word, vertical and double reversal'},
{name:'Raphael',role:'Harmonic Shift / Sphere',method:'Reversible shifts with keys 3, 7 and 12'},
{name:'Donatello',role:'Ground / Base',method:'Reversible indexed shifts with moduli 4, 9 and 16'},
{name:'Michelangelo',role:'Tension',method:'Odd-index ROT13'}
]);
const LENSES=Object.freeze([
{id:'jesus',name:'Jesus — textual/historical lens',scope:'Read and compare teachings and narratives using named text, translation and historical context',status:'historical-and-religious-sources',note:'Not the literal mind, consciousness, voice or endorsement of Jesus'},
{id:'buddha',name:'Buddha — textual/philosophical lens',scope:'Read and compare traditions, teachings, versions and interpretive differences',status:'historical-and-religious-sources',note:'Not the literal mind or consciousness of the Buddha'},
{id:'islam',name:'Islamic intellectual traditions',scope:'Explore named scholars, texts and traditions rather than representing a religion as a single person',status:'tradition-not-person',note:'ISLAM AI remains a separate creator-defined persona token in the original pantheon'},
{id:'davinci',name:'Leonardo da Vinci — notebook and invention lens',scope:'Art, engineering, geometry, historical notebook methods',status:'historical-sources',note:'The user-authored four-master ciphers are separate modern reconstructions'},
{id:'cleopatra',name:'Cleopatra — historical governance lens',scope:'Examine ancient political sources and later representations',status:'historical-sources',note:'Use documented sources, not an invented literal consciousness'},
{id:'myth',name:'Eve / Lilith — comparative literary lens',scope:'Distinguish textual versions, myth, commentary and fictional work',status:'myth-and-religious-literature',note:'Keep separate from empirical historical records'}
]);
const MODULES=Object.freeze([
{id:'omni',name:'OMNI GOD — 126 billion virtual addresses',group:'Omni',href:'../../omni-god/index.html',origin:'omni-god/engine.js',status:'working-browser-model'},
{id:'omni-map',name:'REAPER × OMNI GOD × AI Provenance Mapping',group:'Omni',href:'../../ai-mapping/index.html',origin:'ai-mapping/records.json',status:'working-browser-index'},
{id:'complete',name:'Complete Mind / Vitruvian and Code of Codes',group:'Minds',href:'../../complete-mind/index.html',origin:'complete-mind/records.json',status:'working-browser-model'},
{id:'quad',name:'Quad-Axis Four Masters',group:'Minds',href:'../../complete-mind/quad-axis/index.html',origin:'complete-mind/quad-axis/engine.js',status:'working-browser-cipher'},
{id:'absolute',name:'Absolute Intelligence — 54 module registry',group:'Minds',href:'../../absolute-intelligence/index.html',origin:'absolute-intelligence/registry.json',status:'working-browser-index'},
{id:'neuro',name:'Mind · Neuropath · Game Matrix',group:'Minds',href:'../../mind-neuropath/index.html',origin:'mind-neuropath/README.md',status:'working-browser-index'},
{id:'consci',name:'consciouness — owner-controlled digital self model',group:'Minds',href:'../../consciouness/index.html',origin:'consciouness/README.md',status:'local-model'},
{id:'worker',name:'Nathan AI Node Runtime / 732m SUPERNODES',group:'Infrastructure',href:'../../node-runtime/index.html',origin:'node-runtime',status:'logical-addresses'},
{id:'one',name:'ONE — The Last App',group:'Infrastructure',href:'../../../one/index.html',origin:'one',status:'working-browser-app'},
{id:'vault',name:'Universal Creator Vault',group:'Archive',href:'../../../vault.html',origin:'vault.js',status:'working-local-vault'},
{id:'master',name:'ONE Master Library',group:'Archive',href:'../../../one/library/index.html',origin:'one/library',status:'working-browser-import'},
{id:'library-mind',name:'Library Mind — books and language',group:'Archive',href:'../../../one/library-mind/index.html',origin:'one/library-mind',status:'working-browser-index'},
{id:'deep',name:'Deep Archive — binary and source',group:'Archive',href:'../../deep-archive/index.html',origin:'deep-archive',status:'working-local-index'},
{id:'roots',name:'Route · Raut · Root languages',group:'Languages',href:'../../route-raut-root/index.html',origin:'route-raut-root',status:'working-browser-model'},
{id:'tablet',name:'Tablet of Tabor — original decryption specification',group:'Languages',href:'',origin:'owner-held Tablet of Tabor originals (not fully verified on public site)',status:'source-lead'},
{id:'everything',name:'Everything / Nothing Engine',group:'Languages',href:'../../complete-mind/index.html',origin:'owner-authored Code of Codes / Vitruvian work; source path to verify',status:'source-lead'},
{id:'vitruvian',name:'Vitruvian Full Tilt',group:'Minds',href:'../../complete-mind/index.html',origin:'owner-authored Vitruvian framework and Complete Mind public index',status:'source-referenced'},
{id:'factory',name:'TABOR 1-2-3 FACTORY',group:'Infrastructure',href:'../../../index.html',origin:'app-factory',status:'working-browser-app'},
{id:'builder',name:'MAKE AI YOURS — Personal Intelligence',group:'Infrastructure',href:'../index.html',origin:'personal-intelligence',status:'working-browser-app'}
]);
function clean(x,limit=12000){return String(x==null?'':x).slice(0,limit);}
function words(x){return [...new Set((clean(x,12000).toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(w=>w.length>2))].slice(0,200);}
function normalizeCode(code){const v=clean(code,80).trim();if(!v)return '';if(!/^[\p{L}\p{N}\s./:()_-]{1,80}$/u.test(v))throw Error('Invalid classification code');return v;}
function classification({dewey='',loc='',duo='',ceroUnoDos='0.0'}={}){if(!TIERS.some(x=>x.id===ceroUnoDos))throw Error('Unknown Cero/Uno/Dos tier');return Object.freeze({tier:ceroUnoDos,dewey:normalizeCode(dewey),libraryOfCongress:normalizeCode(loc),duo:normalizeCode(duo),catalogAuthority:'owner-entered; not externally verified'});}
function address(id,omni){if(!omni||typeof omni.agent!=='function')throw Error('Existing OMNI GOD engine is required');const raw=clean(id,32).trim();if(!/^\d{1,12}$/.test(raw))throw Error('Provide an integer from 0 to 125999999999');const entity=omni.agent(raw,'OMNI GOD');return Object.freeze({id:entity.id,label:entity.label,enabled:false,simulation:true,capacity:omni.CAPACITY,allocatedProcesses:0,provenance:'existing omni-god/engine.js'});}
function crossLinks(source,others=[],limit=10){const a=new Set(words(source)),matches=[];for(const x of others.slice(0,500)){if(!x||typeof x!=='object')continue;const b=words([x.title||x.name,x.body||x.text,x.tags?.join(' ')||''].join(' '));const common=b.filter(w=>a.has(w));if(common.length)matches.push({id:clean(x.id||'',120),title:clean(x.title||x.name,200),sharedTerms:common.slice(0,8),score:common.length,relation:'candidate lexical overlap',verified:false});}return matches.sort((x,y)=>y.score-x.score||x.title.localeCompare(y.title)).slice(0,Math.min(30,Math.max(1,limit)));}
function simulate(text,others=[],classifications={}){const original=clean(text,12000);if(!original.trim())throw Error('Enter source text');const c=classification(classifications);const related=crossLinks(original,others);return Object.freeze({schema:SCHEMA,original,originalAltered:false,stages:[
{stage:'CERO',tier:'0.0',actor:'Archivist + Leonardo (Turtle)',result:'Preserve unchanged original; create separate source ID and checksum when stored'},
{stage:'UNO',tier:'1.0',actor:'Raphael + Donatello',result:'Review source and propose catalog tags; nothing is independently fact-checked by this demonstration'},
{stage:'DOS',tier:'2.0',actor:'Michelangelo + Leonardo da Vinci',result:'Propose links and a separate synthesis without overwriting original text'}],
classifications:c,related,requiresOwnerReview:true,writingOccurred:false,liveAgentExecution:false});}
function sourceCoverage(catalogs){const result={};for(const [name,items] of Object.entries(catalogs||{}))result[name]=Array.isArray(items)?items.length:0;return result;}
return Object.freeze({SCHEMA,TIERS,PIPELINE,RENAISSANCE,LENSES,MODULES,words,classification,address,crossLinks,simulate,sourceCoverage});
});
