/** Static, read-only audit of publicly shipped persona graph data. No network calls. */
import {NODES, EDGES, INTEGRATIONS} from "./registry.mjs";
export function auditPublicGraph({nodes=NODES,edges=EDGES,integrations=INTEGRATIONS}={}){
 const findings=[];
 const ids=new Set(nodes.map(n=>n.id));
 const add=(code,location)=>findings.push({code,location});
 for(const n of nodes){
  if(!n.id||!n.name||!n.kind)add("missing_identity",n.id||"unknown");
  if(/<\s*(?:img|script|iframe|svg)\b/i.test(n.summary||""))add("embedded_markup",n.id);
  if(/(?:password|api[_-]?key|private[_-]?key|bearer\s+\S+)/i.test(n.summary||""))add("possible_secret",n.id);
 }
 for(const e of edges)if(!ids.has(e.from)||!ids.has(e.to))add("dangling_edge",e.from+"->"+e.to);
 for(const x of integrations)if(x.mode!=="reference_only")add("active_external_integration",x.id);
 return {safe:findings.length===0,findings,checked:{nodes:nodes.length,edges:edges.length,integrations:integrations.length},dispatch:false};
}
