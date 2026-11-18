import assert from "node:assert/strict";
import {test} from "node:test";
import {readFile} from "node:fs/promises";
import workerSource from "./src/index.mjs";

const bundle = process.env.TABOR_TEST_BUNDLE;
const worker = bundle
  ? (await import("data:text/javascript;base64,"+await readFile(bundle).then(b=>b.toString("base64")))).default
  : workerSource;
const fetchRoute = (path,env={}) => worker.fetch(new Request("https://test.example"+path),env);
const loadModule = async path => import("data:text/javascript,"+encodeURIComponent(await (await fetchRoute(path)).text()));

test("all four roles complete all three sectors, including the exact six-turn sequence and undo",async()=>{
  const {scenarios,forms,discernAfterMs,start,play,lockPath,replay} = await loadModule("/slayers-sleyers/engine.js");
  assert.equal(scenarios.length,3);
  assert.equal(discernAfterMs,2000);
  assert.deepEqual(lockPath,["right","right","left","left","left","left"]);
  for (const scene of scenarios) {
    let state = start(scene.id);
    const commands = [];
    const move = command => {
      const result = play(state,command);
      assert.ok(result.ok,result.reason);
      commands.push(command);
      state = result.state;
    };
    assert.equal(play(state,{action:"weave"}).ok,false);
    assert.equal(play(state,{action:"strike"}).ok,false);
    move({action:"manifest",form:1,auto:true});
    assert.match(state.journal.at(-1).note,/Autonomous Discernment/);
    while(state.barrier) move({action:"strike"});
    move({action:"arm",plane:"Physical",scope:"Everything & Nothing"});
    const reject = play(state,{action:"convert"});
    assert.ok(!reject.ok);
    assert.equal(reject.state,state);
    move({action:"arm",plane:scene.plane,scope:scene.field});
    move({action:"convert"});
    assert.ok(state.thread.startsWith("Purified_"));
    assert.equal(play(state,{action:"convert"}).ok,false);
    while(state.decay) move({action:"clear",directive:scene.directive});
    move({action:"weave"});
    assert.match(state.foundation,/Innocence Pillar/);
    assert.equal(state.thread,null);
    move({action:"rotate",direction:"left"});
    assert.equal(state.lock,0);
    for (const direction of lockPath) move({action:"rotate",direction});
    assert.ok(state.complete);
    assert.deepEqual(replay(scene.id,commands),state);
    assert.equal(replay(scene.id,commands.slice(0,-1)).complete,false);
  }
  assert.equal(forms.length,3);
  const custom = play(start("alpha"),{action:"manifest",form:0,label:"Claymore of Clarity"});
  assert.equal(custom.state.bladeName,"Claymore of Clarity");
  assert.match(custom.state.journal[0].note,/Thought-Link Active/);
});

test("Factory resolves the 14 named projects and exposes all 101 original Library launch URLs",async()=>{
  const manifest = await (await fetchRoute("/api/factory")).json();
  assert.equal(manifest.target,101);
  assert.equal(manifest.workspaces,14);
  assert.equal(manifest.awaitingSource,87);
  assert.equal(new Set(manifest.entries.map(i=>i.path)).size,14);
  for (const item of manifest.entries) {
    const official = await fetchRoute(item.path);
    const response = await fetchRoute(item.blueprintRoute);
    assert.ok(official.ok && response.ok,item.title);
    const html = await official.text();
    assert.match(html,/id='workspace'/);
    assert.match(html,/name=/);
    assert.match(html,new RegExp("data-workspace='"+item.slug+"'"));
  }
  assert.equal((await fetchRoute("/factory/not-present/")).status,404);

  const entries = Array.from({length:101},(_,i)=>{
    const id = String(i+1).padStart(3,"0");
    return {id,title:"Title "+id,lcc:"A",play:"https://grapple-it.nathantaboract.workers.dev/#atlas/"+id};
  });
  const env = {LIBRARY:{fetch:async path=>{
    assert.equal(path,"https://library.internal/library/catalog.json");
    return Response.json({release:"test",entries});
  }}};
  const response = await fetchRoute("/api/factory/library",env);
  assert.ok(response.ok);
  const data = await response.json();
  assert.equal(data.total,101);
  assert.deepEqual(data.entries.map(entry=>entry.play),entries.map(entry=>entry.play));
  entries[0].play = "https://example.invalid/";
  assert.equal((await fetchRoute("/api/factory/library",env)).status,503);
});

test("install manifest, icons, and every offline shell asset resolve",async()=>{
  const response = await fetchRoute("/manifest.webmanifest");
  assert.equal(response.headers.get("content-type"),"application/manifest+json");
  const manifest = await response.json();
  assert.equal(manifest.display,"standalone");
  for (const icon of manifest.icons) {
    const image = await fetchRoute(icon.src);
    assert.equal(image.headers.get("content-type"),"image/png");
    const bytes = new DataView(await image.arrayBuffer());
    assert.equal(bytes.getUint32(0),0x89504e47);
    assert.equal(bytes.getUint32(16),parseInt(icon.sizes,10));
  }
  const save = await (await fetchRoute("/sw.js")).text();
  const match = /^const shell = new Set\((.+)\);$/m.exec(save);
  for (const path of JSON.parse(match[1])) assert.ok((await fetchRoute(path)).ok,path);
  const home = await (await fetchRoute("/")).text();
  assert.match(home,/rel="manifest" href="\/manifest\.webmanifest"/);
  const {words} = await loadModule("/words.js");
  assert.equal((await words("Nathan AI Sovereign Core")).firstLetters,"NASC");
});
