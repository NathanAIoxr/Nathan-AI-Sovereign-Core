// Additive conductor contract for the existing Nathan AI architecture.
// Does not change existing Cloudflare Workers or call external nodes.
import {resolveOmniAddress} from './omni-adapter.js';
import {inspectSupernode,planApprovedJobs} from './supernode-swarm-adapter.js';
import {inspectNode,queueChildren} from './reader.js';
export const CONDUCTOR_ID='NATHAN_AI_DEEP_CRAWLER';
export const EVENTS=Object.freeze({TIME:'TIME_TICK',EMIT:'RECURSIVE_HOP',VERIFY:'ALIEN_NEILA_VERIFY',STOP:'KILL_SWITCH_CLEAR'});
export function resolveNode(namespace,id){if(namespace==='supernodes')return inspectSupernode(String(id).startsWith('NT-')?id:'NT-'+id);return resolveOmniAddress(namespace,id);}
export async function prepareConductorEvent({uri,content='',allowHosts=[],depth=0}){const node=await inspectNode({uri,content,allowHosts,depth});return {conductor:CONDUCTOR_ID,node,proposedMessages:queueChildren(node),dispatched:false};}
export function planSwarm(ids){return planApprovedJobs(ids,64);}
export function deploymentStatus(){return {sourceIntegrated:true,cloudflareBound:false,queueConsumerBound:false,remoteNodesConnected:false,externalActions:false,requiresOwnerReview:true};}
