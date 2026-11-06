/* Consumer directory UI — no geolocation, account collection, analytics, auto-launch, or regulatory certification.
   Every external source link is explicitly user-activated, and original works stay in their own modules. */
(function(){'use strict';
const api=window.NathanConsumer;
const $=id=>document.getElementById(id);
let products=null,law=null,selection={query:'',category:'all',stage:'all'},active=null;
function el(parent,tag,text,cls){
 const node=document.createElement(tag);
 if(text!==undefined&&text!==null)node.textContent=String(text);
 if(cls)node.className=cls;
 parent.appendChild(node);return node;
}
function selectOption(parent,value,label){
 const opt=document.createElement('option');opt.value=value;opt.textContent=label;parent.appendChild(opt);return opt;
}
function status(msg){$('load-status').textContent=msg}
function clear(node){node.replaceChildren()}
function link(parent,label,href,cls){
 const a=el(parent,'a',label,cls);
 a.href=href;return a;
}
function getProduct(id){return products.products.find(x=>x.id===id)}
function renderStats(){
 const host=$('stats');clear(host);
 for(const [number,label]of [[products.products.length,'Original-source product routes'],[api.categories(products).length,'Consumer task categories'],[law.jurisdictions.length,'Jurisdiction-specific guidance entries'],['0','Products independently certified worldwide by this directory']]){
  const card=el(host,'div',null,'metric');el(card,'strong',number);el(card,'span',label);
 }
}
function renderCards(){
 const host=$('programs');clear(host);
 const filtered=api.filterProducts(products,selection);
 $('count').textContent=filtered.length+' matching programs · '+products.products.length+' source-backed routes';
 for(const p of filtered){
  const card=el(host,'article',null,'product');card.dataset.selected=String(active===p.id);
  el(card,'span',products.stages[p.stage],'pill');
  el(card,'h3',p.name);
  el(card,'p',p.task);
  el(card,'span',p.category,'chip');
  const button=el(card,'button','Review this program →');
  button.type='button';button.setAttribute('aria-label','Review '+p.name);
  button.addEventListener('click',()=>{
   active=p.id;renderCards();renderProduct();$('details-title').scrollIntoView({behavior:'auto',block:'start'});
  });
 }
 if(!filtered.length)el(host,'p','No matching programs. Clear or adjust the filters.','muted');
}
function renderProduct(){
 const host=$('program-details');clear(host);
 const p=getProduct(active);
 if(!p){el(host,'p','Choose a program above to review its purpose and cautions.','muted');return}
 el(host,'h3',p.name);
 el(host,'p',p.details);
 const tags=el(host,'div',null,'entry-info');
 el(tags,'span',p.category,'chip');el(tags,'span',products.stages[p.stage],'chip');
 el(host,'h3','Read these limits before opening');
 const list=el(host,'ul',null,'warning-list');
 for(const text of api.productDisclaimers(p))el(list,'li',text);
 const special=p.stage==='owner-local-browser'||p.stage==='developer-preview';
 if(special)el(host,'p',p.stage==='developer-preview'?
  'This is a developer or research demonstration and cannot replace installed professional protection.':
  'This app may keep personal records on your own device. Choose a trusted private device and make an independent backup.','risk');
 let acknowledged=!special;
 if(special){
  const row=el(host,'label',null,'check');
  const cb=el(row,'input');cb.type='checkbox';
  el(row,'span','I have reviewed the limitations above. This acknowledgement is not legal consent or identity verification.');
  cb.addEventListener('change',()=>{acknowledged=cb.checked;launch.setAttribute('aria-disabled',String(!acknowledged));launch.tabIndex=acknowledged?0:-1;help.textContent=acknowledged?'You can now open the separate source app.':'Review and check the notice before opening.'});
 }
 const launch=link(host,'Open '+p.name,p.href,'open-link');
 launch.setAttribute('aria-disabled',String(!acknowledged));
 launch.tabIndex=acknowledged?0:-1;
 launch.addEventListener('click',event=>{if(!acknowledged)event.preventDefault()});
 const help=el(host,'p',special?'Review and check the notice before opening.':'Opens the existing browser application; its own notices and storage rules may differ.','small');
 const download=el(host,'button','Download this program’s plain-language cautions');
 download.type='button';
 download.addEventListener('click',()=>{
  const text='NATHAN AI / ONE — CONSUMER SOURCE NOTICE\n'+p.name+'\n'+p.task+'\n'+
   'Source stage: '+products.stages[p.stage]+'\n\n'+api.productDisclaimers(p).map((n,i)=>(i+1)+'. '+n).join('\n')+
   '\n\nRead applicable local law and individual module notices. This file is not legal advice or proof of certification.\n';
  const u=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=u;a.download='nathan-ai-'+p.id+'-consumer-notice.txt';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);
 });
}
function renderRegion(){
 const host=$('region-details');clear(host);
 const region=api.regionById(law,$('region').value);
 el(host,'h3',region.name);
 el(host,'p',region.law);
 el(host,'h3','Checks before offering consumer services here');
 const list=el(host,'ol',null,'steps');
 region.checks.forEach(s=>el(list,'li',s));
 el(host,'h3','Official regulatory material');
 const links=el(host,'div',null,'source-links');
 region.sources.forEach(s=>{const a=link(links,s.title,s.url);a.target='_blank';a.rel='noopener noreferrer'});
 el(host,'p','Links are for research only. Requirements depend on the actual operator, processing, user age, service features and release date. Consult qualified local advice before declaring compliance.','small');
}
function renderGates(){
 const host=$('gates');clear(host);
 for(const g of api.releaseChecklist(law)){
  const row=el(host,'section',null,'gate');
  el(row,'h3',g.title);
  el(row,'p',g.requirement,'muted');
  el(row,'span','NOT CERTIFIED — requires evidence and applicable professional review','state');
 }
}
function setup(){
 const categories=api.categories(products);for(const cat of categories)selectOption($('category'),cat,cat);
 for(const [key,label]of Object.entries(products.stages))selectOption($('stage'),key,label);
 const region=$('region');
 selectOption(region,'','Choose a market (no location detection)');
 law.jurisdictions.forEach(r=>selectOption(region,r.id,r.name));
 region.value='other';
 $('query').addEventListener('input',()=>{selection.query=$('query').value;renderCards()});
 $('category').addEventListener('change',()=>{selection.category=$('category').value;renderCards()});
 $('stage').addEventListener('change',()=>{selection.stage=$('stage').value;renderCards()});
 region.addEventListener('change',renderRegion);
 const quote=$('creator-quote');quote.textContent='“'+law.conceptualVocabulary.creatorExactWords+'” — Nathan Tabor';
 $('creator-clarification').textContent=law.conceptualVocabulary.category+'. '+law.conceptualVocabulary.clarification;
 renderStats();renderCards();renderRegion();renderGates();
 active=products.products[0].id;renderProduct();
 status('Public source index loaded. No account, location lookup or new personal-data collection initiated by this page.');
}
Promise.all([
 fetch('./products.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Product list unavailable');return r.json()}),
 fetch('./jurisdictions.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Jurisdiction notices unavailable');return r.json()})
]).then(([p,j])=>{api.verifyProducts(p);api.verifyJurisdictions(j);products=p;law=j;setup()})
.catch(e=>{status('Consumer directory could not open: '+e.message+'. Serve via HTTPS or a local web server.');el($('programs'),'p','Source list could not be verified. No app links were opened.','risk')});
})();
