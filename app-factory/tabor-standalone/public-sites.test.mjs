import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

execFileSync("python3", [fileURLToPath(new URL("./build_public_sites.py", import.meta.url))]);
const {default: worker} = await import("./.release/public-sites/worker.mjs");

const origin="https://tabor-public-sites.example";
const getFile=(file)=>readFile(new URL(file,import.meta.url));
const env={PUBLIC_ASSETS:{async get(key,{type}){
  assert.equal(type,"json");
  return JSON.parse(await getFile("./.release/public-sites/"+key.split("/")[1]+".json"));
}}};
const read=(path,method="GET")=>worker.fetch(new Request(origin+path,{method}),env);
const hash=b=>createHash("sha256").update(b).digest("hex");
const {items}=JSON.parse(await getFile("../portfolio/catalog.json"));

test("all 379 registered sites serve the byte-for-byte original pages",async()=>{
  const sites=items.filter(x=>x.state==="registered");
  assert.equal(sites.length,379);
  for(const site of sites){
    const launch=await read("/launch/"+site.id+"/");
    assert.equal(launch.status,302,site.path);
    const destination=launch.headers.get("Location");
    assert.ok(destination.startsWith("/"));
    const result=await read(destination);
    assert.equal(result.status,200,site.path);
    assert.match(result.headers.get("Content-Type"),/^text\/html/);
    const original=await getFile("../../"+site.path);
    assert.equal(hash(Buffer.from(await result.arrayBuffer())),hash(original),site.path);
  }
});

test("separately published sites resolve supporting scripts and cannot access unbundled source",async()=>{
  const path="/app-factory/historical-sports/engine.js";
  const asset=await read(path);
  assert.match(asset.headers.get("Content-Type"),/^text\/javascript/);
  assert.equal(hash(Buffer.from(await asset.arrayBuffer())),hash(await getFile("../historical-sports/engine.js")));
  assert.equal((await read(path,"POST")).status,405);
  assert.equal((await read("/.git/config")).status,404);
  assert.equal((await read("/app-factory/nathan-ai/god/art/GOD_v075_app_dashboard_original.png")).status,302);
});

test("all seven templates resolve to the Hook and Ring runtime and all boards have launch pages",async()=>{
  const templates=items.filter(x=>x.state==="template");
  assert.equal(templates.length,7);
  for(const item of templates){
    const r=await read("/launch/"+item.id+"/");
    assert.equal(new URL(r.headers.get("Location")).hostname,"hook-and-ring.nathantaboract.workers.dev");
  }
  const plugins=JSON.parse(await getFile("../../standalone-apps/hook-and-ring/game/game-plugins.json"));
  assert.equal(plugins.length,60);
  for(const game of plugins){
    const launch=await read("/boards/"+game.id+"/");
    assert.equal(launch.status,200,game.id);
    assert.ok((await launch.text()).includes("chassis?game="+game.id),game.id);
  }
  assert.equal((await read("/boards/no-such-game/")).status,404);
});
