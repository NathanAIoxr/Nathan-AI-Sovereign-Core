/** PD-014: pure, fail-closed audit of public Persona Atlas content. */
import {NODES, EDGES, TASKS, INTEGRATIONS} from "./registry.mjs";
const forbiddenKeys = new Set(["password","secret","token","api_key","private_key","authorization","email","phone","address","birthdate","ssn"]);
const allowedKinds = new Set(["creator","scriptural_anchor","philosophical_comparison","persona","folklore_adapter","original_concept","family_metaphor","original_character","creative_world","source_current_spelling","source_variant","symbolic_creature","agent_role","existing_project"]);
const external = /(?:https?:\/\/|data:image\/|<\s*(?:img|svg|canvas|video|iframe|script)\b)/i;
export function auditPublicSurface({nodes=NODES,edges=EDGES,tasks=TASKS,integrations=INTEGRATIONS,html=""}={}) {
 const errors=[];
 const ids=new Set();
 const check=(v,path)=>{
  if(Array.isArray(v)){v.forEach((item,i)=>check(item,path+"["+i+"]"));return;}
  if(v&&typeof v==="object"){for(const [k,val] of Object.entries(v)){
   if(forbiddenKeys.has(k.toLowerCase())) errors.push(path+"."+k+": forbidden personal/credential field");
   check(val,path+"."+k);
  }return;}
  if(typeof v==="string"&&external.test(v)) errors.push(path+": embedded markup or external URL requires review");
 };
 for(const node of nodes){if(!node.id||ids.has(node.id))errors.push("duplicate or empty node ID");ids.add(node.id);if(!allowedKinds.has(node.kind))errors.push("unknown node kind: "+node.kind);check(node,"node:"+node.id);}
 for(const edge of edges){if(!ids.has(edge.from)||!ids.has(edge.to))errors.push("orphan edge");if(edge.assertion!=="creative_crosslink")errors.push("unattributed relationship");check(edge,"edge");}
 for(const task of tasks){if(task.dispatch!==false||task.status!=="pending_review")errors.push("task must remain review-only: "+task.id);check(task,"task");}
 for(const integration of integrations){if(integration.mode!=="reference_only")errors.push("non-reference integration: "+integration.id);check(integration,"integration");}
 if(/<\s*(?:img|svg|canvas|video|iframe)\b/i.test(html))errors.push("visual media requires explicit author approval");
 if(/<\s*form\b|type\s*=\s*['\"]password/i.test(html))errors.push("public page must not collect information");
 return {ok:errors.length===0,errors,nodes:nodes.length,edges:edges.length,tasks:tasks.length};
}
