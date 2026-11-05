(function() {
 'use strict';
 const api=window.NathanStoreDiscovery;
 const $=id=>document.getElementById(id);
 const state={entries:[],shown:0,filtered:[],source:null,manifest:null};
 function node(tag,text,cls) {
   const el=document.createElement(tag);
   if(text!==undefined)el.textContent=String(text);
   if(cls)el.className=cls;
   return el;
 }
 function option(sel,value) {
   const el=node('option',value);el.value=value;sel.append(el);
 }
 function stats() {
   const counts=api.counts(state.entries),el=$('stats');el.replaceChildren();
   for(const [value,label] of [[counts.total,'Existing web entrypoints'],[counts.mapped,'Category proposals'],[counts.needsReview,'Needs functional review'],[counts.publishedStoreListings,'Verified store submissions']]) {
     const cell=node('div',undefined,'stat');cell.append(node('strong',value.toLocaleString()),node('small',label));el.append(cell);
   }
 }
 function render(reset) {
   if(reset)state.shown=0;
   state.filtered=api.filter(state.entries,{
     query:$('query').value,store:$('store').value,category:$('category').value,
     coverage:$('coverage').value,capability:$('capability').value
   });
   $('count').textContent=state.filtered.length.toLocaleString()+' matching';
   $('results').replaceChildren();
   nextPage();
 }
 function addText(nodeParent,tag,value) {
   nodeParent.appendChild(node(tag,value||'Not classified'));
 }
 function card(r) {
   const c=node('article',undefined,'card');
   c.append(node('h3',r.title),node('small',r.path));
   const overview=node('p',r.rationale);c.append(overview);
   const tags=node('div',undefined,'tags');
   for(const id of r.capabilities)tags.append(node('span',id,'tag'));
   if(!r.capabilities.length)tags.append(node('span','Functions pending source review','tag'));
   c.append(tags);
   const dl=node('dl');
   const fields=[
     ['Apple',r.apple.primary?r.apple.primary+(r.apple.secondary?' · '+r.apple.secondary:''):'Unclassified'],
     ['Apple genre',r.apple.genre||'None specified'],
     ['Google Play',r.google.category? r.google.category+' ('+r.google.type+')':'Unclassified'],
     ['Google tags',r.google.tagCandidates.length?r.google.tagCandidates.join(', '):'Select only from official Play Console tags'],
     ['Evidence',r.evidence.kind],
     ['Publication','Not submitted to stores']
   ];
   for(const [k,v] of fields) {dl.append(node('dt',k));dl.append(node('dd',v));}
   c.append(dl);
   const links=node('div',undefined,'row');
   const link=node('a','Open original GitHub file');
   link.href='https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/'+r.path.split('/').map(encodeURIComponent).join('/');
   link.rel='noopener noreferrer';link.target='_blank';links.append(link);
   const page=node('a','Open existing web app');
   page.href='../../../'+r.path.split('/').map(encodeURIComponent).join('/');
   page.target='_blank';page.rel='noopener noreferrer';links.append(page);
   c.append(links);
   return c;
 }
 function nextPage() {
   const batch=state.filtered.slice(state.shown,state.shown+60);
   const fragment=document.createDocumentFragment();
   for(const record of batch) fragment.append(card(record));
   $('results').append(fragment);
   state.shown+=batch.length;
   $('more').hidden=state.shown>=state.filtered.length;
 }
 function exportData() {
   const content=JSON.stringify({
     schema:'nathan-ai.store-discovery-export.v1',sourceTree:state.source.baseCommit,
     storeStatus:'no-submissions',method:'Optional distribution categories, never proof of deployed app',
     entries:state.filtered
   },null,2);
   const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
   const a=node('a');a.href=url;a.download='nathan-ai-store-discovery.json';
   document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 async function start() {
   try{
     if(!api)throw Error('Store taxonomy engine unavailable');
     const [inventoryResponse,categoryResponse]=await Promise.all([
       fetch('inventory.json',{cache:'no-store'}),fetch('store-discovery.json',{cache:'no-store'})
     ]);
     if(!inventoryResponse.ok||!categoryResponse.ok)throw Error('Catalog or GitHub inventory could not load');
     const [inventory,manifest]=await Promise.all([inventoryResponse.json(),categoryResponse.json()]);
     state.source=inventory;state.manifest=manifest;state.entries=api.build(inventory,manifest);
     stats();
     const categories=new Set();
     const functions=new Set();
     for(const r of state.entries) {
       [r.apple.primary,r.apple.secondary,r.apple.genre,r.google.category].filter(Boolean).forEach(x=>categories.add(x));
       r.capabilities.forEach(x=>functions.add(x));
     }
     [...categories].sort().forEach(x=>option($('category'),x));
     [...functions].sort().forEach(x=>option($('capability'),x));
     for(const key of ['query','store','category','coverage','capability']) {
       $(key).addEventListener(key==='query'?'input':'change',()=>render(true));
     }
     $('more').addEventListener('click',nextPage);
     $('reset').addEventListener('click',()=>{
       $('query').value='';['store','category','coverage','capability'].forEach(k=>$(k).value='All');render(true);
     });
     $('export').addEventListener('click',exportData);
     $('status').textContent='Loaded the source GitHub tree and the non-binding store category proposals. All unreviewed entrypoints remain visible.';
     render(true);
   }catch(e){
     $('status').textContent='Classification catalog unavailable: '+e.message;
     $('stats').textContent='Could not verify the source file inventory';
     $('more').hidden=true;
   }
 }
 start();
})();