(function(){
  'use strict';
  const api=window.NathanSovereign,$=id=>document.getElementById(id);
  const el=(tag,value)=>{const e=document.createElement(tag);if(value!==undefined)e.textContent=value;return e};
  const button=(label,action)=>{const b=el('button',label);b.type='button';b.addEventListener('click',action);return b};
  const say=message=>$('status').textContent=message;
  const routes={'system:deep-archive':'../deep-archive/index.html','system:node-runtime':'../node-runtime/index.html','formula:life':'../node-runtime/index.html','system:voicebox':'../../one/offloader/index.html','system:commerce':'../../universal-commerce/README.md','system:pricing':'../../pricing-router/index.html','source:coin-catalog':'../../one/library-mind/index.html#catalog','source:sin-earlier':'../../one/library-mind/index.html#catalog','source:originals':'../../vault.html'};
  let workspace=api.seed(),baseline=null,selected=null,limit=18,pending=null,healthy=true;
  try{baseline=localStorage.getItem(api.KEY);if(baseline)workspace=api.merge(api.parse(baseline),api.seed()).workspace}catch(e){healthy=false;say('Saved data could not be read. Existing storage is preserved; reload or recover your backup before editing. '+e.message)}
  function commit(next){
    if(!healthy){say('Saved storage needs recovery before editing. Existing data has not been overwritten.');return false}
    try{workspace=api.save(localStorage,next,baseline);baseline=JSON.stringify(workspace);return true}
    catch(e){say('Not saved: '+e.message);return false}
  }
  function dirty(){return selected&&$('reader-notes').value!==(workspace.nodes.find(n=>n.id===selected)?.notes||'')}
  function leave(){return !dirty()||confirm('Leave these unsaved notes? Choose Cancel to save them first.')}
  function show(panel){
    if(!document.querySelector('.view#'+panel))return;
    document.querySelectorAll('.view').forEach(e=>e.hidden=e.id!==panel);
    document.querySelectorAll('[data-panel]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.panel===panel)));
    history.replaceState(null,'','#'+panel);
  }
  function options(target,nodes,prompt){
    const select=$(target),old=select.value;select.replaceChildren();
    if(prompt){const o=el('option',prompt);o.value='';select.append(o)}
    for(const n of nodes){const o=el('option',(n.symbol?n.symbol+' · ':'')+n.title);o.value=n.id;select.append(o)}
    if(nodes.some(n=>n.id===old))select.value=old;
  }
  function stat(root,label,value){const box=el('div');box.className='stat';box.append(el('strong',value),el('small',label));root.append(box)}
  function card(n){
    const c=el('article');c.className='record';const tag=el('span',n.kind+(n.symbol?' · '+n.symbol:''));tag.className='tag';
    const stage=el('p',n.status);stage.className='stage';c.append(tag,el('h3',n.title),stage,button('Read source & connections',()=>open(n.id)));return c;
  }
  function open(nodeId){
    if(selected!==nodeId&&!leave())return;
    const n=workspace.nodes.find(n=>n.id===nodeId);if(!n)return;selected=n.id;
    $('reader-title').textContent=n.title;$('reader-kind').textContent=n.kind+(n.symbol?' · '+n.symbol:'');
    $('reader-stage').textContent='Source stage: '+n.status;$('reader-source').textContent='Source: '+n.source;
    $('reader-body').textContent=n.summary||'No source body supplied.';$('reader-notes').value=n.notes;
    const links=$('reader-links');links.replaceChildren();
    if(routes[n.id]){const a=el('a','Open original module →');a.href=routes[n.id];links.append(a)}
    const related=api.neighbors(workspace,n.id);links.append(el('p',related.length+' direct connection'+(related.length===1?'':'s')));
    for(const {edge,node} of related)links.append(button(node.title+' · '+edge.relation,()=>open(node.id)));
    $('reader').hidden=false;$('reader').focus();
  }
  function renderList(){
    const rows=api.query(workspace,$('query').value,$('kind').value);$('record-list').replaceChildren();
    for(const n of rows.slice(0,limit))$('record-list').append(card(n));
    $('result-count').textContent=rows.length+' records · showing '+Math.min(limit,rows.length);$('more').hidden=rows.length<=limit;
    if(!rows.length)$('record-list').append(el('p','No matching records. Import your connection pack or add a source record.'));
  }
  const NS='http://www.w3.org/2000/svg';
  function svgNode(tag,attributes,value){const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attributes))e.setAttribute(k,String(v));if(value!==undefined)e.textContent=value;return e}
  function renderGraph(){
    const focus=$('focus').value||workspace.nodes[0]?.id;const n=workspace.nodes.find(n=>n.id===focus);const root=$('graph');root.replaceChildren();$('neighbors').replaceChildren();
    if(!n)return;const related=api.neighbors(workspace,n.id);const unique=[...new Map(related.map(x=>[x.node.id,x.node])).values()];
    const displayed=unique.slice(0,12);const svg=svgNode('svg',{viewBox:'0 0 720 500',role:'img','aria-label':'Connections around '+n.title});svg.append(svgNode('title',{},'Select a node to read it. A complete connection list follows this map.'));
    function dot(record,x,y,center=false){
      const g=svgNode('g',{role:'button',tabindex:0,'aria-label':'Read '+record.title});
      g.append(svgNode('circle',{cx:x,cy:y,r:center?52:34,class:center?'center':''}),svgNode('text',{x,y:y+5,'text-anchor':'middle'},record.symbol||(record.title.length>14?record.title.slice(0,12)+'…':record.title)));
      g.addEventListener('click',()=>open(record.id));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(record.id)}});svg.append(g);
    }
    displayed.forEach((r,i)=>{const angle=2*Math.PI*i/displayed.length-Math.PI/2,x=360+265*Math.cos(angle),y=250+180*Math.sin(angle);svg.append(svgNode('line',{x1:360,y1:250,x2:x,y2:y}));dot(r,x,y)});dot(n,360,250,true);root.append(svg);
    $('graph-count').textContent=unique.length+' connected records · '+related.length+' relationships'+(unique.length>12?' · first 12 records visualized; complete list below':'');
    if(!related.length)$('neighbors').append(el('p','No recorded connections yet. Use the form below to make an explicit link.'));
    for(const {edge,node}of related){const row=el('article');row.className='source-entry';row.append(button(node.title,()=>open(node.id)),el('p',(edge.from===n.id?'→ ':'← ')+edge.relation+' · '+edge.source));if(edge.note)row.append(el('p',edge.note));row.append(button('Remove connection',()=>{if(!confirm('Remove this local connection? Original source records will remain.'))return;if(commit({...workspace,edges:workspace.edges.filter(e=>e.id!==edge.id)})){say('Connection removed.');render()}}));$('neighbors').append(row)}
  }
  function render(){
    const stats=$('stats');stats.replaceChildren();stat(stats,'coin definitions',workspace.nodes.filter(n=>n.kind==='coin').length);stat(stats,'life milestones',workspace.nodes.filter(n=>n.kind==='timeline').length);stat(stats,'source connections',workspace.edges.length);stat(stats,'open questions',workspace.nodes.filter(n=>n.kind==='claim').length);
    for(const target of ['focus','link-from','link-to'])options(target,workspace.nodes);
    const coins=workspace.nodes.filter(n=>n.kind==='coin');options('observation-coin',coins,'Choose a coin');$('observation-save').disabled=!coins.length;
    renderList();renderGraph();
    $('timeline-list').replaceChildren();const timeline=workspace.nodes.filter(n=>n.kind==='timeline').sort((a,b)=>(a.date||a.title).localeCompare(b.date||b.title));
    for(const n of timeline){const row=el('article');row.className='timeline-item';row.append(el('small',n.date||'Exact date not supplied'),el('h3',n.title),el('p',n.summary),button('Read & connect',()=>open(n.id)));$('timeline-list').append(row)}
    if(!timeline.length)$('timeline-list').append(el('p','No life milestones loaded. Import your owner-held pack or add a milestone below.'));
    $('methods-list').replaceChildren();for(const n of workspace.nodes.filter(n=>['formula','claim','value'].includes(n.kind)))$('methods-list').append(card(n));
    $('source-list').replaceChildren();for(const n of workspace.nodes.filter(n=>n.kind==='source'||n.kind==='system')){const row=el('div');row.className='source-entry';row.append(button(n.title,()=>open(n.id)),el('p',n.source+' · '+n.status));$('source-list').append(row)}
    const totals=api.totals(workspace);$('ledger-totals').replaceChildren();
    if(totals.count){stat($('ledger-totals'),'recorded receipts',totals.proceeds);stat($('ledger-totals'),'recorded costs',totals.costs);stat($('ledger-totals'),'recorded difference',totals.net)}
    $('ledger-help').textContent=totals.count?totals.count+' owner-entered observations. Receipts / recorded costs: '+(totals.ratio===null?'undefined (zero recorded costs)':totals.ratio+':1')+'. This is an account of entered records, not an established balance, all-in profit or forecast.':'No receipt observations recorded. Actual earnings and balances are unknown; source valuation claims are not included as receipts.';
    $('observations').replaceChildren();for(const x of workspace.observations){const row=el('article');row.className='observation';row.append(el('h3',workspace.nodes.find(n=>n.id===x.coinId).title+' · '+x.date),el('p',(x.units?'Units: '+x.units+' · ':'')+'Receipts: '+api.money(api.cents(x.proceeds))+' · Costs: '+api.money(api.cents(x.costs))),el('p','Source: '+x.evidence),el('p',x.note));row.append(button('Remove observation',()=>{if(!confirm('Remove this entered observation?'))return;if(commit({...workspace,observations:workspace.observations.filter(o=>o.id!==x.id)})){say('Observation removed.');render()}}));$('observations').append(row)}
  }
  document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.panel)));
  for(const id of ['query','kind'])$(id).addEventListener('input',()=>{limit=18;renderList()});$('more').addEventListener('click',()=>{limit+=18;renderList()});$('focus').addEventListener('change',renderGraph);
  $('close-reader').addEventListener('click',()=>{if(leave()){$('reader').hidden=true;selected=null}});
  $('save-notes').addEventListener('click',()=>{if(!selected)return;if(commit({...workspace,nodes:workspace.nodes.map(n=>n.id===selected?{...n,notes:$('reader-notes').value}:n)})){say('Notes saved locally. Source wording preserved.');render()}});
  $('show-connections').addEventListener('click',()=>{if(selected){$('focus').value=selected;renderGraph();show('connections')}});
  $('record-form').addEventListener('submit',e=>{
    e.preventDefault();try{const n=api.node({id:api.id(),kind:$('record-kind').value,title:$('record-title').value,summary:$('record-summary').value,source:$('record-source').value,status:$('record-stage').value,symbol:$('record-symbol').value,date:$('record-date').value,notes:''});if(commit({...workspace,nodes:[...workspace.nodes,n]})){e.target.reset();say('Record saved. Connect it to its source or a life milestone.');render();open(n.id)}}catch(error){say(error.message)}
  });
  $('add-milestone').addEventListener('click',()=>{$('new-record').open=true;$('record-kind').value='timeline';$('record-title').focus()});
  $('link-form').addEventListener('submit',e=>{
    e.preventDefault();const edge={id:api.id(),from:$('link-from').value,to:$('link-to').value,relation:$('link-relation').value,source:$('link-source').value,note:$('link-note').value};
    if(workspace.edges.some(x=>x.from===edge.from&&x.to===edge.to&&x.relation===edge.relation)){say('That connection already exists. Its source and notes were retained.');return}
    if(commit({...workspace,edges:[...workspace.edges,edge]})){say('Connection saved with its source.');$('link-source').value='';$('link-note').value='';render()}
  });
  $('observation-form').addEventListener('submit',e=>{
    e.preventDefault();const x={id:api.id(),coinId:$('observation-coin').value,date:$('observation-date').value,units:$('observation-units').value.trim(),proceeds:$('observation-proceeds').value.trim(),costs:$('observation-costs').value.trim(),evidence:$('observation-evidence').value,note:$('observation-note').value};
    if(commit({...workspace,observations:[...workspace.observations,x]})){say('Observation saved as an owner-entered record.');e.target.reset();render()}
  });
  $('pack-file').addEventListener('change',async e=>{
    pending=null;$('import-review').hidden=true;const file=e.target.files[0];if(!file)return;
    try{if(file.size>10*1024*1024)throw Error('Connection pack exceeds 10 MB');const pack=api.parse(await file.text());const result=api.merge(workspace,pack);pending=pack;$('import-summary').textContent=pack.nodes.length+' records, '+pack.edges.length+' connections, '+pack.observations.length+' observations. '+result.added+' new items; '+result.retained+' existing IDs retained ('+result.conflicts+' differing versions). Review means reading the imported file; source claims are not automatically verified.';$('import-review').hidden=false;say('Pack validated. Nothing saved yet. Choose Merge to import locally.')}catch(error){say('Import failed: '+error.message+'. Existing data retained.')}
    e.target.value='';
  });
  $('merge-pack').addEventListener('click',()=>{if(!pending)return;try{const result=api.merge(workspace,pending);if(commit(result.workspace)){pending=null;$('import-review').hidden=true;say(result.added+' items added; '+result.retained+' existing records retained. Nothing uploaded.');render()}}catch(e){say(e.message)}});
  $('cancel-import').addEventListener('click',()=>{pending=null;$('import-review').hidden=true;say('Import cancelled. Nothing changed.')});
  $('export').addEventListener('click',()=>{const a=el('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(workspace,null,2)],{type:'application/json'}));a.download='nathan-ai-sovereign-workspace.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);say('Workspace exported. Keep this private backup separate from original-file backups.')});
  window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue=''}});
  for(const kind of api.KINDS){for(const target of ['kind','record-kind']){const o=el('option',kind);o.value=kind;$(target).append(o)}}
  for(const relation of api.RELATIONS){const o=el('option',relation);o.value=relation;$('link-relation').append(o)}
  render();show(location.hash.slice(1)||'matrix');
})();
