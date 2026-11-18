import { seedNodes as originals } from "../../workers-platforms/act-seed.mjs";

const fields = ["value_text", "phonetic_key", "structural_role", "target_slug", "math_anchor"] as const;
const revisions: Record<string, (string|null)[]> = {
 "act-naming":[null,"pie-phi","indexing-mechanism","pie-pi-phi","pi-phi"],
 "act-recorded-value-1-168":["1.168","phi","proportion-variant","phi","phi"],
 "every-part-is-whole":["1","whole","governing-principle","pie-pi-phi","pi-phi"],
 "forgotten-constants":["69",null,"historical-constants","act-naming","pi-phi"],
 "golden-ratio-matrix":["13, 17, 34","phi","rhythm-matrix","phi","phi"],
 "greek-lettering":["π=80, φ=500","pie-phi","symbolic-numerics","act-naming","pi-phi"],
 "heartbeat-cadence":[null,"whole","temporal-rhythm","golden-ratio-matrix","pi-phi"],
 "leonardo-golden-ratio":[null,"phi","proportion-mechanics","phi","phi"],
 "phi":["1.618033988749895…","phi","proportion",null,"phi"],
 "phonetic-circular-language":[null,"pie","linguistic-architecture","pie-pi-phi","pi"],
 "pi":["3.141592653589793…","pie","circle",null,"pi"],
 "pie-pi-phi":[null,"pie-phi","core-synthesis","every-part-is-whole","pi-phi"]
};
const updated = originals.map(node => {
  const values = revisions[node.slug];
  return values ? {...node,...Object.fromEntries(fields.map((key,i)=>[key,values[i]]))} as typeof node : {...node};
});
function stamp(node: (typeof updated)[number], generation: number, sovereign_index: number, parent_slug: string|null){
  const anchorCode=node.math_anchor==="pi"?1:node.math_anchor==="phi"?2:3;
  const word=(0xff<<8)|(generation<<4)|anchorCode;
  return {...node,generation,sovereign_index,parent_slug,binary_seal:word.toString(2).padStart(16,"0"),hex_seal:"0x"+word.toString(16).toUpperCase().padStart(4,"0")};
}
export function actCollection(){
  const pool=updated.filter(n=>n.slug&&n.title&&n.kind&&n.summary).map((n,i)=>stamp(n,0,i+1,null));
  const counts=[pool.length];
  for(let g=1;g<=3;g++){const size=pool.length;for(let i=0;i<size;i++){const n=pool[i];pool.push(stamp({...n,slug:n.slug+"-"+g+"-"+(i+1)},g,size+i+1,n.slug));}counts.push(pool.length);}
  return {sourceRecords:originals.length,counts,sealBits:16,wholeUnitFieldBits:8,nodes:pool};
}
