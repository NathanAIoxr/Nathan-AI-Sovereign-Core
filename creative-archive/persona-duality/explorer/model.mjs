import { NODES, EDGES, OWNER, CANON_NOTE } from "../registry.mjs";
export const GROUPS = Object.freeze(["all", ...new Set(NODES.map(node => node.kind))]);
export function filterNodes({query="",kind="all"}={}) {
  const needle=String(query).trim().toLocaleLowerCase();
  return NODES.filter(n => (kind==="all"||n.kind===kind) &&
    (!needle || [n.name,n.kind,n.summary,n.id].some(v=>String(v).toLocaleLowerCase().includes(needle))));
}
export function neighborhood(id) {
  const node=NODES.find(n=>n.id===id);
  if(!node)return null;
  const edges=EDGES.filter(e=>e.from===id||e.to===id);
  return {node,edges,neighbors:edges.map(e=>({relation:e.relation,direction:e.from===id?"outgoing":"incoming",
    node:NODES.find(n=>n.id===(e.from===id?e.to:e.from))}))};
}
export function exportGraph() {
  return JSON.stringify({owner:OWNER,canon_note:CANON_NOTE,nodes:NODES,edges:EDGES},null,2);
}
