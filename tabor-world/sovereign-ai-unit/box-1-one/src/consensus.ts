export interface ModelResult { model:string; answer:string; ok:boolean; error?:string }
export async function runConsensus(ai: {run:(model:string,args:unknown)=>Promise<any>}, prompt:string, models:string[]):Promise<{results:ModelResult[]; agreement:number; selected:string|null}> {
 const results=await Promise.all(models.map(async model=>{try{const x=await ai.run(model,{messages:[{role:"user",content:prompt}],max_tokens:512});return {model,answer:String(x?.response??""),ok:true}}catch(e){return {model,answer:"",ok:false,error:"model_unavailable"}}}));
 const valid=results.filter(x=>x.ok&&x.answer.trim());
 if(!valid.length)return {results,agreement:0,selected:null};
 const normalized=valid.map(x=>x.answer.trim().replace(/\s+/g," ").toLowerCase());
 const counts=new Map<string,number>();for(const x of normalized)counts.set(x,(counts.get(x)||0)+1);
 const winner=[...counts.entries()].sort((a,b)=>b[1]-a[1])[0];
 return {results,agreement:winner[1]/valid.length,selected:valid[normalized.indexOf(winner[0])].answer};
}
