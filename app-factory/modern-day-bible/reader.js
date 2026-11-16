'use strict';
const $=id=>document.getElementById(id),node=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e};
let sources=[],active=null,connected=false,selection=0;
const overview='mdb-timeline-overview';
const jebIndex='mdb-timeline-jeb-foxx';
const foxxLinks=new Set(['mdb-timeline-foxx-ledger','mdb-timeline-foxx-july','mdb-timeline-foxx-house']);
const jebHighlights=['mdb-timeline-jeb-dedication','mdb-timeline-jeb-author-words','mdb-timeline-jeb-grok-refusal','mdb-timeline-jeb-article-excerpt'];
async function request(route,method='GET',body){const r=await fetch('/api/'+route,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});if(r.status===401)throw Error('Connect the private database through ONE App Shell first.');if(!r.ok)throw Error((await r.json()).error||'Unable to read the database');return r.json()}
function renderList(){
 const rows=window.OneStoryLibrary.search(sources,$('query').value,$('kind').value),out=$('sources');out.replaceChildren();$('count').textContent=rows.length+' OF '+sources.length+' SOURCES';
 for(const source of rows){const b=node('button',(source.number?'#'+source.number+' · ':'')+source.title);b.setAttribute('aria-current',String(source.id===active));b.append(node('small',(source.timeline?[source.timeline.date,source.timeline.track].filter(Boolean).join(' · '):source.kind+' · '+source.text.length.toLocaleString()+' characters')+(source.complete?'':' · INCOMPLETE')));b.onclick=()=>open(source);out.append(b)}
 if(!rows.length)out.append(node('p','No matching sources.'));return rows;
}
function relatedSource(id){return sources.find(source=>source.sourceId===id&&source.complete)}
function relatedIds(source){
 const links=source.timeline.links;
 if(source.sourceId===jebIndex)return [...new Set([...links,...jebHighlights])];
 if(foxxLinks.has(source.sourceId))return [...new Set([...links,jebIndex])];
 return links;
}
function openTimeline(source){
 if(!source)return;
 $('kind').value='timeline';$('query').value='';
 history.replaceState(null,'','#'+source.sourceId);
 open(source);$('title').focus();
}
function showTimeline(source){
 const record=source.timeline;
 $('timeline-details').replaceChildren();$('related-links').replaceChildren();
 $('related').hidden=true;
 if(!record)return;
 $('timeline-details').textContent=[record.date,record.track,record.dateBasis,record.publishedAtUtc].filter(Boolean).join(' · ');
 for(const id of relatedIds(source)){
  const target=relatedSource(id);
  if(!target)continue;
  const link=node('a',target.title);
  link.href='#'+id;
  link.onclick=event=>{event.preventDefault();openTimeline(target)};
  const item=node('li','');item.append(link);$('related-links').append(item);
 }
 $('related').hidden=!$('related-links').children.length;
}
async function open(source){
 const current=++selection;active=source.id;renderList();$('title').textContent=source.title;$('metadata').textContent=source.kind+' · '+source.text.length.toLocaleString()+' characters · checking integrity…';$('scope').textContent=source.scope;
 showTimeline(source);
 if(source.timeline)history.replaceState(null,'','#'+source.sourceId);
 else if(location.hash.startsWith('#mdb-timeline-'))history.replaceState(null,'',location.pathname+location.search);
 $('original').hidden=!source.source.startsWith('https:');if(!$('original').hidden)$('original').href=source.source;
 $('text').replaceChildren();const q=$('query').value.trim(),text=source.text;
 if(q){let at=0,found=0;const lower=text.toLocaleLowerCase(),needle=q.toLocaleLowerCase();let index;while((index=lower.indexOf(needle,at))!==-1&&found++<1000){$('text').append(document.createTextNode(text.slice(at,index)),node('mark',text.slice(index,index+q.length)));at=index+q.length}$('text').append(document.createTextNode(text.slice(at)))}else $('text').textContent=text;
 try{const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(n=>n.toString(16).padStart(2,'0')).join('');if(current!==selection)return;$('metadata').textContent=source.kind+' · '+text.length.toLocaleString()+' characters · '+(source.complete&&hash===source.sha256?'full text integrity verified':'INCOMPLETE OR CHANGED — review source')}catch{if(current===selection)$('metadata').textContent='Integrity check unavailable in this browser. Source text retained.'}
}
function coverage(){return '100 recovered numbered stories (#102–201), 52 kinship index entries, 4 public Tabor Light references, and a KJV and publication timeline. Missing original story spans: #1–101 and #202–404.'}
function showAisles(labels,provenance){$('aisle-panel').hidden=false;$('aisle-provenance').textContent=provenance||'';$('aisles').replaceChildren();for(const label of labels||[])$('aisles').append(node('li',label))}
function showCollection(){
 $('coverage').textContent=coverage();
 const linked=relatedSource(location.hash.slice(1));
 if(linked?.timeline){openTimeline(linked);return}
 const rows=renderList();if(rows.length)open(rows.find(s=>s.id===active)||rows[0]);
}
async function load(){
 try{
  const recovery=await request('story-recover','POST',{});showAisles(recovery.aisles,recovery.aisleProvenance);
  const [app,result]=await Promise.all([request('apps/modern-day-bible'),(async()=>{const items=[];let offset=0;do{const page=await request('apps/modern-day-bible/records?offset='+offset);items.push(...page.items);offset=page.nextOffset;if(items.length>100000)throw Error('Collection exceeds reader limit')}while(offset!==null&&offset!==undefined);return {items}})()]);connected=true;window.NathanAppearanceUI.setState(app.appearance);sources=window.OneStoryLibrary.assemble(result.items);
  for(const source of sources)source.timeline=recovery.timelineRecords?.[source.id];
  $('connection').textContent='Private SQLite · connected';
  $('import').disabled=false;$('export').disabled=!sources.length;$('connect').hidden=true;showCollection();
 }catch(e){connected=false;$('connection').textContent='Public recovered collection';$('connect').hidden=false;
  $('import').disabled=true;$('export').disabled=true;
  try{
   const base='../../data/tabor/',paths=['modern_day_bible/stories_102_201.json','biblical_kinship_52_entities_2026-11-14.json','modern_day_bible/aisle_labels_7.json','modern_day_bible/tabor_light_public_sources.json','modern_day_bible/publication_timeline.json'];
   const [stories,kinship,aisles,related,timeline]=await Promise.all(paths.map(async path=>{const response=await fetch(base+path);if(!response.ok)throw Error('Public recovery sources unavailable');return response.json()}));
   const bundle=window.OneBibleCorpus.buildBundle(stories,kinship);
   if(related.schema!=='one.story-sources.v1'||related.related_collection!=='TABOR LIGHT'||!Array.isArray(related.sources))throw Error('Invalid Tabor Light source index');
   bundle.sources.push(...related.sources,...window.OneBibleCorpus.publicationTimeline(timeline));
   sources=await Promise.all(bundle.sources.map(async x=>({...x,sourceId:x.id,timeline:window.OneBibleCorpus.timelineMetadata(x.record),number:x.record?.number||null,source:x.url,sha256:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x.text)))).map(n=>n.toString(16).padStart(2,'0')).join(''),complete:true})));
   showAisles(aisles.labels,aisles.provenance);$('status').textContent='Connect the private database for related manuscripts, imports and exports.';showCollection();
  }catch(err){$('status').textContent=err.message;renderList()}
 }

}
$('timeline').onclick=()=>openTimeline(relatedSource(overview));
$('double-mindedness').onclick=()=>openTimeline(relatedSource('mdb-timeline-double-mindedness'));
$('jeb').onclick=()=>openTimeline(relatedSource(jebIndex));
$('query').oninput=()=>{const rows=renderList();if(rows.length)open(rows.find(s=>s.id===active)||rows[0]);else{selection++;$('title').textContent='No matching sources';$('text').textContent='';$('metadata').textContent='';$('scope').textContent='';$('original').hidden=true;showTimeline({})}};
$('kind').onchange=$('query').oninput;$('import').onclick=()=>$('file').click();
$('file').onchange=async()=>{const file=$('file').files[0];if(!file||!connected)return;try{if(file.size>8*1024*1024)throw Error('Import exceeds 8 MB');const bytes=new Uint8Array(await file.arrayBuffer()),text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);let originalBytes='';if(!file.name.toLowerCase().endsWith('.json'))for(const byte of bytes)originalBytes+=String.fromCharCode(byte);const bundle=file.name.toLowerCase().endsWith('.json')?JSON.parse(text.replace(/^\uFEFF/,'')):{schema:'one.story-sources.v1',sources:[{id:'owner-'+crypto.randomUUID(),title:file.name.replace(/\.(txt|md)$/i,''),url:'local:upload/'+encodeURIComponent(file.name),kind:'story',scope:'Added directly by the owner to this collection.',text,original:{format:'text/plain',base64:btoa(originalBytes)}}]};const result=await request('story-import','POST',bundle);await load();$('status').textContent=result.imported+' sources imported; '+result.skipped+' unchanged sources skipped.'}catch(e){$('status').textContent=e.message}finally{$('file').value=''}};
$('export').onclick=async()=>{try{const bundle=await request('story-export'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'}));a.download='modern-day-bible-related-sources.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}catch(e){$('status').textContent=e.message}};
load();
