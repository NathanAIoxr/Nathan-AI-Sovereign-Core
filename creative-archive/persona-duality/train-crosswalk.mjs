import { NODES, INTEGRATIONS } from './registry.mjs';
export const TRAIN_ROSTER = Object.freeze([
  ['DOG AI','dog-ai'],['REAPER AI','reaper-ai'],['Santa Claus AI','santa-ai'],
  ['Miss Stacy Clause AI','stacy-ai'],['007 @Will AI','will-ai'],['ACT AI','act-ai']
]);
export function trainCrosswalk(nodes=NODES, integrations=INTEGRATIONS) {
  const roster = new Map(nodes.map(node=>[node.id,node]));
  const train = integrations.find(item=>item.id==='train');
  if (!train || train.mode!=='reference_only') throw new Error('Train must remain reference-only');
  return {source:'app-factory/nathan-ai/operations/train-runtime/README.md',
    source_type:'repository_documentation',integration_mode:'reference_only',
    dispatch:false,external_requests:0,
    entries:TRAIN_ROSTER.map(([name,id])=>{
      const node=roster.get(id);
      if(!node || node.name!==name || node.kind!=='agent_role') throw new Error('Roster mismatch: '+name);
      return {name,persona_node_id:id,relationship:'documented_role_reference_not_identity'};
    })};
}
