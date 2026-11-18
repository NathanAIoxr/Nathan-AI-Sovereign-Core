/**
 * NATHAN TABOR SUPERCOMPUTER — orchestration layer.
 * Software architecture only: no claim of physical quantum hardware.
 * Preserve original systems as independent components; do not delete originals.
 */
export type Plane = "Mental"|"Spiritual"|"Physical"|"Financial"|"Literal"|"Figurative"|"Mythological";
export type Stage = "proposed"|"queued"|"claimed"|"review"|"approved"|"failed";
export interface RoleProfile {
  id: string;
  name: string;
  kind: "historical-mind"|"mythological-council"|"original-agent"|"external-tool";
  capabilities: readonly string[];
  provenance: string;
  runtime: "conceptual"|"local"|"connected";
}
export interface BuildTask {
  id: string; sourceId: string; prompt: string; capability: string;
  stage: Stage; attempts: number; output?: string; receipt?: string;
}
export const AXIOMS = Object.freeze({
  build: "1+1=2", clear: "1-1=0", integrate: "1×1=1", verify: "1÷1=1"
});
export const PLANES: readonly Plane[] = ["Mental","Spiritual","Physical","Financial","Literal","Figurative","Mythological"];
export const SUPERCOMPUTER_MODULES = Object.freeze([
  "NATHAN OS","NATHAN AI","ABM Master Brain","4T Clover",
  "78-Field Matrix","1001 Matrix","8-Layer Bitwise State Machine",
  "vSoC Sovereign Core","17 Worker Families","172 Worker Families",
  "Tabor Light Slayer","Tabor Light Sleyer","Tabor Dark Slayer",
  "Tabor Dark Sleyer","Worldwide Agent Federation","Source Archive"
]);
/** Catalog capacity is not the count of deployed running agents. */
export const CAPACITY_MODELS = Object.freeze({
  workerFamilies:172, originalWorkerTaxonomy:17, gridNodes:320,
  proposedSupernodes:732_000_000, proposedHiveWorkerAddresses:126_000_000_000
});
export class SupercomputerRegistry {
  private profiles = new Map<string,RoleProfile>();
  register(profile:RoleProfile):void {
    if(!profile.id.trim() || !profile.name.trim() || !profile.provenance.trim()) throw Error("Identity and provenance required");
    const prior=this.profiles.get(profile.id);
    if(prior && JSON.stringify(prior)!==JSON.stringify(profile)) throw Error("Conflicting identity: "+profile.id);
    this.profiles.set(profile.id, Object.freeze({...profile,capabilities:Object.freeze([...profile.capabilities])}));
  }
  search(term:string):RoleProfile[] {
    const q=term.toLowerCase();
    return [...this.profiles.values()].filter(p=>[p.name,p.kind,...p.capabilities].some(x=>x.toLowerCase().includes(q)));
  }
  list():RoleProfile[]{return [...this.profiles.values()];}
  operationalCount():number{return this.list().filter(x=>x.runtime==="connected").length;}
}
export function reviewSignal(input:{id:string;payload:string;stateBit:0|1;plane:Plane}) {
  // Binary input labels are classifications, not proof of truth.
  return {id:input.id,original:input.payload,plane:input.plane,
    status:input.stateBit===0?"quarantined-for-review":"eligible-for-review",
    verified:false,destructiveAction:false};
}
export function nextStage(current:Stage, action:"queue"|"claim"|"submit"|"approve"|"fail"):Stage {
  const transitions:Record<string,Stage> = {
    "proposed:queue":"queued","queued:claim":"claimed",
    "claimed:submit":"review","review:approve":"approved",
    "claimed:fail":"failed","review:fail":"failed"
  };
  const stage=transitions[current+":"+action];
  if(!stage) throw Error("Invalid transition "+current+" -> "+action);
  return stage;
}
