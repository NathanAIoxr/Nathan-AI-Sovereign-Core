import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "./build.mjs";

const {assets}=await build();
const engine=await import("./public/engine.mjs");
const labs=await import("./public/labs.mjs");
const catalog=JSON.parse(await readFile(new URL("./public/catalog.json",import.meta.url),"utf8"));
const root=new URL("https://tabor-universal-library-engine.workers.dev/");
const worker=(await import("./.release/worker.mjs")).default;
const request=(path,options)=>worker.fetch(new Request(new URL(path,root),options));
const assetDir="/app-factory/tabor-universal-library-engine/public/";

test("the Worker serves the original shared modules, browser shell and full source catalog",async ()=>{
  const redirect=await request("/?module=81");
  assert.equal(redirect.status,302);
  assert.match(redirect.headers.get("location"),/module=81/);
  for(const path of Object.keys(assets)){
    const response=await request(path);
    assert.equal(response.status,200,path);
    assert.equal(await response.text(),assets[path],path);
  }
  assert.equal(await (await request(redirect.headers.get("location"),{method:"HEAD"})).text(),"");
  assert.equal((await request("/missing")).status,404);
  assert.equal((await request("/",{method:"POST"})).status,405);
});
test("both Tracker Ball fragments retain their original titles and numbering",()=>{
  const rows=engine.sourceIndex(catalog.ledger,catalog.trackerSupplement);
  assert.deepEqual(rows.map(r=>r.id),Array.from({length:101},(_,i)=>i+1));
  assert.deepEqual(rows.slice(0,64).map(r=>r.title),catalog.trackerSupplement.map(r=>r.title));
  assert.deepEqual(rows.slice(64),catalog.ledger);
  assert.ok(engine.validCircuit(catalog.circuit));
  const invalid=structuredClone(catalog.circuit);
  invalid.physics_profile.magnetic_strength=Infinity;
  assert.equal(engine.validCircuit(invalid),false);
});
test("all 18 runnable entries are deterministic at a fixed input and advance without invalid numbers",()=>{
  assert.equal(Object.keys(labs.active).length,18);
  for(const id of Object.keys(labs.active)){
    const lab=labs.labState(id),bus=new engine.UniversalBridgeBus();
    let verified=false;
    labs.moveLab(id,lab,[-.8,.2],true);
    labs.gripLab(id,lab,{scale:1.1});
    const status=labs.actLab(id,lab,"Q",bus,catalog.circuit,()=>{verified=true;return "verified";});
    for(let i=0;i<120;i++)labs.labStep(id,lab,1/60,[0,0],catalog.circuit);
    assert.ok(Number.isFinite(lab.time),id);
    assert.equal(typeof status,"string",id);
    if(id==="grapple")assert.ok(lab.clock.ticks>400);
    if(id==="66")assert.ok(lab.trail.every(p=>p.every(Number.isFinite)));
    if(id==="101")assert.equal(verified,true);
  }
});
test("the same Bridge turns puzzle progress into attempts and locks into attack bonuses",()=>{
  const bus=new engine.UniversalBridgeBus();
  const seen=[];
  bus.addEventListener("bridge",event=>seen.push(event.detail.kind));
  assert.equal(bus.round.ammo,3);
  bus.emit("bottom-clear");bus.emit("magnetic-lock");
  assert.equal(bus.round.ammo,4);
  assert.equal(bus.round.bonus,20);
  assert.equal(bus.round.charge,4);
  bus.emit("skill-shot",{score:25});
  assert.equal(bus.round.ammo,3);
  assert.equal(bus.round.enemy,153);
  assert.deepEqual(seen,["bottom-clear","magnetic-lock","skill-shot"]);
});
test("circuit snaps near the terminal and awards only once until the probe moves away",()=>{
  const bus=new engine.UniversalBridgeBus(),lab=labs.labState("81");
  const snap=()=>labs.actLab("81",lab,null,bus,catalog.circuit,()=>{});
  assert.match(snap(),/near/);
  labs.moveLab("81",lab,[.55,0],false);
  assert.match(snap(),/reward applied/);
  assert.match(snap(),/Circuit stable/);
  assert.equal(bus.events,1);
});
test("axes, ideal inverse-square behavior and arm reach",()=>{
  const q=engine.rotate(engine.identity(),0,0,Math.PI/2);
  const vertex=engine.project(q,[1,0,0]);
  assert.ok(Math.abs(vertex[1]-1)<1e-9);
  assert.deepEqual(engine.force([2,0],[{p:[0,0],strength:1}],0),[-.25,0]);
  assert.ok(engine.arm([.6,.4]).reachable);
  assert.equal(engine.arm([5,0]).reachable,false);
});
test("call-number sorting and bit-rot checksum have observable results",()=>{
  const bus=new engine.UniversalBridgeBus(),sort=labs.labState("94"),memory=labs.labState("98");
  assert.match(labs.actLab("94",sort,"P",bus,catalog.circuit),/first letter/);
  assert.match(labs.actLab("94",sort,"Q",bus,catalog.circuit),/Shelved/);
  assert.match(labs.actLab("98",memory,null,bus,catalog.circuit),/differs/);
  assert.equal(sort.correct,1);
});

test("Tabor World loads complete scoped editions and preserves a real relationship",async ()=>{
  const {createWorld,matches,compare}=await import("./public/world/world-core.mjs");
  const data=f=>JSON.parse(assets[assetDir+"world/"+f+".json"]);
  const {records,summary}=createWorld({ledger:catalog,library:data("source-catalog"),castAndProps:data("cast-and-props"),
    atlas:data("cosmic-body"),places:data("worlds-atlas"),entries:data("world")});
  assert.deepEqual(summary,{elements:118,nonElements:714,tracker:101,world:101,cosmic:374,cosmicRelationships:331,places:53});
  const atomic=records.filter(r=>r.kind==="Chemical element");
  assert.deepEqual(atomic.map(r=>r.number),Array.from({length:118},(_,i)=>i+1));
  assert.deepEqual(atomic.filter(r=>matches(r,"118")).map(r=>r.id),["atomic-118"]);
  const index=new Map(records.map(r=>[r.id,r]));
  assert.equal(index.get("tracker-65").title,"Molecular Geometry & Bond Rotator");
  assert.equal(index.get("world-library-65").title,"Grammar Sentence Diagrammer");
  assert.equal(compare(index.get("materials-water"),index.get("classic-water")).length,2);
  assert.ok(records.some(r=>r.source==="Cosmic Body Atlas · DOS"));
  const location=(await request("/world/?record=classic-water")).headers.get("location");
  assert.match(location,/\/world\/\?record=classic-water$/);
  const response=await request(location);
  assert.match(await response.text(),/Tabor World by Nathan Tabor/);
});
