(function(){
  'use strict';
  const api=window.NathanDeepArchive,graph=window.NathanSovereign,$=id=>document.getElementById(id);
  const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e};
  const button=(label,action)=>{const b=el('button',label);b.type='button';b.addEventListener('click',action);return b};
  let chosen=null,activeFile=null,timer=null,stage=0;const artifacts=new Map();
  function download(bytes,name,type){const a=el('a');a.href=URL.createObjectURL(bytes instanceof Blob?bytes:new Blob([bytes],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}
  function saveReference(record){
    try{
      const baseline=localStorage.getItem(graph.KEY);let workspace=baseline?graph.merge(graph.parse(baseline),graph.seed()).workspace:graph.seed();
      const existing=workspace.nodes.find(n=>n.id===record.id);
      if(!existing)workspace.nodes.push(graph.node(record));
      const edge={id:'deep-reference:'+record.id,from:record.id,to:'system:deep-archive',relation:'references',source:record.source,note:'Source reference saved by owner from Deep Archive; originals remain separate.'};
      if(!workspace.edges.some(e=>e.id===edge.id))workspace.edges.push(edge);
      graph.save(localStorage,workspace,baseline);
      $('graph-status').textContent=existing?'Existing source reference retained, including any saved notes.':'Source reference saved to Sovereign Connections. Original bytes and source wording remain unchanged.';
    }catch(e){$('graph-status').textContent='Could not save reference: '+e.message+'. Existing data retained.'}
  }
  function render(){
    const rows=api.search($('query').value,$('layer').value,$('type').value);$('catalog').replaceChildren();$('count').textContent=rows.length+' source topics';
    for(const r of rows){const card=el('article');card.className='record';const tag=el('span',r.layer+' · '+r.type);tag.className='tag';card.append(tag,el('h3',r.title),button('Read source',()=>{
      chosen=r;$('reader-meta').textContent=r.layer+' · '+r.type;$('reader-title').textContent=r.title;$('reader-body').textContent=r.body;$('reader-source').textContent='Source: '+r.source;$('reader').hidden=false;$('reader').focus();
    }));$('catalog').append(card)}
    if(!rows.length)$('catalog').append(el('p','No matching source topics. Try another stratum or phrase.'));
  }
  for(const key of ['query','layer','type'])$(key).addEventListener('input',render);
  for(const [key,field]of [['layer','layer'],['type','type']])for(const value of new Set(api.catalog.map(r=>r[field]))){const o=el('option',value);o.value=value;$(key).append(o)}
  $('close-reader').addEventListener('click',()=>{$('reader').hidden=true;$('query').focus()});
  $('save-concept').addEventListener('click',()=>{if(chosen)saveReference({id:'archive:'+chosen.id,kind:'source',title:chosen.title,summary:chosen.body,source:chosen.source,status:chosen.type,symbol:'',date:'',notes:''})});
  function halt(){clearInterval(timer);timer=null;$('dive').disabled=false;$('halt').disabled=true}
  $('dive').addEventListener('click',()=>{
    halt();stage=0;$('dive-log').textContent='[NARRATIVE DEEP-DIVE · LOCAL PLAYBACK]\nNo remote retrieval is performed.\n';$('dive').disabled=true;$('halt').disabled=false;
    timer=setInterval(()=>{const r=api.descent[stage];$('dive-log').textContent+='\n'+r.title+'\n'+r.text+'\n';stage++;if(stage===api.descent.length)halt();$('dive-log').scrollTop=$('dive-log').scrollHeight},600);
  });
  $('halt').addEventListener('click',()=>{halt();$('dive-log').textContent+='\n[Playback stopped by owner]\n'});
  $('export-story').addEventListener('click',()=>download(JSON.stringify({schema:'nathan-ai.deep-archive-narrative.v1',classification:'Narrative simulation',catalog:api.catalog,descent:api.descent,archiveDecision:'Preserve originals; keep translations separate.'},null,2),'nathan-ai-deep-archive-narrative.json','application/json'));
  function preview(){
    if(!activeFile)return;
    $('file-title').textContent=activeFile.name;$('file-meta').textContent=activeFile.size+' exact bytes · SHA-256 '+activeFile.sha256+' · names: '+activeFile.aliases.join(', ');$('file-preview').textContent=api.bytesView(activeFile.bytes,$('view').value);$('file-reader').hidden=false;
  }
  function fileList(){
    $('file-list').replaceChildren();
    for(const artifact of artifacts.values()){const row=el('article');row.className='source-entry';row.append(button(artifact.name,()=>{activeFile=artifact;preview()}),el('small',artifact.size+' bytes · '+artifact.aliases.length+' selected name(s)'));$('file-list').append(row)}
    $('export-index').disabled=!artifacts.size;
  }
  $('files').addEventListener('change',async event=>{
    const files=Array.from(event.target.files||[]);if(!files.length)return;
    if(files.length>50||files.reduce((sum,f)=>sum+f.size,0)>api.MAX_BATCH){$('file-status').textContent='Selection exceeds 50 files or 100 MB. Existing inspected files retained.';event.target.value='';return}
    event.target.disabled=true;let added=0,duplicates=0;const errors=[];
    for(const file of files){
      try{
        $('file-status').textContent='Fingerprinting '+file.name+' locally…';
        const a=await api.fingerprint(file);const existing=artifacts.get(a.id);
        if(existing){duplicates++;if(!existing.aliases.includes(a.name))existing.aliases.push(a.name);continue}
        const total=Array.from(artifacts.values()).reduce((sum,x)=>sum+x.size,0);
        if(artifacts.size>=50||total+a.size>api.MAX_BATCH)throw Error('Session limit reached (50 unique files / 100 MB)');
        a.aliases=[a.name];artifacts.set(a.id,a);added++;
      }catch(e){errors.push(file.name+': '+e.message)}
    }
    event.target.disabled=false;event.target.value='';fileList();$('file-status').textContent=added+' new originals inspected; '+duplicates+' identical byte copies recognized; '+errors.length+' not inspected.'+(errors.length?' '+errors.join(' · '):' Files are held only in this tab; originals were not altered.');
  });
  $('view').addEventListener('change',preview);
  $('download-original').addEventListener('click',()=>{if(activeFile)download(activeFile.bytes,activeFile.name,activeFile.mime)});
  $('save-fingerprint').addEventListener('click',()=>{if(activeFile)saveReference(api.reference(activeFile))});
  $('export-index').addEventListener('click',()=>download(JSON.stringify({schema:'nathan-ai.artifact-fingerprints.v1',notice:'Fingerprints and selected names only; no original file bytes or contents included.',records:Array.from(artifacts.values(),({bytes,...rest})=>rest)},null,2),'nathan-ai-artifact-fingerprints.json','application/json'));
  $('decode').addEventListener('click',()=>{try{$('decoded').textContent=api.decode($('encoded').value,$('encoding').value)}catch(e){$('decoded').textContent='Could not create derived view: '+e.message}});
  window.addEventListener('pagehide',halt);render();
})();
