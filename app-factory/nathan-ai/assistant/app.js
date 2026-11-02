(function(){
  'use strict';
  const api=window.NathanAssistant,archive=window.NathanWorkspace,graph=window.NathanSovereign,$=id=>document.getElementById(id);
  const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n};
  let publicRows=[],pluginRows=[],handoffRows=[],selection=[],previewQuestion='',session={schema:api.SCHEMA,turns:[]},baseline=null,healthy=true,controller=null,loading=false;
  const root=new URL('../',location.href);
  function say(text){$('question-status').textContent=text}
  try{baseline=localStorage.getItem(api.KEY);if(baseline)session=api.parse(baseline)}catch(e){healthy=false;$('save-status').textContent='Saved conversation could not be read; preserved without overwrite. '+e.message}
  function render(){
    $('turns').replaceChildren();
    for(const turn of session.turns){const box=el('article');box.className='turn';box.append(el('h3',turn.question),el('small',turn.mode==='model'?'Model draft · supplied context only':'Source retrieval · no model inference'),el('pre',turn.answer));
      for(const s of turn.sources){const d=el('details');d.className='citation';d.append(el('summary',s.title+' · '+s.stage+(s.private?' · local record':'')),el('p',s.excerpt),el('small','Source ID: '+s.id));box.append(d)}$('turns').append(box)}
    if(!session.turns.length)$('turns').append(el('p','Your questions and source-linked responses will appear here.'));
  }
  function context(){
    const rows=[...publicRows,...pluginRows,...handoffRows];
    if($('include-local').checked){
      const rawGraph=localStorage.getItem(graph.KEY),rawResearch=localStorage.getItem(archive.KEY);
      const g=rawGraph?graph.parse(rawGraph):graph.seed(),r=rawResearch?archive.parseBackup(rawResearch):archive.empty();rows.push(...api.localSources(g,r));
    }
    const seen=new Set();return rows.filter(r=>{if(seen.has(r.id))return false;seen.add(r.id);return true});
  }
  function preview(){
    delete $('selected-sources').dataset.reviewed;
    const question=$('question').value;selection=api.retrieve(question,context());previewQuestion=question;
    const box=$('selected-sources');box.replaceChildren();
    for(const s of selection){const d=el('details');d.className='citation';d.append(el('summary',s.title+(s.private?' · local record':'')),el('p',s.excerpt),el('small',s.stage));box.append(d)}
    if(!selection.length)box.append(el('p','No matching source passages. Load sources or try a specific title or phrase.'));
    say(selection.length+' excerpts selected. Review these before choosing a model request.');return selection;
  }
  function invalidate(){selection=[];previewQuestion='';delete $('selected-sources').dataset.reviewed;$('selected-sources').replaceChildren()}
  $('question').addEventListener('input',invalidate);$('include-local').addEventListener('change',invalidate);
  $('preview').addEventListener('click',()=>{try{preview()}catch(e){say(e.message)}});
  $('load').addEventListener('click',async()=>{
    if(loading)return;loading=true;$('load').disabled=true;$('coverage').textContent='Loading existing public catalogs…';
    try{const result=await archive.load(url=>fetch(new URL(url,root)));publicRows=result.rows.map(api.source);invalidate();$('coverage-list').replaceChildren();for(const c of result.coverage)$('coverage-list').append(el('li',c.name+': '+(c.error?'Unavailable — '+c.error:c.count+' records')));const missing=result.coverage.filter(c=>c.error).length;$('coverage').textContent=publicRows.length.toLocaleString()+' records from '+(result.coverage.length-missing)+' of '+result.coverage.length+' public catalogs.'}
    catch(e){$('coverage').textContent='Source loading failed: '+e.message}
    finally{loading=false;$('load').disabled=false}
  });
  $('question-form').addEventListener('submit',async event=>{
    event.preventDefault();if(controller)return;
    try{
      const question=$('question').value;if(previewQuestion!==question||!selection.length)preview();
      const requestSources=[...selection];
      if(session.turns.length>=40)throw Error('Conversation limit reached. Export it before clearing or starting another.');
      let response;
      if($('use-model').checked){
        if(!selection.length)throw Error('A model draft requires selected source passages.');
        // The first click with a changed question is review only; no request is sent until context has been displayed.
        if(!$('selected-sources').dataset.reviewed){$('selected-sources').dataset.reviewed='true';say('Review the excerpts above, then press Answer again to send this question and context.');return}
        controller=new AbortController();$('ask').disabled=true;$('cancel').disabled=false;say('Requesting a draft from the configured model…');
        const r=await fetch('/api/nathan/draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(api.packet(question,requestSources)),signal:controller.signal});
        response=await r.json();if(!r.ok)throw Error(response.error||'Model request failed');
        if(response.mode!=='model'||typeof response.answer!=='string'||!Array.isArray(response.citations)||response.citations.some(id=>!requestSources.some(s=>s.id===id)))throw Error('Model returned invalid source citations');
      }else response=api.answer(question,requestSources,$('mode').value);
      const answer=response.answer+(response.suggestions?.length?'\n\nNext steps:\n'+response.suggestions.map((s,i)=>(i+1)+'. '+s).join('\n'):'');
      const used=response.mode==='model'?requestSources.filter(s=>response.citations.includes(s.id)):requestSources;
      const turn={question,answer,mode:response.mode,sources:used.map(s=>({id:s.id,title:s.title,excerpt:s.excerpt,stage:s.stage,private:s.private}))};
      session=api.session({...session,turns:[...session.turns,turn]});render();say(response.mode==='model'?'Model draft received. Sources are shown with the response.':'Source passages retrieved. No model request was made.');
    }catch(e){say(e.name==='AbortError'?'Request cancelled in this browser. A provider may already have processed a sent request.':e.message)}
    finally{controller=null;$('ask').disabled=false;$('cancel').disabled=true}
  });
  $('cancel').addEventListener('click',()=>controller?.abort());
  $('save').addEventListener('click',()=>{if(!healthy){$('save-status').textContent='Saved storage needs recovery before overwrite.';return}try{session=api.save(localStorage,session,baseline);baseline=JSON.stringify(session);$('save-status').textContent='Conversation saved on this device.'}catch(e){$('save-status').textContent='Not saved: '+e.message}});
  $('export').addEventListener('click',()=>{const a=el('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(session,null,2)],{type:'application/json'}));a.download='nathan-ai-conversation.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)});
  $('clear').addEventListener('click',()=>{if(!confirm('Clear this conversation and its saved browser copy? Export a backup first.'))return;try{if(!healthy||localStorage.getItem(api.KEY)!==baseline)throw Error('Saved storage changed or needs recovery; nothing cleared');localStorage.removeItem(api.KEY);baseline=null;session={schema:api.SCHEMA,turns:[]};render();$('save-status').textContent='Conversation cleared.'}catch(e){$('save-status').textContent=e.message}});
  $('restore').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>2*1024*1024)throw Error('Backup exceeds 2 MB');const value=api.parse(await file.text());if(confirm('Replace the in-memory conversation with '+value.turns.length+' restored turns? Saved storage changes only when you choose Save.')){session=value;render();$('save-status').textContent='Conversation restored in memory; choose Save to retain it.'}}catch(e){$('save-status').textContent='Restore failed: '+e.message}event.target.value=''});
  async function pluginContext(workflowId){
    const response=await fetch(new URL('plugins/inventory.json',root));if(!response.ok)throw Error('Plugin inventory unavailable');
    const inventory=window.NathanPlugins.validate(await response.json());const rows=window.NathanPlugins.sources(inventory,workflowId);
    if(workflowId&&!rows.length)throw Error('Workflow is not in the inspected inventory');
    pluginRows=rows.map(api.source);invalidate();$('plugin-coverage').textContent=rows.length+' plugin workflow records loaded. These are capabilities and handoff metadata, not executable account tools.';
    return inventory;
  }
  $('load-plugins').addEventListener('click',()=>pluginContext().catch(e=>say(e.message)));
  const workflowId=new URLSearchParams(location.search).get('workflow');
  if(workflowId)pluginContext(workflowId).then(inventory=>{
    const raw=sessionStorage.getItem('nathan-ai.plugin-handoff.v1');sessionStorage.removeItem('nathan-ai.plugin-handoff.v1');
    if(raw){const value=JSON.parse(raw);if(value.workflowId!==workflowId)throw Error('Handoff workflow mismatch');api.noCredentials(value.task);const checked=window.NathanPlugins.handoff(inventory,workflowId,value.task);$('question').value=checked.request;invalidate();say('Plugin handoff loaded for review. No plugin has been executed. The web assistant can discuss the workflow; paste the request into the host chat to invoke it.')}
  }).catch(e=>say('Handoff not loaded: '+e.message));
  try{
    const raw=sessionStorage.getItem('nathan-ai.source-handoff.v1');sessionStorage.removeItem('nathan-ai.source-handoff.v1');
    if(raw){
      if(raw.length>16000)throw Error('Source handoff too large');const value=JSON.parse(raw);
      if(value.schema!=='nathan-ai.source-handoff.v1'||typeof value.question!=='string'||!value.question.trim()||value.question.length>4000||!Array.isArray(value.sources)||value.sources.length>1)throw Error('Invalid source handoff');
      api.noCredentials(value.question);for(const s of value.sources){for(const [key,max]of [['id',1000],['title',2000],['text',1200],['stage',500]])if(typeof s[key]!=='string'||s[key].length>max)throw Error('Invalid handoff source');api.noCredentials(s.text)}
      handoffRows=value.sources.map(s=>api.source({...s,sourceName:'Explicitly selected source handoff',private:Boolean(s.private)}));$('question').value=value.question;invalidate();say(handoffRows.length?'One source attached by your selection. Review and submit when ready; no model request was made.':'Question opened for review. No model request was made.');
    }
  }catch(e){say('Source handoff not loaded: '+e.message)}
  fetch('/api/nathan/status').then(async response=>{if(!response.ok)throw Error();const status=await response.json();if(status.modelConfigured===true){$('model-status').textContent='Model adapter configured; provider access is confirmed only after a successful draft.';$('use-model').disabled=false}else $('model-status').textContent='Source mode available. No model provider configured.'}).catch(()=>{$('model-status').textContent='Source mode available. Optional local model adapter is not running.'});
  render();
})();
