/* Universal Master Matrix console. All source processing is local-only.
 * Hashes are integrity fingerprints, NOT encryption.
 */
(function(){
  'use strict';
  function byId(id){return document.getElementById(id);}
  function show(id,value){byId(id).textContent=value;}
  function text(value){return String(value===undefined||value===null?'':value);}
  function item(tag,words,parent,cl) {
    const e=document.createElement(tag);e.textContent=words;
    if(cl)e.className=cl;
    parent.appendChild(e);return e;
  }
  function option(select,value,label) {
    const opt=document.createElement('option');opt.value=value;opt.textContent=label;select.appendChild(opt);
  }
  function slug(value) {
    return text(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)||'original';
  }
  function download(payload,name) {
    const data=JSON.stringify(payload,null,2)+'\n';
    const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=name;
    document.body.appendChild(a);a.click();a.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),12000);
  }
  async function sha256(value) {
    if(!window.crypto||!crypto.subtle||typeof crypto.subtle.digest!=='function')throw Error(
      'Browser SHA-256 unavailable. Open from a secure HTTPS page; no unverified packet was created.');
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  }
  function getInput(){
    return {
      owner:byId('owner').value,source:byId('source').value,
      sourceLabel:byId('source-label').value,stack:byId('stack').value,
      plane:byId('plane').value,direction:byId('direction').value,
      destinationId:byId('destination').value,
      duoDecimal:byId('duo-decimal').value,deweySuggested:byId('dewey').value
    };
  }
  function currentMeta(manifest) {
    const {sourceText,...rest}=manifest;
    return rest;
  }
  function createApp() {
    const M=window.TaborUniversalMatrix;
    if(!M){show('packet-status','Registry source is not loaded. Open the app within the complete Factory checkout.');return;}
    const check=M.validateRegistry();
    if(!check.ok){show('packet-status','Registry validation failed: '+check.errors.join('; '));return;}
    M.PLANES.forEach(x=>{
      const box=item('article','',byId('planes'),'tile');
      item('h3',x.label,box);
      item('p',x.purpose,box);
      item('small','Output: '+x.output,box);
      option(byId('plane'),x.id,x.label);
    });
    M.STACKS.forEach(x=>{
      const line=item('div','',byId('stacks'));
      item('strong',x.group+' · ',line);
      item('span',x.title,line);
      option(byId('stack'),x.id,x.title);
    });
    M.AXES.forEach(x=>{
      const line=item('div','',byId('axes'));
      item('strong',x.label+' · ',line);
      item('span',x.value,line);
    });
    M.DESTINATIONS.forEach(x=>option(byId('destination'),x.id,x.sector+' · '+x.name+' ('+x.status+')'));
    byId('destination').value='kickstarter';
    function renderDestinations(){
      const query=byId('query').value.trim().toLowerCase();
      const status=byId('status-filter').value;
      const visible=M.DESTINATIONS.filter(x=>(!status||x.status===status)&&
        (!query||[x.name,x.sector,x.scope,x.status].join(' ').toLowerCase().includes(query)));
      const region=byId('destination-list');region.replaceChildren();
      for(const d of visible){
        const box=item('article','',region,'dest');
        item('h3',d.name,box);
        item('small',d.sector+' · '+d.status,box);
        item('p',d.scope,box);
        const btn=item('button','SELECT TARGET',box);
        btn.type='button';btn.addEventListener('click',()=>{
          byId('destination').value=d.id;
          show('packet-status','Selected '+d.name+'. This changes the local destination marker only. No remote connection.');
        });
      }
      show('destination-summary',visible.length+' of '+M.DESTINATIONS.length+
        ' target entries · status reports describe code present, not access to external accounts.');
    }
    byId('query').addEventListener('input',renderDestinations);
    byId('status-filter').addEventListener('change',renderDestinations);
    renderDestinations();
    byId('source-file').addEventListener('change',async function(){
      const file=this.files&&this.files[0];if(!file)return;
      try{
        if(file.size>10*1024*1024)throw Error('Import exceeds 10 MiB; split your original into separate smaller files.');
        if(!/\.(txt|md)$/i.test(file.name))throw Error('Choose a TXT or Markdown file.');
        const value=await file.text();
        if(value.length>5000000)throw Error('Decoded source exceeds 5 million characters.');
        byId('source').value=value;
        byId('source-label').value=file.name.slice(0,200);
        show('packet-status','Imported decoded source text from '+file.name+' locally; no transmission. Preserve the original file separately for byte-exact evidence.');
      }catch(e){show('packet-status','SOURCE IMPORT BLOCKED: '+e.message);}
      this.value='';
    });
    byId('build').addEventListener('click',async()=>{
      try{
        const result=M.planFromSource(getInput());
        const sha=await sha256(result.sourceText);
        const stamp=new Date().toISOString();
        const packet={
          ...result,provenance:{
            capturedAtUtc:stamp,
            sourceUtf8Sha256:sha,
            algorithm:'SHA-256 over UTF-8 of captured source string',
            encryption:'none',
            version:M.VERSION,
            note:'No remote submission. This proves a fingerprint only, not provenance or external verification.'
          }
        };
        download(packet,slug(result.sourceLabel)+'-matrix-'+stamp.slice(0,10)+'.json');
        show('packet-status','Local packet prepared for download. Confirm the browser saved it.\\n'+
          'Original UTF-8 SHA-256: '+sha+'\\nCaptured UTC: '+stamp+'\\nTarget: '+result.destination.name+
          ' ('+result.destination.status+')\\nNo upload, payment, permission grant or publication.');
      }catch(e){show('packet-status','NOT COMPLETED: '+e.message);}
    });
    byId('copy').addEventListener('click',async()=>{
      try{
        const record=M.planFromSource(getInput());
        if(!navigator.clipboard||!navigator.clipboard.writeText)throw Error('Clipboard unavailable on this browser context.');
        const meta=currentMeta(record);
        await navigator.clipboard.writeText(JSON.stringify(meta,null,2));
        show('packet-status','Metadata copied WITHOUT the original source text. This has not been uploaded.');
      }catch(e){show('packet-status','COPY FAILED: '+e.message);}
    });
  }
  document.addEventListener('DOMContentLoaded',createApp);
})();
