import assert from "node:assert/strict";
import {test} from "node:test";
import worker from "./src/index.mjs";
import {rhythm,score} from "./src/core.mjs";
import {words} from "./src/words.mjs";
import {generation} from "./src/power.mjs";

const request=path=>new Request("https://example.test"+path);
test("13 and 17 meet every 221 ticks and the recovered score contains 54 pulses and 17 moves",()=>{
  assert.equal(rhythm(221).align,true);
  assert.equal(rhythm(-221).align,true);
  assert.deepEqual([rhythm(-1).cycle13,rhythm(-1).cycle17],[12,16]);
  assert.equal(rhythm(34).cycle17,0);
  assert.equal(rhythm(34).align,false);
  assert.equal(score().total_pulses,54);
  assert.equal(score().moves.length,17);
  assert.equal(score().pairs.length,5);
});

test("WORDS retains every character, mirrors graphemes and extracts actual first letters",async()=>{
  const sample="  Nathan AI Sovereign Core 👩‍🚀";
  const result=await words(sample);
  assert.equal(result.exact,sample);
  assert.equal(result.firstLetters,"NASC");
  assert.ok(result.mirror.startsWith("👩‍🚀"));
  assert.equal((await words(result.mirror)).mirror,sample);
  assert.ok(result.family>=1&&result.family<=172);
  assert.ok(result.clover>=1&&result.clover<=1382);
  assert.ok(result.supernode>=1&&result.supernode<=732000000);
  assert.ok(result.omni>=1&&result.omni<=126000000000);
  assert.notEqual(result.sha256,(await words(sample.trim())).sha256);
  const response=await worker.fetch(request("/words.js"),{});
  const served=await import("data:text/javascript,"+encodeURIComponent(await response.text()));
  assert.deepEqual(await served.words(sample),result);
});

test("the public catalog preserves known entries and the six directional connections",async()=>{
  const catalog=await (await worker.fetch(request("/api/catalog"),{})).json();
  assert.deepEqual(catalog.expansion_families.map(x=>x.id),[164,165,166,167,168,169,170,171,172]);
  assert.equal(catalog.council_archetypes.length,24);
  assert.equal(catalog.blueprint_apps.length,14);
  assert.equal(catalog.factory_target,101);
  const will=await (await worker.fetch(request("/api/will-wheel-way"),{})).json();
  assert.equal(will.connections.length,6);
  assert.equal(will.identities.length,3);
  assert.equal((await worker.fetch(request("/api/rhythm?tick=221&tick=0"),{})).status,400);
});

test("public power observation reads a fixed source and validates samples",async()=>{
  const data={from:"2026-11-18T14:30Z",to:"2026-11-18T15:00Z",generationmix:[{fuel:"wind",perc:30},{fuel:"nuclear",perc:70}]};
  const fetched=await generation(async url=>{
    assert.equal(url,"https://api.carbonintensity.org.uk/generation");
    return Response.json({data});
  });
  assert.equal(fetched.region,"Great Britain");
  assert.deepEqual(fetched.fuels.map(x=>x.percent),[30,70]);
  await assert.rejects(generation(async()=>Response.json({data:{...data,generationmix:[{fuel:"wind",perc:-1}]}})),/Unexpected/);
});
