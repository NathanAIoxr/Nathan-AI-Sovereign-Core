// Sovereign HOLD zones: one logical zone per existing virtual reader identity.
// Never creates DNS zones, Workers, external accounts or fake domain ownership.
import {resolveOmniAddress} from './omni-adapter.js';
import {inspectSupernode} from './supernode-swarm-adapter.js';
export const HOLD_CAPACITY='126732000000';
export function zoneFor(namespace,id){
 const node=namespace==='supernodes'?inspectSupernode(String(id).startsWith('NT-')?id:'NT-'+id):resolveOmniAddress(namespace,id);
 if(!node) return null;
 const key=namespace==='supernodes'?node.id:String(node.id);
 return {zoneId:'hold/'+namespace+'/'+key,sourceNode:node.uri,status:'HOLD',website:{kind:'placeholder',host:null,domainVerified:false},resources:{worker:'planned',d1:'planned',kv:'planned',r2:'planned',queue:'planned'},conductor:{interface:'NATHAN_AI_DEEP_CRAWLER',connected:false},launch:{ready:false,ownerApproved:false,checks:['domain_verified','bindings_valid','secrets_configured','tests_passed','owner_approved']},deployed:false};
}
export function launchEligibility(zone,checks={}){if(!zone||zone.status!=='HOLD')return false;return zone.launch.checks.every(k=>checks[k]===true);}
export function holdingSummary(){return {totalVirtualZones:HOLD_CAPACITY,materializedZones:0,cloudflareDnsZonesCreated:0,launches:0,mode:'lazy addressable manifests'};}
