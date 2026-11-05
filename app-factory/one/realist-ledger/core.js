/* NATHAN AI — 101-ACTION CHRONICLE: pure parsing and game logic.
   Source words are immutable: no entry text is rewritten by this code. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ChronicleCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SECTIONS=Object.freeze([
    {id:'I',from:1,to:25,title:'The 1994 Structural Reconnaissance & Physical Entry',subtitle:'Field observations and architectural study'},
    {id:'II',from:26,to:50,title:'Linguistic Decryption & Textual Deconstruction',subtitle:'Language, manuscripts, and methods'},
    {id:'III',from:51,to:75,title:'Direct Confrontation, Legal Challenges, & Strategic Activism',subtitle:'Advocacy, confrontation, and personal history'},
    {id:'IV',from:76,to:101,title:'Authoring the Counter-Matrix & Designing the Blueprint',subtitle:'Original works, software, and inventions'}
  ]);
  const sectionOf=n=>SECTIONS.find(s=>n>=s.from&&n<=s.to)||null;
  const MAX_SOURCE_CHARS=2*1024*1024;
  function validateEntries(items){
    if(!Array.isArray(items)||items.length!==101)throw new Error('The ledger needs exactly 101 entries.');
    const seen=new Set();let bytes=0;
    return items.map(e=>{
      if(!e||!Number.isInteger(e.number)||e.number<1||e.number>101||seen.has(e.number)||typeof e.text!=='string')throw new Error('Invalid, repeated, or missing action number.');
      seen.add(e.number);
      const section=sectionOf(e.number);
      if(e.section!==section.id)throw new Error('Action '+e.number+' has a conflicting volume.');
      if(e.text.length>100000)throw new Error('Action '+e.number+' exceeds the allowed size.');
      const result={number:e.number,text:e.text,section:section.id};
      if(e.original!==undefined){
        if(typeof e.original!=='string'||e.original.length>100000||
          !new RegExp('^\\s*0*'+e.number+'\\.\\s+').test(e.original))throw new Error('Action '+e.number+' has an invalid verbatim source.');
        result.original=e.original;
      }
      bytes+=e.text.length+(result.original||'').length;
      if(bytes>MAX_SOURCE_CHARS*2)throw new Error('The stored ledger exceeds the safe size limit.');
      return result;
    }).sort((a,b)=>a.number-b.number);
  }
  function parseLedger(text){
    if(typeof text!=='string')throw new Error('The source must be text.');
    if(text.length>MAX_SOURCE_CHARS)throw new Error('The original ledger exceeds 2 MiB. Keep the unmodified original separately.');
    // Capturing each line terminator leaves the original CRLF, LF or CR bytes
    // in the verbatim entry. Only the browse/search view is normalized.
    const lines=text.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g)||[];
    const byNumber=new Map();let current=null;
    for(const raw of lines){
      if(!raw)continue;
      const line=raw.replace(/(?:\r\n|\n|\r)$/,'');
      const matched=line.match(/^\s*(\d{1,3})\.\s+(.+)$/);
      if(matched){
        const n=Number(matched[1]);
        if(n>=1&&n<=101){
          if(byNumber.has(n))throw new Error('Duplicate entry '+n+'.');
          current={number:n,text:matched[2].trim(),section:sectionOf(n).id,original:raw};
          byNumber.set(n,current);
        }else current=null;
      }else if(current&&/^\s{2,}\S/.test(line)&&!/^\s*[•\-*]/.test(line)){
        // Preserve the literal, original continuation, including indentation.
        current.text+=' '+line.trim();
        current.original+=raw;
      }else if(/^\s*$/.test(line))current=null;
    }
    const missing=Array.from({length:101},(_,i)=>i+1).filter(n=>!byNumber.has(n));
    if(missing.length)throw new Error('The ledger needs 101 numbered entries. Missing: '+missing.slice(0,16).join(', ')+(missing.length>16?'…':'')+'.');
    return validateEntries(Array.from(byNumber.values()));
  }
  function placeholderLedger(){return Array.from({length:101},(_,i)=>({number:i+1,text:'',section:sectionOf(i+1).id}));}
  function bookText(section,entries){
    const canonical=SECTIONS.find(s=>s.id===section?.id);
    if(!canonical||canonical.from!==section.from||canonical.to!==section.to||canonical.title!==section.title)throw new Error('Use one of the four original Chronicle volumes.');
    const selected=validateEntries(entries).filter(e=>e.number>=section.from&&e.number<=section.to);
    if(selected.length!==section.to-section.from+1||selected.some(e=>!e.text))throw new Error('Import the complete original source before exporting populated volumes.');
    const title='NATHAN AI — THE 101-ACTION CHRONICLE';
    return ['# '+title,'','## Volume '+section.id+': '+section.title,'',
      '> SOURCE RECORD: Entries below reproduce the author-supplied account without alteration. These are autobiographical statements and interpretations, not independent historical verification.',
      '',`**Original entry range:** ${section.from}–${section.to}`,'','---','',
      ...selected.flatMap(e=>['### Action '+e.number,'',e.original!==undefined?e.original:e.number+'. '+e.text,'']),
      '---','', '### Research and documentation pages','',
      'For each action, record an original document or artifact, date, source, corroboration, uncertainty, and further reading separately. Do not change the source entry.','',
      '### Author note','',
      'The four volumes preserve the sequence of the original 101-action ledger. Further narrative chapters may be added as separately attributed writing.',''].join('\n');
  }
  function buildQuestion(entries,random=Math.random){
    const complete=entries.filter(e=>e.text);
    const pool=complete.length?complete:entries;
    const chosen=pool[Math.floor(random()*pool.length)];
    const correct=sectionOf(chosen.number);
    return {number:chosen.number,clue:chosen.text||'Gate '+String(chosen.number).padStart(3,'0')+' — choose its volume.',correct:correct.id,choices:SECTIONS.map(s=>({id:s.id,label:'Volume '+s.id})),sectionTitle:correct.title};
  }
  function cleanFilename(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
  return {SECTIONS,sectionOf,MAX_SOURCE_CHARS,validateEntries,parseLedger,placeholderLedger,bookText,buildQuestion,cleanFilename};
});
