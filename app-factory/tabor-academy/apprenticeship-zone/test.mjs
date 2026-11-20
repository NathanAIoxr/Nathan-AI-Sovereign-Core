import assert from "node:assert/strict";
import { after, test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { seedPlan } from "./seed.mjs";
import { installEntry } from "./release.mjs";
import { serveZone } from "./runtime.mjs";

const sqlite = new DatabaseSync(":memory:");
sqlite.exec("PRAGMA foreign_keys=ON");
const plan=seedPlan();
sqlite.exec(plan.schema);
for (let run=0;run<2;run++) for (const stage of plan.stages) {
  for (const item of stage) sqlite.prepare(item.sql).run(...item.params);
}
after(()=>sqlite.close());
const db = {
  prepare(sql) {
    const stmt=sqlite.prepare(sql);
    const callable = args=>({all:async()=>({results:stmt.all(...args)}),first:async()=>stmt.get(...args)??null});
    return {...callable([]),bind:(...args)=>callable(args)};
  },
  batch(stmts){return Promise.all(stmts.map(stmt=>stmt.all()));},
};
const base="https://academy.test/institution/apprenticeship-zone/";
const get=(path="",init)=>serveZone(new Request(base+path,init),db);
const read=async path=>(await get(path)).json();
const markup=async path=>(await get(path)).text();

test("complete source snapshots survive repeatable, referentially sound imports",async()=>{
  assert.deepEqual(sqlite.prepare("PRAGMA foreign_key_check").all(),[]);
  const report=await read("api/coverage");
  assert.deepEqual(report.totals,{records:4173,variants:3708,sources:41});
  assert.deepEqual(Object.fromEntries(report.imports.map(x=>[x.id,x.record_count])),
    {academy:227,canada:54,dol:1478,england:2090,germany:324});
  assert.equal(report.kinds.find(row=>row.kind==="proposal").records,119);
  assert.match(await markup(""),/4,173 catalog records/);
  assert.match(await markup("coverage/"),/Where coverage is incomplete/);
});

test("searches foreign titles, published status, historical evidence and future proposals",async()=>{
  const us=await read("api/records?q=2078&region=United+States");
  assert.equal(us.total,1);
  const detail=await read("api/record/"+us.rows[0].id);
  assert.equal(detail.variants.length,3);
  assert.equal(detail.title,"3D Printing Technician");
  const eng=await read("api/records?q=FA0010&region=England");
  assert.match(eng.rows[0].title,/Rail foundation/);
  const retired=await read("api/records?scope=retired");
  assert.ok(retired.total>1000);
  assert.ok(retired.rows.every(row=>["Retired","Documented withdrawal"].includes(row.status)));
  assert.equal((await read("api/records?q=zupfinstrumentenmacher&region=Germany")).total,1);
  assert.equal((await read("api/records?q=Karanis&kind=historical")).total,1);
  assert.equal((await read("api/records?q=right-to-repair&kind=proposal")).total,1);
  assert.equal((await read("api/records?q=%27+OR+1%3D1")).total,0);
  assert.match(await markup("search/?kind=proposal"),/119 matching records/);
});

test("keeps public reads bounded and composes with the existing Academy",async()=>{
  assert.equal((await get("",{method:"HEAD"})).body,null);
  assert.equal((await get("",{method:"POST"})).status,405);
  assert.equal((await get("api/record/nonexistent")).status,404);
  assert.equal(await serveZone(new Request("https://academy.test/institution/apprenticeships/"),db),null);
  const app='import academy from "./worker.mjs";\nexport default withApprenticeships(academy);\n';
  const wrapped=installEntry(app);
  assert.equal(installEntry(wrapped),wrapped);
  assert.match(wrapped,/withApprenticeshipZone\(withApprenticeships\(academy\)\)/);
  assert.equal((await serveZone(new Request(base),null)).status,503);
  assert.equal((await read("api/records?page=9999999")).rows.length,4173%28);
});
