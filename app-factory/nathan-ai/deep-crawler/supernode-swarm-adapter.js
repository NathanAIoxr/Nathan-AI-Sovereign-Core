// Nathan AI SUPERNODES: read-only global namespace attachment.
// This is not a network scanner or remote-node enrollment mechanism.
export const SUPERNODE_RANGE=Object.freeze({prefix:'NT-',first:1,last:732000000,total:732000000,mode:'virtual-address-space',source:'app-factory/nathan-ai/personal-intelligence/minds/federation/universal_workers.py'});
export function inspectSupernode(id){const text=String(id);const m=/^NT-([1-9][0-9]*)$/.exec(text);if(!m)return null;const n=Number(m[1]);if(!Number.isSafeInteger(n)||n>SUPERNODE_RANGE.last)return null;return {id:'NT-'+n,uri:'omni://supernodes/'+n,registeredVirtualAddress:true,remoteAgentVerified:false,networkConnection:false};}
export function planApprovedJobs(ids,maxJobs=64){if(!Array.isArray(ids)||!Number.isInteger(maxJobs)||maxJobs<0||maxJobs>64)throw Error('invalid budget');return ids.slice(0,maxJobs).map(inspectSupernode).filter(Boolean).map(node=>({nodeId:node.id,action:'verify-local-metadata',remoteExecution:false}));}
