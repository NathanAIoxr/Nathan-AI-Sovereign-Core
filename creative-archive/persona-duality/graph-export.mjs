import { VERSION, OWNER, SCRIPTURE, CANON_NOTE, NODES, EDGES } from "./registry.mjs";
const PUBLIC_KINDS = new Set(["creator","scriptural_anchor","philosophical_comparison","persona","folklore_adapter","original_concept","family_metaphor","original_character","creative_world","source_current_spelling","source_variant","symbolic_creature","agent_role","existing_project"]);
const DENIED = /(?:secret|token|password|private|credential|email|phone|address|storage_key|api_key)/i;
export function buildPublicGraphArchive({version=VERSION,nodes=NODES,edges=EDGES}={}) {
  if (!Array.isArray(nodes)||!Array.isArray(edges)||typeof version!=="string") throw new TypeError("Invalid graph");
  const ids=new Set();
  const safeNodes=nodes.map(node=>{
    if (!node || typeof node.id!=="string" || !PUBLIC_KINDS.has(node.kind) || ids.has(node.id)) throw new Error("Invalid or duplicate public node");
    if(Object.keys(node).some(key=>DENIED.test(key))) throw new Error("Private field refused");
    ids.add(node.id);
    return {id:node.id,name:String(node.name),kind:node.kind,summary:String(node.summary)};
  });
  const safeEdges=edges.map(edge=>{
    if(!ids.has(edge.from)||!ids.has(edge.to)||edge.assertion!=="creative_crosslink") throw new Error("Invalid edge or unreviewed assertion");
    if(Object.keys(edge).some(key=>DENIED.test(key))) throw new Error("Private field refused");
    return {from:edge.from,to:edge.to,relation:String(edge.relation),assertion:edge.assertion};
  });
  return {schema:"tabor.persona.public-graph",schema_version:1,source_version:version,owner:OWNER,scripture_reference:SCRIPTURE,canon_note:CANON_NOTE,publication:"review_required_not_deployed",nodes:safeNodes,edges:safeEdges};
}
export function migratePublicGraphArchive(archive) {
  if(archive?.schema!=="tabor.persona.public-graph"||archive.schema_version!==1) throw new Error("Unsupported archive version; no silent migration");
  return buildPublicGraphArchive({version:archive.source_version,nodes:archive.nodes,edges:archive.edges});
}
