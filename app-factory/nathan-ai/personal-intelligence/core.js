/* NATHAN AI — Personal Intelligence Builder. Pure browser/Node contracts. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanPI=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const STATE_SCHEMA='nathan.personal-intelligence.state.v1';
const HANDOFF_SCHEMA='nathan.personal-intelligence.handoff.v1';
const LESSONS=[
{id:'own',level:0,title:'OWN — your records',goal:'Identify what belongs to you and what an AI provider remembers.',task:'Choose a workspace name and review the local-only storage notice.'},
{id:'capture',level:1,title:'CAPTURE — original source',goal:'Save a file, image or typed note with provenance.',task:'Import one file and locate it by name.'},
{id:'organize',level:2,title:'ORGANIZE — connected sources',goal:'Use project names, tags and source IDs.',task:'Attach a source ID and tags to a knowledge note.'},
{id:'preserve',level:3,title:'PRESERVE — original bytes',goal:'Understand SHA-256, versions and original/derived separation.',task:'Export an original-byte ZIP and confirm its restore path.'},
{id:'configure',level:4,title:'CONFIGURE — your rules',goal:'Write repeatable instructions without changing original evidence.',task:'Create a note documenting a rule and link its evidence.'},
{id:'connect',level:5,title:'CONNECT — authorized AI handoff',goal:'Send only explicitly selected context to a compatible AI.',task:'Prepare a portable JSON handoff and inspect it before sharing.'},
{id:'create',level:6,title:'CREATE — projects from sources',goal:'Turn linked original records into a reusable project.',task:'Assign a project name to imported material.'},
{id:'recover',level:7,title:'RECOVER — portable intelligence',goal:'Test backup, restore and permission revocation.',task:'Restore a backup in a separate browser profile or device, then verify the source.'}
];
const METHODS=[
['SOURCE FIRST','Never replace an original file or author text with AI commentary.'],
['MEMORY AS STRUCTURE','Link source, place, time, word, project and concept records.'],
['ROOT-LEVEL ANALYSIS','Explore phonetics, inversions and relationships as attributed analysis.'],
['DETERMINISTIC CONTROL','1+1=2 BUILD; 1-1=0 CLEAR: executable rules require tests.'],
['CONTINUOUS CREATION','Turn captured material into source-linked projects and programs.'],
['MULTI-AI COMPUTATION','Use compatible models while controlling the shared sources.'],
['SOURCE IDENTITY','Keep originals, revisions and derived interpretations separate.'],
['MOBILE-FIRST','Capture on a phone; manage complex work on a laptop.'],
['RECOVERABLE ORIGINALS','Retain full-byte hashes, backups and restore capability.'],
['TEACH THE METHOD','Others build their own owner-controlled intelligence, not a copy of another person.']
];
const CONNECTORS=[
{name:'ChatGPT',mode:'Manual file or text handoff',state:'manual',hint:'Use exported context packets or upload selected original files. No automatic account access.'},
{name:'Claude / MCP-capable AI',mode:'Local MCP bridge (optional)',state:'setup',hint:'Requires running a user-authorized local MCP server on the laptop and configuring the AI client.'},
{name:'LocalAI and self-hosted models',mode:'MCP/API adapter (optional)',state:'setup',hint:'A local model does not automatically discover browser files. A bridge must be configured.'},
{name:'Other AI services',mode:'Portable JSON / original file upload',state:'manual',hint:'Direct integration is only available when a supported, authorized provider API exists.'}
];
function cleanText(x,max=10000){return String(x==null?'':x).replace(/\u0000/g,'').slice(0,max)}
function tokens(s){return cleanText(s,400).toLocaleLowerCase().trim().split(/\s+/).filter(Boolean).slice(0,20)}
function searchItems(items,query){const words=tokens(query);if(!words.length)return items.slice();return items.map(item=>{const hay=[item.name,item.title,item.body,item.text,item.project,item.sourceId,item.source_id,...(Array.isArray(item.tags)?item.tags:[])].map(x=>cleanText(x,12000).toLocaleLowerCase()).join(' ');const score=words.reduce((n,w)=>n+(hay.includes(w)?1:0),0);return {item,score}}).filter(x=>x.score===words.length).sort((a,b)=>b.score-a.score).map(x=>x.item)}
function safeTags(text){const a=Array.isArray(text)?text:String(text||'').split(',');return [...new Set(a.map(x=>cleanText(x,50).trim()).filter(Boolean))].slice(0,20)}
function createNote({id,title,body,tags,sourceId,project,type,createdAt}){const t=cleanText(title,160).trim(),b=cleanText(body,50000).trim();if(!t||!b)throw Error('A knowledge note requires a title and source text');return {schema:'nathan.personal-intelligence.note.v1',id:id||('note-'+Date.now()+'-'+Math.random().toString(36).slice(2)),title:t,body:b,tags:safeTags(tags),sourceId:cleanText(sourceId,140),project:cleanText(project,120),type:['source','interpretation','fiction','working'].includes(type)?type:'working',createdAt:createdAt||new Date().toISOString()}}
function makeHandoff({query,assets=[],notes=[],includeContent=false}){const chosen=assets.slice(0,30).map(x=>({id:cleanText(x.id,120),name:cleanText(x.name,220),mime:cleanText(x.mime,100),sha256:x.sha256||null,project:cleanText(x.project,120),version:1,excerpt:includeContent?cleanText(x.excerpt||x.text||'',1800):undefined}));const citations=notes.slice(0,20).map(x=>({id:cleanText(x.id,120),title:cleanText(x.title,200),sourceId:cleanText(x.sourceId,120),type:cleanText(x.type,30),excerpt:includeContent?cleanText(x.body,1800):undefined}));return {schema:HANDOFF_SCHEMA,createdAt:new Date().toISOString(),query:cleanText(query,1200),transport:'owner-reviewed-manual-export',disclosure:includeContent?'selected excerpts included':'metadata only; originals remain on owner device',assets:chosen,notes:citations,instructions:'Use cited source IDs. Distinguish originals from interpretation. Do not claim access to unshared files. Request original files or images separately where needed.'}}
function validateState(input){if(!input||input.schema!==STATE_SCHEMA||!Array.isArray(input.notes)||typeof input.lessons!=='object'||input.lessons===null)throw Error('Unrecognized personal intelligence state backup');if(input.notes.length>20000)throw Error('Too many notes');return {schema:STATE_SCHEMA,notes:input.notes.map(x=>createNote(x)),lessons:Object.fromEntries(LESSONS.map(x=>[x.id,input.lessons[x.id]===true])),createdAt:cleanText(input.createdAt||'',80)}}
return {STATE_SCHEMA,HANDOFF_SCHEMA,LESSONS,METHODS,CONNECTORS,cleanText,tokens,searchItems,safeTags,createNote,makeHandoff,validateState};
});
