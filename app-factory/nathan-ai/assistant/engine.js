(function(root){
  'use strict';
  const SCHEMA='nathan-ai.assistant-session.v1',KEY=SCHEMA;
  const STOP=new Set('a an the and or to of in on for is are was were my me i you your what how why about can do does tell with from it this that all'.split(' '));
  function noCredentials(value){
    if(/-----BEGIN[^\n]*PRIVATE KEY-----|\bsk-[A-Za-z0-9_-]{20,}|\b(?:password|passphrase|seed phrase|recovery phrase|private key|api[_ -]?key)\s*[:=]\s*\S+/i.test(String(value)))throw Error('Possible credentials detected. Remove them before searching, saving or sending this text.');
  }
  function terms(value){return [...new Set(String(value).normalize('NFKC').toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)||[])].filter(t=>!STOP.has(t)&&t.length>1)}
  function source(row){
    noCredentials([row.title,row.body,row.summary,row.text].filter(Boolean).join('\n'));
    return {id:String(row.id),title:String(row.title||row.name||row.id),text:String(row.body||row.summary||row.text||''),origin:String(row.origin||row.sourceName||row.source||'Source reference'),stage:String(row.stage||row.status||'Source stage not supplied'),private:Boolean(row.private)};
  }
  function localSources(graph,research){
    const rows=[];
    for(const n of graph?.nodes||[])rows.push(source({id:'local-graph:'+n.id,title:(n.symbol?n.symbol+' · ':'')+n.title,body:[n.summary,n.notes].filter(Boolean).join('\n\nOwner notes:\n'),source:n.source,status:n.status,private:true}));
    for(const n of research?.items||[])rows.push(source({id:'local-research:'+n.id,title:n.title,body:[n.note,n.collection].filter(Boolean).join('\n'),sourceName:n.sourceName,stage:'Owner-saved reference and notes; original may not be loaded',private:true}));
    return rows;
  }
  function retrieve(question,rows,max=5){
    if(typeof question!=='string'||!question.trim()||question.length>4000)throw Error('Enter a question of 1–4000 characters');
    noCredentials(question);
    const tokens=terms(question);if(!tokens.length)return [];
    return rows.map(source).map((r,i)=>{
      const title=terms(r.title),body=terms(r.text.slice(0,100000)),origin=terms(r.origin+' '+r.stage);
      const score=tokens.reduce((n,t)=>n+(title.includes(t)?6:0)+(body.includes(t)?2:0)+(origin.includes(t)?1:0),0);
      const lower=r.text.toLocaleLowerCase();let at=-1;for(const t of tokens){const pos=lower.indexOf(t);if(pos>=0&&(at<0||pos<at))at=pos}
      const start=Math.max(0,at-140),end=Math.min(r.text.length,start+900);
      const excerpt=(start?'…':'')+r.text.slice(start,end)+(end<r.text.length?'…':'');
      return {...r,score,excerpt,i};
    }).filter(r=>r.score>0).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,max);
  }
  function answer(question,sources,mode='answer'){
    if(!sources.length)return {mode:'source-retrieval',answer:'No matching source text was found in the loaded records. Try a specific title, symbol or phrase, or opt in to the relevant local records.',citations:[],suggestions:[]};
    return {mode:'source-retrieval',answer:'Relevant source passages:\n\n'+sources.map((s,i)=>'['+(i+1)+'] '+s.title+'\n“'+s.excerpt+'”\nSource stage: '+s.stage).join('\n\n'),citations:sources.map(s=>s.id),suggestions:mode==='plan'?['Open the cited originals and preserve their wording.','Record the specific implementation or evidence gap as a task.','Choose one acceptance test before changing the implementation.']:[]};
  }
  function packet(question,sources){
    return {question,sources:sources.map(s=>({id:s.id,title:s.title,text:s.excerpt,stage:s.stage})),operation:'draft-only'};
  }
  function session(value){
    if(!value||value.schema!==SCHEMA||!Array.isArray(value.turns)||value.turns.length>40)throw Error('Invalid conversation backup');
    const turns=value.turns.map(t=>{
      if(!t||typeof t.question!=='string'||t.question.length>4000||typeof t.answer!=='string'||t.answer.length>24000||!['source-retrieval','model'].includes(t.mode)||!Array.isArray(t.sources)||t.sources.length>5)throw Error('Invalid conversation turn');
      noCredentials(t.question);noCredentials(t.answer);
      return {question:t.question,answer:t.answer,mode:t.mode,sources:t.sources.map(s=>{
        for(const [key,max]of [['id',1000],['title',2000],['excerpt',1200],['stage',500]])if(typeof s[key]!=='string'||s[key].length>max)throw Error('Invalid source citation');
        noCredentials(s.excerpt);
        return {id:s.id,title:s.title,excerpt:s.excerpt,stage:s.stage,private:Boolean(s.private)};
      })};
    });return {schema:SCHEMA,turns};
  }
  function parse(raw){if(new TextEncoder().encode(raw).length>2*1024*1024)throw Error('Conversation backup exceeds 2 MB');return session(JSON.parse(raw))}
  function save(storage,value,baseline){if(storage.getItem(KEY)!==baseline)throw Error('Saved conversation changed in another tab. Export this conversation before reloading.');const clean=session(value);storage.setItem(KEY,JSON.stringify(clean));return clean}
  const api={SCHEMA,KEY,terms,source,localSources,retrieve,answer,packet,session,parse,save,noCredentials};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanAssistant=api;
})(typeof window==='object'?window:globalThis);
