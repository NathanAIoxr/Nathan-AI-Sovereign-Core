/** PD-002: evidence-limited chronology. No inferred dates or author attributions. */
export const CHRONOLOGY = Object.freeze([
  {id:"scripture",label:"Isaiah 45:7",source:"KJV Isaiah 45:7",sourceType:"scripture",date:null,claim:"Textual light/darkness and peace/evil comparison anchor",interpretation:false},
  {id:"santa",label:"Santa Claus",source:"creative-archive/persona-duality/registry.mjs",sourceType:"repository_creator_description",date:null,claim:"Giving, imagination, joy, mercy; user-described creative mode",interpretation:true},
  {id:"reaper",label:"The Reaper",source:"creative-archive/persona-duality/registry.mjs",sourceType:"repository_creator_description",date:null,claim:"Accountability, transformation, protective boundaries; symbolic role only",interpretation:true},
  {id:"comparison",label:"Santa / Reaper comparison",source:"creative-archive/persona-duality/registry.mjs",sourceType:"assistant_graph_interpretation",date:null,claim:"Graph edge contrasting_modes is a creative crosslink, not historical identity",interpretation:true}
]);
export function auditChronology(items=CHRONOLOGY){return items.flatMap((item,i)=>[
 ...(!item.id||!item.source||!item.sourceType||!item.claim?[{index:i,error:"missing_provenance"}]:[]),
 ...(item.sourceType==="scripture"&&item.interpretation?[{index:i,error:"scripture_mislabeled"}]:[]),
 ...(item.date!==null&&!/^\\d{4}-\\d{2}-\\d{2}$/.test(item.date)?[{index:i,error:"invalid_date"}]:[]),
 ...(item.sourceType==="assistant_graph_interpretation"&&!item.interpretation?[{index:i,error:"unlabeled_interpretation"}]:[])
]);}
