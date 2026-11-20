import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { serveApprenticeships } from "./runtime.mjs";
import { buildModules, installEntry } from "./release.mjs";

const root = "https://academy.invalid/institution/apprenticeships/";
const get = (path="", init) => serveApprenticeships(new Request(root+path,init));
const getHTML = async path => (await get(path)).text();

test("opens the public catalog and preserves paths, counts, and documentary status", async () => {
  const home = await getHTML("");
  assert.match(home,/1,478 U.S. occupation entries/);
  assert.match(home,/170 pathways and examples/);
  assert.match(home,/Before the Cave/);
  const catalog = await (await get("pathways.json")).json();
  assert.equal(catalog.groups.length, 13);
  assert.equal(catalog.groups.flatMap(g => g.programs).length, 170);
  assert.ok(catalog.groups.every(g => g.sources.every(id => catalog.sources[id])));
  const statuses = new Set(catalog.groups.map(g => g.status));
  assert.deepEqual(statuses, new Set(["current","retired","reconstruction","documented","living","proposed"]));
  const handoff = await (await get("conductor.json")).json();
  assert.equal(handoff.academyPathways,170);
  assert.equal((await get("",{method:"HEAD"})).body,null);
  assert.equal((await get("",{method:"POST"})).status,405);
  assert.equal((await get("pathway/wrong/")).status,404);
  assert.equal(await serveApprenticeships(new Request("https://academy.invalid/institution/mastery/")),null);
});

test("keeps every workbook row, all approaches, and the source row with no RAPIDS code", async () => {
  const {snapshot,entries} = await (await get("registered.json")).json();
  assert.equal(snapshot.rows,3708);
  assert.equal(snapshot.rowsWithoutCode,1);
  assert.equal(entries.length,snapshot.entries);
  assert.equal(new Set(entries.map(([code])=>code).filter(Boolean)).size,1180);
  assert.equal(entries.flatMap(([, , variants])=>variants).length,3708);
  const technician=entries.find(([code,title])=>code==="2078"&&title==="3D Printing Technician");
  assert.deepEqual(new Set(technician[2].map(row=>row[2])),new Set(["Time-Based","Hybrid","Competency-Based"]));
  assert.equal(entries.find(([code])=>!code)[1],"Biomedical Equipment Technician");
  assert.match(await getHTML("registered/?q=2078&filter=Hybrid"),/3D Printing Technician/);
  assert.match(await getHTML("registered/?q=47-2111.00"),/Electrician/);
  assert.match(await getHTML("registered/?q=definitely-no-match"),/0 matches/);
  const page=await getHTML("registered/?page=2");
  assert.match(page,/Page 2 of 50/);
  assert.match(page,/Previous/);
  const detail=await getHTML("registered/"+(entries.indexOf(technician)+1)+"/");
  assert.match(detail,/RAPIDS code 2078/);
  assert.match(detail,/2019-18/);
});

test("opens each proposed, current, archival and historical project and exports its practice log", async () => {
  const {groups} = await (await get("pathways.json")).json();
  for (const group of groups) {
    const page = await get("pathway/"+group.id+"/");
    assert.equal(page.status,200);
    for (const item of group.programs) {
      const path = "pathway/"+group.id+"/"+item.id+"/";
      const detail = await get(path);
      assert.equal(detail.status,200);
      assert.match(await detail.text(),/Try a first project/);
      const worksheet = await get(path+"worksheet.txt");
      assert.equal(worksheet.status,200);
      assert.match(worksheet.headers.get("content-disposition"),/attachment/);
      assert.ok((await worksheet.text()).includes(item.project));
    }
  }
  assert.match(await getHTML("pathway/?q=watch&filter=retired"),/North Bennet Street School/);
  assert.doesNotMatch(await getHTML("pathway/?q=watch&filter=retired"),/North Seattle College/);
  assert.match(await getHTML("pathway/?q=watch&filter=current"),/North Seattle College/);
  assert.match(await getHTML("pathway/?q=%3Cscript%3E"),/&lt;script&gt;/);
  assert.match(await getHTML("college/"),/progressive pay/);
});

test("wraps the existing Academy entry exactly once and delegates the older routes", async () => {
  const dir = await mkdtemp(join(tmpdir(),"academy-apprenticeships-"));
  try {
    const { modules } = await buildModules();
    for (const [name,code] of Object.entries(modules)) await writeFile(join(dir,name),code);
    await writeFile(join(dir,"worker.mjs"),'export default { fetch(request) { return new Response(new URL(request.url).pathname); } };');
    const old='import academy from "./worker.mjs";\nexport default academy;\n';
    const wired=installEntry(old);
    assert.equal(installEntry(wired),wired);
    await writeFile(join(dir,"entry.mjs"),wired);
    const { default: entry } = await import(pathToFileURL(join(dir,"entry.mjs")));
    assert.equal(await (await entry.fetch(new Request("https://academy.invalid/institution/mastery/"))).text(),"/institution/mastery/");
    assert.match(await (await entry.fetch(new Request(root))).text(),/Tabor Academy Apprenticeships/);
  } finally {
    await rm(dir,{recursive:true,force:true});
  }
});
