'use strict';
/* ONE Connected System: read-only discovery of existing on-device stores.
   Imported originals never leave this browser or get written into GitHub. */
(()=>{
  const $=id=>document.getElementById(id);
  const BINARY=Object.freeze({CLEAR:0,BUILD:1});
  const STORE='one.connected.owner-links.v1';
  const LIMIT=100000;
  const nodes=new Map();
  let links=[],shown=100,from='',to='',previewURL=null;
  const scans=[];
  const escapeText=s=>String(s??'');
  const add=(n)=>{if(!n||!n.key||nodes.has(n.key))return;nodes.set(n.key,n)};
  const status=s=>{$('status').textContent=s};
  const text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=escapeText(value);if(cls)e.className=cls;return e};
  const counts=()=>{const all=[...nodes.values()];return {
    apps:all.filter(n=>n.kind==='app').length,
    books:all.filter(n=>n.kind==='book').length,
    images:all.filter(n=>n.kind==='image').length,
    other:all.filter(n=>!['app','book','image'].includes(n.kind)).length
  }};
  const modules=[
    ['master-library','ONE Master Library · 101–901','../library/index.html','book','local-first browser module'],
    ['creator-vault','Universal Creator Vault','../../vault.html','app','local-first browser module'],
    ['sealed-voice-box','SEALED VOICE BOX · AI Offloader','../offloader/index.html','app','encrypted local browser module'],
    ['tabor-trinity','THE TABOR TRINITY · 17-Part Book/Game/App','../tabor-trinity/index.html','book','public browser module'],
    ['assocchio','ASSOCCHIO · Book + Game','../assocchio/index.html','book','public browser module'],
    ['accountability','TRANSFERRED INSTEAD OF ARRESTED · Book/Game','../accountability/index.html','book','public browser module'],
    ['mother-earth','MOTHER EARTH · Book/Game/App','../mother-earth/index.html','book','public browser module'],
    ['rcc-time','TIME · Book/Art/Game','../rcc-time/index.html','book','public browser module'],
    ['trial-matrix','33 Trial Matrix · Epoch I','../trial-matrix/index.html','app','public browser module'],
    ['language-db','Universal Language Database · D17', '../library/index.html','app','private index requires owner import'],
    ['33million','33 Million Book Library', '../library/index.html','book','planning and private catalog; not 33M completed books']
  ];
  function seedModules(){
    for(const [id,title,url,kind,stage] of modules)add({key:'module:'+id,title,url,kind,stage,origin:'ONE existing modules',state:BINARY.BUILD});
  }
  async function publicProducts(){
    try{
      const response=await fetch('../../products.json',{cache:'no-store',credentials:'same-origin'});
      if(!response.ok)throw Error('HTTP '+response.status);
      const obj=await response.json();
      if(obj.schema!=='tabor123.ecosystem-catalog.v1'||!Array.isArray(obj.products))throw Error('Unexpected public registry');
      for(const p of obj.products){
        if(!p||typeof p.id!=='string'||typeof p.name!=='string')continue;
        const kind=/Game|Games/i.test(p.category)?'app':'app';
        const url=p.url&&p.url.startsWith('./')?'../../'+p.url.slice(2):'';
        const docs=p.docs&&p.docs.startsWith('./')?'../../'+p.docs.slice(2):'';
        add({key:'product:'+p.id,title:p.name,kind,stage:p.status||'unverified',url,docs,origin:'Factory public products.json',state:BINARY.BUILD,summary:p.summary||''});
      }
      scans.push('Public app registry: '+obj.products.length+' entries (catalog data; not proof of deployed services)');
    }catch(e){scans.push('Public app registry unavailable: '+e.message);}
  }
  function openExisting(name){
    return new Promise(resolve=>{
      if(!('indexedDB' in window)){resolve(null);return}
      let req;
      try{req=indexedDB.open(name)}catch(e){resolve(null);return}
      let newDb=false;
      req.onupgradeneeded=()=>{newDb=true;req.transaction.abort()};
      req.onsuccess=()=>{if(newDb){req.result.close();resolve(null)}else resolve(req.result)};
      req.onerror=()=>resolve(null);
      req.onblocked=()=>resolve(null);
    });
  }
  function records(db,storeName,visit){
    return new Promise((resolve,reject)=>{
      if(!db.objectStoreNames.contains(storeName)){resolve({read:0,limited:false});return}
      let n=0,limited=false;
      const tx=db.transaction(storeName,'readonly');
      const req=tx.objectStore(storeName).openCursor();
      req.onsuccess=()=>{
        const cursor=req.result;
        if(!cursor)return;
        if(n>=LIMIT){limited=true;return}
        try{visit(cursor.value)}catch(e){ /* a malformed source row must not erase other originals */ }
        n++;cursor.continue();
      };
      tx.oncomplete=()=>resolve({read:n,limited});
      tx.onerror=()=>reject(tx.error||Error('Local store read failed'));
      tx.onabort=()=>reject(tx.error||Error('Local scan aborted'));
    });
  }
  async function scanLocal(){
    const sources=[
      {name:'ONE Master Library',db:'tabor-one-private-master-library-v1',store:'records',read:r=>{
        const shelf=String(r.shelf||'');
        add({key:'library:'+r.id,title:escapeText(r.title||r.originalId||'Untitled'),kind:shelf==='201'||r.kind==='document'?'book':shelf==='901'?'image':shelf==='401'?'app':'record',
          stage:r.stage||'unverified source record',origin:'ONE Master Library · '+(r.provenance||'owner import'),sourceId:r.originalId||r.id,
          parent:'module:master-library',url:'../library/index.html',state:BINARY.BUILD,summary:r.description||''});
      }},
      {name:'Universal Creator Vault',db:'tabor123_vault_v1',store:'records',read:r=>{
        const type=r.group==='image'?'image':r.kind==='conversation'?'record':r.group==='document'?'book':'record';
        add({key:'vault:'+r.id,title:escapeText(r.name||'Untitled asset'),kind:type,stage:r.kind||'owner imported file',
          origin:'Creator Vault · '+(r.project||'Unsorted'),sourceId:r.id,parent:'module:creator-vault',url:'../../vault.html',
          state:BINARY.BUILD,summary:r.summary||'',mime:r.mime||''});
      }}
    ];
    for(const s of sources){
      const db=await openExisting(s.db);
      if(!db){scans.push(s.name+': not imported in this browser');continue}
      try{
        const result=await records(db,s.store,s.read);
        scans.push(s.name+': '+result.read.toLocaleString()+' local entries'+(result.limited?' (scan limit reached; partial)':''));
      }catch(e){scans.push(s.name+': unavailable ('+e.message+')')}
      finally{db.close()}
    }
    try{
      const raw=JSON.parse(localStorage.getItem('tabor123_projects_v1')||'[]');
      if(Array.isArray(raw)){
        let n=0;
        for(const p of raw){
          if(!p||typeof p!=='object')continue;
          const id=String(p.id||p.name||p.title||n);
          add({key:'factory:'+id,title:String(p.name||p.title||'Untitled Factory project'),kind:'app',
            stage:'local Factory project entry',origin:'TABOR 1-2-3 FACTORY',url:'../../index.html',state:BINARY.BUILD});
          n++;
        }
        scans.push('Factory local projects: '+n);
      }
    }catch(e){scans.push('Factory project index unavailable')}
  }
  function loadLinks(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORE)||'[]');
      links=Array.isArray(raw)?raw.filter(e=>e&&typeof e.from==='string'&&typeof e.to==='string'&&typeof e.type==='string').slice(0,200000):[];
    }catch(e){links=[]}
  }
  function persist(){
    try{localStorage.setItem(STORE,JSON.stringify(links));return true}
    catch(e){status('The link could not be saved. Browser storage unavailable or full. Export existing links and keep a backup.');return false}
  }
  function setPick(side,key){
    if(side==='from')from=key;else to=key;
    const a=nodes.get(from),b=nodes.get(to);
    $('from').textContent=a?a.title:'Choose FROM in a result';
    $('to').textContent=b?b.title:'Choose TO in a result';
  }
  function renderStats(){
    const c=counts();
    for(const [k,v] of Object.entries(c))$(k+'Count').textContent=v.toLocaleString();
    $('linksCount').textContent=links.length.toLocaleString();
    $('sources').replaceChildren(...scans.map(s=>text('p',s)));
  }
  function renderResults(){
    const search=$('search').value.trim().toLocaleLowerCase();
    const kind=$('type').value;
    const candidates=[...nodes.values()].filter(n=>(!kind||n.kind===kind)&&(!search||(n.title+' '+n.origin+' '+n.stage+' '+(n.sourceId||'')).toLocaleLowerCase().includes(search)));
    $('match').textContent=candidates.length.toLocaleString()+' matching records · '+Math.min(shown,candidates.length).toLocaleString()+' visible';
    const list=$('results');list.replaceChildren();
    for(const n of candidates.slice(0,shown)){
      const item=text('article','', 'item');
      item.append(text('strong',n.title),text('small',n.kind.toUpperCase()+' · '+n.stage),text('small',n.origin));
      const row=text('div','', 'row');
      for(const side of ['from','to']){
        const b=text('button',side==='from'?'Set FROM':'Set TO');
        b.onclick=()=>setPick(side,n.key);row.append(b);
      }
      if(n.url){
        const a=text('a','Open source page');
        a.href=n.url;a.target='_blank';a.rel='noopener';row.append(a);
      }else if(n.docs){
        const a=text('a','Read source documentation');a.href=n.docs;a.target='_blank';a.rel='noopener';row.append(a);
      }
      if(n.kind==='image'&&n.key.startsWith('vault:')&&/^image\/(png|jpeg|webp|gif|avif)$/i.test(n.mime)){
        const b=text('button','Preview image');b.onclick=()=>previewImage(n);row.append(b);
      }
      item.append(row);list.append(item);
    }
    $('more').hidden=shown>=candidates.length;
  }
  async function previewImage(n){
    const db=await openExisting('tabor123_vault_v1');
    if(!db||!db.objectStoreNames.contains('blobs')){status('Image bytes are not available in this browser Vault.');db?.close();return}
    let blob=null;
    try{blob=await new Promise((resolve,reject)=>{
      const tx=db.transaction('blobs','readonly');const req=tx.objectStore('blobs').get(n.sourceId);
      req.onsuccess=()=>resolve(req.result?.blob||null);req.onerror=()=>reject(req.error);
    })}catch(e){status('Image preview unavailable: '+e.message)}
    finally{db.close()}
    if(!(blob instanceof Blob)){status('Original image not found in Vault.');return}
    if(previewURL)URL.revokeObjectURL(previewURL);
    previewURL=URL.createObjectURL(blob);
    const img=document.createElement('img');img.alt=n.title;img.src=previewURL;
    const target=$('preview');target.replaceChildren(text('h3',n.title),img);
    target.hidden=false;target.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function renderLinks(){
    $('linksCount').textContent=links.length.toLocaleString();
    const list=$('links');list.replaceChildren();
    for(const [i,e] of links.entries()){
      if(i>=200)break;
      const row=text('article','', 'item');
      row.append(text('strong',(nodes.get(e.from)?.title||e.from)+' → '+(nodes.get(e.to)?.title||e.to)),text('small',e.type+' · owner-approved '+e.ownerApproved+' · historical verification not asserted'));
      const b=text('button','Unlink only');
      b.onclick=()=>{if(!confirm('Remove this connection? Originals and records will remain unchanged.'))return;
        const old=links;links=links.filter((_,j)=>j!==i);if(!persist())links=old;renderLinks()};
      row.append(b);list.append(row);
    }
    if(links.length>200)list.append(text('p','Showing first 200 links. Export the manifest for the full list.'));
    if(!links.length)list.append(text('p','Select two records and create your first owner-approved relationship.'));
  }
  function saveLink(){
    if(!from||!to||!nodes.has(from)||!nodes.has(to)){status('Select FROM and TO using the record buttons.');return}
    if(from===to){status('Choose two distinct records.');return}
    const type=$('relation').value;
    const key=from+'|'+type+'|'+to;
    if(links.some(l=>l.key===key)){status('That exact relationship already exists.');return}
    const entry={key,from,to,type,ownerApproved:BINARY.BUILD,externalVerified:BINARY.CLEAR,createdAt:new Date().toISOString()};
    links.push(entry);
    if(!persist()){links.pop();return}
    renderLinks();status('Connection saved in this browser. The original source records were not modified.');
  }
  function download(name,data){
    const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=name;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
  }
  function exportLinks(){
    const payload={schema:'one.connected.owner-links.v1',exportedAt:new Date().toISOString(),binary:{CLEAR:BINARY.CLEAR,BUILD:BINARY.BUILD},
      note:'Relationship identifiers only. No original books, images, transcripts, keys or encrypted vault data.',links};
    download('ONE_CONNECTED_LINKS.json',JSON.stringify(payload,null,2));
    status('Downloaded relationship manifest. Back up full originals separately from their source Vaults.');
  }
  async function importLinks(file){
    if(!file||file.size>15*1024*1024)throw Error('Select a links JSON file smaller than 15 MB.');
    const imported=JSON.parse(await file.text());
    if(imported.schema!=='one.connected.owner-links.v1'||!Array.isArray(imported.links))throw Error('Wrong relationship file format.');
    let added=0;const existing=new Set(links.map(l=>l.key));
    for(const l of imported.links){
      if(!l||typeof l.from!=='string'||typeof l.to!=='string'||!['illustrates','adapted-as','belongs-to','references','connected-with','source-of'].includes(l.type))continue;
      if(l.from===l.to||l.from.length>600||l.to.length>600)continue;
      const key=l.from+'|'+l.type+'|'+l.to;
      if(existing.has(key))continue;
      links.push({key,from:l.from,to:l.to,type:l.type,ownerApproved:BINARY.BUILD,externalVerified:BINARY.CLEAR,createdAt:new Date().toISOString()});
      existing.add(key);added++;
      if(links.length>=200000)break;
    }
    if(!persist()){links.splice(links.length-added,added);throw Error('Insufficient local storage for imported relationships.')}
    renderLinks();return added;
  }
  async function start(){
    seedModules();loadLinks();
    await publicProducts();
    await scanLocal();
    renderStats();renderResults();renderLinks();
    status('Connected index ready. '+
      [...nodes.values()].length.toLocaleString()+
      ' discoverable records across available local sources and the curated public registry. Private records remain on this device.');
  }
  $('search').oninput=()=>{shown=100;renderResults()};
  $('type').onchange=()=>{shown=100;renderResults()};
  $('more').onclick=()=>{shown+=100;renderResults()};
  $('save').onclick=saveLink;
  $('export').onclick=exportLinks;
  $('reload').onclick=async()=>{nodes.clear();scans.length=0;from='';to='';setPick('from','');setPick('to','');shown=100;status('Refreshing local catalog…');await start()};
  $('importLinks').onchange=async()=>{
    const file=$('importLinks').files[0];if(!file)return;
    try{const added=await importLinks(file);status('Imported '+added+' new relationship IDs; all originals remain untouched.')}
    catch(e){status('Import rejected: '+e.message)}
    finally{$('importLinks').value=''}
  };
  window.addEventListener('pagehide',()=>{if(previewURL)URL.revokeObjectURL(previewURL)});
  start().catch(e=>status('Unable to scan all sources: '+e.message));
})();