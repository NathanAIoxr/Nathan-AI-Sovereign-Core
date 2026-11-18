import {canonical,sha256} from "./proofs.mjs";

export const projects={
  "pie-pi-phi":{name:"Pie Pi Phi",secret:"FABRIC_PIE_PI_PHI_TOKEN",daily_operations:262144},
  "supercalifragilisticexpialidocious":{name:"Supercalifragilisticexpialidocious",secret:"FABRIC_SUPERCALIFRAGILISTICEXPIALIDOCIOUS_TOKEN",daily_operations:262144}
};
export const fabricContract={title:"NATHAN AI — NATHAN TABOR 2X+ SOVEREIGN SUPERCOMPUTER",
  parent:"TRUE CLOUD COMPUTING BY NATHAN TABOR",
  boxes:[{name:"Box 0 · The Clearing Gate",axiom:"1 - 1 = 0",roles:["authenticate","validate","deduplicate","reserve quota","cancel"]},
    {name:"Box 1 · The Compounding Engine",axiom:"1 + 1 = 2",roles:["claim","dispatch","replay","commit"]}],
  workload:{kind:"fp64-dot-lcg32-v1",minimum_terms:64,maximum_terms:4096,attempt_limit:3},
  namespaces:Object.entries(projects).map(([id,{name,daily_operations}])=>({id,name,daily_operations})),
  backend:"Nathan AI 2X+ Sovereign Supercomputer Cloudflare service binding",
  benchmark:"Fixed-vector FP64 software check, independent replay and receipt verification"};
const idPattern=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
export const validId=id=>idPattern.test(id);

export async function authenticate(request,env) {
  const namespace=request.headers.get("x-tenant");
  if(!namespace||!Object.hasOwn(projects,namespace))return null;
  const header=request.headers.get("authorization")??"";
  if(!/^Bearer [A-Za-z0-9._~-]{24,256}$/.test(header))return null;
  const digest=await sha256(header.slice(7));
  const secret=env[projects[namespace].secret];
  if(secret) {
    const expected=await sha256(secret);
    let diff=0;
    for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^digest.charCodeAt(i);
    if(diff===0)return namespace;
  }
  const row=await env.DB.prepare("SELECT namespace FROM true_cloud_compute_keys WHERE digest=? AND namespace=? AND expires_ms>?")
    .bind(digest,namespace,Date.now()).first();
  return row?.namespace??null;
}

export async function parameters(request) {
  const reader=request.body?.getReader();
  if(!reader)throw new RangeError("A JSON body is required.");
  const decoder=new TextDecoder();
  let raw="",bytes=0;
  for(;;){
    const {done,value}=await reader.read();
    if(done)break;
    bytes+=value.byteLength;
    if(bytes>512){await reader.cancel();throw new RangeError("JSON input is limited to 512 bytes.");}
    raw+=decoder.decode(value,{stream:true});
  }
  let input;
  try{input=JSON.parse(raw+decoder.decode());}catch{throw new RangeError("Invalid JSON body.");}
  if(!input||Object.getPrototypeOf(input)!==Object.prototype||Object.keys(input).some(k=>k!=="seed"&&k!=="terms")||
    !Number.isInteger(input.seed)||input.seed<0||input.seed>4294967295||
    !Number.isInteger(input.terms)||input.terms<64||input.terms>4096) {
    throw new RangeError("Provide an unsigned 32-bit seed and 64 to 4096 terms.");
  }
  const key=request.headers.get("idempotency-key")??"";
  if(!/^[A-Za-z0-9._:-]{1,100}$/.test(key))throw new RangeError("A valid Idempotency-Key is required.");
  return {key,seed:input.seed,terms:input.terms};
}

export async function admit(db,namespace,{key,seed,terms},now=Date.now()) {
  const digest=await sha256(canonical({seed,terms}));
  const day=new Date(now).toISOString().slice(0,10);
  const reservation=2*terms;
  const fresh=await db.prepare(`INSERT INTO true_cloud_compute_jobs
    (id,namespace,retry_key,request_sha,seed,terms,operation_budget,budget_day,state,created_ms,updated_ms,next_ms)
    SELECT ?,?,?,?,?,?,?,?,'queued',?,?,? WHERE
    ?+(SELECT COALESCE(SUM(operation_budget),0) FROM true_cloud_compute_jobs WHERE namespace=? AND budget_day=?)<=?
    ON CONFLICT(namespace,retry_key) DO NOTHING RETURNING id,state,operation_budget`)
    .bind(crypto.randomUUID(),namespace,key,digest,seed,terms,reservation,day,now,now,now,reservation,namespace,day,projects[namespace].daily_operations).first();
  if(fresh)return {status:202,body:{...fresh,namespace,admission:"accepted"}};
  const existing=await db.prepare("SELECT id,state,operation_budget,request_sha FROM true_cloud_compute_jobs WHERE namespace=? AND retry_key=?")
    .bind(namespace,key).first();
  if(!existing)return {status:429,body:{admission:"deferred",reason:"daily_operation_quota"}};
  if(existing.request_sha!==digest)return {status:409,body:{admission:"rejected",reason:"idempotency_conflict"}};
  return {status:200,body:{id:existing.id,state:existing.state,operation_budget:existing.operation_budget,namespace,admission:"duplicate"}};
}

export async function cancel(db,namespace,id,now=Date.now()) {
  return db.prepare(`UPDATE true_cloud_compute_jobs SET state='cancelled',updated_ms=?,lease_owner=NULL,lease_until=NULL
    WHERE id=? AND namespace=? AND state IN ('queued','running') RETURNING id,state`).bind(now,id,namespace).first();
}
