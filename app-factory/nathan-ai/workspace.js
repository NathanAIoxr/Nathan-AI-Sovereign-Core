/* Nathan AI source workspace. Derived navigation and notes never alter originals. */
(function(root){
  'use strict';
  const sources=[
    {id:'books',name:'Reading records',url:'../one/library-mind/documents.json',href:'../one/library-mind/index.html#documents'},
    {id:'plan',name:'Original book plan',url:'../one/library-mind/plan.json',href:'../one/library-mind/index.html#plan'},
    {id:'catalog',name:'Library catalog',url:'../one/library-mind/catalog.json',href:'../one/library-mind/index.html#catalog'},
    {id:'languages',name:'Language profiles',url:'../one/library-mind/languages.json',href:'../one/library-mind/index.html#languages'},
    {id:'builds',name:'Interfaces & recovery',url:'./build-recovery/registry.json',keys:['interfaces','systems','archive_anchors'],href:'./build-recovery/index.html'},
    {id:'intelligence',name:'Intelligence architecture',url:'./absolute-intelligence/registry.json',keys:['modules','topics'],href:'./absolute-intelligence/index.html'},
    {id:'family',name:'Family & historical research',url:'./family-research/records.json',keys:['records'],href:'./family-research/index.html'},
    {id:'games',name:'Games & puzzles',url:'./games/catalog.json',keys:['entries'],href:'./games/index.html'},
    {id:'anatomy',name:'Anatomy & authored frameworks',url:'./anatomy/atlas.json',keys:['anatomyAZ','iversions','biologicalEquator','grammar','relatedOriginalFrameworks'],href:'./anatomy/index.html'}
  ];
  function strings(value){
    return Object.entries(value).filter(([key,v])=>typeof v==='string'&&!/url|href|identifier|source_name/i.test(key)).map(([,v])=>v).join('\n');
  }
  function records(source,data){
    const groups=source.keys?source.keys.map(k=>{
      if(!Array.isArray(data[k]))throw Error('Missing collection: '+k);
      return [k,data[k]];
    }):[['records',data]];
    return groups.flatMap(([group,rows])=>{
      if(!Array.isArray(rows))throw Error('Expected a record array');
      return rows.map((r,i)=>{
        if(!r||typeof r!=='object'||Array.isArray(r))throw Error('Invalid source record');
        const title=r.title||r.name||r.preferred_name||r.term||r.structure||r.direction||r.id;
        if(typeof title!=='string'||!title.trim())throw Error('Record has no title');
        const originalId=String(r.id??r.key??r.variety_id??r.letter??i);
        return {id:source.id+':'+group+':'+originalId,title,source:source.id,sourceName:source.name,
          originalId,group,stage:String(r.stage||r.status||r.record_stage||r.review_status||r.sourceStatus||r.provenance||'Stage not specified'),
          body:strings(r),href:source.href};
      });
    });
  }
  async function load(fetcher){
    const outcomes=await Promise.all(sources.map(async source=>{
      try{
        const response=await fetcher(source.url);
        if(!response.ok)throw Error('HTTP '+response.status);
        const rows=records(source,await response.json());
        return {source,rows,error:null};
      }catch(e){return {source,rows:[],error:e.message}}
    }));
    return {rows:outcomes.flatMap(x=>x.rows),coverage:outcomes.map(x=>({id:x.source.id,name:x.source.name,count:x.rows.length,error:x.error}))};
  }
  function search(rows,query='',source=''){
    const terms=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    return rows.filter(r=>(!source||r.source===source)&&terms.every(t=>[r.title,r.originalId,r.stage,r.body,r.sourceName,r.note,r.collection].join(' ').toLocaleLowerCase().includes(t)));
  }
  const KEY='nathan-ai.research-workspace.v1',SCHEMA='nathan-ai.research-workspace.v1';
  function empty(){return {schema:SCHEMA,items:[]}}
  function validate(value){
    if(!value||value.schema!==SCHEMA||!Array.isArray(value.items)||value.items.length>1000)throw Error('Unsupported workspace backup (maximum 1000 saved records)');
    const ids=new Set();
    const items=value.items.map(item=>{
      if(!item||typeof item!=='object')throw Error('Invalid saved record');
      for(const [key,max] of [['id',1000],['title',2000],['sourceName',200],['collection',100],['note',20000]]){
        if(typeof item[key]!=='string'||item[key].length>max)throw Error('Invalid saved '+key);
      }
      if(!item.id||!item.title.trim()||ids.has(item.id))throw Error('Missing or duplicate saved record ID');
      ids.add(item.id);
      // Only a reference and user notes are portable. Source URLs and original bytes stay separate.
      return {id:item.id,title:item.title,sourceName:item.sourceName,collection:item.collection,note:item.note};
    });
    return {schema:SCHEMA,items};
  }
  function parseBackup(raw){
    if(new TextEncoder().encode(raw).length>5*1024*1024)throw Error('Workspace backup exceeds 5 MB');
    return validate(JSON.parse(raw));
  }
  function merge(current,incoming){
    const result=validate(current),extra=validate(incoming);let added=0,skipped=0;
    for(const item of extra.items){
      if(result.items.some(x=>x.id===item.id)){skipped++;continue}
      result.items.push(item);added++;
    }
    return {workspace:validate(result),added,skipped};
  }
  function persist(storage,workspace){
    const clean=validate(workspace);
    storage.setItem(KEY,JSON.stringify(clean));
    return clean;
  }
  const api={sources,records,load,search,KEY,SCHEMA,empty,validate,parseBackup,merge,persist};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.NathanWorkspace=api;
})(typeof window==='object'?window:globalThis);
