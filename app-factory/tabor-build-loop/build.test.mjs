import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { authenticate, oauth } from "./oauth.mjs";
import { cancelJob, history, listJobs, planStatus, queuePlan, retryJob, setPaused } from "./plans.mjs";
import { checkModule } from "./validate.mjs";
import { digest, enqueue, getJob, nextWake, resumePublish, runOne, stats } from "./queue.mjs";

const schema = readFileSync(new URL("schema.sql", import.meta.url),"utf8");
function testEnv(bootstrap = () => {}) {
  const db = new DatabaseSync(":memory:");
  db.exec(schema);
  bootstrap(db);
  db.exec(readFileSync(new URL("schema-v2.sql",import.meta.url),"utf8"));
  function prepare(sql) {
    const statement=db.prepare(sql);
    const query = args => ({
      async first() { return statement.get(...args) ?? null; },
      async run() { return { meta:{ changes:statement.run(...args).changes } }; },
      async all() { return { results:statement.all(...args) }; },
      execute() {
        if (statement.columns().length) return { results:statement.all(...args) };
        return { meta:{ changes:statement.run(...args).changes } };
      },
    });
    return { ...query([]), bind(...args){return query(args);} };
  }
  return { LOOP_OWNER_TOKEN:"owner-password-for-test", DB:{
    prepare,
    async batch(statements) {
      db.exec("BEGIN");
      try {
        const result = statements.map(statement => statement.execute());
        db.exec("COMMIT");
        return result;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  }};
}

test("persistent queue has idempotency and atomic claims across concurrent runners",async()=>{
  const env=testEnv();
  const a=await enqueue(env,{prompt:"Export a receipt",kind:"probe",idempotency_key:"probe-1"});
  const b=await enqueue(env,{prompt:"Export a receipt",kind:"probe",idempotency_key:"probe-1"});
  assert.equal(a.id,b.id);
  await assert.rejects(enqueue(env,{prompt:"Other job",kind:"probe",idempotency_key:"probe-1"}),RangeError);
  assert.ok(await nextWake(env));
  const [winner,second]=await Promise.all([runOne(env),runOne(env)]);
  assert.equal([winner,second].filter(Boolean).length,1);
  const job=await getJob(env,a.id,true);
  assert.equal(job.status,"generated");
  const module=await import("data:text/javascript,"+encodeURIComponent(job.code_output));
  assert.equal(module.buildReceipt().id,a.id);
  assert.equal(createHash("sha256").update(job.code_output).digest("hex"),job.code_sha256);
  assert.deepEqual((await stats(env)).queue,{generated:1});
});

test("the model queues a draft and reports the actual GitHub handoff state",async()=>{
  const env={...testEnv(),AI:{async run(){return {response:"export function answer() { return 42; }"};}}};
  const a=await enqueue(env,{prompt:"Create a function that returns 42",publish:true});
  await runOne(env);
  const job=await getJob(env,a.id,true);
  assert.equal(job.provider,"Workers AI");
  assert.equal(job.publish_status,"awaiting_github_token");
  const module=await import("data:text/javascript,"+encodeURIComponent(job.code_output));
  assert.equal(module.answer(),42);
});

test("GitHub publication is opt-in and writes only the generated path on the draft branch",async()=>{
  const env={...testEnv(),GITHUB_TOKEN:"placeholder",GITHUB_REPOSITORY:"owner/builds",
    GITHUB_DRAFT_BRANCH:"automation/tabor-build-drafts"};
  const a=await enqueue(env,{prompt:"Stage a generated receipt",kind:"probe",publish:true});
  const run=await runOne(env,async(url,request)=>{
    assert.equal(url,"https://api.github.com/repos/owner/builds/contents/"+a.file_path);
    const entry=JSON.parse(request.body);
    assert.equal(entry.branch,"automation/tabor-build-drafts");
    assert.match(atob(entry.content),/export function buildReceipt/);
    return Response.json({commit:{html_url:"https://github.com/owner/builds/commit/test"}});
  });
  assert.equal(run.status,"published");
  assert.equal((await getJob(env,a.id)).commit_url,"https://github.com/owner/builds/commit/test");
});

test("OAuth restricts redirects and gives a one-time authorization code bound to its PKCE verifier",async()=>{
  const env=testEnv(), origin="https://example.test", redirect="https://chatgpt.com/connector_platform_oauth_redirect";
  const verifier="V".repeat(43);
  const form=new URLSearchParams({client_id:"tabor-chatgpt",response_type:"code",redirect_uri:redirect,
    code_challenge_method:"S256",code_challenge:createHash("sha256").update(verifier).digest("base64url"),
    state:"test-state",owner:env.LOOP_OWNER_TOKEN});
  const auth = await oauth(new Request(origin+"/oauth/authorize",{method:"POST",headers:{origin},body:form}),env);
  assert.equal(auth.status,303);
  const destination=new URL(auth.headers.get("location"));
  assert.equal(destination.origin,"https://chatgpt.com");
  const body=new URLSearchParams({client_id:"tabor-chatgpt",grant_type:"authorization_code",redirect_uri:redirect,
    code:destination.searchParams.get("code"),code_verifier:verifier,resource:origin+"/mcp"});
  const exchange=()=>oauth(new Request(origin+"/oauth/token",{method:"POST",body}),env);
  const token=await (await exchange()).json();
  assert.ok(await authenticate(new Request(origin+"/mcp",{headers:{authorization:"Bearer "+token.access_token}}),env));
  assert.equal((await exchange()).status,400);
  form.set("redirect_uri","https://chatgpt.com.attacker.invalid/");
  assert.equal((await oauth(new Request(origin+"/oauth/authorize",{method:"POST",headers:{origin},body:form}),env)).status,400);
});

test("a generated artifact can resume draft delivery without another model call",async()=>{
  const env={...testEnv(),AI:{async run(){return {response:"export const proof = 100;"};}}};
  const job=await enqueue(env,{prompt:"Create the published proof",publish:true});
  await runOne(env);
  const first=await getJob(env,job.id,true);
  await assert.rejects(resumePublish(env,job.id),RangeError);
  env.GITHUB_TOKEN="draft";
  env.GITHUB_REPOSITORY="owner/builds";
  env.GITHUB_DRAFT_BRANCH="automation/tabor-build-drafts";
  env.AI={async run(){throw new Error("Never generate a second time");}};
  await resumePublish(env,job.id);
  await runOne(env,async()=>Response.json({commit:{html_url:"https://github.com/owner/builds/commit/test"}}));
  const result=await getJob(env,job.id,true);
  assert.equal(result.status,"published");
  assert.equal(result.code_sha256,first.code_sha256);
});

test("plans are atomic, reject cycles, and preserve order independently of input order",async()=>{
  const env=testEnv();
  const request={title:"Delivery",idempotency_key:"delivery-plan",tasks:[
    {key:"report",prompt:"Print the total",kind:"probe",depends_on:["compute"]},
    {key:"compute",prompt:"Add quantities",kind:"probe"},
  ]};
  const plan=await queuePlan(env,request,digest);
  assert.equal((await queuePlan(env,request,digest)).id,plan.id);
  await assert.rejects(queuePlan(env,{...request,title:"Changed"},digest),/belongs/);
  await assert.rejects(queuePlan(env,{title:"Cycle",tasks:[request.tasks[0],{...request.tasks[1],depends_on:["report"]}]},digest),/cycle/);
  const initial=await planStatus(env,plan.id);
  assert.deepEqual(initial.tasks.map(t=>t.status),["waiting","pending"]);
  assert.equal((await runOne(env)).id,initial.tasks[1].id);
  assert.equal((await runOne(env)).id,initial.tasks[0].id);
  assert.deepEqual((await planStatus(env,plan.id)).tasks.map(t=>t.status),["generated","generated"]);
  assert.equal((await listJobs(env,{})).jobs.length,2);
  const receipt=await history(env,initial.tasks[1].id);
  assert.deepEqual(receipt.events.map(item=>item.event),["generated","syntax_verified","running","queued"]);
});

test("pause, cancellation, and reopening preserve transitive dependency state",async()=>{
  const env=testEnv();
  const plan=await queuePlan(env,{title:"Stack",tasks:[
    {key:"base",prompt:"Base module",kind:"probe"},
    {key:"middle",prompt:"Middle module",kind:"probe",depends_on:["base"]},
    {key:"top",prompt:"Top module",kind:"probe",depends_on:["middle"]},
  ]},digest);
  const [base,middle,top]=(await planStatus(env,plan.id)).tasks;
  await setPaused(env,true);
  assert.equal(await runOne(env),null);
  assert.equal(await nextWake(env),null);
  await cancelJob(env,base.id);
  assert.equal((await getJob(env,middle.id)).status,"blocked");
  assert.equal((await getJob(env,top.id)).status,"blocked");
  await setPaused(env,false);
  assert.equal(await runOne(env),null);
  assert.equal((await retryJob(env,base.id)).status,"pending");
  assert.equal((await runOne(env)).id,base.id);
  assert.equal((await runOne(env)).id,middle.id);
  assert.equal((await runOne(env)).id,top.id);
  assert.ok((await history(env,base.id)).events.some(item=>item.event==="reopened"));
});

test("syntax validation accepts only declared static imports and preserves the code lineage",async()=>{
  assert.throws(()=>checkModule("export const x =;",[]),/syntax/i);
  assert.throws(()=>checkModule('import fs from "node:fs"; export const x=fs;',[]),/direct dependency/);
  assert.throws(()=>checkModule('export const x=()=>import("./other.mjs");',[]),/dynamic/i);
  const prompts=[];
  const env={...testEnv(),AI:{async run(model,{messages}){
    const input=JSON.parse(messages[1].content);
    prompts.push(input);
    return {response:input.direct_dependencies.length ?
      'import { quantity } from "./base.mjs"; export const total=quantity+2;' :
      "export const quantity=40;"};
  }}};
  const plan=await queuePlan(env,{title:"Lineage",tasks:[
    {key:"base",prompt:"Base code"},
    {key:"total",prompt:"Total code",publish:true,depends_on:["base"]},
  ]},digest);
  const [base,total]=(await planStatus(env,plan.id)).tasks;
  env.GITHUB_TOKEN="mock";
  await runOne(env);
  await runOne(env);
  assert.equal(prompts[1].direct_dependencies[0].source,"export const quantity=40;\n");
  assert.ok((await getJob(env,base.id)).code_sha256);
  const draft=await getJob(env,total.id,true);
  assert.equal(draft.publish_status,"awaiting_dependency_publication");
  assert.match(draft.code_output,/quantity\+2/);
});

test("upgrading preserves historical jobs and their code",async()=>{
  const id="46e63819-3ab4-4e70-b3e8-af6b6b6a355b";
  const env=testEnv(db=>db.prepare(`INSERT INTO build_queue(id,request_hash,task_prompt,file_path,kind,status,publish,next_at,created_at,code_output)
    VALUES(?,?,?,?,'module','generated',0,0,0,?)`).run(id,"h","Old job","generated-builds/old.mjs","export const old=1;"));
  assert.equal((await getJob(env,id,true)).code_output,"export const old=1;");
  assert.deepEqual((await stats(env)).queue,{generated:1});
});
