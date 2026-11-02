/* Local source graph and observation ledger. No network, wallet, mining or unlock operations. */
(function(root){
  'use strict';
  const SCHEMA='nathan-ai.sovereign-workspace.v1',KEY=SCHEMA;
  const KINDS=['coin','timeline','formula','system','source','claim','value'];
  const RELATIONS=['describes','references','belongs-to','linked-by-owner','supports','contradicts','relates-to'];
  const copy=x=>JSON.parse(JSON.stringify(x));
  const id=()=>globalThis.crypto.randomUUID();
  function text(x,name,max=20000,required=false){
    if(x===undefined&&!required)return '';
    if(typeof x!=='string'||x.length>max||(required&&!x.trim()))throw Error('Invalid '+name);
    return x;
  }
  function identifier(x){
    text(x,'ID',200,true);
    if(!/^[a-zA-Z0-9:._-]+$/.test(x))throw Error('IDs must use letters, numbers, colon, period, underscore or dash');
    return x;
  }
  function date(x,required=false){
    text(x,'date',10,required);
    if(!x&&!required)return '';
    if(!/^\d{4}-\d{2}-\d{2}$/.test(x)||Number.isNaN(Date.parse(x+'T00:00:00Z'))||new Date(x+'T00:00:00Z').toISOString().slice(0,10)!==x)throw Error('Use a valid date (YYYY-MM-DD)');
    return x;
  }
  function cents(x){
    if(typeof x!=='string'||!/^\d{1,15}(?:\.\d{1,2})?$/.test(x))throw Error('Enter a nonnegative USD amount with at most two decimal places');
    const [whole,fraction='']=x.split('.');return BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
  }
  function money(x){
    const negative=x<0n;if(negative)x=-x;
    return (negative?'-':'')+'$'+(x/100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',')+'.'+(x%100n).toString().padStart(2,'0');
  }
  function node(x){
    if(!x||!KINDS.includes(x.kind))throw Error('Unsupported record kind');
    return {id:identifier(x.id),kind:x.kind,title:text(x.title,'title',2000,true),summary:text(x.summary,'source text'),
      source:text(x.source,'source reference',2000,true),status:text(x.status,'source stage',200)||'Recorded source',
      symbol:text(x.symbol,'symbol',30),date:date(x.date||''),notes:text(x.notes,'notes')};
  }
  function unique(rows,label){const seen=new Set();for(const row of rows){if(seen.has(row.id))throw Error('Duplicate '+label+' ID: '+row.id);seen.add(row.id)}}
  function validate(value){
    if(!value||value.schema!==SCHEMA)throw Error('Unsupported connection-pack schema');
    for(const key of ['nodes','edges','observations'])if(!Array.isArray(value[key])||value[key].length>5000)throw Error('Invalid '+key+' list (maximum 5000)');
    const nodes=value.nodes.map(node);unique(nodes,'record');const ids=new Set(nodes.map(x=>x.id));
    const edges=value.edges.map(x=>{
      if(!x||!RELATIONS.includes(x.relation)||!ids.has(x.from)||!ids.has(x.to)||x.from===x.to)throw Error('Invalid relationship endpoints or type');
      return {id:identifier(x.id),from:x.from,to:x.to,relation:x.relation,source:text(x.source,'relationship source',2000,true),note:text(x.note,'relationship note')};
    });unique(edges,'relationship');
    const observations=value.observations.map(x=>{
      if(!x||!nodes.some(n=>n.id===x.coinId&&n.kind==='coin'))throw Error('Observation must reference a coin record');
      cents(x.proceeds);cents(x.costs);
      if(typeof x.units!=='string'||(x.units!==''&&!/^\d{1,60}(?:\.\d{1,18})?$/.test(x.units)))throw Error('Invalid coin units');
      return {id:identifier(x.id),coinId:x.coinId,date:date(x.date,true),units:x.units,proceeds:x.proceeds,costs:x.costs,evidence:text(x.evidence,'receipt or source reference',2000,true),note:text(x.note,'observation note')};
    });unique(observations,'observation');
    return {schema:SCHEMA,nodes,edges,observations};
  }
  function parse(raw){
    if(new TextEncoder().encode(raw).length>10*1024*1024)throw Error('Connection pack exceeds 10 MB; use Creator Vault for original files');
    return validate(JSON.parse(raw));
  }
  function merge(current,incoming){
    const result=validate(current),pack=validate(incoming),counts={added:0,retained:0,conflicts:0};
    for(const key of ['nodes','edges','observations'])for(const row of pack[key]){
      const existing=result[key].find(x=>x.id===row.id);
      if(existing){counts.retained++;if(JSON.stringify(existing)!==JSON.stringify(row))counts.conflicts++}
      else{result[key].push(copy(row));counts.added++}
    }
    return {workspace:validate(result),...counts};
  }
  function save(storage,next,baseline){
    if(storage.getItem(KEY)!==baseline)throw Error('Another tab changed this workspace. Reload before saving; your current draft remains visible.');
    const clean=validate(next);storage.setItem(KEY,JSON.stringify(clean));return clean;
  }
  function totals(workspace){
    let proceeds=0n,costs=0n;for(const x of workspace.observations){proceeds+=cents(x.proceeds);costs+=cents(x.costs)}
    return {count:workspace.observations.length,proceeds:money(proceeds),costs:money(costs),net:money(proceeds-costs),ratio:costs===0n?null:(proceeds*100n/costs/100n).toString()+'.'+(proceeds*100n/costs%100n).toString().padStart(2,'0')};
  }
  function query(workspace,q='',kind=''){
    const words=q.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    return workspace.nodes.filter(n=>(!kind||n.kind===kind)&&words.every(w=>[n.title,n.symbol,n.summary,n.source,n.status,n.notes].join(' ').toLocaleLowerCase().includes(w)));
  }
  function neighbors(workspace,nodeId){
    return workspace.edges.filter(e=>e.from===nodeId||e.to===nodeId).map(edge=>({edge,node:workspace.nodes.find(n=>n.id===(edge.from===nodeId?edge.to:edge.from))}));
  }
  function seed(){
    const base={schema:SCHEMA,nodes:[
      {id:'system:sovereign',kind:'system',title:'Sovereign connections',source:'Nathan AI local source workspace',summary:'A source map for coin definitions, life milestones, design methods, recorded observations and original-file recovery. Import an owner-held connection pack to populate private records.',status:'Local research workspace'},
      {id:'system:node-runtime',kind:'system',title:'Nathan AI Node Runtime',source:'app-factory/nathan-ai/node-runtime/',summary:'Owner-started local checksum workers, a logical address registry, inspectable run reports and a separate initialization narrative player. Awaken → Ignite → Protect → Grow is the lifecycle mapping.',status:'Local source implementation'},
      {id:'system:deep-archive',kind:'system',title:'Nathan AI Deep Archive',source:'app-factory/nathan-ai/deep-archive/',summary:'Shadow Code, Ancient Files and oceanic narrative strata, alongside explicit local file inspection, exact-byte fingerprints and separate text/hex/binary derived views. Originals remain unchanged.',status:'Local source implementation'},
      {id:'formula:life',kind:'formula',title:'Formula of Life · activation sequence',source:'Owner-supplied Formula of Life',summary:String.raw`\Phi_{\text{life}} = \mathcal{A} \rightarrow [\,\mathbf{Ca}^{2+}_{\text{wave}} \implies \mathbf{Zn}^{2+}_{\text{flash}} \implies \mathcal{S}_{\text{hard}} \implies \mathcal{C}_{\text{init}}\,]`,status:'Author-supplied conceptual formula'},
      {id:'source:coin-catalog',kind:'source',title:'Earlier coin-design catalog',source:'Library Mind catalog: CONNECTV2:PROJECTREF:ADD:COINS',summary:'Nine sovereign coin designs + SIN/SEN earlier systems. Metadata only; original designs not embedded.',status:'Catalog reference'},
      {id:'source:sin-earlier',kind:'source',title:'Earlier SIN definition',source:'Library Mind catalog: CONNECTV2:PROJECTREF:BASE:NT-ADDED-037',summary:'SIN = Saving Innocence Now. Preserve this wording independently of any later definition until the owner supplies a documented relationship.',status:'Catalog reference'},
      {id:'system:voicebox',kind:'system',title:'Sealed Voice Box',source:'app-factory/one/offloader/README.md; engine.js',summary:'Existing browser-local encrypted original-file storage and foreground voice-note capture. Uses passphrase-derived PBKDF2 and AES-GCM. This source implementation does not establish voice-biometric authentication or financial custody.',status:'Documented source implementation'},
      {id:'system:commerce',kind:'system',title:'Commerce & launch',source:'app-factory/universal-commerce/README.md',summary:'Documented owner-held commerce prototype with channel-specific preview packages. Live checkout and provider connections are not established by this reference.',status:'Private package reference'},
      {id:'system:pricing',kind:'system',title:'Pricing & audience policies',source:'app-factory/pricing-router/README.md',summary:'Existing static pricing-plan evaluator. Real billing and verified payment receipts require separate services.',status:'Documented source implementation'},
      {id:'source:originals',kind:'source',title:'Original source recovery',source:'ALL_299_PROJECTS_SOURCE_FIRST_v020.csv; owner-held archives',summary:'Attach original documents in the existing Vault or Master Library. A reference to a missing file is not its contents.',status:'Originals needed'}
    ],edges:[
      {id:'edge:life-runtime',from:'formula:life',to:'system:node-runtime',relation:'describes',source:'Owner-supplied activation sequence mapped to a software lifecycle',note:'Narrative simulation and actual worker telemetry remain separate.'},
      {id:'edge:runtime-workspace',from:'system:node-runtime',to:'system:sovereign',relation:'relates-to',source:'Nathan AI app navigation and source architecture',note:''},
      {id:'edge:deep-runtime',from:'system:deep-archive',to:'system:node-runtime',relation:'relates-to',source:'Owner-requested continuation of the activation narrative into archival layers',note:'Narrative topics and owner-selected files retain distinct source types.'},
      {id:'edge:coin-source',from:'source:coin-catalog',to:'system:sovereign',relation:'references',source:'Public coin-design catalog',note:''},
      {id:'edge:sin-source',from:'source:sin-earlier',to:'source:coin-catalog',relation:'relates-to',source:'Both public catalog records mention SIN; no alias resolution asserted',note:'Names remain separate'},
      {id:'edge:originals',from:'source:originals',to:'source:coin-catalog',relation:'references',source:'Coin catalog cites the original source-first CSV',note:''}
    ],observations:[]};return validate(base);
  }
  const api={SCHEMA,KEY,KINDS,RELATIONS,id,node,validate,parse,merge,save,totals,query,neighbors,seed,cents,money};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanSovereign=api;
})(typeof window==='object'?window:globalThis);
