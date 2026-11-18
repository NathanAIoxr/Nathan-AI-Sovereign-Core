export function page(vault) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${vault?'Handling Life Voice Vault':'Nathan Mind Fleet'}</title><link rel="stylesheet" href="/app.css"><script src="/app.js" defer></script></head>
<body><header><div class="frame mast"><a href="/" class="mark">Nathan <strong>AI</strong></a><nav aria-label="Main">
<a href="/" ${vault?'':'aria-current="page"'}>Fleet</a><a href="/vault" ${vault?'aria-current="page"':''}>Voice Vault</a></nav></div></header>
<main id="main" class="frame" data-view="${vault?'vault':'fleet'}">
${vault?`
<section class="intro"><h1>Handling Life<br><em>Voice Vault</em></h1><p>Record voice and save exact words. Originals live in this browser on this device.</p></section>
<section class="panel"><h2>Capture a record</h2>
<label>Title <input id="title" maxlength="120" placeholder="Untitled record"></label>
<label>Exact text <textarea id="transcript" rows="7" placeholder="Type, paste, or use your device’s keyboard dictation."></textarea></label>
<div class="actions"><button id="record">Record audio</button><button id="stop" disabled>Stop recording</button><button class="accent" id="save">Lock and save</button></div>
<audio id="preview" controls hidden></audio><p id="vault-status" role="status"></p>
</section><section class="panel"><h2>Saved originals</h2><label>Find a record <input type="search" id="vault-search" placeholder="Title or exact text"></label><div id="records"></div></section>
`:`
<section class="intro"><h1>Nathan Mind <em>Fleet</em></h1><p>By Nathan Tabor and Nathan AI</p><div class="stats"><span><b id="worker-count">101</b> Workers</span><span><b id="bot-count">101</b> bots</span></div></section>
<section class="workbench" aria-label="Fleet workbench">
<div class="panel catalog"><h2>Fleet roster</h2><label>Find a tool <input type="search" id="search" placeholder="Name, topic, or ID"></label>
<label>Group <select id="group"><option value="">All groups</option></select></label>
<div id="tools" class="tools"></div></div>
<div class="panel workspace"><div id="selection"><h2>Select a tool</h2></div><label>Input JSON <textarea id="input" rows="11" spellcheck="false" autocapitalize="off"></textarea></label>
<div class="actions"><button class="accent" id="run" disabled>Run Worker</button><button id="review" disabled>Run bot review</button></div>
<h3>Output</h3><pre id="output" role="status" tabindex="0">Choose a tool and run its sample input.</pre>
<p class="small">Fleet calls send the input to Cloudflare. Use Voice Vault for private recordings and exact notes.</p></div>
</section>`}
</main><footer class="frame"><a href="/fleet">Fleet API</a><a href="/health">Status</a></footer></body></html>`
}

export const css = `
:root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#101418;color:#eef4f5;--muted:#a7b5bd;--surface:#181e24;--border:#34434c;--blue:#93eddd}
*{box-sizing:border-box}body{margin:0}header{border-bottom:1px solid var(--border)}.frame{max-width:1160px;margin:auto;padding-inline:clamp(16px,4vw,48px)}
.mast{min-height:66px;display:flex;justify-content:space-between;align-items:center;gap:1em}.mark{font-weight:690;letter-spacing:.015em;text-decoration:none;color:inherit}.mark strong{color:var(--blue)}nav,footer{display:flex;gap:1.4rem}
a{color:var(--blue)}nav a,footer a{color:var(--muted);text-decoration:none}nav a[aria-current],a:hover{color:var(--blue)}footer{padding-block:2.5rem;font-size:.9rem}
.intro{padding-block:clamp(34px,6vw,70px) 30px}h1{font-size:clamp(3rem,8vw,6.6rem);letter-spacing:-.085em;line-height:.94;margin:0;font-weight:760}h1 em{color:var(--blue);font-style:normal}
p{color:var(--muted);line-height:1.55}.intro p{font-size:1.1rem}.stats{display:flex;gap:1.6rem;color:var(--muted);margin-top:1.2rem}.stats b{color:var(--blue);font-size:1.25rem}
.workbench{display:grid;grid-template-columns:minmax(260px,1fr) minmax(0,1.75fr);gap:14px}.panel{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:clamp(14px,3vw,26px)}
[data-view=vault] .panel+.panel{margin-top:14px}h2{margin-top:0;font-size:1.32rem;letter-spacing:-.02em}h3{font-size:.95rem}
label{display:grid;gap:6px;color:var(--muted);margin:12px 0;font-size:.92rem}input,select,textarea,button{font:inherit;color:inherit;background:#101418;border:1px solid var(--border);border-radius:7px;padding:10px;width:100%}
input,select,textarea{font-size:1rem}textarea,pre,code{font-family:ui-monospace,monospace}textarea{resize:vertical;line-height:1.45;min-height:110px}
button{cursor:pointer;text-align:center;width:auto;min-height:44px}button:hover:not(:disabled),button[aria-pressed=true]{border-color:var(--blue);color:var(--blue)}button:disabled{opacity:.45;cursor:default}
.accent{background:var(--blue);color:#101418;border-color:var(--blue);font-weight:700}.accent:hover:not(:disabled){color:#101418;background:#bafff4}
.actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px}.tools{display:grid;gap:5px;max-height:550px;overflow:auto}.tools button{text-align:left;width:100%}
.tools code{color:var(--blue);font-size:.76rem;display:block;margin-bottom:3px}
pre{background:#101418;border:1px solid var(--border);min-height:130px;max-height:520px;overflow:auto;border-radius:7px;padding:12px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:.85rem}
.small{font-size:.82rem}.record{border-top:1px solid var(--border);padding:14px 0}.record h3{margin:.25rem 0}.record p{font-size:.84rem;overflow-wrap:anywhere}audio{max-width:100%;margin-top:12px}
:focus-visible{outline:2px solid var(--blue);outline-offset:3px}
@media(max-width:760px){.workbench{grid-template-columns:minmax(0,1fr)}.tools{max-height:225px}.intro h1{letter-spacing:-.07em}}
`

export const browserScript = String.raw`(() => {
  const $ = id => document.getElementById(id)
  const node = (tag,value) => Object.assign(document.createElement(tag),{textContent:value})
  const message = error => error instanceof Error ? error.message : String(error)

  async function fleet(){
    const output=$('output')
    const response=await fetch('/fleet')
    if(!response.ok)throw new Error('Fleet roster unavailable')
    const fleet=await response.json()
    for(const group of fleet.groups)$('group').append(Object.assign(node('option',group),{value:group}))
    let selected
    function select(entry,scroll){
      selected=entry
      $('selection').replaceChildren(node('h2',entry.name),node('p',entry.bot+' · '+entry.botName))
      if(entry.notes)$('selection').append(node('p',entry.notes))
      $('input').value=JSON.stringify(entry.input,null,2)
      output.textContent='Run the Worker or its bot with the input above.'
      $('run').disabled=$('review').disabled=false
      for(const button of $('tools').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.id===entry.worker))
      if(scroll&&matchMedia('(max-width:760px)').matches)document.querySelector('.workspace').scrollIntoView({block:'nearest'})
    }
    function filter(){
      const query=$('search').value.trim().toLowerCase(), group=$('group').value
      const matches=fleet.entries.filter(e=>(!group||e.domain===group)&&[e.name,e.domain,e.worker,e.bot,e.botName].some(value=>value.toLowerCase().includes(query)))
      $('tools').replaceChildren(...matches.map(entry=>{
        const button=node('button','')
        button.append(node('code',entry.worker),document.createTextNode(entry.name))
        button.dataset.id=entry.worker
        button.setAttribute('aria-pressed',String(selected?.n===entry.n))
        button.onclick=()=>select(entry,true)
        return button
      }))
      if(!matches.length)$('tools').append(node('p','No matching tools.'))
    }
    async function run(kind){
      const entry=selected, raw=$('input').value
      try{
        JSON.parse(raw)
        output.textContent='Running…'
        const result=await fetch('/'+kind+'/'+entry.n,{method:'POST',headers:{'content-type':'application/json'},body:raw})
        const resultBody=await result.json()
        if(selected===entry)output.textContent=JSON.stringify(resultBody,null,2)
      }catch(e){if(selected===entry)output.textContent=message(e)}
    }
    $('search').oninput=filter
    $('group').onchange=filter
    $('run').onclick=()=>run('worker')
    $('review').onclick=()=>run('bot')
    filter()
    select(fleet.entries[0],false)
  }

  async function vault(){
    const status=$('vault-status')
    const report=text=>{status.textContent=text}
    const db=await new Promise((resolve,reject)=>{
      const request=indexedDB.open('nathan-fleet-voice-vault',1)
      request.onupgradeneeded=()=>request.result.createObjectStore('originals',{keyPath:'id'})
      request.onsuccess=()=>resolve(request.result)
      request.onerror=()=>reject(request.error)
    })
    function readWrite(action,mode='readonly'){
      return new Promise((resolve,reject)=>{
        const tx=db.transaction('originals',mode)
        const operation=action(tx.objectStore('originals'))
        tx.oncomplete=()=>resolve(operation.result)
        tx.onabort=()=>reject(tx.error??new Error('Vault operation aborted'))
      })
    }
    const digest=async blob=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('')
    let recorder,audio=null,previewUrl
    const record=$('record'), stop=$('stop'), save=$('save'), preview=$('preview')
    function setAudio(blob){
      if(previewUrl)URL.revokeObjectURL(previewUrl)
      audio=blob
      preview.hidden=!blob
      if(blob){previewUrl=URL.createObjectURL(blob);preview.src=previewUrl}
      else preview.removeAttribute('src')
    }
    record.onclick=async()=>{
      let stream
      record.disabled=save.disabled=true
      try{
        stream=await navigator.mediaDevices.getUserMedia({audio:true})
        recorder=new MediaRecorder(stream)
        const chunks=[]
        recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)}
        let limit
        recorder.onstop=()=>{
          clearTimeout(limit)
          stream.getTracks().forEach(track=>track.stop())
          if(chunks.length)setAudio(new Blob(chunks,{type:recorder.mimeType||chunks[0].type}))
          record.disabled=save.disabled=false
          stop.disabled=true
          report(chunks.length?'Recording ready to lock.':'No audio was captured.')
        }
        recorder.onerror=e=>report(message(e.error))
        recorder.start(1000)
        limit=setTimeout(()=>{if(recorder.state==='recording')recorder.stop()},300000)
        stop.disabled=false
        report('Recording. The session stops after five minutes.')
      }catch(e){
        stream?.getTracks().forEach(track=>track.stop())
        record.disabled=save.disabled=false
        report(message(e))
      }
    }
    stop.onclick=()=>{if(recorder?.state==='recording')recorder.stop();stop.disabled=true}
    function download(blob,name){
      const url=URL.createObjectURL(blob), link=document.createElement('a')
      link.href=url;link.download=name;link.click()
      setTimeout(()=>URL.revokeObjectURL(url),1000)
    }
    let rows=[]
    function render(){
      const term=$('vault-search').value.toLowerCase()
      const matches=rows.filter(r=>(r.title+' '+r.transcript).toLowerCase().includes(term)).sort((a,b)=>b.created.localeCompare(a.created))
      $('records').replaceChildren(...matches.map(row=>{
        const block=node('article','')
        block.className='record'
        const info={id:row.id,title:row.title,created:row.created,textSha256:row.textHash,audioSha256:row.audioHash,verbatim_locked:true}
        block.append(node('h3',row.title),node('p',new Date(row.created).toLocaleString()+' · '+(row.audio?'audio':'')+(row.audio&&row.transcript?' + ':'')+(row.transcript?'exact text':'')))
        const actions=node('div','')
        actions.className='actions'
        const verify=node('button','Verify')
        const verdict=node('p','')
        verdict.setAttribute('role','status')
        verify.onclick=async()=>{
          try{
            const ok=await digest(new Blob([row.transcript]))===row.textHash&&(!row.audio||await digest(row.audio)===row.audioHash)
            verdict.textContent=ok?'Stored contents match their SHA-256 digests.':'Stored contents differ from their recorded digests.'
          }catch(e){verdict.textContent=message(e)}
        }
        actions.append(verify)
        if(row.transcript){
          const text=node('button','Download text')
          text.onclick=()=>download(new Blob([row.transcript],{type:'text/plain;charset=utf-8'}),row.id+'.txt')
          actions.append(text)
        }
        if(row.audio){
          const file=node('button','Download audio')
          const ext=row.audio.type.includes('mp4')?'m4a':row.audio.type.includes('ogg')?'ogg':'webm'
          file.onclick=()=>download(row.audio,row.id+'.'+ext)
          actions.append(file)
        }
        const receipt=node('button','Download receipt')
        receipt.onclick=()=>download(new Blob([JSON.stringify(info,null,2)],{type:'application/json'}),row.id+'.json')
        actions.append(receipt)
        block.append(actions,verdict)
        return block
      }))
      if(!matches.length)$('records').append(node('p',rows.length?'No matching records.':'No saved originals in this browser.'))
    }
    save.onclick=async()=>{
      const transcript=$('transcript').value, blob=audio
      if(!transcript&&!blob){report('Record audio or enter text first.');return}
      const title=$('title').value.trim()||'Untitled record'
      save.disabled=record.disabled=true
      try{
        const row={id:crypto.randomUUID(),title,created:new Date().toISOString(),transcript,audio:blob,textHash:await digest(new Blob([transcript])),audioHash:blob?await digest(blob):null}
        await readWrite(store=>store.add(row),'readwrite')
        setAudio(null);$('transcript').value='';$('title').value=''
        rows.push(row)
        render()
        report('Original locked and saved in this browser.')
      }catch(e){report(message(e))}
      finally{save.disabled=record.disabled=false}
    }
    $('vault-search').oninput=render
    rows=await readWrite(store=>store.getAll())
    render()
  }
  const view=$('main').dataset.view
  const start=view==='vault'?vault:fleet
  start().catch(error=>{$(view==='vault'?'vault-status':'output').textContent=message(error)})
})();`
