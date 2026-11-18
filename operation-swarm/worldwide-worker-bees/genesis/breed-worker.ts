// OPERATION GENESIS — bounded, deterministic lineage engine.
// Logical children are inert records. This module NEVER deploys code or creates cloud resources.
export type Genome = {
  id:string; family:string; generation:number; status:"sandbox"|"approved"|"retired";
  skills:string[]; permissions:string[];
};
export type Exam = { id:string; passed:boolean; detail:string };
const MAX_SKILLS=32;
const MAX_GENERATION=12;
const SAFE_SKILL=/^[a-z][a-z0-9-]{0,63}$/;
function unique(xs:string[]):string[] {return [...new Set(xs)].sort();}
export function clone(parent:Genome, childId:string):Genome {
  if (!childId || childId===parent.id) throw Error("Invalid child ID");
  if(parent.generation>=MAX_GENERATION) throw Error("Generation limit");
  return {id:childId,family:parent.family,generation:parent.generation+1,
    status:"sandbox",skills:[...parent.skills],permissions:[]};
}
export function breed(a:Genome,b:Genome,childId:string):Genome {
  if(!childId||a.id===b.id||childId===a.id||childId===b.id) throw Error("Invalid lineage");
  if(a.status!=="approved"||b.status!=="approved") throw Error("Parents must be approved");
  const generation=Math.max(a.generation,b.generation)+1;
  if(generation>MAX_GENERATION) throw Error("Generation limit");
  const skills=unique([...a.skills,...b.skills]);
  if(skills.length>MAX_SKILLS || skills.some(s=>!SAFE_SKILL.test(s))) throw Error("Unsafe skill manifest");
  return {id:childId,family:a.family===b.family?a.family:"cross-family",generation,
    status:"sandbox",skills,permissions:[]};
}
// Ten explicit tests; failures never trigger destructive deletion.
export function examine(child:Genome,parents:Genome[],budgetRemaining:number):Exam[] {
 const ids=parents.map(p=>p.id);
 return [
  {id:"01-identity",passed:!!child.id&&ids.every(id=>id!==child.id),detail:"Unique child identity"},
  {id:"02-lineage",passed:parents.length>=1&&parents.length<=2&&new Set(ids).size===parents.length,detail:"Valid parent count"},
  {id:"03-generation",passed:child.generation===Math.max(...parents.map(p=>p.generation))+1,detail:"Generation increments"},
  {id:"04-inert",passed:child.status==="sandbox",detail:"No automatic activation"},
  {id:"05-permissions",passed:child.permissions.length===0,detail:"No inherited permissions"},
  {id:"06-skills",passed:child.skills.length<=MAX_SKILLS&&child.skills.every(s=>SAFE_SKILL.test(s)),detail:"Skill validation"},
  {id:"07-provenance",passed:child.skills.every(s=>parents.some(p=>p.skills.includes(s))),detail:"Skills trace to parents"},
  {id:"08-bounds",passed:child.generation<=MAX_GENERATION,detail:"Generation limit"},
  {id:"09-budget",passed:Number.isFinite(budgetRemaining)&&budgetRemaining>=1,detail:"Available allocation"},
  {id:"10-no-runtime",passed:true,detail:"Exam does not deploy or execute untrusted code"}
 ];
}
export function canGraduate(exams:Exam[],operatorApproved:boolean):boolean {
 return operatorApproved && exams.length===10 && new Set(exams.map(e=>e.id)).size===10 && exams.every(e=>e.passed);
}
