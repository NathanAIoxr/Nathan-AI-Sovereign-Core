import { bytes, check, define, hex, int, sha, str, sum, utf8, vec } from "../../../shared/core.ts";
type Graph = Map<string,string[]>;
type DB = { prepare(sql:string): { all(): Promise<{results:{source:string,target:string}[]}> } };
const fixtureEdges=[["catalog","index"],["index","archive"],["archive","restore"],["catalog","preview"]];
function graph(edges:unknown):Graph{
  check(Array.isArray(edges)&&edges.length<=128,"Expected up to 128 edges");
  const result:Graph=new Map();
  for(const row of edges){check(Array.isArray(row)&&row.length===2,"Expected an edge pair");const a=str(row[0],48),b=str(row[1],48);
    if(!result.has(a))result.set(a,[]);if(!result.has(b))result.set(b,[]);if(!result.get(a)!.includes(b))result.get(a)!.push(b);}
  return result;
}
function breadth(g:Graph,start:string){const prior=new Map<string,string|null>([[start,null]]), order=[start];
  for(let i=0;i<order.length;i++)for(const v of g.get(order[i])??[])if(!prior.has(v)){prior.set(v,order[i]);order.push(v);}
  return {prior,order};
}
async function merkle(items:unknown){check(Array.isArray(items)&&items.length>=1&&items.length<=32,"Expected 1–32 leaves");
  let hashes=await Promise.all(items.map(item=>sha(utf8("leaf:"+str(item,256)))));
  while(hashes.length>1){const next=[];for(let i=0;i<hashes.length;i+=2){const pair=new Uint8Array(65);pair[0]=1;pair.set(hashes[i],1);pair.set(hashes[i+1]??hashes[i],33);next.push(sha(pair));}hashes=await Promise.all(next);}
  return hex(hashes[0]);
}
function routeMetadata(input:unknown){const raw=bytes(input);
  check(raw.length>=4&&raw.length<=256&&raw[0]===1,"Expected synthetic telemetry frame v1");
  const len=(raw[2]<<8)|raw[3];return {version:raw[0],kind:raw[1],declaredPayloadBytes:len,validLength:len===raw.length-4};
}
export const modules = {
  "061": define("Synthetic packet header validation",{bytes:[1,5,0,2,65,66]},p=>routeMetadata(p.bytes)),
  "062": define("Network event volume by protocol",{protocols:["https","dns","https"]},p=>{
    check(Array.isArray(p.protocols)&&p.protocols.length<=128,"Expected up to 128 protocol labels");const counts=new Map<string,number>();
    for(const x of p.protocols){const label=str(x,32);counts.set(label,(counts.get(label)??0)+1);}return Object.fromEntries(counts);
  }),
  "063": define("Merkle root for synthetic records",{items:["catalog","restore","verify"]},p=>merkle(p.items)),
  "064": define("Compare audit chain root",{items:["first"],expected:"0000000000000000000000000000000000000000000000000000000000000000"},async p=>{const expected=str(p.expected,64);check(/^[a-f0-9]{64}$/.test(expected),"Expected a SHA-256 root");const computed=await merkle(p.items);return {computed,matches:computed===expected};}),
  "065": define("Dependency graph breadth-first order",{edges:fixtureEdges,start:"catalog"},p=>breadth(graph(p.edges),str(p.start,48)).order),
  "066": define("Shortest dependency path",{edges:fixtureEdges,start:"catalog",goal:"restore"},p=>{
    const goal=str(p.goal,48),{prior}=breadth(graph(p.edges),str(p.start,48));if(!prior.has(goal))return null;
    const path=[];for(let n:string|null=goal;n!==null;n=prior.get(n)??null)path.push(n);return path.reverse();
  }),
  "067": define("Dependency in-degree and out-degree",{edges:fixtureEdges},p=>{const g=graph(p.edges),indegree=new Map([...g.keys()].map(k=>[k,0]));for(const es of g.values())for(const k of es)indegree.set(k,(indegree.get(k)??0)+1);return [...g].map(([id,es])=>({id,in:indegree.get(id),out:es.length}));}),
  "068": define("Directed dependency cycle check",{edges:[["a","b"],["b","a"]]},p=>{const g=graph(p.edges),active=new Set<string>(),passed=new Set<string>();
    function walk(id:string):boolean{if(active.has(id))return true;if(passed.has(id))return false;active.add(id);if((g.get(id)??[]).some(walk))return true;active.delete(id);passed.add(id);return false;}
    return {cycle:[...g.keys()].some(walk)};
  }),
  "069": define("Record secret-field redaction",{record:{name:"example",password:"remove",token:"remove"}},p=>{
    check(p.record!==null&&typeof p.record==="object"&&!Array.isArray(p.record),"Expected a record");const sensitive=/^(authorization|api[_-]?key|password|secret|token)$/i;
    return Object.fromEntries(Object.entries(p.record).map(([k,v])=>[k,sensitive.test(k)?"[redacted]":v]));
  }),
  "070": define("Repeated event detection",{ids:["a","b","a","c","b"]},p=>{check(Array.isArray(p.ids)&&p.ids.length<=256,"Expected up to 256 IDs");
    const seen=new Set<string>(),duplicates=new Set<string>();for(const x of p.ids){const id=str(x,80);if(seen.has(id))duplicates.add(id);seen.add(id);}return [...duplicates];
  }),
  "071": define("D1 dependency graph traversal",{start:"catalog"},async(p,env)=>{
    const db=env.GRAPH as DB|undefined;const edges=db?(await db.prepare("SELECT source,target FROM graph_edges ORDER BY rank").all()).results.map(r=>[r.source,r.target]):fixtureEdges;
    return {store:db?"d1":"fixture",order:breadth(graph(edges),str(p.start,48)).order};
  }),
  "072": define("Synthetic log gap detector",{sequence:[8,9,12,13]},p=>{
    const x=vec(p.sequence).map(v=>int(v,0,1e9));const gaps=[];for(let i=1;i<x.length;i++){check(x[i]>x[i-1],"Sequence must strictly increase");if(x[i]>x[i-1]+1)gaps.push([x[i-1]+1,x[i]-1]);}return gaps;
  }),
  "073": define("Fixture byte-size anomaly report",{sizes:[5,8,12,40],threshold:12},p=>{const sizes=vec(p.sizes).map(x=>int(x,0,1e9)),threshold=int(p.threshold,0,1e9);return {total:sum(sizes),over:sizes.filter(n=>n>threshold).length};}),
  "074": define("Audit manifest digest comparison",{before:"approved build",after:"approved build"},async p=>{
    const a=hex(await sha(utf8(p.before))),b=hex(await sha(utf8(p.after)));return {before:a,after:b,unchanged:a===b};
  }),
  "075": define("Permission set difference",{granted:["read","write"],expected:["read"]},p=>{
    check(Array.isArray(p.granted)&&Array.isArray(p.expected)&&p.granted.length<=128&&p.expected.length<=128,"Expected bounded permission lists");
    const granted=new Set(p.granted.map(v=>str(v,48))), expected=new Set(p.expected.map(v=>str(v,48)));return {unexpected:[...granted].filter(x=>!expected.has(x)).sort(),missing:[...expected].filter(x=>!granted.has(x)).sort()};
  })
};
