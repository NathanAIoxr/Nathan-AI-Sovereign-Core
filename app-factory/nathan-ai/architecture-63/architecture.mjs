'use strict';
export const CATALOG_SCHEMA = 'nathan-one-original-architecture-63.v1';

export function flattenCatalog(catalog) {
  return catalog.flatMap(group => group.entries.map(entry => ({...entry, family:group.id, family_label:group.label})));
}
export function validateCatalog(data) {
  if (!data || data.schema !== CATALOG_SCHEMA || !Array.isArray(data.catalog) || data.catalog.length !== 3) {
    throw new Error('Invalid architecture catalog schema');
  }
  const rows=flattenCatalog(data.catalog);
  if (rows.length!==63 || data.catalog.some(g=>g.count!==21 || g.entries.length!==21)) throw new Error('63 / 21 × 3 registry invariant failed');
  if(new Set(rows.map(x=>x.id)).size!==63)throw new Error('Duplicate catalog IDs');
  for(const row of rows) {
    if(typeof row.title!=='string'||!row.title.trim()||typeof row.description!=='string'||typeof row.route!=='string'||!/^\.\.\//.test(row.route)||row.route.includes('://')||row.route.includes('\\')) {
      throw new Error('Invalid or unsafe registry row');
    }
  }
  return rows;
}
export function selectRows(rows,{query='',family='all',category='all'}={}) {
  const q=query.trim().toLocaleLowerCase();
  return rows.filter(r=>(family==='all'||r.family===family)&&(category==='all'||r.category===category)&&
    (!q||[r.title,r.description,r.category,r.family_label].join(' ').toLocaleLowerCase().includes(q)));
}
export function createBrief(rows,selectedIds) {
  const chosen=rows.filter(row=>selectedIds.includes(row.id));
  return {schema:'nathan-one-original-brief.v1',
    origin:'Nathan AI / ONE — 63 Original Architecture Registry',
    stage:'design reference only; no deployment, external access or licensing implied',
    invariants:['1+1=2 BUILD','1-1=0 CLEAR'],
    workflow:['SOURCE','DESIGN','TEST','RIGHTS REVIEW','OWNER APPROVAL','DEPLOYMENT REVIEW'],
    concepts:chosen.map(({id,title,description,category,family})=>({id,title,description,category,family})),
    preservation:'Original author sources and existing apps remain unchanged; no third-party branded assets or source reused.'};
}

if(typeof document!=='undefined'){
  const $=id=>document.getElementById(id), state={rows:[],selected:new Set(),family:'all',category:'all',query:''};
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
  function updateBriefButton(){const b=$('export');b.disabled=state.selected.size===0;b.textContent='Export original design brief ('+state.selected.size+')';}
  function render(){
    const filtered=selectRows(state.rows,state);const host=$('items');host.replaceChildren();
    $('status').textContent=filtered.length+' visible of 63 design concepts · '+state.selected.size+' selected';
    const frag=document.createDocumentFragment();
    for(const row of filtered){
      const article=el('article','item'),id=el('span','meta',row.id+' · '+row.category),title=el('h3','',row.title);
      const p=el('p','',row.description),label=el('label','check'),check=el('input');
      check.type='checkbox';check.checked=state.selected.has(row.id);check.setAttribute('aria-label','Select '+row.title+' for concept brief');
      check.onchange=()=>{if(check.checked)state.selected.add(row.id);else state.selected.delete(row.id);updateBriefButton();$('status').textContent=filtered.length+' visible of 63 design concepts · '+state.selected.size+' selected';};
      label.append(check,document.createTextNode('Select for original design brief'));
      const a=el('a','module','Explore existing Nathan AI module');a.href=row.route;
      article.append(id,title,p,a,label);frag.append(article);
    }
    host.append(frag);
  }
  const download=(name,content)=>{
    const objectUrl=URL.createObjectURL(new Blob([content],{type:'application/json'}));
    const a=document.createElement('a');a.href=objectUrl;a.download=name;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
  };
  $('search').addEventListener('input',e=>{state.query=e.target.value;render();});
  $('family').addEventListener('change',e=>{state.family=e.target.value;render();});
  $('category').addEventListener('change',e=>{state.category=e.target.value;render();});
  $('clear').addEventListener('click',()=>{state.selected.clear();updateBriefButton();render();});
  $('export').addEventListener('click',()=>download('Nathan_AI_Original_Architecture_Brief.json',
    JSON.stringify(createBrief(state.rows,[...state.selected]),null,2)+'\n'));
  $('export-catalog').addEventListener('click',()=>download('Nathan_AI_Original_Architecture_63.json',JSON.stringify(window.__architectureData,null,2)+'\n'));
  fetch('./registry.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(data=>{
    const rows=validateCatalog(data);state.rows=rows;window.__architectureData=data;
    for(const category of [...new Set(rows.map(x=>x.category))].sort()){const opt=el('option','',category);opt.value=category;$('category').append(opt);}
    $('total').textContent=String(rows.length);
    for(const group of data.catalog){$(group.id+'-count').textContent=String(group.entries.length);}
    render();
  }).catch(error=>{$('status').textContent='Catalog unavailable: '+error.message;});
}
