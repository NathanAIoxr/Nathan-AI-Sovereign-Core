import assert from "node:assert/strict";
import test from "node:test";
import gateway from "./world-gateway/worker.mjs";
import {ATLAS} from "../grapple-it/public/atlas.mjs";
import {ROOMS, browse} from "./public/library/library-core.mjs";
import {build} from "./build.mjs";

await build();
const {default: worker} = await import("./.release/worker.mjs");
const request = (pathname, options) => worker.fetch(new Request("https://library.example" + pathname, options));
const catalog = await (await request("/library/catalog.json")).json();

test("the library keeps all 101 individual records and their original Atlas play routes", () => {
  assert.equal(catalog.entries.length, 101);
  assert.equal(Object.keys(catalog.shelves).length, 21);
  assert.equal(Object.keys(ROOMS).length, 5);
  const fields = ["id", "title", "lcc", "kind", "chassis", "attributes", "characteristics", "traits", "application", "target"];
  for (const [i, entry] of catalog.entries.entries()) {
    for (const field of fields) assert.equal(entry[field], ATLAS[i][field], field + " on entry " + entry.id);
    assert.equal(entry.play, "https://grapple-it.nathantaboract.workers.dev/#atlas/" + ATLAS[i].id);
  }
  assert.equal(new Set(catalog.entries.map(entry => entry.play)).size, 101);
});

test("the UI and the public search API use matching rules", async () => {
  const filtered = browse(catalog, {q: "Alice", shelf: "P", kind: "character", room: "craft"});
  assert.deepEqual(filtered.map(entry => entry.id), ["066"]);
  const search = await request("/library/api/catalog?q=Alice&shelf=P&kind=character&room=craft");
  assert.equal(search.status, 200);
  assert.deepEqual((await search.json()).entries, filtered);
  const page = await (await request("/library/api/catalog?offset=1&limit=2")).json();
  assert.deepEqual(page.entries.map(entry => entry.id), ["002", "003"]);
  assert.equal(page.total, 101);
});

test("page, artwork, individual record, health and canonical redirect are live Worker routes", async () => {
  const page = await request("/library/");
  assert.match(await page.text(), /Library of Tabor within Tabor World/);
  assert.match(page.headers.get("Content-Security-Policy"), /script-src 'self'/);
  const image = await request("/library/rotunda.webp");
  assert.equal(image.headers.get("Content-Type"), "image/webp");
  assert.equal(Buffer.from(await image.arrayBuffer()).toString("utf8", 8, 12), "WEBP");
  assert.equal((await (await request("/library/api/entries/101")).json()).title, "Library book return sorter");
  assert.equal((await request("/library/api/entries/102")).status, 404);
  assert.equal((await request("/library/catalog.json", {method: "POST"})).status, 405);
  assert.equal(await (await request("/library/catalog.json", {method: "HEAD"})).text(), "");
  assert.equal((await request("/library?entry=066")).headers.get("Location"), "/library/?entry=066");
  assert.deepEqual(await (await request("/library/api/health")).json(),
    {ok: true, release: "library-of-tabor-2", entries: 101, shelves: 21});
  assert.equal((await request("/app-factory/tabor-universal-library-engine/public/library/")).status, 200);
});

test("the Tabor World gateway preserves every public destination and both Library routes", async () => {
  const get = pathname => gateway.fetch(new Request("https://world.example" + pathname));
  assert.match(await (await get("/")).text(), /Enter the Library of Tabor/);
  const list = await (await get("/api/destinations")).json();
  assert.deepEqual(list.map(item => item.id), [
    "tabor-standalone", "library-of-tabor", "grapple", "hook", "bible", "tracker",
    "library", "dual", "hive", "bees", "saturday",
  ]);
  assert.ok(list.some(item => item.id === "library" && item.name === "Tabor Universal Library"));
  assert.equal(list.find(item => item.id === "library-of-tabor").url, "https://tabor-world.nathantaboract.workers.dev/library/");
  const redirect = await get("/library/?entry=066");
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get("Location"),
    "https://tabor-universal-library-engine.nathantaboract.workers.dev/library/?entry=066");
});


test("Accords alias, private service routing and browser-local root checks",async()=>{
  const [{default:broker},{databases},{evaluateRoot,adapters}]=await Promise.all([
    import("./data-broker/worker.mjs"),import("./data-broker/connections.mjs"),import("./public/library/root-core.mjs")]);
  assert.equal(Object.keys(adapters).length,6);
  const state={adapter:"archives",candidate:"Source ID changed",symptom:"Citation disappeared",
    evidence:{precedes:"yes",reproduces:"yes",corrected:"yes",alternatives:"yes"}};
  assert.match(evaluateRoot(state).conclusion,/supported/);
  assert.match(evaluateRoot({...state,evidence:{}}).conclusion,/still open/);
  assert.match(evaluateRoot({...state,evidence:{precedes:"no"}}).conclusion,/contradicted/);
  assert.match(evaluateRoot({...state,evidence:{corrected:"yes",alternatives:"no"}}).conclusion,/contributor/);
  assert.throws(()=>evaluateRoot({...state,evidence:{precedes:"maybe"}}));
  const mock={prepare(sql){return {
    first:async()=>{assert.equal(sql,"SELECT 1 AS ready");return {ready:1};},
    all:async()=>({results:[{id:"world",title:"Example",category:"fictional",privateValue:"ignored"}]})
  };}};
  const env=Object.fromEntries(databases.map(db=>[db.binding,mock]));
  const service={fetch:(input,init)=>broker.fetch(new Request(input,init),env)};
  const live=(path,options)=>worker.fetch(new Request("https://library.example"+path,options),{LIBRARY_DATA:service});
  const status=await (await live("/library/api/connections")).json();
  assert.deepEqual(status.totals,{discovered:25,bound:25,ready:25});
  assert.equal(status.published.length+status.restricted,25);
  assert.ok(!JSON.stringify(status).includes("D1_NATHAN")&&!JSON.stringify(status).includes("crypto-wallets"));
  const sample=await (await live("/library/api/collections/worlds")).json();
  assert.deepEqual(sample.rows,[{id:"world",title:"Example",category:"fictional"}]);
  assert.equal((await live("/library/api/collections/credentials")).status,404);
  assert.equal((await live("/library/api/collections/worlds?anything=1")).status,404);
  assert.equal((await live("/library/api/connections",{method:"POST"})).status,405);
  assert.equal(await (await live("/library/api/connections",{method:"HEAD"})).text(),"");
  assert.equal((await request("/library/api/connections")).status,503);
  assert.equal((await broker.fetch(new Request("https://public.example/connections"),env)).status,404);
  assert.equal((await gateway.fetch(new Request("https://world.example/accords/library/"))).headers.get("Location"),
    "https://tabor-universal-library-engine.nathantaboract.workers.dev/library/#accords");
});
