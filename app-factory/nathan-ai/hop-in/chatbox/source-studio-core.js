(function(root){
'use strict';
// Source-to-creation activities, separate from the owner's original_text records.
// All chapters, quiz questions and lessons here are authored editorial scaffolds.
const ARCHIVE_PATH='../../protection-of-innocence/david-exchange-2026-11-05/';
const SOURCE_IDS=['NATHAN-SOURCE-20261105-001','NATHAN-SOURCE-20261105-002','NATHAN-SOURCE-20261105-003','NATHAN-SOURCE-20261105-004'];
const VOLUMES=[
{id:'worth',title:'Book 1 — You Are Worth a Whole Lot',theme:'Self-worth and the impact of others’ words',chapters:['Worth before judgment','The difference between action and identity','Saying what needed to be heard'],sourceIds:[SOURCE_IDS[0]]},
{id:'mercy',title:'Book 2 — Mercy, Grace, and Restraint',theme:'Anger, restraint, and responding without harm',chapters:['When anger speaks','The choice not to retaliate','A record that keeps context'],sourceIds:[SOURCE_IDS[0]]},
{id:'elder',title:'Book 3 — Grandfather’s Words and Their Context',theme:'Family sayings, contested history, and careful attribution',chapters:['Remembering a quotation','Who said what','What the record can and cannot prove'],sourceIds:[SOURCE_IDS[0]]},
{id:'changed',title:'Book 4 — Do Not Change My Words',theme:'The distinction between verbatim testimony and commentary',chapters:['The first correction','The second correction','The original alongside the index'],sourceIds:[SOURCE_IDS[1],SOURCE_IDS[2]]},
{id:'innocence',title:'Book 5 — Protection of Innocence',theme:'Child safety, evidence, lawful reporting, and survivor privacy',chapters:['Protecting a vulnerable person','Evidence, allegations and findings','An accountable record'],sourceIds:[SOURCE_IDS[0],SOURCE_IDS[1],SOURCE_IDS[2]]},
{id:'archive',title:'Book 6 — The Archive That Remembers',theme:'Source-first preservation and accountable editorial work',chapters:['Each message has an ID','Source and interpretation stay separate','An index is not a replacement'],sourceIds:[SOURCE_IDS[2],SOURCE_IDS[3]]},
{id:'worlds',title:'Book 7 — Words Become Worlds',theme:'Transforming source-led work into educational apps, games and books',chapters:['The research shelf','The game and the choice','The learning studio'],sourceIds:[SOURCE_IDS[3]]}
];
const GAME_ROUNDS=[
{id:'g1',question:'An index heading describes a source. Does the heading replace the original author wording?',options:['Yes','No'],answer:1,explanation:'No. Preserve original_text untouched; store headings in a separate derived index.'},
{id:'g2',question:'Two messages repeat a sentence. Should an archive silently collapse one of the messages?',options:['Yes','No'],answer:1,explanation:'No. Repetition is part of the source record and chronology.'},
{id:'g3',question:'Someone reports a historical quotation. Is that automatically proof that the reported event happened exactly as described?',options:['Yes','No'],answer:1,explanation:'No. Attribute the account, then research supporting primary evidence separately.'},
{id:'g4',question:'Can an accusation be faithfully preserved without treating it as an independently verified finding?',options:['Yes','No'],answer:0,explanation:'Yes. Document who said it, and distinguish the statement from independently established facts.'},
{id:'g5',question:'Should graphic or threatening adult-source language be automatically shown to children in an educational game?',options:['Yes','No'],answer:1,explanation:'No. Adult originals can remain in a clearly labeled, separately gated source archive.'},
{id:'g6',question:'Does a victim-protection exercise benefit from clear evidence labels and privacy safeguards?',options:['Yes','No'],answer:0,explanation:'Yes. Care, lawful reporting, and accurate records work together.'}
];
const LESSONS=[
{id:'source',title:'Lesson 1 — Original vs. Interpretation',prompt:'What is different about an original quote and an editorial heading?',body:'Original: a sourced author statement with exact visible wording. Interpretation: a separate label or explanation written by an editor. Never silently substitute one for the other.',exercise:'Identify which field holds the original words in messages.json.',answer:'original_text',sourceIds:SOURCE_IDS},
{id:'testimony',title:'Lesson 2 — What a Source Can Prove',prompt:'Does a person reporting something mean the historical claim is independently confirmed?',body:'A first-person report establishes what that person said, not necessarily every external fact it describes. Find corroborating dated records before making historical claims.',exercise:'Give one question you would ask before calling a reported village custom historical fact.',answer:'Look for contemporary primary legal records or documented local history.',sourceIds:[SOURCE_IDS[0]]},
{id:'speech',title:'Lesson 3 — Anger, Words, and Action',prompt:'How can a record preserve anger without teaching retaliation?',body:'Describe the speaker accurately, avoid presenting threats as instructions, and explore restraint, nonviolent accountability and safety.',exercise:'Name one way to pursue accountability without retaliation.',answer:'Document facts, protect affected people, and seek appropriate lawful review.',sourceIds:[SOURCE_IDS[1],SOURCE_IDS[2]]},
{id:'innocence',title:'Lesson 4 — Protecting the Vulnerable',prompt:'What must a responsible child-protection lesson keep separate?',body:'Survivor privacy, credible evidence, allegations and established findings are distinct. Avoid unverified accusations, graphic details or personally identifying information.',exercise:'What should be protected when creating a public evidence archive?',answer:'The privacy and safety of victims and survivors.',sourceIds:[SOURCE_IDS[0]]},
{id:'publish',title:'Lesson 5 — Making a Book or Game',prompt:'Can a creative adaptation take the place of the source?',body:'A book chapter, lesson or game can explore a theme, but it remains a new creation. Give it its own title, author/editing label and links to source IDs.',exercise:'Which files represent the originals and editorial index in this archive?',answer:'messages.json (originals) and index.json (editorial index).',sourceIds:[SOURCE_IDS[3]]}
];
function assertArchive(records){
 if(!Array.isArray(records)||records.length!==SOURCE_IDS.length)throw Error('Archive record count does not match the indexed source.');
 for(let i=0;i<SOURCE_IDS.length;i++){
  const item=records[i];
  if(!item||item.id!==SOURCE_IDS[i]||item.sequence!==i+1||typeof item.original_text!=='string'||!item.original_text.trim())throw Error('Source order, ID or text is invalid.');
 }
 return true;
}
function bookById(id){return VOLUMES.find(x=>x.id===id)||null;}
function scoreAnswer(id,choice){
 const r=GAME_ROUNDS.find(x=>x.id===id);
 if(!r||!Number.isInteger(choice)||choice<0||choice>=r.options.length)throw Error('Invalid game response.');
 return {correct:choice===r.answer,correctOption:r.options[r.answer],explanation:r.explanation};
}
function bookMarkdown(id,notes){
 const v=bookById(id);if(!v)throw Error('Unknown book volume.');
 if(typeof notes!=='string'||notes.length>250000)throw Error('Draft exceeds the 250,000-character per-volume limit; export in smaller source-safe parts, no truncation.');
 return '# '+v.title+'\n\n'+
 '**Type:** Editorial / creative development draft (not an original source transcript)\n\n'+
 '**Theme:** '+v.theme+'\n\n'+
 '**Source record IDs:** '+v.sourceIds.join(', ')+'\n\n'+
 '## Proposed chapter plan\n\n'+v.chapters.map((x,i)=>(i+1)+'. '+x).join('\n')+'\n\n'+
 '## Creator draft notes\n\n'+(notes.trim()||'[No author draft notes entered]')+'\n\n'+
 '## Source integrity\n\nOriginal author messages remain in the separate messages.json archive. These chapter headings and prompts are creative editorial material and do not imply verified facts about David, relatives, historical laws or individuals.\n';
}

/* Lossless, order-preserving import of additional owner-provided source records.
 * Identical original_text with different source IDs remains two separate records.
 * A duplicate ID is rejected, never silently overwritten or merged. */
function appendSourcesWithoutCollapse(existing, incoming){
 if(!Array.isArray(existing)||!Array.isArray(incoming))throw Error('Sources must be ordered arrays.');
 if(existing.length+incoming.length>1500)throw Error('Source record limit is 1500. Export and split collections; no records were dropped.');
 const seen=new Set();
 const all=[];
 for(const item of [...existing,...incoming]){
  if(!item||typeof item!=='object'||Array.isArray(item)||typeof item.id!=='string'||!item.id.trim()||
     typeof item.original_text!=='string'||!item.original_text.trim()||
     item.original_text.length>350000)throw Error('Invalid or oversized source record; no truncation performed.');
  if(seen.has(item.id))throw Error('Duplicate source ID: '+item.id+'. No records were merged or overwritten.');
  seen.add(item.id);
  all.push({...item}); // Retain the source wording, ID and all author-supplied metadata.
 }
 return all;
}
function sourceCensus(records){
 if(!Array.isArray(records))throw Error('Expected source array.');
 return {records:records.length,characters:records.reduce((n,x)=>n+x.original_text.length,0),uniqueIds:new Set(records.map(x=>x.id)).size,distinctTexts:new Set(records.map(x=>x.original_text)).size,repeatedWordings:records.length-new Set(records.map(x=>x.original_text)).size};
}
function seriesMarkdown(notes={}){
 const parts=['# NATHAN AI — Seven-Volume Words → Worlds Series',
 '**Type:** New editorial writing outlines, separate from primary source',
 '**Coverage:** All seven plans are included in source order; no volume is hidden or dropped.'];
 for(const v of VOLUMES)parts.push(bookMarkdown(v.id,typeof notes[v.id]==='string'?notes[v.id]:''));
 return parts.join('\n\n---\n\n')+'\n';
}
function originalsExport(records){
 const reviewed=appendSourcesWithoutCollapse([],records);
 return JSON.stringify({schema:'nathan.source-verbatim.v1',export_type:'local-source-ledger',source_count:reviewed.length,note:'Verbatim original_text retained and ordered. This is a local export, not proof of original chat-platform byte equality.',messages:reviewed},null,2)+'\n';
}
const API={ARCHIVE_PATH,SOURCE_IDS,VOLUMES,GAME_ROUNDS,LESSONS,assertArchive,bookById,scoreAnswer,bookMarkdown,appendSourcesWithoutCollapse,sourceCensus,seriesMarkdown,originalsExport};
if(typeof module==='object'&&module.exports)module.exports=API;else root.NathanSourceStudioCore=API;
})(typeof window==='object'?window:globalThis);
