import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { authenticate, oauth } from "./oauth.mjs";
import { enqueue, getJob, nextWake, resumePublish, runOne, stats } from "./queue.mjs";

const schema = readFileSync(new URL("schema.sql", import.meta.url),"utf8");
function testEnv() {
  const db = new DatabaseSync(":memory:");
  db.exec(schema);
  return { LOOP_OWNER_TOKEN:"owner-password-for-test",
    DB: { prepare(sql) {
      const statement=db.prepare(sql);
      const query = args => ({
        async first() { return statement.get(...args) ?? null; },
        async run() { return { meta:{ changes:statement.run(...args).changes } }; },
        async all() { return { results:statement.all(...args) }; },
      });
      return { ...query([]), bind(...args){return query(args);} };
    } },
  };
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
