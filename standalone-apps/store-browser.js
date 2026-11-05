/* Nathan AI App-Store-Style Catalog
 * Editorial browse labels for source-preserving public routes and derived editions.
 * No Apple/Google account access, store submission or original code rewrite.
 */
(function(){'use strict';
const base=new URL('./',document.currentScript.src),repoRoot=new URL('../',base),$=id=>document.getElementById(id);
const el=(tag,label,className)=>{const n=document.createElement(tag);if(typeof label==='string')n.textContent=label;if(className)n.className=className;return n};
const safePath=p=>typeof p==='string'&&p.length<310&&/^(?:standalone-apps\/|app-factory\/|archive-index\/|index\.html$)/.test(p)&&p.endsWith('.html')&&!p.includes('..')&&!/[\\?#:%\x00-\x1f]/.test(p);
const assetLink=(path)=>{if(!safePath(path))throw Error('Untrusted local path');return new URL(path,repoRoot).href};
const selections={store:'apple',type:'all',category:'all',genre:'all',collection:'all',sort:'title',query:''};
let publicSources=[],cards=[],taxonomy=null,limit=24;
const labelFor=(r)=>selections.store==='apple'?r.apple.primary:r.google.category;
const isGame=r=>r.google.type==='Game';
const matches=(r,ignoreCategory=false)=>{
 if(selections.collection!=='all'&&selections.collection!==r.collection)return false;
 if(selections.type==='games'&&!isGame(r))return false;
 if(selections.type==='apps'&&isGame(r))return false;
 if(!ignoreCategory&&selections.category!=='all'&&labelFor(r)!==selections.category)return false;
 if(selections.genre!=='all'){
  if(!isGame(r))return false;
  const genres=selections.store==='apple'?r.apple.gameGenres:[r.google.category];
  if(!genres.includes(selections.genre))return false;
 }
 const text=[r.title,r.sourcePath||'',r.route,r.apple.primary,r.apple.secondary||'',r.google.category,...r.google.suggestedTags,
    ...(r.apple.gameGenres||[]),r.developmentStage].join(' ').toLocaleLowerCase();
 return !selections.query||text.includes(selections.query);
};
const selectedOrder=(a,b)=>selections.sort==='category'?
  labelFor(a).localeCompare(labelFor(b))||a.title.localeCompare(b.title):
  selections.sort==='source'?a.route.localeCompare(b.route):a.title.localeCompare(b.title);
const anchors=(r)=>{
 const links=el('div',undefined,'links'),launch=el('a','Open '+(r.collection==='independent-edition-variant'?'edition':'standalone'));
 launch.href=assetLink(r.route);links.append(launch);
 if(r.collection==='standalone-public-route'){
  const original=el('a','Original program');original.href=assetLink(r.sourcePath);original.target='_blank';original.rel='noopener noreferrer';
  links.append(original);
 }else if(r.collection==='capability-atlas-reviewed-source'){
  const original=el('a','Open reviewed original');original.href=assetLink(r.sourcePath);original.target='_blank';original.rel='noopener noreferrer';
  links.append(original);
 }else{
  for(const form of ['app','game','book','academy']){
   const a=el('a',form.toUpperCase());a.href=assetLink(r.route)+'?form='+encodeURIComponent(form);a.className='form-link';links.append(a);
  }
 }
 return links;
};
function cardFor(r){
 const c=el('article',undefined,'program');
 const top=el('div',undefined,'store-card-top'),kind=el('span',isGame(r)?'GAME':'APP','type');
 const label=el('span',r.collection==='independent-edition-variant'?'EDITION VARIANT':r.collection==='capability-atlas-reviewed-source'?'CAPABILITY-REVIEWED SOURCE':'GITHUB STANDALONE','collection');
 top.append(kind,label);
 const h=el('h3',r.title),line=el('p',r.collection==='independent-edition-variant'?'Existing four-format independent edition':r.collection==='capability-atlas-reviewed-source'?'Existing reviewed public source page; no new standalone wrapper':'Existing program at its original source location','summary');
 const category=el('p',undefined,'category-value');
 if(selections.store==='apple'){
   category.textContent='Apple · '+r.apple.primary+(r.apple.secondary?' / '+r.apple.secondary:'');
 }else{
   category.textContent='Google Play · '+r.google.type+' / '+r.google.category;
 }
 const genres=el('p',undefined,'genres');
 if(isGame(r))genres.textContent='Genre · '+(selections.store==='apple'?r.apple.gameGenres.join(', '):r.google.category);
 const tags=el('p',r.google.suggestedTags.slice(0,5).join(' · '),'tags');
 const stage=el('p','Source status · '+r.developmentStage,'stage'),path=el('p',r.sourcePath||r.route,'path');
 const mark=el('p','Proposed directory category · Not submitted to any app store','proposal');
 c.append(top,h,line,category);if(isGame(r))c.append(genres);
 c.append(tags,stage,path);
 if(r.priorCapabilityAtlasReview){
   const evidence=el('p','Existing Capability Atlas: '+r.priorCapabilityAtlasReview.capabilities.join(', ')+'. '+r.priorCapabilityAtlasReview.rationale,'prior-review');
   c.append(evidence);
   if(r.classificationRequiresReconciliation){
     c.append(el('p','Category review needed: earlier proposal '+r.priorCapabilityAtlasReview.applePrimary+' (Apple) / '+r.priorCapabilityAtlasReview.googleCategory+' (Google Play).','category-conflict'));
   }
 }
 c.append(anchors(r),mark);
 return c;
}
function options(id,values,value){
 const node=$(id);node.replaceChildren(new Option('All '+(id==='genre'?'game genres':'categories'),'all'));
 for(const name of values){node.add(new Option(name,name))}
 node.value=values.includes(value)?value:'all';return node.value;
}
function filterData(){
 return cards.filter(r=>matches(r)).sort(selectedOrder);
}
function updateCategories(){
 const categoryCounts=new Map(),genreCounts=new Map();
 for(const r of cards.filter(x=>matches(x,true))){
  const cat=labelFor(r);categoryCounts.set(cat,(categoryCounts.get(cat)||0)+1);
  if(isGame(r)){for(const g of (selections.store==='apple'?r.apple.gameGenres:[r.google.category]))genreCounts.set(g,(genreCounts.get(g)||0)+1)}
 }
 const available=[...categoryCounts.keys()].sort((a,b)=>a.localeCompare(b));
 const current=options('category',available,selections.category);selections.category=current;
 const chips=$('category-cards');chips.replaceChildren();
 for(const name of available){
  const b=el('button',name+' · '+categoryCounts.get(name),'category-chip');b.type='button';
  b.setAttribute('aria-pressed',String(selections.category===name));b.onclick=()=>{
   selections.category=selections.category===name?'all':name;limit=24;render();
  };
  chips.append(b);
 }
 const games=[...new Set(cards.filter(x=>isGame(x)).flatMap(x=>selections.store==='apple'?x.apple.gameGenres:[x.google.category]))].sort();
 selections.genre=options('genre',games,selections.genre);
 $('genre-wrap').hidden=selections.type==='apps'||games.length===0;
 $('categories-label').textContent=selections.store==='apple'?'Apple App Store categories':'Google Play categories';
 $('store-explanation').textContent=selections.store==='apple'?
   'Apple: primary category, optional secondary category, and up to two game genres. These are proposed choices.' :
   'Google Play: one app category OR one game genre, plus up to five suggested discovery keywords. Verify selectable tags in Play Console.';
}
function render(){
 updateCategories();
 const rows=filterData(),holder=$('programs');holder.replaceChildren();
 for(const r of rows.slice(0,limit))holder.append(cardFor(r));
 $('count').textContent=rows.length+' matching source-preserving catalog records · '+Math.min(limit,rows.length)+' shown';
 $('more').hidden=limit>=rows.length;
 if(!rows.length)holder.append(el('p','No entries match these filters. Try a different category, genre or search term.','empty'));
 const counts=cards.reduce((o,x)=>{o[x.collection]=(o[x.collection]||0)+1;return o},{});
 $('total').textContent=String(cards.length);
 $('registry-counts').textContent=counts['standalone-public-route']+' original standalone routes + '+counts['independent-edition-variant']+' independent edition variants + '+(counts['capability-atlas-reviewed-source']||0)+' existing Capability Atlas-reviewed source pages. Editions are not additional unique underlying products.';
 $('family-counts').textContent=cards.filter(isGame).length+' indexed game routes. The remaining records are apps, creative studios, research tools and edition variants.';
 const params=new URLSearchParams();
 if(selections.store!=='apple')params.set('store',selections.store);
 if(selections.type!=='all')params.set('type',selections.type);
 if(selections.category!=='all')params.set('category',selections.category);
 if(selections.genre!=='all')params.set('genre',selections.genre);
 if(selections.collection!=='all')params.set('collection',selections.collection);
 if(selections.query)params.set('q',selections.query);
 const query=params.toString();
 if(typeof history!=='undefined'&&history.replaceState)history.replaceState(null,'',location.pathname+(query?'?'+query:'')+location.hash);
}
function onFilter(id,key){
 $(id).addEventListener('change',()=>{selections[key]=$(id).value;limit=24;if(key==='store'){selections.category='all';selections.genre='all';}if(key==='type'){selections.category='all';selections.genre='all';}render()});
}
async function load(){
 const status=$('status');
 try{
  const [catalogResp,taxResp]=await Promise.all([fetch(new URL('catalog.json',base)),fetch(new URL('store-taxonomy.json',base))]);
  if(!catalogResp.ok||!taxResp.ok)throw Error('Source catalog or category mapping unavailable');
  const [catalog,tax]=await Promise.all([catalogResp.json(),taxResp.json()]);
  if(catalog.schema!=='nathan-ai.standalone-apps.v1'||tax.schema!=='nathan-ai.app-store-taxonomy.v1'||!Array.isArray(tax.records)||
     tax.records.length!==catalog.entries.length||!Array.isArray(tax.editions)||tax.editions.length>100||!Array.isArray(tax.additionalReviewed)||tax.additionalReviewed.length>100)throw Error('Catalog version or count mismatch');
  const original=new Map(catalog.entries.map(x=>[x.id,x]));const seen=new Set();
  for(const r of tax.records){
   const source=original.get(r.catalogId);
   if(!source||seen.has(r.catalogId)||source.sourcePath!==r.sourcePath||source.standalonePath!==r.route||!safePath(r.route)||!safePath(r.sourcePath))throw Error('Source preservation link mismatch');
   seen.add(r.catalogId);
  }
  if(seen.size!==original.size)throw Error('Unmapped original source');
  for(const r of [...tax.records,...tax.editions,...tax.additionalReviewed]){
   if(!safePath(r.route)||!r.apple||!r.google||typeof r.title!=='string'||!Array.isArray(r.apple.gameGenres)||!Array.isArray(r.google.suggestedTags)||
      r.google.suggestedTags.length>5||!['Game','App'].includes(r.google.type)||r.review!=='editorial-category-proposal-not-store-submission')
      throw Error('Invalid category metadata');
  }
  taxonomy=tax;publicSources=catalog.entries;cards=[...tax.records,...tax.editions,...tax.additionalReviewed];
  const params=new URLSearchParams(location.search);
  selections.store=params.get('store')==='google'?'google':'apple';
  selections.type=['all','apps','games'].includes(params.get('type'))?params.get('type'):'all';
  selections.collection=['all','standalone-public-route','independent-edition-variant','capability-atlas-reviewed-source'].includes(params.get('collection'))?params.get('collection'):'all';
  selections.category=params.get('category')||'all';
  selections.genre=params.get('genre')||'all';
  selections.query=(params.get('q')||'').slice(0,160).toLocaleLowerCase();
  $('search').value=selections.query;$('group').value=selections.type;$('store').value=selections.store;$('collection').value=selections.collection;
  onFilter('store','store');onFilter('group','type');onFilter('category','category');onFilter('genre','genre');onFilter('collection','collection');onFilter('sort','sort');
  $('search').addEventListener('input',()=>{selections.query=$('search').value.trim().toLocaleLowerCase();limit=24;render()});
  $('more').addEventListener('click',()=>{limit+=24;render()});
  document.addEventListener('keydown',e=>{if(e.defaultPrevented||e.altKey||e.metaKey||e.target.closest('input,select,textarea,[contenteditable]'))return;
   if(e.key==='/'){e.preventDefault();$('search').focus()}}
  );
  render();
  status.textContent='Original sources checked. Category assignments are editorial suggestions for browsing and future App Store Optimization review.';
 }catch(e){status.textContent='Unable to display category directory: '+e.message}
}
load();
})();