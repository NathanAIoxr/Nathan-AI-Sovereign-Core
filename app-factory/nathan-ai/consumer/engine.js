/* NATHAN AI / ONE — consumer launch logic.
 * Source-factual product directory; no user data, network discovery or compliance certificate.
 * 1+1=2 BUILD · 1−1=0 CLEAR · preserve the original.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanConsumer=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const PRODUCTS_SCHEMA='nathan-ai.consumer.products.v1';
 const LAW_SCHEMA='nathan-ai.consumer.jurisdictions.v1';
 const PRACTICES_SCHEMA='nathan-ai.consumer.data-practices.v1';
 const STAGES=['public-browser-preview','owner-local-browser','developer-preview'];
 // Official-regulator/source domains audited for this dated research checklist.
 const OFFICIAL_HOSTS=new Set(['www.ftc.gov','cppa.ca.gov','commission.europa.eu','ai-act-service-desk.ec.europa.eu','digital-strategy.ec.europa.eu',
 'ico.org.uk','www.priv.gc.ca','www.gov.br','www.oaic.gov.au','www.privacy.org.nz','www.gov.za','www.pdpc.gov.sg','www.meity.gov.in','www.w3.org']);
 const must=(condition,message)=>{if(!condition)throw Error(message);};
 const has=(s,q)=>String(s??'').toLocaleLowerCase().includes(String(q??'').trim().toLocaleLowerCase());
 function safeLocalHref(href){
  // Relative to the nathan-ai/consumer directory. No protocols, queries, fragments or
  // embedded slash tricks; allows only static local HTML destinations.
  return typeof href==='string'&&/^(\.\.\/){1,2}[a-z0-9_-]+(?:\/[a-z0-9_-]+)*\/index\.html$/i.test(href)&&!/%|\\|\/\/|\s/.test(href);
 }
 function verifyProducts(data){
  must(data&&data.schema===PRODUCTS_SCHEMA&&Array.isArray(data.products)&&data.products.length>0,'Invalid consumer product catalog');
  const ids=new Set();
  for(const p of data.products){
   must(p&&/^[a-z0-9-]{2,40}$/.test(p.id)&&!ids.has(p.id),'Invalid or duplicate product');
   ids.add(p.id);
   for(const s of ['name','task','category','details'])must(typeof p[s]==='string'&&p[s].trim().length>5,'Missing consumer product '+s);
   must(STAGES.includes(p.stage),'Unknown product release stage');
   must(safeLocalHref(p.href),'Unsafe or non-local application link');
   must(Array.isArray(p.limits)&&p.limits.length>0&&p.limits.every(x=>typeof x==='string'&&x.length>10),'Missing product limitations');
   must(Array.isArray(p.tags)&&p.tags.every(x=>typeof x==='string'),'Invalid tags');
  }
  return {products:ids.size,stages:Object.freeze([...STAGES])};
 }
 function verifyJurisdictions(data){
  must(data&&data.schema===LAW_SCHEMA&&Array.isArray(data.jurisdictions)&&data.jurisdictions.length>0,'Invalid region guidance');
  must(Array.isArray(data.releaseGates)&&data.releaseGates.length>=6,'Missing consumer release gates');
  const ids=new Set();
  for(const r of data.jurisdictions){
   must(r&&/^[a-z0-9-]{2,20}$/.test(r.id)&&!ids.has(r.id),'Invalid or duplicate region');
   ids.add(r.id);
   must(typeof r.name==='string'&&r.name.trim()&&typeof r.law==='string'&&r.law.trim(),'Invalid region description');
   must(Array.isArray(r.checks)&&r.checks.length>0,'Region checks missing');
   must(Array.isArray(r.sources)&&r.sources.length>0,'Official source missing');
   for(const s of r.sources){
    let u;try{u=new URL(s.url)}catch{throw Error('Invalid legal source URL')}
    must(u.protocol==='https:'&&OFFICIAL_HOSTS.has(u.hostname)&&u.username===''&&u.password===''&&typeof s.title==='string'&&s.title.length>4,'Unsafe or unofficial legal source');
   }
  }
  const gates=new Set();
  for(const g of data.releaseGates){
   must(/^[a-z0-9-]{2,20}$/.test(g.id)&&!gates.has(g.id)&&typeof g.requirement==='string'&&g.requirement.length>20,'Invalid release gate');
   gates.add(g.id);
  }
  must(typeof data.conceptualVocabulary?.creatorExactWords==='string'&&
      typeof data.conceptualVocabulary?.clarification==='string','Creator attribution / geography clarification missing');
  return {jurisdictions:ids.size,gates:gates.size};
 }

 function verifyDataPractices(doc,products){
  verifyProducts(products);
  must(doc&&doc.schema===PRACTICES_SCHEMA&&Array.isArray(doc.records),'Invalid data practices schema');
  must(typeof doc.warning==='string'&&doc.warning.length>30,'Missing privacy research limitation');
  const ids=new Set(products.products.map(x=>x.id)),seen=new Set();
  for(const r of doc.records){
   must(r&&ids.has(r.id)&&!seen.has(r.id),'Unknown or duplicate privacy record');
   seen.add(r.id);
   for(const key of ['scope','inputs','deviceStorage','remoteActivity','evidenceLevel','ownerAction']){
    must(typeof r[key]==='string'&&r[key].trim().length>12,'Missing source privacy field '+key);
   }
   must(typeof r.evidencePath==='string'&&/^app-factory\/[a-z0-9/_\-.]+\.(?:js|md|html)$/i.test(r.evidencePath)
     &&!r.evidencePath.includes('..')&&!r.evidencePath.includes('//'),'Unsafe original-source evidence path');
  }
  must(ids.size===seen.size,'Some consumer products have no individual data-practice entry');
  return {records:seen.size,mode:'source-derived-not-runtime-certification'};
 }
 function dataPracticesFor(doc,id){
  must(doc&&Array.isArray(doc.records),'Invalid data practices');
  return doc.records.find(x=>x.id===id)||null;
 }
 function filterProducts(data,selection={}){
  verifyProducts(data);
  const q=String(selection.query||'').trim(),category=String(selection.category||'all'),stage=String(selection.stage||'all');
  return data.products.filter(p=>(category==='all'||p.category===category)&&(stage==='all'||p.stage===stage)&&
    (!q||[p.name,p.task,p.category,p.details,p.stage,...p.tags].some(v=>has(v,q))));
 }
 function categories(data){verifyProducts(data);return [...new Set(data.products.map(p=>p.category))].sort((a,b)=>a.localeCompare(b))}
 function regionById(data,id){
  verifyJurisdictions(data);
  return data.jurisdictions.find(r=>r.id===id)||data.jurisdictions.find(r=>r.id==='other')||data.jurisdictions[0];
 }
 function productDisclaimers(product){
  must(product&&Array.isArray(product.limits),'Invalid product');
  const baseline=[
   'This page lists source-backed previews. A listed program is not a guarantee of availability, legal certification, security, suitability or complete functionality.',
   'Your use of a linked application may involve separate local storage, a private passphrase, device permissions or server requests. Review that module before using it.'
  ];
  return [...baseline,...product.limits];
 }
 function releaseChecklist(data){
  verifyJurisdictions(data);
  // Research checklist, not a machine-generated legal permission.
  return data.releaseGates.map(g=>({id:g.id,title:g.title,requirement:g.requirement,status:'needs-owner-and-qualified-review'}));
 }
 return Object.freeze({PRODUCTS_SCHEMA,LAW_SCHEMA,PRACTICES_SCHEMA,STAGES,verifyProducts,verifyJurisdictions,verifyDataPractices,dataPracticesFor,safeLocalHref,
   filterProducts,categories,regionById,productDisclaimers,releaseChecklist});
});
