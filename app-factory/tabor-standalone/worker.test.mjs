import test from "node:test";
import assert from "node:assert/strict";
import {build} from "./build.mjs";
const {data}=await build();
const {default:worker}=await import("./.release/worker.mjs");
const read=(url,method="GET")=>worker.fetch(new Request("https://standalone.example"+url,{method}));

test("all 101 standalone games have their own runnable route and install identity",async()=>{
  const games=data.items.filter(x=>x.type==="games");
  assert.equal(games.length,101);
  const scopes=new Set();
  for(const entry of games){
    const path="/games/"+entry.id+"/";
    const page=await read(path);
    assert.equal(page.status,200);
    assert.match(await page.text(),/src="\/assets\/game\.mjs"/);
    const manifest=await (await read(path+"manifest.webmanifest")).json();
    assert.equal(manifest.id,path);
    assert.equal(manifest.start_url,path);
    assert.equal(manifest.scope,path);
    assert.equal(manifest.display,"standalone");
    scopes.add(manifest.scope);
    assert.match(await (await read(path+"sw.js")).text(),/caches\.open/);
  }
  assert.equal(scopes.size,101);
  assert.equal((await read("/games/atlas-102/")).status,404);
});

test("book pages preserve each edition, link relatives and offer individual downloads",async()=>{
  for(const edition of ["original","teen","children"]){
    const rows=data.items.filter(x=>x.type==="books"&&x.id.startsWith("pee-dee-"+edition+"-"));
    assert.equal(rows.length,13);
    for(const row of rows){
      const path="/books/"+row.id+"/";
      const response=await read(path),page=await response.text();
      assert.equal(response.status,200);
      assert.ok(page.includes(row.html));
      assert.match(page,/Other editions of Book/);
      assert.ok(page.includes("/collections/pee-dee-valley/"));
      const download=await read(path+"download");
      assert.match(download.headers.get("Content-Disposition"),/attachment/);
      assert.ok((await download.text()).includes(row.html));
    }
  }
  const draft=data.items.find(x=>x.category==="Draft awaiting language review");
  const path="/books/"+draft.id+"/";
  assert.match(await (await read(path)).text(),/Draft awaiting language review/);
  assert.equal(await (await read(path+"download")).text(),draft.words);
});

test("the same item has one identity across the main directory and related collections",async()=>{
  const collection=await (await read("/collections/grapple-atlas/")).text();
  const directory=await (await read("/games/")).text();
  assert.ok(collection.includes("/games/atlas-001/")&&directory.includes("/games/atlas-001/"));
  assert.match(await (await read("/collections/pee-dee-valley/")).text(),/40 entries/);
  const portfolio=data.items.filter(x=>x.type==="sites");
  assert.equal(portfolio.length,398);
  assert.equal(portfolio.filter(x=>x.mode==="hosted").length,12);
  for(const x of portfolio)assert.equal((await read("/sites/"+x.id+"/")).status,200,x.id);
  assert.match(await (await read("/sites/nathan-tabor-library/")).text(),/Sign-in required/);
  const archive=data.items.filter(x=>x.type==="books");
  assert.equal(archive.length,94);
  for(const x of archive)assert.equal((await read("/books/"+x.id+"/")).status,200,x.id);
});

test("release metadata is consistent and searching preserves accessible server-rendered links",async()=>{
  const receipt=await (await read("/api/health")).json();
  assert.deepEqual(receipt.counts,data.counts);
  const catalog=await (await read("/api/catalog")).json();
  assert.equal(catalog.items.length,593);
  assert.ok(catalog.items.every(x=>!Object.hasOwn(x,"html")&&!Object.hasOwn(x,"words")));
  const search=await (await read("/books/?q=The+Ford+Stone")).text();
  assert.match(search,/2 entries/);
  assert.equal((await read("/api/catalog","POST")).status,405);
  assert.equal(await (await read("/games/atlas-001/","HEAD")).text(),"");
});
