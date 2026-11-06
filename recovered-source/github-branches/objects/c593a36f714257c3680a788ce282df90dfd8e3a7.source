'use strict';
(()=>{
  if(typeof document==='undefined')return;
  const core=window.ONEAcronymCore;
  const $=id=>document.getElementById(id);
  let rows=[],reverse=false;
  function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);if(cls)e.className=cls;return e}
  function stats(){
    const counts=new Map();for(const x of rows)counts.set(x.term,(counts.get(x.term)||0)+1);
    $('total').textContent=rows.length.toLocaleString();$('unique').textContent=counts.size.toLocaleString();
    $('collisions').textContent=[...counts.values()].filter(n=>n>1).length.toLocaleString();
    $('mining').textContent=rows.filter(x=>/sovereign coins|crypto mining|coin design|operational mining/i.test(x.context+' '+x.mining)).length.toLocaleString();
  }
  function render(){
    const found=core.search(rows,$('query').value,$('scope').value,reverse);
    $('match').textContent=found.length.toLocaleString()+' matching definitions · showing first '+Math.min(500,found.length)+'.';
    const target=$('results');target.replaceChildren();
    for(const x of found.slice(0,500)){
      const item=node('article');item.append(node('h3',x.term),node('div',x.definition,'def'));
      item.append(node('small',x.context+' · '+x.kind));
      if(x.mining)item.append(node('small','Mining classification: '+x.mining));
      if(x.source)item.append(node('small','Source: '+x.source));
      if(x.sourceId)item.append(node('small','Original source ID: '+x.sourceId));
      if(x.date)item.append(node('small','Source date: '+x.date));
      if(x.notes)item.append(node('small',x.notes));
      target.append(item);
    }
  }
  $('ownerFiles').addEventListener('change',async e=>{
    const files=[...e.target.files];let added=0,duplicate=0,fail=[];
    for(const f of files){
      if(f.size>core.MAX_FILE_BYTES){fail.push(f.name+': too large');continue}
      try{const imported=core.parse(f.name,await f.text());const result=core.merge(rows,imported);rows=result.records;added+=result.added;duplicate+=result.duplicates}
      catch(err){fail.push(f.name+': '+err.message)}
    }
    stats();render();
    $('status').textContent='Imported '+added+' new source records; '+duplicate+' duplicate keys retained as existing.'+(fail.length?' Errors: '+fail.join('; '):'')+' All content remains in this tab until you export it.';
    e.target.value='';
  });
  $('query').addEventListener('input',render);$('scope').addEventListener('change',render);
  $('order').addEventListener('click',()=>{reverse=!reverse;render()});
  $('export').addEventListener('click',()=>{
    if(!rows.length){$('status').textContent='Nothing to export; import a source first.';return}
    const blob=new Blob([JSON.stringify({schema:'one.acronyms.owner-export.v1',exportedAt:new Date().toISOString(),records:rows},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=node('a');a.href=url;a.download='NATHAN_AI_ONE_Acronym_Lexicon_Private.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
  });
  stats();render();
})();