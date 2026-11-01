'use strict';
/* Nathan AI owner-local Games & Puzzles Atlas.
 * Public catalog names are references; owner originals are never transmitted.
 * Derived search rows are computed separately from the unchanged source text. */
export const PACK_SCHEMA = 'nathan-ai-games-pack.v1';
export function parseOwnerPack(text) {
  let value;
  try { value = JSON.parse(text); } catch { return null; }
  if (!value || value.schema !== PACK_SCHEMA || !Array.isArray(value.files)) return null;
  if (value.files.length > 500) throw Error('Pack has too many files (maximum 500).');
  return value.files.map((f, i) => {
    if (!f || typeof f.name !== 'string' || typeof f.content !== 'string') throw Error('Invalid pack source entry '+(i+1));
    if (f.content.length > 8000000) throw Error('Source '+f.name+' exceeds the 8M character local import limit.');
    return {name:f.name.slice(0,255),content:f.content,kind:f.source_kind||'owner-source',originalHash:f.sha256_utf8||null};
  });
}
export function sourceLineEntries(source) {
  if (!source || typeof source.content !== 'string') return [];
  return source.content.split(/\r?\n/).flatMap((line,i) => {
    const match=line.match(/^\s*•\s*(?:(\d{1,3})\.\s*)?(.+)$/u);
    if (!match) return [];
    const raw=match[2].trim();
    if (!raw) return [];
    const title=raw.split(/:\s|\s[–—]\s/)[0].trim().slice(0,160);
    return [{title,description:raw,category:'Owner source',stage:'owner-local',sourceId:source.id,sourceName:source.name,line:i+1,number:match[1]||null}];
  });
}
const DB_NAME='nathan-ai-games-owners-sources-v1';
let dbPromise=null;
function dbOpen(){
  if(!('indexedDB' in window))return Promise.reject(Error('IndexedDB is unavailable in this browser.'));
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('sources'))req.result.createObjectStore('sources',{keyPath:'id',autoIncrement:true});};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||Error('Local database could not open.'));
  });
  return dbPromise;
}
async function dbAll(){
  const db=await dbOpen();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('sources','readonly'),req=tx.objectStore('sources').getAll();
    req.onsuccess=()=>resolve(req.result||[]);
    req.onerror=()=>reject(req.error);
  });
}
async function dbInsert(items){
  const db=await dbOpen();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('sources','readwrite'),st=tx.objectStore('sources');
    for(const item of items)st.add({...item,importedAt:new Date().toISOString()});
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Import canceled'));
  });
}
async function dbDelete(id){
  const db=await dbOpen();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('sources','readwrite');tx.objectStore('sources').delete(id);
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });
}
function downloadSource(source){
  const blob=new Blob([source.content],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=source.name||'original-source.txt';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function el(tag,cls,txt){
  const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;
}
function start(){
  const $=id=>document.getElementById(id);
  const search=$('search'),category=$('category'),stage=$('stage'),cards=$('cards'),status=$('catalog-status');
  const sourceList=$('sources'),reader=$('source-reader');
  let catalog=[],sources=[],limit=60;
  function openSource(id){
    const x=sources.find(y=>y.id===id);if(!x)return;
    $('source-reader-title').textContent=x.name+' · Original source, read only';
    $('source-text').textContent=x.content;
    reader.hidden=false;reader.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  $('close-reader').addEventListener('click',()=>{reader.hidden=true;$('source-text').textContent='';});
  function options(sel,vals){
    const current=sel.value;sel.replaceChildren(new Option(sel.id==='stage'?'All stages':'All categories',''));
    for(const x of [...new Set(vals)].sort())sel.add(new Option(x,x));
    if([...sel.options].some(o=>o.value===current))sel.value=current;
  }
  function renderCatalog(){
    const derived=sources.flatMap(sourceLineEntries);
    const all=[...catalog,...derived];
    options(category,all.map(x=>x.category));options(stage,all.map(x=>x.stage));
    const q=search.value.toLocaleLowerCase().trim();
    const filtered=all.filter(x=>(!category.value||x.category===category.value)&&(!stage.value||x.stage===stage.value)&&(!q||[x.title,x.description,x.category,x.stage,x.sourceName].join(' ').toLocaleLowerCase().includes(q)));
    cards.replaceChildren();
    for(const item of filtered.slice(0,limit)){
      const card=el('article','card'),tag=el('span','tag',item.category),name=el('h3','',item.title),stageTxt=el('span','stage',item.stage.replaceAll('-',' '));
      card.append(tag,name,stageTxt);
      if(item.description)card.append(el('p','',item.description.slice(0,300)));
      if(item.href){
        const a=el('a','','Open existing module →');a.href=item.href;const p=el('p','');p.append(a);card.append(p);
      }else if(item.sourceId!==undefined){
        const p=el('p','muted',item.sourceName+' · source line '+item.line);
        const b=el('button','','View original source');b.type='button';b.addEventListener('click',()=>openSource(item.sourceId));card.append(p,b);
      }else card.append(el('p','muted','Catalog reference; no public playable release verified.'));
      cards.append(card);
    }
    $('more').hidden=filtered.length<=limit;
    status.textContent=filtered.length+' matching indexed entries · '+Math.min(filtered.length,limit)+' shown. Public titles and owner-derived entries are labeled separately.';
    $('public-count').textContent=String(catalog.length);
    $('owner-count').textContent=String(sources.length);
    $('derived-count').textContent=String(derived.length);
  }
  function renderSources(){
    sourceList.replaceChildren();
    if(!sources.length){$('import-status').textContent='No original sources stored in this browser.';return;}
    $('import-status').textContent=sources.length+' original source document(s) stored only in this browser. Export a backup before clearing browser data.';
    for(const s of sources){
      const wrap=el('article','source'),head=el('h3','',s.name),meta=el('p','muted',(s.kind||'owner-source')+' · '+s.content.length.toLocaleString()+' characters · '+sourceLineEntries(s).length+' searchable entries'),row=el('div','row');
      const view=el('button','','Read unchanged source');view.type='button';view.addEventListener('click',()=>openSource(s.id));
      const exportBtn=el('button','','Export source');exportBtn.type='button';exportBtn.addEventListener('click',()=>downloadSource(s));
      const del=el('button','','Remove from this browser');del.type='button';del.addEventListener('click',async()=>{
        if(!window.confirm('Remove this local copy of '+s.name+'? This does not delete any original external file.'))return;
        await dbDelete(s.id);await refresh();
      });
      row.append(view,exportBtn,del);wrap.append(head,meta,row);sourceList.append(wrap);
    }
  }
  async function refresh(){sources=await dbAll();renderSources();renderCatalog();}
  for(const control of [search,category,stage])control.addEventListener(control===search?'input':'change',()=>{limit=60;renderCatalog();});
  $('more').addEventListener('click',()=>{limit+=60;renderCatalog();});
  $('source-import').addEventListener('change',async e=>{
    const selected=[...e.target.files];if(!selected.length)return;
    $('import-status').textContent='Reading selected files locally…';
    try{
      const inserts=[];
      for(const file of selected){
        if(file.size>12000000)throw Error(file.name+' is larger than the 12MB file limit.');
        const txt=await file.text();const pack=file.name.toLowerCase().endsWith('.json')?parseOwnerPack(txt):null;
        if(pack)inserts.push(...pack);
        else inserts.push({name:file.name,content:txt,kind:'verbatim-owner-import'});
      }
      await dbInsert(inserts);await refresh();
      $('import-status').textContent='Imported '+inserts.length+' source file(s) into this browser only. Originals are unchanged.';
    }catch(err){$('import-status').textContent='Import did not complete: '+(err?.message||err);}
    e.target.value='';
  });
  fetch('./catalog.json').then(r=>{if(!r.ok)throw Error('Public catalog is unavailable');return r.json();})
  .then(data=>{if(data.schema!=='nathan-ai-games-public-index.v1'||!Array.isArray(data.entries))throw Error('Invalid catalog');catalog=data.entries;renderCatalog();})
  .catch(err=>{status.textContent='Public catalog unavailable: '+err.message+'. Owner import still works.';});
  refresh().catch(err=>{$('import-status').textContent='Local storage unavailable: '+err.message;renderCatalog();});
}
if(typeof document!=='undefined')start();
