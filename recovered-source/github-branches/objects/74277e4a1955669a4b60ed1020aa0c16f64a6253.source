'use strict';
// ONE owner-local acronym reader. No network access, credentials or auto-sync.
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ONEAcronymCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const MAX_ENTRIES=5000;
  const MAX_FILE_BYTES=5*1024*1024;
  const text=x=>x===undefined||x===null?'':String(x);
  function get(o,...keys){for(const key of keys){if(o&&o[key]!==undefined)return o[key]}return ''}
  function item(v){
    if(!v||typeof v!=='object')return null;
    const id=text(get(v,'key','Record Key','id','Record ID'));
    const term=text(get(v,'term','Acronym / Label','title','ticker','name'));
    const definition=text(get(v,'meaning','Exact Expansion / Meaning','description','definition'));
    if(!id||!term||!definition)return null;
    return {
      id, term, definition,
      context:text(get(v,'context','Department','group','category')),
      kind:text(get(v,'kind','Definition Type','stage','type')),
      date:text(get(v,'date','First Source Date')),
      source:text(get(v,'source','Source Work / Evidence','Source URL')),
      sourceId:text(get(v,'sourceId','Original Source ID')),
      mining:text(get(v,'mining','Mining Relevance')),
      notes:text(get(v,'notes','Context / Variant','provenance'))
    };
  }
  function jsonRecords(data){
    if(!data||typeof data!=='object')throw Error('Expected a JSON source object');
    if(data.schema==='one.acronyms.owner-export.v1'&&Array.isArray(data.records))return data.records.map(item).filter(Boolean);
    // Private 117-record three-year recovery; never fetch the source from the public site.
    // Each variant has its own stable key. Author/assistant/industry statuses remain separate.
    if(data.title==='NATHAN AI — Three-Year Acronym / Acrostic Recovery' && Array.isArray(data.records)){
      if(data.record_count!==data.records.length)throw Error('Recovery entry count mismatch');
      if(data.range_start!=='2023-11-02'||data.range_end!=='2026-11-02')throw Error('Unexpected recovery scope');
      if(data.records.length>MAX_ENTRIES)throw Error('Recovery file exceeds record limit');
      return data.records.map((r,i)=>item({
        key:'ACR-20261102-'+String(i+1).padStart(4,'0'),
        term:r.term, meaning:r.expansion, context:r.collection,
        kind:r.status, date:r.period, source:r.source,
        sourceId:r.source_id||'', notes:'Source classification: '+String(r.status||'unknown')
      })).filter(Boolean);
    }

    if(data.meta?.title==='TABOR TOTALITY ARCHIVE — MASTER EXPANSION 007'&&Array.isArray(data.records)){
      return data.records.filter(r=>r.group==='Acronyms & authored expansions').map(r=>item({key:String(r.id).startsWith('EX007-')?String(r.id):'EX007-'+r.id,term:r.title,meaning:r.description,context:r.group,kind:r.stage,source:r.source,sourceId:r.id,notes:r.notes})).filter(Boolean);
    }
    if(data.schema==='nathan-ai.sovereign-coin-matrix.v1'&&Array.isArray(data.coins)){
      return data.coins.map(c=>item({key:'SOVCOIN-'+String(c.number).padStart(2,'0'),term:c.ticker,meaning:c.name,context:'Sovereign Coins',kind:'author-defined coin design — not a mined asset',source:'THE 21 SOVEREIGN COIN MATRIX DEFINITIONS',sourceId:String(c.number),mining:'Coin design / not live asset',notes:c.definition})).filter(Boolean);
    }
    if(Array.isArray(data.records)&&data.records.every(x=>x&&typeof x.fields==='object'))return data.records.map(r=>item({...r.fields,id:r.fields['Record Key']||r.id})).filter(Boolean);
    throw Error('Unrecognized JSON schema. Nothing was imported.');
  }
  function csvRows(csv){
    if(typeof csv!=='string')throw Error('Invalid CSV');
    const result=[];let cell='',row=[],quoted=false;
    for(let i=0;i<csv.length;i++){
      const c=csv[i];
      if(c==='"'){
        if(quoted&&csv[i+1]==='"'){cell+='"';i++}else quoted=!quoted;
      } else if(c===','&&!quoted){row.push(cell);cell=''}
      else if((c==='\n'||c==='\r')&&!quoted){
        if(c==='\r'&&csv[i+1]==='\n')i++;
        row.push(cell); if(row.some(x=>x!==''))result.push(row);cell='';row=[];
      }else cell+=c;
      if(result.length>MAX_ENTRIES+1)throw Error('CSV exceeds 5,000-row limit');
    }
    if(quoted)throw Error('Unterminated CSV quotation');
    row.push(cell);if(row.some(x=>x!==''))result.push(row);
    return result;
  }
  function csvRecords(csv){
    const lines=csvRows(csv);if(!lines.length)return [];
    const cols=lines.shift().map(x=>x.replace(/^\uFEFF/,''));
    if(!cols.includes('Acronym / Label')||!cols.includes('Exact Expansion / Meaning')||!cols.includes('Record Key'))throw Error('CSV is not an Acronyms & Author Lexicon export');
    return lines.map(line=>item(Object.fromEntries(cols.map((c,i)=>[c,line[i]??''])))).filter(Boolean);
  }
  function parse(filename,body){
    if(text(body).length>MAX_FILE_BYTES)throw Error('File is too large for owner-local import');
    const data=/\.csv$/i.test(filename)?csvRecords(body):jsonRecords(JSON.parse(body));
    if(data.length>MAX_ENTRIES)throw Error('Source exceeds 5,000 entries');
    return data;
  }
  function merge(current,added){
    const map=new Map();
    for(const x of current)map.set(x.id,x);
    let addedCount=0,duplicates=0;
    for(const x of added){if(map.has(x.id)){duplicates++;continue}map.set(x.id,x);addedCount++}
    if(map.size>MAX_ENTRIES)throw Error('Merged registry exceeds 5,000 entries');
    return {records:[...map.values()],added:addedCount,duplicates};
  }
  function search(records,query='',filter='all',reverse=false){
    const q=text(query).toLocaleLowerCase();
    let matches=records.filter(x=>{
      const hay=[x.term,x.definition,x.context,x.kind,x.source,x.id,x.mining].join(' ').toLocaleLowerCase();
      if(q&&!hay.includes(q))return false;
      if(filter==='mining')return /mining|sovereign coin|crypto|coin design|standard/i.test(x.context+' '+x.mining);
      if(filter==='unresolved')return /unrecovered|cipher_not_acronym|not confirmed|meaning unrecovered/i.test(x.kind+' '+x.definition);
      if(filter==='author')return !/industry|assistant/i.test(x.kind);
      if(filter==='industry')return /industry|standard/i.test(x.kind);
      return true;
    });
    return matches.sort((a,b)=>reverse?b.term.localeCompare(a.term):a.term.localeCompare(b.term));
  }
  return Object.freeze({MAX_ENTRIES,MAX_FILE_BYTES,parse,merge,search,csvRows,csvRecords,jsonRecords});
});