const q={
  "upsert": "INSERT INTO repair_jobs(id,scope,provider,repository,number,url,title,signal,source_at,last_seen)\n VALUES(?,?,?,?,?,?,?,?,?,?)\n ON CONFLICT(id) DO UPDATE SET\n scope=CASE WHEN repair_jobs.scope='INTERNAL' THEN 'INTERNAL' ELSE excluded.scope END,\n title=excluded.title,signal=excluded.signal,last_seen=excluded.last_seen,source_at=excluded.source_at,\n status=CASE WHEN repair_jobs.status='WITHDRAWN' THEN 'QUEUED' ELSE repair_jobs.status END,\n attempts=CASE WHEN repair_jobs.status='WITHDRAWN' THEN 0 ELSE repair_jobs.attempts END\n WHERE (excluded.scope='INTERNAL' AND repair_jobs.scope='GLOBAL')\n OR (excluded.source_at >= repair_jobs.source_at AND (\n   excluded.source_at > repair_jobs.source_at OR excluded.title <> repair_jobs.title OR\n   excluded.signal <> repair_jobs.signal OR repair_jobs.status='WITHDRAWN'\n ))",
  "reap": "UPDATE repair_jobs SET status='NEEDS_REVIEW', updated_at=unixepoch(),\n receipt=json_object('reason','Last lease expired') WHERE status='LEASED' AND lease_until<=unixepoch() AND attempts>=max_attempts",
  "claim": "UPDATE repair_jobs SET status='LEASED',attempts=attempts+1,\n worker_id=?1,request_id=?2,lease_id=?3,lease_until=unixepoch()+120,updated_at=unixepoch()\n WHERE NOT EXISTS(SELECT 1 FROM repair_runs WHERE worker_id=?1 AND request_id=?2)\n AND id=(SELECT id FROM repair_jobs WHERE (?4='ANY' OR scope=?4) AND attempts<max_attempts\n AND (?5='[]' OR EXISTS(SELECT 1 FROM json_each(?5) WHERE value=lower(repair_jobs.repository))) AND ((status IN ('QUEUED','RETRY_WAIT') AND ready_at<=unixepoch()) OR (status='LEASED' AND lease_until<=unixepoch()))\n ORDER BY CASE scope WHEN 'INTERNAL' THEN 0 ELSE 1 END,ready_at,source_at,id LIMIT 1)\n RETURNING id,scope,provider,repository,number,url,title,signal,attempts,lease_id,lease_until",
  "heartbeat": "UPDATE repair_jobs SET lease_until=unixepoch()+120,updated_at=unixepoch()\n WHERE id=? AND worker_id=? AND lease_id=? AND status='LEASED' AND lease_until>unixepoch()\n RETURNING id,lease_until",
  "finish": "UPDATE repair_jobs SET status=CASE WHEN ?1='RETRY_WAIT' AND attempts>=max_attempts THEN 'NEEDS_REVIEW' ELSE ?1 END,\n receipt=?2, ready_at=unixepoch()+min(900,30*(1<<min(attempts,5))), updated_at=unixepoch()\n WHERE id=?3 AND worker_id=?4 AND lease_id=?5 AND status='LEASED' AND lease_until>unixepoch()\n RETURNING id,status,receipt",
  "replay": "SELECT j.id,j.scope,j.provider,j.repository,j.number,j.url,j.title,j.signal,j.attempts,j.lease_id,j.lease_until\n FROM repair_jobs j JOIN repair_runs r ON r.lease_id=j.lease_id\n WHERE r.worker_id=? AND r.request_id=? AND j.status='LEASED' AND j.lease_until>unixepoch()",
  "advance": "UPDATE repair_jobs SET status=?1,receipt=?2,updated_at=unixepoch()\n WHERE id=?3 AND status=?4 AND updated_at=?5 RETURNING id,status,updated_at",
  "markSource": "INSERT INTO repair_sources(id,cursor,checked_at,success_at,sweep_started_at,covered_through,items,error)\n VALUES(?1,?2,?3,?3,?4,?5,?6,NULL) ON CONFLICT(id) DO UPDATE SET\n cursor=excluded.cursor,checked_at=excluded.checked_at,success_at=excluded.success_at,\n sweep_started_at=excluded.sweep_started_at,covered_through=COALESCE(excluded.covered_through,repair_sources.covered_through),\n items=excluded.items,error=NULL WHERE excluded.checked_at>=repair_sources.checked_at",
  "failSource": "INSERT INTO repair_sources(id,checked_at,error) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE\n SET checked_at=excluded.checked_at,error=excluded.error WHERE excluded.checked_at>=repair_sources.checked_at"
};
const plan={
  "sources": [
    {
      "id": "gitlab-gnome-shell",
      "type": "gitlab",
      "endpoint": "https://gitlab.gnome.org/api/v4/projects/GNOME%2Fgnome-shell/issues",
      "label": "4. Newcomers",
      "repository": "GNOME/gnome-shell"
    },
    {
      "id": "codeberg",
      "type": "forgejo",
      "endpoint": "https://codeberg.org/api/v1/repos/issues/search",
      "label": "help wanted"
    },
    {
      "id": "mozilla-bugzilla",
      "type": "bugzilla",
      "endpoint": "https://bugzilla.mozilla.org/rest/bug",
      "label": "good-first-bug"
    }
  ],
  "pageSize": 12
};

function sourceTimestamp(value,fallback){
  const time=Math.floor(Date.parse(value)/1000);
  return Number.isFinite(time) ? time : fallback;
}

function job(id,scope,provider,repository,number,url,title,signal,observedAt,now){
  if (!Number.isSafeInteger(number) || number<1 || typeof title!=="string" || !title.trim()) return null;
  return [id,scope,provider,String(repository).slice(0,200),number,url,title.slice(0,300),signal,observedAt,now];
}

function githubJob(row,scope,now){
  const item=/^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/issues\/([1-9]\d*)$/i.exec(row.url??"");
  if(!item) return null;
  const repository=item[1];
  const number=Number(item[2]);
  const isInternal=repository.toLowerCase()==="nathanaioxr/nathan-ai-sovereign-core";
  return job("github:"+repository.toLowerCase()+"#"+number,isInternal ? "INTERNAL" : scope,
    "github",repository,number,row.url,row.title,isInternal ? "owner tracker" : "help wanted",
    sourceTimestamp(row.updated_at,0),now);
}

function externalJob(config,item,now){
  const origin=new URL(config.endpoint).origin;
  if(config.type==="bugzilla"){
    if(item.is_open!==true || !Array.isArray(item.keywords) || !item.keywords.includes(config.label) || item.groups?.length) return null;
    return job("bugzilla:"+new URL(origin).host+"#"+item.id,"GLOBAL","bugzilla",item.product??"Mozilla",item.id,
      origin+"/show_bug.cgi?id="+item.id,item.summary,config.label,sourceTimestamp(item.last_change_time,now),now);
  }
  if(config.type==="gitlab"){
    if(item.state!=="opened" || !item.labels?.includes(config.label) || item.confidential) return null;
    const url=origin+"/"+config.repository+"/-/issues/"+item.iid;
    return job("gitlab:"+new URL(origin).host+":"+config.repository.toLowerCase()+"#"+item.iid,"GLOBAL","gitlab",config.repository,
      item.iid,url,item.title,config.label,sourceTimestamp(item.updated_at,now),now);
  }
  const match=/^https:\/\/codeberg\.org\/([\w.-]+\/[\w.-]+)\/issues\/([1-9]\d*)$/i.exec(item.html_url??"");
  if(!match || item.pull_request || item.state!=="open" || !item.labels?.some(x=>x.name?.toLowerCase()===config.label)) return null;
  const number=Number(match[2]);
  return job("forgejo:codeberg.org:"+match[1].toLowerCase()+"#"+number,"GLOBAL","forgejo",match[1],number,match[0],item.title,
    config.label,sourceTimestamp(item.updated_at,now),now);
}

function pageUrl(config,offset){
  const url=new URL(config.endpoint);
  const page=Math.floor(offset/plan.pageSize)+1;
  const p=config.type==="bugzilla" ? {
    keywords:config.label,limit:String(plan.pageSize),offset:String(offset),
    order:"bug_id",include_fields:"id,summary,is_open,product,keywords,groups,last_change_time"
  } : config.type==="gitlab" ? {
    state:"opened",labels:config.label,order_by:"created_at",sort:"asc",per_page:String(plan.pageSize),page:String(page)
  } : {type:"issues",state:"open",labels:config.label,limit:String(plan.pageSize),page:String(page)};
  url.search=new URLSearchParams(p);
  if(config.type==="bugzilla") for(const status of ["UNCONFIRMED","NEW","ASSIGNED","REOPENED"]) url.searchParams.append("status",status);
  return url;
}

function batchJobs(db,rows){
  const statements=[];
  for(let i=0;i<rows.length;i+=9){
    const group=rows.slice(i,i+9);
    const values=group.map(()=>"(?,?,?,?,?,?,?,?,?,?)").join(",");
    const sql=q.upsert.replace("VALUES(?,?,?,?,?,?,?,?,?,?)","VALUES"+values);
    statements.push(db.prepare(sql).bind(...group.flat()));
  }
  return statements;
}

async function syncExternal(db,config,now,read=fetch){
  const source=await db.prepare("SELECT * FROM repair_sources WHERE id=?").bind(config.id).first();
  if(source?.checked_at>=now) return;
  const offset=source?.cursor??0;
  try{
    const response=await read(pageUrl(config,offset),{headers:{Accept:"application/json","User-Agent":"NathanAI-Sovereign-Hive"},redirect:"manual",signal:AbortSignal.timeout(12000)});
    if(!response.ok) throw Error("HTTP "+response.status);
    const data=await response.json();
    const rows=config.type==="bugzilla" ? data.bugs : data;
    if(!Array.isArray(rows)||rows.length>plan.pageSize) throw Error("Unexpected provider response");
    const admitted=[...new Map(rows.map(item=>externalJob(config,item,now)).filter(Boolean).map(row=>[row[0],row])).values()];
    const start=source?.sweep_started_at??now;
    const complete=rows.length<plan.pageSize;
    await db.batch([...batchJobs(db,admitted),db.prepare(q.markSource).bind(config.id,complete?0:offset+plan.pageSize,now,complete?null:start,complete?start:null,admitted.length)]);
    return {id:config.id,admitted:admitted.length,complete};
  } catch(error){
    await db.prepare(q.failSource).bind(config.id,now,String(error.message).slice(0,110)).run();
    return {id:config.id,error:String(error.message).slice(0,110)};
  }
}

async function syncInternal(db,now){
  const source=await db.prepare("SELECT observed_ms,snapshot FROM issue_queue WHERE id=1").first();
  if(!source) return;
  const asOf=Math.floor(source.observed_ms/1000);
  const coverage=await db.prepare("SELECT covered_through FROM repair_sources WHERE id='internal-sovereign-core'").first();
  if(coverage?.covered_through>=asOf) return;
  const data=JSON.parse(source.snapshot);
  const rows=data.issues.map(item=>githubJob({...item,updated_at:data.receipt?.completedAt},"INTERNAL",asOf)).filter(Boolean);
  if(rows.length!==data.issues.length) throw Error("Invalid internal snapshot");
  const statements=batchJobs(db,rows);
  // Repair evidence and active leases survive upstream closure.
  statements.push(db.prepare(`UPDATE repair_jobs SET status='WITHDRAWN',updated_at=unixepoch()
    WHERE scope='INTERNAL' AND repository='NathanAIoxr/Nathan-AI-Sovereign-Core' COLLATE NOCASE
      AND status IN ('QUEUED','RETRY_WAIT') AND last_seen < ?
      AND NOT EXISTS(SELECT 1 FROM json_each(?) WHERE value=repair_jobs.id)`).bind(asOf,JSON.stringify(rows.map(row=>row[0]))));
  statements.push(db.prepare(q.markSource).bind("internal-sovereign-core",0,now,null,asOf,rows.length));
  await db.batch(statements);
}

async function syncGlobal(env,now){
  const db=env.HIVE;
  const key="github-help-wanted-index";
  try {
    const source=await db.prepare("SELECT * FROM repair_sources WHERE id=?").bind(key).first();
    const offset=source?.cursor??0;
    if(source?.checked_at>=now || (!offset&&source?.success_at&&now-source.success_at<1800)) return;
    const upstream=await env.DISCOVERY.fetch("https://help-wanted.internal/api/queue?offset="+offset);
    if(!upstream.ok) throw Error("Discovery HTTP "+upstream.status);
    const {snapshot}=await upstream.json();
    if(!Array.isArray(snapshot?.issues)||snapshot.issues.length>100) throw Error("Invalid discovery snapshot");
    const rows=snapshot.issues.map(i=>githubJob({...i,updated_at:i.updatedAt},"GLOBAL",now)).filter(Boolean);
    const next=Number.isSafeInteger(snapshot.nextOffset)&&snapshot.nextOffset>offset?snapshot.nextOffset:0;
    await db.batch([...batchJobs(db,rows),db.prepare(q.markSource).bind(key,next,now,null,
      !next&&snapshot.coverage?.backfillComplete&&snapshot.scannedAt?sourceTimestamp(snapshot.scannedAt,now):null,rows.length)]);
  } catch(error){
    await db.prepare(q.failSource).bind(key,now,String(error.message).slice(0,110)).run();
  }
}

async function refreshRepairs(env,scheduledTime){
  const now=Math.floor(scheduledTime/1000);
  const operations=await Promise.allSettled([
    syncInternal(env.HIVE,now),syncGlobal(env,now),
    ...plan.sources.map(source=>syncExternal(env.HIVE,source,now)),
    env.HIVE.prepare(q.reap).run()
  ]);
  const failures=operations.filter(result=>result.status==="rejected");
  if(failures.length)throw Error("Repair refresh had "+failures.length+" storage or reconciliation failures");
}

function reply(body,status=200){
  return Response.json(body,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff","x-robots-tag":"noindex"}});
}

async function equalToken(request,secret){
  if(typeof secret!=="string"||secret.length<32) return false;
  const supplied=request.headers.get("authorization")??"";
  if(!supplied.startsWith("Bearer ") || supplied.length>512) return false;
  const encode=new TextEncoder();
  const hash=async value=>new Uint8Array(await crypto.subtle.digest("SHA-256",encode.encode(value)));
  const [actual,expected]=await Promise.all([hash(supplied.slice(7)),hash(secret)]);
  let diff=0;
  for(let i=0;i<expected.length;i++) diff|=expected[i]^actual[i];
  return diff===0;
}

async function readBody(request){
  const reader=request.body?.getReader();
  if(!reader) throw Error("A JSON body is required");
  const decoder=new TextDecoder();
  let bytes=0;
  let text="";
  for(;;){
    const {done,value}=await reader.read();
    if(done) break;
    bytes+=value.byteLength;
    if(bytes>65536){await reader.cancel();throw Error("Body exceeds 64 KiB");}
    text+=decoder.decode(value,{stream:true});
  }
  const body=JSON.parse(text+decoder.decode());
  if(!body || typeof body!=="object" || Array.isArray(body)) throw Error("Expected a JSON object");
  return body;
}

function identifier(value){
  return typeof value==="string"&&/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/.test(value);
}

function testsPassed(tests){
  return Array.isArray(tests)&&tests.length>0&&tests.every(test=>typeof test?.command==="string"&&test.command.trim()&&test.exitCode===0);
}

function validResult(status,receipt){
  if(!receipt||typeof receipt!=="object"||Array.isArray(receipt)) return false;
  if(status==="PATCH_READY"||status==="VERIFIED"){
    if(!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(receipt.base??"")||
      typeof receipt.patch!=="string"||!receipt.patch.startsWith("diff --git ")||receipt.patch.length>50000) return false;
    return status==="PATCH_READY"||testsPassed(receipt.tests);
  }
  return ["RETRY_WAIT","NEEDS_REVIEW"].includes(status)&&typeof receipt.reason==="string"&&receipt.reason.trim().length>0;
}

async function repairRoute(request,env){
  const url=new URL(request.url);
  const route=url.pathname;
  const db=env.HIVE;
  if(request.method==="GET"&&route==="/api/repair/status"){
    const [counts,sources,latest]=await Promise.all([
      db.prepare("SELECT scope,status,COUNT(*) AS count FROM repair_jobs GROUP BY scope,status ORDER BY scope,status").all(),
      db.prepare("SELECT * FROM repair_sources ORDER BY id").all(),
      db.prepare("SELECT outcome,COUNT(*) AS count FROM repair_runs GROUP BY outcome ORDER BY outcome").all()
    ]);
    return reply({queue:counts.results,sources:sources.results,attempts:latest.results,
      runnerApiConfigured:typeof env.REPAIR_RUNNER_TOKEN==="string"&&env.REPAIR_RUNNER_TOKEN.length>=32,
      ownerApiConfigured:typeof env.REPAIR_OWNER_TOKEN==="string"&&env.REPAIR_OWNER_TOKEN.length>=32,
      anchors:["1+1=2","1-1=0"]});
  }
  if(request.method==="GET"&&route==="/api/repair/leads"){
    const out=await db.prepare("SELECT id,provider,repository,number,url,title,signal,status FROM repair_jobs WHERE scope='GLOBAL' ORDER BY source_at DESC,id LIMIT 50").all();
    return reply({issues:out.results});
  }
  const action=route.split("/").at(-1);
  if(!["claim","heartbeat","finish","advance","task"].includes(action)) return reply({error:"Route not found"},404);
  if(request.method!=="POST") return reply({error:"Use POST"},405);
  const secret=["advance","task"].includes(action) ? env.REPAIR_OWNER_TOKEN : env.REPAIR_RUNNER_TOKEN;
  if(typeof secret!=="string"||secret.length<32) return reply({error:"Credential enrollment required"},503);
  if(!await equalToken(request,secret)) return reply({error:"Unauthorized"},401);
  let body;
  try{body=await readBody(request);}catch(error){return reply({error:error.message},400);}
  if(action==="claim"){
    if(!identifier(body.worker)||!identifier(body.requestId)||!["INTERNAL","GLOBAL","ANY"].includes(body.scope)) return reply({error:"Invalid claim"},400);
    const repositories=body.repositories??[];
    if(!Array.isArray(repositories)||repositories.length>50||repositories.some(repo=>typeof repo!=="string"||repo.length<1||repo.length>200)) return reply({error:"Invalid repository filter"},400);
    const task=await db.prepare(q.claim).bind(body.worker,body.requestId,crypto.randomUUID(),body.scope,JSON.stringify(repositories.map(repo=>repo.toLowerCase()))).first();
    if(task) return reply({status:"LEASED",task});
    const replay=await db.prepare(q.replay).bind(body.worker,body.requestId).first();
    return replay ? reply({status:"LEASED",task:replay}) : reply({status:"IDLE"});
  }
  if(typeof body.id!=="string"||body.id.length>350) return reply({error:"Invalid task identity"},400);
  if(action==="task"){
    const task=await db.prepare("SELECT * FROM repair_jobs WHERE id=?").bind(body.id).first();
    return task ? reply({task}) : reply({error:"Task not found"},404);
  }
  if(action==="advance"){
    const transitions={PATCH_READY:["VERIFIED","IMPLEMENTED"],VERIFIED:["IMPLEMENTED"],IMPLEMENTED:["DONE"]};
    if(!transitions[body.from]?.includes(body.to)||!Number.isSafeInteger(body.updatedAt)||!body.evidence||typeof body.evidence!=="object") return reply({error:"Invalid transition"},400);
    if((body.to==="VERIFIED"||body.to==="DONE")&&!testsPassed(body.evidence.tests)) return reply({error:"Passing test receipts required"},400);
    if((body.to==="IMPLEMENTED"||body.to==="DONE")&&!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(body.evidence.appliedCommit??"")) return reply({error:"Applied commit required"},400);
    const current=await db.prepare("SELECT receipt FROM repair_jobs WHERE id=?").bind(body.id).first();
    const evidence=JSON.parse(current?.receipt??"{}");
    evidence.owner=[...(evidence.owner??[]),{...body.evidence,status:body.to}];
    const task=await db.prepare(q.advance).bind(body.to,JSON.stringify(evidence),body.id,body.from,body.updatedAt).first();
    return task ? reply({task}) : reply({error:"Task changed"},409);
  }
  if(!identifier(body.worker)||typeof body.lease!=="string"||!/^[a-f0-9-]{36}$/i.test(body.lease)) return reply({error:"Invalid lease"},400);
  if(action==="heartbeat"){
    const task=await db.prepare(q.heartbeat).bind(body.id,body.worker,body.lease).first();
    return task ? reply({task}) : reply({error:"Lease lost"},409);
  }
  if(!validResult(body.status,body.receipt)) return reply({error:"Invalid result receipt"},400);
  const evidence=JSON.stringify({...body.receipt,byline:"By Nathan Tabor and Nathan AI"});
  const task=await db.prepare(q.finish).bind(body.status,evidence,body.id,body.worker,body.lease).first();
  if(task) return reply({task});
  const old=await db.prepare("SELECT job_id AS id,outcome AS status,receipt FROM repair_runs WHERE lease_id=? AND worker_id=? AND job_id=?").bind(body.lease,body.worker,body.id).first();
  if(old?.receipt===evidence) return reply({task:old,replay:true});
  return reply({error:"Lease lost or result already differs"},409);
}

async function directInternalScan(env, scheduledTime, collect, validate, persist) {
  const db=env.HIVE;
  const key="internal-direct-github";
  const now=Math.floor(scheduledTime/1000);
  const previous=await db.prepare("SELECT checked_at,error FROM repair_sources WHERE id=?").bind(key).first();
  if(!env.HIVE_GITHUB_READ_TOKEN&&previous?.error&&now-previous.checked_at<3600) return;
  try {
    const issues=validate(await collect(fetch,env.HIVE_GITHUB_READ_TOKEN));
    await persist(db,issues,scheduledTime);
    await db.prepare(q.markSource).bind(key,0,now,null,now,issues.length).run();
  } catch(error) {
    const message=String(error.message).slice(0,110);
    await db.prepare(q.failSource).bind(key,now,message).run();
    console.warn(JSON.stringify({source:key,message}));
  }
}

export { directInternalScan, externalJob, githubJob, pageUrl, refreshRepairs, repairRoute, validResult };
