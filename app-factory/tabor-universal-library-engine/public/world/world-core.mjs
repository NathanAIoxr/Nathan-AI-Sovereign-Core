export const periodicSource="https://iupac.org/what-we-do/periodic-table-of-elements/";
export const worldEdition="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/273";
export const cosmicSource="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/app-factory/nathan-ai/anatomy/cosmic-body/atlas.json";
export const placesSource="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/app-factory/one/mespark-memory-matrix/worlds-atlas.json";

const relation=(id,label="Related record")=>({id,label});
const classLabel=(code)=>code?"Class "+code:"";
const elementIndex=()=>Array.from({length:118},(_,offset)=>{
  const number=offset+1;
  return {id:"atomic-"+number,title:"Atomic number "+number,kind:"Chemical element",number,
    description:"An atom of this element has "+number+" proton"+(number===1?"":"s")+" in its nucleus.",
    source:"IUPAC periodic table",url:periodicSource,connections:[relation("components-proton","Atomic number counts protons")]};
});

export function createWorld({ledger,library,castAndProps,atlas,places,entries}){
  const byCosmicTarget=new Map();
  for(const edge of atlas.links){
    for(const [from,to] of [[edge.from,edge.to],[edge.to,edge.from]]){
      if(!byCosmicTarget.has(from))byCosmicTarget.set(from,[]);
      const label=edge.from===from?edge.relation:"Incoming "+edge.relation;
      byCosmicTarget.get(from).push({...relation("cosmic-"+to,label),note:edge.note});
    }
  }
  const cosmicSources=new Map(atlas.sources.map(row=>[row.id,row]));
  const trackerDraft=new Map(library.trackerDraft.map(row=>[row.id,row]));
  const knownTracker=new Map(ledger.ledger.map(row=>[row.id,row]));
  const tracker=Array.from({length:101},(_,index)=>{
    const id=index+1,known=knownTracker.get(id),r=known??trackerDraft.get(id);
    if(!r)throw Error("Tracker Ball entry missing: "+id);
    return {id:"tracker-"+id,title:r.title,kind:"Tracker Ball cartridge",number:id,description:r.description,
      source:known?"v.7 source ledger · 65–101":"Tabor Tracker Ball branch · 1–64",
      url:known?"../catalog.json":worldEdition,metadata:{Class:classLabel(r.lcClass??r.class)},
      connections:(trackerDraft.get(id)?.related??[]).filter(v=>Number.isInteger(v)&&v>=1&&v<=101).map(value=>relation("tracker-"+value)),
      play:ledger.runnableNumbers?.includes(id)?"../?module="+id:null};
  });
  const sourceLibrary=library.cartridges.map(r=>({id:"world-library-"+r.id,title:r.title,kind:"Tabor World cartridge",number:r.id,
    description:r.description,source:"Tabor World Library · 101-cartridge edition",url:worldEdition,
    metadata:{Class:classLabel(r.class),"Source code":r.sourceCode,"Suggested code":r.suggestedCode,"Input profile":r.profile,
      "Source status":r.status,"Classification note":r.classificationNote}}));
  const cast=castAndProps.cast.map(r=>({id:"cast-"+r.id,title:r.label,kind:"Character",
    source:"Tabor World workbench · cast",url:worldEdition,metadata:{Attributes:r.attributes,Characteristics:r.characteristics,Functionalities:r.functionalities,Traits:r.traits}}));
  const props=Object.entries(castAndProps.pilots).flatMap(([id,pilot])=>
    pilot.records.map((r,i)=>({id:"prop-"+id+"-"+(i+1),title:r.label,kind:"Object & mechanism",description:pilot.goal,
      source:"Tabor World workbench · playable demo records",url:worldEdition,
      metadata:{Attributes:r.attributes,Characteristics:r.characteristics,Functionalities:r.functionalities,Traits:r.traits},
      connections:[relation("world-library-"+id,"Appears in")]})));
  const cosmic=atlas.records.map(r=>({id:"cosmic-"+r.id,title:r.label,kind:"Cosmic Body · "+r.category,description:r.detail,
    source:"Cosmic Body Atlas · "+r.tier,url:cosmicSource,metadata:r.meta,
    references:r.source_ids.map(id=>cosmicSources.get(id)).filter(Boolean),
    connections:byCosmicTarget.get(r.id)??[]}));
  const worldPlaces=places.records.map(r=>({id:"place-"+r.id,title:r.name,kind:"Worlds Atlas · "+r.type,description:r.description,
    source:"meSPARK Worlds Atlas",url:placesSource,sourceNote:places.note,
    metadata:{Region:r.region,Era:r.era,Relationship:r.relationship,Coordinates:[r.lat,r.lon],
      "Source label":r.source}}));
  const catalogEntries=entries.map(r=>({...r,source:r.id.startsWith("cast-")||r.id.startsWith("work-")?"Nathan Tabor project canon":
    r.kind==="Classical element"?"Classical and symbolic usage":r.id.startsWith("rule-")||r.id.startsWith("object-")?
    "Tabor Universal Library Engine":"Science reference",connections:r.links?.map(id=>relation(id))??[]}));
  const elements=elementIndex();
  const records=[...catalogEntries,...cast,...props,...worldPlaces,...tracker,...sourceLibrary,...cosmic,...elements];
  const ids=new Set(records.map(r=>r.id));
  if(ids.size!==records.length)throw Error("Duplicate Tabor World record ID");
  return {records,summary:{elements:elements.length,nonElements:records.length-elements.length,tracker:tracker.length,
    world:sourceLibrary.length,cosmic:cosmic.length,cosmicRelationships:atlas.links.length,places:worldPlaces.length}};
}

export function matches(record,query){
  if(!query)return true;
  if(/^\d+$/.test(query))return record.number===Number(query)||record.id===query;
  return query.toLocaleLowerCase().split(/\s+/).every(word=>
    [record.title,record.id,record.kind,record.description,record.source].some(field=>String(field??"").toLocaleLowerCase().includes(word)));
}
export function compare(first,second){
  const title=row=>first.title===second.title?row.title+" ("+row.kind+")":row.title;
  return [first,second].flatMap((row,index)=>(row.connections??[])
    .filter(link=>link.id===[second,first][index].id)
    .map(link=>({from:title(row),to:title([second,first][index]),label:link.label,note:link.note})));
}
