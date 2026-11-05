(function(){
 'use strict';
 const taxonomy=window.NathanLandingTaxonomy;
 const storeEngine=window.NathanStoreDiscovery;
 const $=id=>document.getElementById(id);
 const state={records:[],inventory:null,axis:'center',direction:'forward',coordinate:0,ddc:'',apple:'',google:'',genre:'',capability:'',review:'',query:'',storeView:'apple',historicalMethod:'',deo:null,limit:24};
 const button=(label,cls)=>{const b=document.createElement('button');b.type='button';b.textContent=String(label);if(cls)b.className=cls;return b;};
 const span=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el;};
 const joinUrl=(prefix,path)=>prefix+String(path).split('/').map(encodeURIComponent).join('/');
 const originUrl=path=>joinUrl('./',path);
 function levelButtons(){
   for(const [id,list] of [['above-levels',taxonomy.ABOVE],['below-levels',taxonomy.BELOW]]){
     const element=$(id);element.replaceChildren();
     for(const n of list){const b=button(n>0?'+'+n:String(n));
       b.setAttribute('aria-pressed',state.coordinate===n?'true':'false');
       b.addEventListener('click',()=>changeCoordinate(n));
       element.append(b);
     }
   }
 }
 function changeCoordinate(n){
   state.coordinate=Math.max(-9,Math.min(9,Number(n)||0));$('spectrum-range').value=String(state.coordinate);
   $('spectrum-output').textContent=(state.coordinate>0?'+':'')+state.coordinate;
   $('spectrum-explain').textContent=state.coordinate===0?
     'At 0: all directions meet. Choose an axis or a number.':
     'Whole-number depth '+Math.abs(state.coordinate)+' · '+(state.coordinate>0?'upward / above':'downward / below')+
     ' · inspect progressively more attributes without changing originals.';
   if(state.coordinate>0)state.axis='up';
   if(state.coordinate<0)state.axis='down';
   if(state.coordinate===0)state.axis='center';
   selectAxis(state.axis,false);
   levelButtons();
 }
 function selectAxis(axis,scroll){
   if(!taxonomy.AXES[axis])return;
   state.axis=axis;
   for(const el of document.querySelectorAll('[data-axis]'))el.setAttribute('aria-pressed',el.dataset.axis===axis?'true':'false');
   $('axis-title').textContent=taxonomy.AXES[axis].label;
   $('axis-desc').textContent=taxonomy.AXES[axis].description;
   if(axis==='left'&&state.historicalMethod){
     const row=taxonomy.HISTORICAL.find(x=>x.id===state.historicalMethod);
     if(row)$('axis-desc').textContent=row.method;
   }
   if(scroll){
     const section={up:'dewey',down:'catalog',left:'historical',right:'stores',center:'pyramids'}[axis];
     $(section).scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
   }
   renderResults();
 }
 function toggleDirection(){
   state.direction=state.direction==='forward'?'reverse':'forward';
   $('reverse-order').setAttribute('aria-pressed',state.direction==='reverse'?'true':'false');
   $('reverse-order').textContent='⇄ Reverse: '+(state.direction==='reverse'?'ON':'OFF');
   renderHistorical();renderDewey();renderStores();renderResults();
 }
 function clearTaxonomyFilters(){
   state.ddc='';state.apple='';state.google='';state.genre='';state.capability='';state.review='';state.query='';
   $('search').value='';$('filter-capability').value='';$('filter-review').value='';
   state.limit=24;
 }
 function resetAll(){
   clearTaxonomyFilters();state.historicalMethod='';state.deo=null;
   state.direction='forward';$('reverse-order').setAttribute('aria-pressed','false');$('reverse-order').textContent='⇄ Reverse: OFF';
   changeCoordinate(0);renderDewey();renderHistorical();renderStores();renderDEO();renderResults();
 }
 function renderHistorical(){
   const root=$('history-timeline');root.replaceChildren();
   const rows=taxonomy.HISTORICAL.slice();
   if(state.direction==='reverse')rows.reverse();
   for(const item of rows){
     const b=button('', 'history-card');b.setAttribute('aria-pressed',state.historicalMethod===item.id?'true':'false');
     b.append(span('span',item.era),span('strong',item.name),span('p',item.method));
     b.addEventListener('click',()=>{
       state.historicalMethod=state.historicalMethod===item.id?'':item.id;
       selectAxis('left',false);renderHistorical();
     });
     root.append(b);
   }
 }
 function renderDewey(){
   const root=$('dewey-grid');root.replaceChildren();
   const rows=taxonomy.DEWEY.slice();
   if(state.direction==='reverse')rows.reverse();
   for(const cls of rows){
     const b=button('','dewey-card');
     b.setAttribute('aria-pressed',state.ddc===cls.code?'true':'false');
     b.append(span('span',cls.code),span('strong',cls.title));
     b.addEventListener('click',()=>{
       state.ddc=state.ddc===cls.code?'':cls.code;state.limit=24;
       selectAxis('up',false);renderDewey();
       $('catalog').scrollIntoView({behavior:'smooth'});
     });
     root.append(b);
   }
 }
 function renderDEO(){
   const root=$('deo-digits');root.replaceChildren();
   for(const n of taxonomy.DEO.digits){
     const b=button(String(n));b.setAttribute('aria-pressed',state.deo===n?'true':'false');
     b.addEventListener('click',()=>{
       state.deo=state.deo===n?null:n;
       $('deo-status').textContent=state.deo===null?'0–9 reserved · definitions pending':
         'DEO '+state.deo+': no definition or product assignment supplied; originals remain uncategorized by this scheme.';
       renderDEO();
     });root.append(b);
   }
 }
 function categories(){
   const root=$('store-categories');root.replaceChildren();
   const cats=state.storeView==='apple'?taxonomy.APPLE:state.storeView==='google'?taxonomy.GOOGLE:taxonomy.GAMES;
   const ordered=cats.slice();if(state.direction==='reverse')ordered.reverse();
   for(const category of ordered){
     const count=state.records.filter(r=>state.storeView==='apple'?r.apple.primary===category||r.apple.secondary===category:
         state.storeView==='google'?r.google.category===category:r.apple.genre===category||r.google.category===category&&r.google.type==='game').length;
     const active=state.storeView==='apple'?state.apple===category:state.storeView==='google'?state.google===category:state.genre===category;
     const b=button('','category-card');
     b.setAttribute('aria-pressed',active?'true':'false');
     b.append(span('strong',category),span('small',String(count)));
     b.addEventListener('click',()=>{
       const key=state.storeView==='apple'?'apple':state.storeView==='google'?'google':'genre';
       state[key]=state[key]===category?'':category;
       state.limit=24;selectAxis('right',false);renderStores();
       $('catalog').scrollIntoView({behavior:'smooth'});
     });root.append(b);
   }
 }
 function renderStores(){
   for(const b of document.querySelectorAll('[data-store-view]'))b.setAttribute('aria-pressed',b.dataset.storeView===state.storeView?'true':'false');
   categories();
 }
 function selected(){
   let records=taxonomy.selectRecords(state.records,{
     axis:state.axis,ddc:state.ddc,apple:state.apple,google:state.google,
     capability:state.capability,query:state.query,order:state.direction
   });
   if(state.review==='mapped')records=records.filter(r=>r.apple.primary);
   if(state.review==='unclassified')records=records.filter(r=>!r.apple.primary);
   if(state.genre)records=records.filter(r=>r.apple.genre===state.genre||r.google.type==='game'&&r.google.category===state.genre);
   if(state.axis==='left'&&state.historicalMethod){
     const method=taxonomy.HISTORICAL.find(x=>x.id===state.historicalMethod);
     const sortBy=method?method.sort:'title';
     if(sortBy==='path'||sortBy==='scope')records.sort((a,b)=>a.path.localeCompare(b.path));
     else if(sortBy==='ddc')records.sort((a,b)=>(a.ddc||'999').localeCompare(b.ddc||'999'));
     else if(sortBy==='capability')records.sort((a,b)=>b.capabilities.length-a.capabilities.length);
     else if(sortBy==='category')records.sort((a,b)=>(a.apple.primary||'zzz').localeCompare(b.apple.primary||'zzz'));
     else records.sort((a,b)=>a.title.localeCompare(b.title));
     if(state.direction==='reverse')records.reverse();
   }
   return records;
 }
 function appCard(row){
   const card=span('article',undefined,'app-card');
   const heading=span('h3');
   const link=span('a',row.title);link.href=originUrl(row.path);heading.append(link);
   card.append(heading);
   card.append(span('span',row.path,'path'));
   const facets=span('div',undefined,'badges');
   if(row.apple.primary)facets.append(span('span','Apple · '+row.apple.primary));
   if(row.google.category)facets.append(span('span','Google · '+row.google.category));
   if(row.ddc)facets.append(span('span','DDC crosswalk · '+row.ddc));
   if(!row.apple.primary)facets.append(span('span','Unclassified · source retained'));
   const depth=Math.abs(state.coordinate);
   if(depth>=2||state.axis==='down'){
     for(const ability of row.capabilities.slice(0,depth>=7?18:4))facets.append(span('span',ability));
   }
   if(depth>=4||state.axis==='left')card.append(span('p',row.rationale));
   if(depth>=6){
     card.append(span('p','Evidence: '+row.evidence.kind+' · Store status: '+row.status));
   }
   card.append(facets);
   const actions=span('div',undefined,'links');
   const orig=span('a','Open original');orig.href=originUrl(row.path);actions.append(orig);
   const source=span('a','GitHub code');source.href=joinUrl('https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/',row.path);source.target='_blank';source.rel='noopener noreferrer';actions.append(source);
   card.append(actions);return card;
 }
 function renderResults(){
   if(!state.records.length)return;
   const all=selected(),list=all.slice(0,state.limit);
   $('catalog-grid').replaceChildren(...list.map(appCard));
   $('result-summary').textContent=all.length.toLocaleString()+' matching originals · '+state.axis+
      ' · '+(state.direction==='forward'?'forward':'reverse')+
      (state.ddc?' · Dewey '+state.ddc:'')+(state.apple?' · Apple '+state.apple:'')+
      (state.google?' · Google '+state.google:'')+(state.genre?' · '+state.genre:'');
   $('more-results').hidden=state.limit>=all.length;
   if(!all.length){$('catalog-grid').append(span('p','No classified matches. Clear filters to include all original and unreviewed projects.'));}
 }
 function exportView(){
   const rows=selected().map(r=>({path:r.path,title:r.title,apple:r.apple,google:r.google,ddcCrosswalk:r.ddc,
     candidateFunctionalities:r.capabilities,evidence:r.evidence,sourceStatus:r.coverage}));
   const json=JSON.stringify({schema:'nathan-ai.full-spectrum-export.v1',originalsPreserved:true,
      crosswalkProvisional:true,deo:'No assignments without owner definitions',
      axis:state.axis,direction:state.direction,coordinate:state.coordinate,records:rows},null,2);
   const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
   const a=span('a');a.href=url;a.download='nathan-ai-full-spectrum-index.json';document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1500);
 }
 function chatUI(){
   const panel=$('chat-panel');
   $('open-chat').addEventListener('click',()=>{panel.hidden=false;$('close-chat').focus();});
   $('close-chat').addEventListener('click',()=>{panel.hidden=true;$('open-chat').focus();});
   window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){panel.hidden=true;$('open-chat').focus();}});
 }
 function wire(){
   for(const control of document.querySelectorAll('[data-axis]'))control.addEventListener('click',()=>selectAxis(control.dataset.axis,true));
   $('spectrum-range').addEventListener('input',e=>changeCoordinate(Number(e.target.value)));
   $('reverse-order').addEventListener('click',toggleDirection);
   $('reset-map').addEventListener('click',resetAll);
   $('search').addEventListener('input',e=>{state.query=e.target.value;state.limit=24;renderResults();});
   $('filter-capability').addEventListener('change',e=>{state.capability=e.target.value;state.limit=24;renderResults();});
   $('filter-review').addEventListener('change',e=>{state.review=e.target.value;state.limit=24;renderResults();});
   for(const btn of document.querySelectorAll('[data-store-view]'))btn.addEventListener('click',()=>{
     state.storeView=btn.dataset.storeView;state.limit=24;renderStores();
   });
   $('clear-filters').addEventListener('click',()=>{clearTaxonomyFilters();renderStores();renderDewey();renderResults();});
   $('download-index').addEventListener('click',exportView);
   $('more-results').addEventListener('click',()=>{state.limit+=24;renderResults();});
   chatUI();renderDEO();levelButtons();renderHistorical();renderDewey();
 }
 async function start(){
   wire();
   try{
     if(!taxonomy||!storeEngine)throw Error('The original catalog classification engine is unavailable');
     const [a,b]=await Promise.all([
       fetch('./app-factory/nathan-ai/capability-atlas/inventory.json',{cache:'no-store'}),
       fetch('./app-factory/nathan-ai/capability-atlas/store-discovery.json',{cache:'no-store'})
     ]);
     if(!a.ok||!b.ok)throw Error('Source inventory unavailable: '+a.status+' / '+b.status);
     const [inventory,manifest]=await Promise.all([a.json(),b.json()]);
     state.inventory=inventory;
     state.records=taxonomy.buildRecords(inventory,manifest,storeEngine);
     const coverage=taxonomy.mappingCoverage(state.records);
     $('count-apps').textContent=coverage.total.toLocaleString();
     $('count-classified').textContent=coverage.categorized.toLocaleString();
     $('count-original').textContent=coverage.unclassified.toLocaleString();
     taxonomy.FUNCTIONS.forEach(c=>{const o=span('option',c);o.value=c;$('filter-capability').append(o);});
     renderStores();renderResults();
   }catch(e){
     $('result-summary').textContent='Catalog could not load: '+e.message+
       '. Open the Nathan AI app hub and capability atlas through the direct links above.';
     $('more-results').hidden=true;
   }
 }
 document.addEventListener('DOMContentLoaded',start);
})();