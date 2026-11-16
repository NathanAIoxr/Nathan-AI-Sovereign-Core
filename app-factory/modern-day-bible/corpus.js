(function(root){'use strict';
const BASE='https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/';
function buildBundle(stories,kinship,passages){
 if(!Array.isArray(stories?.records)||!Array.isArray(kinship?.records))throw Error('Invalid recovered source catalogs');
 const sources=stories.records.map(r=>({id:r.entry_id.toLowerCase(),title:r.title_as_supplied,url:BASE+'data/tabor/modern_day_bible/volume_2_102_201_original.txt',kind:'numbered-story',scope:'Entry #'+r.number+' · '+r.bible_reference_as_supplied+' · '+r.source_section_as_supplied+' · Original supplied wording; scripture interpretation not independently verified.',text:r.original_line,original:{format:'text/plain',text:r.original_line},record:r}));
 for(const r of kinship.records){const text=r.title_as_supplied+'\n'+r.bible_reference_as_supplied+'\n'+r.section_as_supplied;sources.push({id:r.id.toLowerCase(),title:r.title_as_supplied,url:BASE+'data/tabor/biblical_kinship_52_entities_2026-11-14.json',kind:'index',scope:'Separate kinship index #'+r.source_sequence+' · Title and citation only; full original description not recovered; not an additional numbered story.',text,original:{format:'application/json',text:JSON.stringify(r)},record:r})}
 if(passages){
  if(!Array.isArray(passages.entities))throw Error('Invalid numbered scripture index');
  for(const r of passages.entities){const text=r.title+'\n'+r.reference_as_supplied+'\n'+r.category;sources.push({id:r.id,title:r.title,url:BASE+'data/tabor/scripture_passage_entities_2026-11-14.json',kind:'numbered-index',scope:'Numbered scripture index #'+r.number+' · '+r.category+' · Title and reference recovered; original description missing. This is a separate source index, not recovered full story text or a verified assignment to the seven aisles.',text,original:{format:'application/json',text:JSON.stringify(r)},record:r})}
 }
 return {schema:'one.story-sources.v1',collection:'THE MODERN DAY BIBLE BY NATHAN TABOR',recentProjectLocated:true,sources};
}
function publicationTimeline(bundle){
 if(bundle?.schema!=='one.story-sources.v1'||bundle.related_collection!=='KJV AND PUBLICATION TIMELINE'||!Array.isArray(bundle.sources)||!bundle.sources.length)throw Error('Invalid publication timeline');
 const ids=new Set(bundle.sources.map(source=>source.id));
 if(ids.size!==bundle.sources.length||bundle.sources.some(source=>!source.id.startsWith('mdb-timeline-')||!timelineMetadata(source.record)||source.record.links.some(id=>!ids.has(id))))throw Error('Invalid publication timeline links');
 return bundle.sources;
}
function timelineMetadata(record){
 if(!record||typeof record.track!=='string'||typeof record.evidence!=='string'||typeof record.dateBasis!=='string'||typeof record.date!=='string'||(record.date&&!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(record.date))||!Array.isArray(record.links)||record.links.some(id=>typeof id!=='string'||!id.startsWith('mdb-timeline-')))return null;
 return record;
}
const api={buildBundle,publicationTimeline,timelineMetadata};if(typeof module==='object'&&module.exports)module.exports=api;else root.OneBibleCorpus=api;
})(typeof globalThis==='object'?globalThis:this);
