import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
const root=path.dirname(fileURLToPath(import.meta.url));
const hub=path.resolve(root,"..");
test("M-99 is listed in launcher and target page exists",async()=>{
 const launcher=await import(path.join(hub,"launcher/engine.js"));
 const d=launcher.default.destinations.find(x=>x.id==="m99-living-mammal");
 assert.ok(d);assert.equal(d.path,"matrix-grinder-m99/index.html");
 assert.ok(existsSync(path.resolve(hub,d.path)));
 assert.equal(launcher.default.search("M-99")[0].id,"m99-living-mammal");
});
test("M-99 page loads shared launcher exactly once",()=>{
 const html=readFileSync(path.join(root,"index.html"),"utf8");
 assert.equal((html.match(/data-nathan-command-center/g)||[]).length,1);
 assert.match(html,/\.\.\/launcher\/engine\.js/);
 assert.match(html,/\.\.\/launcher\/app\.js/);
 assert.match(html,/witnesses\.js/);
});
test("M-99 files are included in safe offline asset list",()=>{
 const assets=JSON.parse(readFileSync(path.join(hub,"offline-assets.json"),"utf8"));
 for(const f of ["matrix-grinder-m99/index.html","matrix-grinder-m99/engine.js","matrix-grinder-m99/witnesses.js","matrix-grinder-m99/assets/m99-bridge-worlds.svg"])
  assert.ok(assets.includes(f),f);
});
