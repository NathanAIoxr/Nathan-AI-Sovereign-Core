/* Nathan AI Work Vault: explicit local-only ingestion; no automatic access to external chats. */
(() => {
  'use strict';
  const DB='nathan-ai-work-vault-v1', STORE='items', MAX=20*1024*1024;
  const $=id=>document.getElementById(id);
  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB,1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});};
      req.onerror=()=>reject(req.error);req.onsuccess=()=>resolve(req.result);
    });
  }
  async function transaction(mode,operation){
    const db=await openDb();
    try{return await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,mode), store=tx.objectStore(STORE);
      let result;let request;
      try{request=operation(store);}catch(err){reject(err);return;}
      request.onsuccess=()=>{result=request.result;};
      request.onerror=()=>reject(request.error);
      tx.oncomplete=()=>resolve(result);
      tx.onerror=()=>reject(tx.error);
      tx.onabort=()=>reject(tx.error||Error('Storage transaction aborted'));
    });}finally{db.close();}
  }
  const list=()=>transaction('readonly',s=>s.getAll());
  const put=item=>transaction('readwrite',s=>s.put(item));
  const remove=id=>transaction('readwrite',s=>s.delete(id));
  const id=()=>crypto.randomUUID();
  const validText=s=>typeof s==='string' ? s : '';
  const status=s=>{$('status').textContent=s;};
  const formatSize=n=>n<1024?n+' B':(n/1024/1024).toFixed(2)+' MB';
  function download(blob,name){
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=name||'artifact';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function saveText(e){
    e.preventDefault();
    const title=$('title').value.trim(), text=$('body').value;
    if(!title)throw Error('Title is required');
    if(new Blob([text]).size>MAX)throw Error('Text exceeds the 20 MB local limit');
    await put({id:id(),title,kind:$('kind').value,source:$('source').value.trim(),
      created:new Date().toISOString(),mime:'text/plain;charset=utf-8',name:title+'.txt',size:new Blob([text]).size,
      text,blob:new Blob([text],{type:'text/plain;charset=utf-8'})});
    $('title').value='';$('body').value='';status('Saved locally in this browser.');await render();
  }
  async function importFiles(files){
    let saved=0;
    for(const f of files){
      if(f.size>MAX){status('Skipped '+f.name+': file exceeds 20 MB.');continue;}
      let text='';
      if(/^(text\/|application\/(json|xml|javascript))/.test(f.type)||/\.(txt|md|csv|json|html|css|js|py|xml)$/i.test(f.name)){
        text=await f.text();
      }
      await put({id:id(),title:f.name,kind:'file',source:'Owner-selected file import',
        created:new Date().toISOString(),mime:f.type||'application/octet-stream',
        name:f.name,size:f.size,text:text.slice(0,200000),blob:f});
      saved++;
    }
    status(saved+' file(s) imported on this device; no upload performed.');await render();
  }
  async function render(){
    const items=await list(),q=$('search').value.trim().toLocaleLowerCase();
    const matches=items.filter(x=>[x.title,x.kind,x.source,x.text].join(' ').toLocaleLowerCase().includes(q))
      .sort((a,b)=>b.created.localeCompare(a.created));
    $('count').textContent=matches.length+' of '+items.length+' saved items';
    $('results').replaceChildren();
    for(const item of matches){
      const article=document.createElement('article');
      const h=document.createElement('h3');h.textContent=item.title;article.append(h);
      const p=document.createElement('p');
      p.textContent=[item.kind,item.source,item.created,formatSize(item.size)].filter(Boolean).join(' · ');article.append(p);
      if(item.text){const preview=document.createElement('pre');preview.textContent=item.text.slice(0,500);article.append(preview);}
      const get=document.createElement('button');get.textContent='Download original';
      get.onclick=()=>download(item.blob,item.name);
      const del=document.createElement('button');del.textContent='Delete local item';
      del.onclick=async()=>{if(!confirm('Delete this saved local item?'))return;await remove(item.id);status('Local item deleted.');await render();};
      article.append(get,document.createTextNode(' '),del);$('results').append(article);
    }
  }
  $('editor').addEventListener('submit',e=>{saveText(e).catch(err=>status('Save failed: '+err.message));});
  $('files').addEventListener('change',e=>{importFiles(e.target.files).catch(err=>status('Import failed: '+err.message));e.target.value='';});
  $('search').addEventListener('input',()=>render().catch(err=>status(err.message)));
  $('manifest').addEventListener('click',async()=>{
    try{const items=await list();const manifest={schema:'nathan-ai.work-vault.manifest.v1',exported:new Date().toISOString(),
      note:'Index only; binary bytes are NOT included. Download originals separately.',
      items:items.map(({id,title,kind,source,created,mime,name,size})=>({id,title,kind,source,created,mime,name,size}))};
      download(new Blob([JSON.stringify(manifest,null,2)],{type:'application/json'}),'nathan-ai-work-vault-manifest.json');
      status('Manifest downloaded; download file originals separately.');
    }catch(err){status(err.message);}
  });
  render().catch(err=>status('Local vault unavailable: '+err.message));
})();
