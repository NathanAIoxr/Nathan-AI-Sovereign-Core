import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { test } from "node:test";
import worker,{runPackages} from "./unit-worker.mjs";

const dbSchema=await readFile(new URL("./schema.sql",import.meta.url),"utf8");
function testDb(){
  const local=new DatabaseSync(":memory:");
  local.exec("CREATE TABLE build_queue(id TEXT PRIMARY KEY,status TEXT);"+dbSchema);
  local.prepare("INSERT INTO build_queue VALUES(?,?)").run("job-1","generated");
  local.prepare("INSERT INTO sovereign_app_unit_shard_v1 VALUES(?,?,?,?)").run("shard-001","job-1",2,"f".repeat(64));
  const put=local.prepare("INSERT INTO sovereign_app_unit_v1(id,title,kind,evidence_stage,source_json,source_sha256,workstream,next_action,shard_id,repository_path) VALUES(?,?,?,?,?,?,?,?,?,?)");
  const src=JSON.stringify({id:"app-0001",name:"A & B",sources:[{source:"Known test source",url:"https://example.com",stage:"Concept"}]});
  const good=createHash("sha256").update(src).digest("hex");
  put.run("app-0001","A & B","Game","Concept / specification",src,good,"specify_prototype","Restore author rules","shard-001","standalone-apps/sovereign-units/units/app-0001/app.json");
  put.run("app-0002","Corrupted","Game","Concept / specification",src,"0".repeat(64),"specify_prototype","Restore author rules","shard-001","standalone-apps/sovereign-units/units/app-0002/app.json");
  local.exec("INSERT INTO sovereign_app_unit_feature_v1(unit_id) SELECT id FROM sovereign_app_unit_v1");
  const open=(sql,args=[])=>{
    const s=local.prepare(sql);
    return {
      bind:(...params)=>open(sql,params),
      all:async()=>({results:s.all(...args)}),
      first:async()=>s.get(...args),
      run:async()=>({meta:{changes:Number(s.run(...args).changes)}})
    };
  };
  return {prepare:open,batch:async(list)=>Promise.all(list.map(s=>s.all()))};
}

test("independent handoffs are idempotent and require original digest",async()=>{
 const db=testDb();
 assert.deepEqual(await runPackages(db),{packaged:1,errors:1});
 assert.deepEqual(await runPackages(db),{packaged:0,errors:0});
 const env={DB:db,OWNER_EMAIL:"owner@example.com",OWNER_AUDIENCE:"owner-aud",ARCHIVE_KEY:"fixture"};
 const request=(path,ctx={})=>worker.fetch(new Request("https://example.test"+path),env,ctx);
 assert.equal((await request("/unit/app-0001/package.json")).status,403);
 assert.equal((await request("/archive-key")).status,403);
 const owner={access:{aud:"owner-aud",getIdentity:async()=>({email:"owner@example.com"})}};
 const status=await (await request("/api/status",owner)).json();
 assert.equal(status.total,2);
 assert.equal(status.packaged,1);
 assert.equal(status.errors,1);
 const x=await request("/unit/app-0001/package.json",owner);
 const raw=await x.text();
 assert.equal(x.headers.get("X-Package-SHA256"),createHash("sha256").update(raw).digest("hex"));
 assert.equal(JSON.parse(raw).assignment.worker,"tabor-build-loop");
 assert.match(await (await request("/?q=A+%26+B",owner)).text(),/A &amp; B/);
 assert.equal((await request("/unit/app-0002/package.json",owner)).status,202);
 assert.equal((await request("/unit/app-9999",owner)).status,404);
});
