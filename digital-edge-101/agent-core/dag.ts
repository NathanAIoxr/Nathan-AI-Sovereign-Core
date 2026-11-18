import { check, InputError, str, type Env, type JSONValue } from "../shared/core.ts";
import { handlers } from "../registry/handlers.ts";
type Node = { id:string; syscall:string; after:string[]; input?:JSONValue; from?:string; into?:string };

export function orderPlan(raw: unknown):Node[] {
  check(Array.isArray(raw)&&raw.length>=1&&raw.length<=16,"A plan must contain 1–16 steps");
  const byId=new Map<string,Node>();
  for(const x of raw){
    check(x&&typeof x==="object"&&!Array.isArray(x),"Invalid step");
    const id=str(x.id,48),syscall=str(x.syscall,12),after=x.after??[];
    check(/^[a-z][a-z0-9_-]{0,47}$/i.test(id)&&!byId.has(id),"Invalid or repeated step ID");
    check(handlers.has(syscall),"Step references a syscall that cannot run");
    check(Array.isArray(after)&&after.length<=16,"Expected a dependency list");
    const links=[...new Set<string>(after.map((a:unknown)=>str(a,48)))];
    const from=x.from===undefined?undefined:str(x.from,48);
    check(from===undefined||links.includes(from),"Output source must be an explicit dependency");
    const into=x.into===undefined?undefined:str(x.into,48);
    if(from!==undefined){
      check(into!==undefined&&/^[a-z][a-z0-9_]*$/i.test(into)&&!["constructor","prototype","__proto__"].includes(into),"Expected a safe output destination field");
      check(x.input===undefined||x.input!==null&&typeof x.input==="object"&&!Array.isArray(x.input),"Piped input must be an object");
    }else check(into===undefined,"Output destination requires a source");
    byId.set(id,{id,syscall,after:links,input:x.input,from,into});
  }
  for(const n of byId.values())for(const link of n.after)check(byId.has(link),"Unknown dependency");
  const ordered:Node[]=[], done=new Set<string>();
  while(ordered.length<byId.size){
    const next=[...byId.values()].find(n=>!done.has(n.id)&&n.after.every(id=>done.has(id)));
    if(!next)throw new InputError("Cyclic DAG");
    done.add(next.id);ordered.push(next);
  }
  return ordered;
}

export async function runPlan(raw:unknown,env:Env) {
  const plan=orderPlan(raw), output=new Map<string,unknown>();
  for(const node of plan){
    const handler=handlers.get(node.syscall)!;
    const input=node.from!==undefined ? { ...(node.input as Record<string,JSONValue>??{}), [node.into!]:output.get(node.from) as JSONValue } : node.input??handler.sample;
    output.set(node.id,await handler.execute(input as JSONValue,env));
  }
  return {order:plan.map(n=>n.id), outputs:Object.fromEntries(output)};
}
