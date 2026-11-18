export interface Env { COCKPIT_QUEUE: Queue; COCKPIT_DB: D1Database; CONTROL_TOKEN: string; GITHUB_TOKEN?: string; GITHUB_REPOSITORY?: string; }
type Job = { id:string; type:"inventory"|"health"|"reconcile"; created:string; };
const json=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
const authorized=(r:Request,e:Env)=>Boolean(e.CONTROL_TOKEN)&&r.headers.get("authorization")===`Bearer ${e.CONTROL_TOKEN}`;
export default {
 async fetch(request:Request,env:Env):Promise<Response>{
  const url=new URL(request.url);
  if(url.pathname==="/health") return json({ok:true,service:"unified-operations-cockpit",mode:"configured"});
  if(!authorized(request,env)) return json({error:"unauthorized"},401);
  if(url.pathname==="/api/status"&&request.method==="GET"){
   const rows=await env.COCKPIT_DB.prepare("SELECT id,type,status,created_at,updated_at,error FROM cockpit_jobs ORDER BY created_at DESC LIMIT 50").all();
   return json({jobs:rows.results});
  }
  if(url.pathname==="/api/jobs"&&request.method==="POST"){
   const body=await request.json() as {type?:string};
   if(!["inventory","health","reconcile"].includes(body.type||""))return json({error:"unsupported job type"},400);
   const job:Job={id:crypto.randomUUID(),type:body.type as Job["type"],created:new Date().toISOString()};
   await env.COCKPIT_DB.prepare("INSERT INTO cockpit_jobs(id,type,status,created_at,updated_at) VALUES(?,?,?,?,?)").bind(job.id,job.type,"queued",job.created,job.created).run();
   await env.COCKPIT_QUEUE.send(job);return json({queued:job},202);
  }
  return json({error:"not found"},404);
 },
 async scheduled(_event:ScheduledEvent,env:Env):Promise<void>{
  const job:Job={id:crypto.randomUUID(),type:"health",created:new Date().toISOString()};
  await env.COCKPIT_DB.prepare("INSERT INTO cockpit_jobs(id,type,status,created_at,updated_at) VALUES(?,?,?,?,?)").bind(job.id,job.type,"queued",job.created,job.created).run();
  await env.COCKPIT_QUEUE.send(job);
 },
 async queue(batch:MessageBatch<Job>,env:Env):Promise<void>{
  for(const message of batch.messages){const job=message.body;
   try {
    // This initial consumer records receipt; it does NOT claim full fleet verification.
    await env.COCKPIT_DB.prepare("UPDATE cockpit_jobs SET status=?,updated_at=? WHERE id=?").bind("received",new Date().toISOString(),job.id).run();
    message.ack();
   }catch(e){message.retry();}
  }
 }
} satisfies ExportedHandler<Env>;