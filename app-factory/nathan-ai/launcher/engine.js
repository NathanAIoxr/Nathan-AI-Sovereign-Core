(function(root){
  'use strict';
  const KEY='nathan-ai.launcher.v1';
  const destinations=[
    ['original-works','My Original Works','original-works/index.html','Original manuscripts, saved words, earlier versions, canonical book titles and unchanged downloads'],
    ['universal-workspace','Universal Workspace','universal-workspace/index.html','Local tools and source workspace'],
    ['self-help','iCuBUDDY Self Help','self-help/index.html','Self help, Buddy AI and planning'],
    ['ai-mapping','AI Source Map','ai-mapping/index.html','Reaper, Omni God and source mapping'],
    ['omni-god','Omni God Binary Core','omni-god/index.html','Authored binary core and original source'],
    ['operations','Operation Convoy','operations/index.html','RAM and sovereign stack operations registry'],
    ['eyeprints','Eyeprints & Handprints','eyeprints-handprints/index.html','Local consent-based anatomy and research explorer'],
    ['command-center','Work & Assets Command Center','command-center/index.html','Projects, build tasks, wallet registry, assets, transactions, mining rewards, reports and audit'],
    ['home','Nathan AI Home','index.html','Start, overview, dashboard'],
    ['assistant','Ask Nathan AI','assistant/index.html','Questions, source answers, drafts, chat'],
    ['research','Research Workspace','index.html#workspace','Search original records, books and notes'],
    ['plugins','Apps & Plugins','plugins/index.html','Tools, connected workflows and handoffs'],
    ['connections','Sovereign Connections','sovereign/index.html','Coins, life timeline, source graph, ledger'],
    ['runtime','Formula & Node Runtime','node-runtime/index.html','Formula of Life, tasks, narrative simulation'],
    ['archive','Deep Archive','deep-archive/index.html','Artifacts, logs, files, fingerprints and derived views'],
    ['appearance','Appearance Studio','appearance/index.html','Skins, themes, fonts, contrast, look and feel'],
    ['activation','Formula of Life Activation','activation/index.html','Local activation lifecycle and original virtual registry'],
    ['phi-life','Formula of Life Explorer','phi-life/index.html','Original formula and virtual address explorer'],
    ['coin-matrix','Sovereign Coin Matrix','sovereign-coins/index.html','Original 21-ring coin source registry'],
    ['anchored-matrix','Anchored Matrix','sovereign-coins/anchored/index.html','Conditional rules and benchmark source'],
    ['coin-integrations','Coin Integration Dashboard','sovereign-coins/integrations/index.html','Provider capabilities and integration status'],
    ['coin-life','Coin-to-Life Matrix','sovereign-coins/life/index.html','Source-linked life definitions and voicebox references'],
    ['phi-mining','Phi Mining Validation','sovereign-coins/phi-mining/index.html','Offline historical proof-of-work vectors and validation'],
    ['architecture-63','Original Architecture 63','architecture-63/index.html','Play, build and think architecture concepts'],
    ['fifty-three-year','53-Year Source Navigator','fifty-three-year/index.html','Original timeline and toy/source navigator'],
    ['universal-tools','Universal 13 Tools','universal-tools/index.html','Tools, history and geometry games'],
    ['arrowhead-tree','Arrowhead Tree Matrix','universal-tools/arrowhead-tree.html','Geometry and tree matrix explorer'],
    ['books','Books & Reader','index.html#books','Reading records and original series'],
    ['games','Games & Puzzles','games/index.html','Game atlas and puzzle records'],
    ['children','Children & Innocence','children-innocence/index.html','Children’s book and protection catalog'],
    ['mind','Mind & Neuropath','mind-neuropath/index.html','Brain games and symbolic frameworks'],
    ['anatomy','Anatomy A–Z','anatomy/index.html','Body systems and authored frameworks'],
    ['m99-living-mammal','M-99 Living Mammal Matrix','matrix-grinder-m99/index.html','Universal Harmonic Gyre Box, five-matrix grinder, dual calf pumps, evidence review, bridge, anatomy and circulation'],
    ['family','Family Research','family-research/index.html','Tabor history and source-led investigation'],
    ['builds','Interfaces & Build Recovery','build-recovery/index.html','Build registry, recovered source references'],
    ['flyers','Flyer Studio','flyer-studio/index.html','Create and export marketing visuals'],
    ['architecture','Absolute Intelligence','absolute-intelligence/index.html','Named architecture and module definitions'],
    ['innocence','Innocence Matrix','innocence-matrix/index.html','Geometry and novel lab'],
    ['language','ROUTE · RAUT · ROOT','route-raut-root/index.html','Language, binary and mirrored words'],
    ['vault','Creator Vault','../vault.html','Original file storage and backups'],
    ['voicebox','Sealed Voice Box','../one/offloader/index.html','Encrypted original-file storage and voice notes'],
    ['five-guardians','Five Equal Guardians','five-guardians/index.html','Five creator-designated equal guardians and protective policy preview'],
    ['independent-editions','Originals · Independent Editions','independent-editions/index.html','Stand-alone program editions: apps, games, reading books, academies, HOP IN Chatbox handoff'],
    ['mosaic-reader','Mosaic Reader','../one/mosaic-reader/index.html','Original Mosaic Reader app, reading and game'],
    ['taborite-language-matrix','Taborite Language Matrix','../one/taborite-language-matrix/index.html','Distinct research, books, matrix and game']
  ].map(([id,title,path,description])=>({id,title,path,description}));
  function preferences(value){
    const known=new Set(destinations.map(d=>d.id));if(!value||!Array.isArray(value.favorites)||!Array.isArray(value.recent)||typeof value.remember!=='boolean')throw Error('Invalid launcher preferences');
    return {favorites:[...new Set(value.favorites.filter(x=>known.has(x)))].slice(0,12),recent:value.remember?[...new Set(value.recent.filter(x=>known.has(x)))].slice(0,6):[],remember:value.remember};
  }
  const defaults=()=>({favorites:[],recent:[],remember:false});
  function search(query){
    const words=String(query).toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    return destinations.map(d=>({...d,score:words.reduce((s,w)=>s+(d.id.includes(w)?5:0)+(d.title.toLocaleLowerCase().includes(w)?4:0)+(d.description.toLocaleLowerCase().includes(w)?1:0),0)})).filter(d=>!words.length||d.score>0).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title));
  }
  function favorite(prefs,id){if(!destinations.some(d=>d.id===id))throw Error('Unknown destination');const next=preferences(prefs);if(next.favorites.includes(id))next.favorites=next.favorites.filter(x=>x!==id);else{if(next.favorites.length>=12)throw Error('Maximum 12 pinned destinations');next.favorites.push(id)}return next}
  function visit(prefs,id){const next=preferences(prefs);if(next.remember&&destinations.some(d=>d.id===id))next.recent=[id,...next.recent.filter(x=>x!==id)].slice(0,6);return next}
  function handoff(question,source){
    if(typeof question!=='string'||!question.trim()||question.length>4000)throw Error('Invalid assistant question');
    const result={schema:'nathan-ai.source-handoff.v1',question:question.trim(),sources:[]};
    if(source){for(const [key,max]of [['id',1000],['title',2000],['text',1200],['stage',500]])if(typeof source[key]!=='string'||source[key].length>max)throw Error('Invalid source handoff');result.sources=[{id:source.id,title:source.title,text:source.text,stage:source.stage,private:Boolean(source.private)}]}
    return result;
  }
  const api={KEY,destinations,preferences,defaults,search,favorite,visit,handoff};if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanLauncher=api;
})(typeof window==='object'?window:globalThis);
