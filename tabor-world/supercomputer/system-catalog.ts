import { SUPERCOMPUTER_MODULES } from "./supercomputer";
export interface SystemSpec {id:string;name:string;layer:string;status:"specified"|"implemented"|"connected";dependencies:string[];verification:string}
const specs: SystemSpec[] = [
["matrix-physics","Matrix Technology Stack","physics",[]],
["quantum-mining","Nathan AI Quantum Mining & Cosmic Tracking","research",["matrix-physics"]],
["clover","4T Clover & Universal Geological Supercomputer","simulation",["matrix-physics"]],
["ecc","ECC silicon / 1T1C DRAM controller concepts","hardware-spec",["clover"]],
["codex5","Codex 5 & Nathan AI Math Records","archive",[]],
["nathan-os","NATHAN OS / NATHAN AI","operating",[]],
["one","ONE — The Last App / Equator & Mirror Engine","application",["nathan-os"]],
["factory","TABOR 1-2-3 FACTORY","factory",["nathan-os"]],
["mespark","Memory Matrix / meSPARK","memory",["nathan-os"]],
["words","WORDS / Knowledge Engine / Universal Creator Vault","knowledge",["nathan-os"]],
["make-ai-yours","MAKE AI YOURS","application",["nathan-os"]],
["vsoc","vSoC React Native / Python / Podman architecture","edge-security",["nathan-os"]],
["17-blocks","17 Building Blocks","taxonomy",[]],
["supernodes","732m SUPERNODES capacity model","capacity",["17-blocks"]],
["grid320","320-Node Global Grid capacity model","capacity",["17-blocks"]],
["bitwise8","8-Layer Bitwise State-Machine","logic",["nathan-os"]],
["matrix78","NATHAN AI 78-Field Matrix","logic",["bitwise8"]],
["ebpf","eBPF binary verification rules","security-spec",["bitwise8"]],
["matrix1001","1001 Matrix / Positive Negative Neutral","logic",["bitwise8"]],
["axioms","1+1=2 / 1-1=0 / 1×1=1 / 1÷1=1","logic",[]],
["cero","Cero Uno Dos / Zero LA AL / Uno EL LE","symbolic",["axioms"]],
["aclra","ACLRA & IKIV","commands",["bitwise8"]],
["ciphers101","101+ Cipher Methods","research",["aclra"]],
["abm","ABM Master Brain Algorithm","orchestration",["nathan-os"]],
["families17","17-Family Worker Bot Taxonomy","worker-taxonomy",["abm"]],
["pipeline8","8-Stage Worker Pipeline","worker-pipeline",["families17"]],
["families172","172-Family Federation","worker-taxonomy",["abm"]],
["voxel5","Five-Node Volumetric 3D Printing Swarm","simulation",["abm"]],
["light-slayer","Tabor Light Slayer","loom",["axioms"]],
["light-sleyer","Tabor Light Sleyer","loom",["axioms"]],
["dark-slayer","Tabor Dark Slayer","loom",["axioms"]],
["dark-sleyer","Tabor Dark Sleyer","loom",["axioms"]],
["worldwide","Worldwide Bots and Agents","registry",["abm"]],
["historical","Historical Minds Council","registry",["worldwide"]],
["mythological","Mythological Minds Council","registry",["worldwide"]],
["hive","Bee Hive / Ant Farm","worker-topology",["families172"]],
["innocence","Agents of Innocence","review",["abm"]],
["source-archive","Original Source Preservation","archive",[]]
].map(([id,name,layer,dependencies])=>({id:id as string,name:name as string,layer:layer as string,dependencies:dependencies as string[],status:"specified" as const,verification:"Source specification recorded; executable integration not verified"}));
export const SYSTEM_SPECS:readonly SystemSpec[]=Object.freeze(specs);
export function verifySystemGraph() {
 const ids=new Set(specs.map(s=>s.id));
 const errors:string[]=[];
 for(const s of specs) for(const dep of s.dependencies) if(!ids.has(dep)) errors.push(s.id+" missing "+dep);
 return {systems:specs.length,errors,originalCoreNames:SUPERCOMPUTER_MODULES.length};
}
export const WORKER_PIPELINE=["sensor","filter","process","log","act-and-index","dispatch","sync","escalate"] as const;
