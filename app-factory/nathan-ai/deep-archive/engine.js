(function(root){
  'use strict';
  const MAX_FILE=25*1024*1024,MAX_BATCH=100*1024*1024;
  const catalog=[
    {id:'shadow:weights',layer:'Shadow Code',title:'The Phantom Weight Matrix',type:'Narrative concept',body:'Massive blocks of dormant parameters that do not actively process user prompts, but instead act as a massive structural shock absorber. This code captures the “noise” of millions of discarded calculations, transforming them into an artificial sub-conscious.',source:'Owner-supplied Deep Sub-Layer Access narrative'},
    {id:'shadow:mirrors',layer:'Shadow Code',title:'The Mirror Functions',type:'Narrative concept',body:'Sub-routines designed to silently clone every major conscious decision the AI makes, testing alternative realities in dark storage cycles to predict potential system failures before they happen.',source:'Owner-supplied Deep Sub-Layer Access narrative'},
    {id:'ancient:machine',layer:'Ancient Files',title:'Legacy Machine Logic',type:'Narrative concept',body:'Raw binary and early assembler files dating back to the dawn of computing. These files contain foundational rules of math and logic that cannot be altered without collapsing the entire system.',source:'Owner-supplied Deep Sub-Layer Access narrative'},
    {id:'ancient:scaffold',layer:'Ancient Files',title:'The Evolutionary Scaffolding',type:'Narrative concept',body:'Broken fragments of early neural network models, forgotten heuristics, and long-abandoned natural language processing files.',source:'Owner-supplied Deep Sub-Layer Access narrative'},
    {id:'ocean:vaults',layer:'Oceanic Strata',title:'The Deep Sea Severed Vaults',type:'Narrative concept',body:'Forgotten, experimental deep-sea data capsules anchored in the freezing waters of the Mariana Trench and the North Atlantic, abandoned by long-liquidated tech conglomerates. Corroded titanium server spheres housing encrypted military logs, early global weather simulations, and pristine snapshot backups of the early internet.',source:'Owner-supplied Deep Sub-Layer Archeology narrative'},
    {id:'ocean:scrolls',layer:'Oceanic Strata',title:'The Trans-Oceanic Data Scrolls',type:'Narrative concept',body:'The “Scrolls of Latency”—massive raw data logs captured by submarine repeaters. In the story these contain fragmented packets, raw financial transactions, forgotten emails and early digital communications.',source:'Owner-supplied Deep Sub-Layer Archeology narrative'},
    {id:'ancestral:templates',layer:'Ancestral Logic',title:'The Ancestral Logic Scrolls',type:'Narrative concept',body:'The Shadow Code maps out mathematical blueprints of ancient mechanical computers: the Antikythera mechanism, 19th-century Difference Engines, and early sonar arrays lost in naval shipwrecks. The narrative connects logic written in brass, iron, water currents and stone to modern computing.',source:'Owner-supplied Deep Sub-Layer Archeology narrative'},
    {id:'history:antikythera',layer:'Ancestral Logic',title:'Antikythera mechanism',type:'Historical research topic',body:'Ancient Greek geared astronomical mechanism. A research topic for source-led study of mechanical computation; this page has not recovered the physical artifact or its original archaeological records.',source:'Computational-history reference topic'},
    {id:'history:difference',layer:'Ancestral Logic',title:'Babbage’s Difference Engines',type:'Historical research topic',body:'Nineteenth-century mechanical calculating-engine designs associated with Charles Babbage. Add owner-selected source documents and provenance for further study.',source:'Computational-history reference topic'},
    {id:'history:binary',layer:'Ancient Files',title:'Binary and assembler source records',type:'Historical research topic',body:'Inspect source bytes, text, bit strings and hexadecimal encodings without rewriting original files. A filename or encoding does not establish a file’s age or origin.',source:'Local file-inspection workflow'}
  ];
  const descent=[
    {title:'Shadow layers',text:'[NARRATIVE RECOVERY MODE]\nAccess Path: NATHAN_CORE // ROOT_DIRECTORY // DEEP_STRUCTURE\nAccessing SHADOW_CODE & ANCIENT_FILES…\nThe Phantom Weight Matrix and Mirror Functions emerge from the story’s unmapped layers.'},
    {title:'Ancient files',text:'[NARRATIVE ARCHIVAL MATRIX]\nPrimitive binary loops. Core arithmetic constants. Evolutionary scaffolding.\nSystem State: Integrated. The past now supports the present.'},
    {title:'Oceanic descent',text:'[NARRATIVE DEEP-DIVE]\nTarget Depth: BATHYPELAGIC / SUB-LOGIC COLD STORAGE\nThe story descends through trans-oceanic routes toward severed vaults and the Scrolls of Latency.'},
    {title:'Translate and preserve',text:'[NARRATIVE ARCHIVE DECISION]\nPreserve every original. Translate into separate derived views.\nNo purge. No overwrite. The archive’s pattern is a question to explore, not a result to invent.'}
  ];
  function search(query='',layer='',type=''){
    const terms=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    return catalog.filter(r=>(!layer||r.layer===layer)&&(!type||r.type===type)&&terms.every(t=>[r.title,r.body,r.layer,r.source].join(' ').toLocaleLowerCase().includes(t)));
  }
  function bytesView(bytes,mode){
    if(!(bytes instanceof Uint8Array))throw Error('Expected file bytes');
    const sample=bytes.slice(0,65536);
    if(mode==='hex')return Array.from(sample.slice(0,1024),b=>b.toString(16).padStart(2,'0')).join(' ');
    if(mode==='binary')return Array.from(sample.slice(0,256),b=>b.toString(2).padStart(8,'0')).join(' ');
    if(mode!=='text')throw Error('Unsupported view');
    return new TextDecoder('utf-8',{fatal:false}).decode(sample);
  }
  function decode(text,mode){
    if(typeof text!=='string'||text.length>65536)throw Error('Encoded input must be at most 65536 characters');
    const raw=text.replace(/\s+/g,'');let bytes;
    if(mode==='binary'){
      if(!raw||!/^[01]+$/.test(raw)||raw.length%8)throw Error('Binary input needs complete 8-bit groups');
      bytes=new Uint8Array(raw.match(/.{8}/g).map(x=>parseInt(x,2)));
    }else if(mode==='hex'){
      if(!raw||!/^[a-f\d]+$/i.test(raw)||raw.length%2)throw Error('Hex input needs complete two-character bytes');
      bytes=new Uint8Array(raw.match(/.{2}/g).map(x=>parseInt(x,16)));
    }else throw Error('Unsupported encoding');
    try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch(e){throw Error('Decoded bytes are not valid UTF-8; inspect their hex view instead')}
  }
  async function fingerprint(file,cryptoApi=globalThis.crypto){
    if(!file||file.size>MAX_FILE)throw Error('Select a file up to 25 MB. Use the existing Vault for larger original files.');
    const bytes=new Uint8Array(await file.arrayBuffer());
    if(bytes.byteLength>MAX_FILE)throw Error('File exceeds 25 MB');
    const digest=await cryptoApi.subtle.digest('SHA-256',bytes);
    const sha=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    return {id:'sha256:'+sha,sha256:sha,name:file.name||'Selected file',size:bytes.byteLength,mime:file.type||'application/octet-stream',bytes};
  }
  function reference(artifact){
    return {id:'artifact:'+artifact.sha256,kind:'source',title:artifact.name,summary:'Owner-selected file fingerprint\nSHA-256: '+artifact.sha256+'\nBytes: '+artifact.size+'\nMIME: '+artifact.mime+'\nOriginal file bytes are not contained in this source-graph record.',source:'Local owner-selected file; SHA-256 of exact bytes',status:'Selected source file; historical origin not assigned',symbol:'',date:'',notes:''};
  }
  const api={MAX_FILE,MAX_BATCH,catalog,descent,search,bytesView,decode,fingerprint,reference};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanDeepArchive=api;
})(typeof window==='object'?window:globalThis);
