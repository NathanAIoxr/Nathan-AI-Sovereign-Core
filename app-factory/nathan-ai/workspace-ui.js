(function(){
  'use strict';
  const api=window.NathanWorkspace,$=id=>document.getElementById(id);
  const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e};
  const button=(text,action)=>{const b=node('button',text);b.type='button';b.addEventListener('click',action);return b};
  let rows=[],workspace=api.empty(),limit=20,scope='all',loaded=false,selected=null;
  const message=text=>$('workspace-message').textContent=text;
  let storageHealthy=true;
  try{const raw=localStorage.getItem(api.KEY);if(raw)workspace=api.parseBackup(raw)}catch(e){storageHealthy=false;message('Saved workspace could not be read. Export/recover existing browser data before changing it. '+e.message)}
  function commit(next){
    if(!storageHealthy){message('Workspace storage needs recovery before saving changes.');return false}
    try{workspace=api.persist(localStorage,next);return true}catch(e){message('Could not save: '+e.message+'. Existing saved notes were retained.');return false}
  }
  function render(){
    const query=$('workspace-query').value,source=$('workspace-source').value;
    const collection=$('workspace-collection').value.trim().toLocaleLowerCase();
    const candidates=scope==='saved'?workspace.items.map(item=>{
      const original=rows.find(r=>r.id===item.id);
      return {...(original||{id:item.id,title:item.title,source:item.id.split(':')[0],sourceName:item.sourceName,body:'Load source catalogs to read the original. If its catalog is unavailable, retry loading it. Your saved notes are shown separately below.',stage:'Source not loaded',originalId:item.id}),...item};
    }):rows;
    const found=api.search(candidates,query,source).filter(r=>!collection||workspace.items.some(i=>i.id===r.id&&i.collection.toLocaleLowerCase().includes(collection)));
    $('workspace-results').replaceChildren();
    for(const r of found.slice(0,limit)){
      const card=node('article');card.className='card';
      card.append(node('span',r.sourceName),node('h3',r.title),node('p',r.stage));
      const actions=node('div');actions.className='actions';
      actions.append(button('Read & annotate',()=>open(r)),button(workspace.items.some(i=>i.id===r.id)?'Saved ✓':'Save source',()=>saveSource(r)));
      card.append(actions);$('workspace-results').append(card);
    }
    $('workspace-results-count').textContent=found.length.toLocaleString()+' matching records · '+workspace.items.length+' saved references';
    $('workspace-more').hidden=found.length<=limit;
    if(!found.length)$('workspace-results').append(node('p',loaded?'No matches. Try another phrase or source filter.':'Open the workspace to load the source catalogs.'));
    document.querySelectorAll('[data-workspace-scope]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workspaceScope===scope)));
  }
  function saveSource(r){
    if(workspace.items.some(i=>i.id===r.id)){open(r);return}
    const item={id:r.id,title:r.title,sourceName:r.sourceName,collection:'My research',note:''};
    if(commit({...workspace,items:[...workspace.items,item]})){message('Source reference saved locally. Original source remains unchanged.');render();open(r)}
  }
  function open(r){
    r=rows.find(original=>original.id===r.id)||r;
    selected=r;const saved=workspace.items.find(i=>i.id===r.id);
    showSource(r);
    $('workspace-note').value=saved?.note||'';$('workspace-note-collection').value=saved?.collection||'My research';
    $('workspace-reader').hidden=false;$('workspace-reader').focus();
  }
  function showSource(r){
    $('workspace-reader-title').textContent=r.title;
    $('workspace-reader-meta').textContent=r.sourceName+' · '+r.originalId+' · '+r.stage;
    $('workspace-reader-body').textContent=r.body||'Metadata reference only. Open the source module for available material.';
    const link=$('workspace-original');link.hidden=!r.href;if(r.href)link.href=r.href;
  }
  $('workspace-save-note').addEventListener('click',()=>{
    if(!selected)return;
    const item={id:selected.id,title:selected.title,sourceName:selected.sourceName,collection:$('workspace-note-collection').value.trim()||'My research',note:$('workspace-note').value};
    const items=workspace.items.filter(i=>i.id!==item.id);items.push(item);
    if(commit({...workspace,items})){message('Notes and collection saved on this device.');render()}
  });
  $('workspace-remove').addEventListener('click',()=>{
    if(!selected||!workspace.items.some(i=>i.id===selected.id))return;
    if(!confirm('Remove this saved reference and its notes? The original source will remain unchanged.'))return;
    if(commit({...workspace,items:workspace.items.filter(i=>i.id!==selected.id)})){
      $('workspace-reader').hidden=true;message('Removed the saved reference and its notes.');render();
    }
  });
  $('workspace-close').addEventListener('click',()=>{$('workspace-reader').hidden=true;$('workspace-query').focus()});
  for(const id of ['workspace-query','workspace-source','workspace-collection'])$(id).addEventListener('input',()=>{limit=20;render()});
  document.querySelectorAll('[data-workspace-scope]').forEach(b=>b.addEventListener('click',()=>{scope=b.dataset.workspaceScope;limit=20;render()}));
  $('workspace-more').addEventListener('click',()=>{limit+=20;render()});
  $('workspace-load').addEventListener('click',async()=>{
    $('workspace-load').disabled=true;message('Loading the existing public source catalogs…');
    const result=await api.load(url=>fetch(url));rows=result.rows;loaded=true;
    // Two existing JavaScript registries expose read-only public records.
    const extras=[
      {id:'children',name:'Children & innocence',href:'./children-innocence/index.html',data:window.NathanChildrenCatalog?.projects},
      {id:'language-roots',name:'ROUTE · RAUT · ROOT',href:'./route-raut-root/index.html',data:window.NathanRouteRautRoot?.searchRecords('','all')}
    ];
    for(const extra of extras){
      try{const added=api.records(extra,extra.data);rows.push(...added);result.coverage.push({name:extra.name,count:added.length})}
      catch(e){result.coverage.push({name:extra.name,count:0,error:e.message})}
    }
    const list=$('workspace-coverage');list.replaceChildren();
    for(const c of result.coverage)list.append(node('li',c.name+': '+(c.error?'UNAVAILABLE — '+c.error:c.count.toLocaleString()+' records')));
    const failed=result.coverage.filter(c=>c.error).length;
    message(rows.length.toLocaleString()+' records loaded from '+(result.coverage.length-failed)+' of '+result.coverage.length+' catalogs.'+(failed?' Retry to recover unavailable catalogs.':' Source content and stages remain distinct.'));
    if(selected){const refreshed=rows.find(r=>r.id===selected.id);if(refreshed){selected=refreshed;showSource(refreshed)}}
    $('workspace-load').textContent='Refresh source catalogs';$('workspace-load').disabled=false;render();
  });
  for(const source of [...api.sources,{id:'children',name:'Children & innocence'},{id:'language-roots',name:'ROUTE · RAUT · ROOT'}]){
    const option=node('option',source.name);option.value=source.id;$('workspace-source').append(option);
  }
  $('workspace-export').addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(workspace,null,2)],{type:'application/json'}));
    const a=node('a');a.href=url;a.download='nathan-ai-research-workspace.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
    message('Workspace exported: source references, collections and your notes. Original files require a separate Vault backup.');
  });
  $('workspace-import').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      if(file.size>5*1024*1024)throw Error('Workspace backup exceeds 5 MB');
      const incoming=api.parseBackup(await file.text());const result=api.merge(workspace,incoming);
      if(confirm('Add '+result.added+' saved references? '+result.skipped+' existing references and notes will be kept.')){
        if(commit(result.workspace)){message(result.added+' references restored; '+result.skipped+' existing references kept.');render()}
      }
    }catch(e){message('Restore failed: '+e.message+'. Existing workspace was retained.')}
    event.target.value='';
  });
  render();
})();
