(function(root){'use strict';
const BASE='https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/';
function buildBundle(stories,kinship){
 if(!Array.isArray(stories?.records)||!Array.isArray(kinship?.records))throw Error('Invalid recovered source catalogs');
 const sources=stories.records.map(r=>({id:r.entry_id.toLowerCase(),title:r.title_as_supplied,url:BASE+'data/tabor/modern_day_bible/volume_2_102_201_original.txt',kind:'numbered-story',scope:'Entry #'+r.number+' · '+r.bible_reference_as_supplied+' · '+r.source_section_as_supplied+' · Original supplied wording; scripture interpretation not independently verified.',text:r.original_line,original:{format:'text/plain',text:r.original_line},record:r}));
 for(const r of kinship.records){const text=r.title_as_supplied+'\n'+r.bible_reference_as_supplied+'\n'+r.section_as_supplied;sources.push({id:r.id.toLowerCase(),title:r.title_as_supplied,url:BASE+'data/tabor/biblical_kinship_52_entities_2026-11-14.json',kind:'index',scope:'Separate kinship index #'+r.source_sequence+' · Title and citation only; full original description not recovered; not an additional numbered story.',text,original:{format:'application/json',text:JSON.stringify(r)},record:r})}
 return {schema:'one.story-sources.v1',collection:'THE MODERN DAY BIBLE BY NATHAN TABOR',recentProjectLocated:true,sources};
}
const api={buildBundle};if(typeof module==='object'&&module.exports)module.exports=api;else root.OneBibleCorpus=api;
})(typeof globalThis==='object'?globalThis:this);
