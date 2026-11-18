import assert from "node:assert/strict";
import { test } from "node:test";
import catalog from "../src/catalog.json" with {type:"json"};
import worker from "../src/index.mjs";

const origin = "https://tests.example";
const request = (path, options, env) => worker.fetch(new Request(origin+path, options), env);
const post = (id, input, env, headers = {}) => request(`/api/tools/${String(id).padStart(3,"0")}`,
  {method:"POST",headers:{"content-type":"application/json", ...headers},body:JSON.stringify(input)},env);

test("full directory preserves all IDs, group ranges, route states, and exact upstream revisions", async () => {
  const home = await request("/");
  assert.match(await home.text(), /Library of Tabor/);
  const manifest = await (await request("/api/catalog")).json();
  assert.deepEqual(manifest, catalog);
  assert.deepEqual(manifest.entries.map(row=>row.id), Array.from({length:101},(_,i)=>i+1));
  for (const group of manifest.groups) {
    assert.deepEqual(manifest.entries.filter(row=>row.group===group.id).map(row=>row.id),
      Array.from({length:group.last-group.first+1},(_,i)=>i+group.first));
  }
  const health = await (await request("/api/health")).json();
  assert.equal(health.handlers, manifest.entries.filter(row=>row.route).length);
  assert.equal(health.public_handlers, manifest.entries.filter(row=>row.route && row.status!=="owner").length);
  assert.equal(manifest.entries.filter(row=>row.upstream?.revision?.length===40).length,7);
  assert.equal(manifest.entries.filter(row=>row.existing_cloudflare_worker).length,6);
  assert.equal((await post(17,{})).status,501);
  assert.equal((await request("/api/catalog/000")).status,404);
  assert.equal((await request("/api/tools/013")).headers.get("allow"),"POST");
});

test("every deterministic route accepts its published example", async () => {
  const local = catalog.entries.filter(row=>["live","limited"].includes(row.status) && ![3,49].includes(row.id));
  for (const entry of local) {
    const response = await post(entry.id, entry.example);
    assert.ok(response.ok,`Tool ${entry.id}: ${await response.text()}`);
  }
});

test("Unicode utilities preserve grapheme clusters and requested line separators", async () => {
  const mixed = await (await post(101,{text:"Tabor שלום 𓀀",language:"akk"})).json();
  assert.equal(mixed.scripts.counts.Egyptian_Hieroglyphs,1);
  assert.equal(mixed.language.name,"Akkadian");
  assert.ok(mixed.direction.runs.some(run=>run.direction==="rtl"));
  assert.ok(mixed.related.some(row=>row.id===34));
  const result = await (await post(48,{text:"A\r\nB👩‍🚀C\nD",firstReversed:false})).json();
  assert.equal(result.text,"A\r\nC👩‍🚀B\nD");
  assert.equal((await (await post(35,{code:"A001"})).json()).glyph,"𓀀");
  assert.equal((await (await post(57,{number:116})).json()).text,"קט״ז");
  assert.equal((await (await post(57,{number:117})).json()).text,"קי״ז");
  assert.equal((await (await post(39,{date:"2012-12-21"})).json()).long_count,"13.0.0.0.0");
  assert.equal((await post(39,{date:"2026-02-31"})).status,400);
});

test("content type, oversized bytes and XML declarations are handled explicitly", async () => {
  assert.equal((await request("/api/tools/013",{method:"POST",body:"abc"})).status,415);
  assert.equal((await post(13,{text:"a".repeat(200000)})).status,413);
  assert.equal((await post(90,{xml:'<!DOCTYPE TEI [<!ENTITY a SYSTEM "file:///tmp/data">]><TEI>&a;</TEI>'})).status,400);
  const binary = new Uint8Array([0,255,17,3]);
  const hash = await request("/api/tools/095",{method:"POST",body:binary,headers:{"content-type":"application/octet-stream"}});
  assert.equal((await hash.json()).bytes,4);
  assert.match((await (await post(38,{codes:["A1"]})).text()),/^<svg /);
  const tone = await post(87,{frequency:528,milliseconds:125});
  const wav = Buffer.from(await tone.arrayBuffer());
  assert.equal(wav.toString("ascii",0,4),"RIFF");
  assert.equal(wav.readUInt32LE(40),4000);
});

test("only the configured bearer token can invoke Workers AI", async () => {
  const calls = [];
  const env = {POLYGLOT_AI_KEY:"owner-test-key",AI:{run:async (...args)=>{calls.push(args);return {translated_text:"Buenos días"};}}};
  const body = {text:"Good morning",sourceLanguage:"en",targetLanguage:"es"};
  assert.equal((await post(1,body)).status,503);
  assert.equal((await post(1,body,env)).status,401);
  assert.equal((await post(1,body,env,{authorization:"Bearer wrong"})).status,401);
  assert.equal(calls.length,0);
  const authorized = {authorization:"Bearer owner-test-key"};
  assert.equal((await (await post(1,body,env,authorized)).json()).text,"Buenos días");
  assert.deepEqual(calls[0],["@cf/meta/m2m100-1.2b",{text:"Good morning",source_lang:"en",target_lang:"es"}]);
  const srt = "1\r\n00:00:00,000 --> 00:00:01,000\r\nGood morning\r\n";
  const converted = await (await post(12,{...body,text:srt},env,authorized)).json();
  assert.equal(converted.text,"1\r\n00:00:00,000 --> 00:00:01,000\r\nBuenos días\r\n");
});

test("Library service binding checks the existing catalog route", async () => {
  const response = await request("/api/library",{}, {LIBRARY:{fetch:async url=>{
    assert.equal(url,"https://library.internal/library/api/health");
    return Response.json({ok:true,release:"test",entries:101,shelves:21});
  }}});
  assert.equal((await response.json()).entries,101);
  assert.equal((await request("/api/library")).status,503);
});

test("provider routes restrict fetch hosts, preserve source URLs, and handle upstream failures", async context => {
  context.mock.method(globalThis,"fetch",async (value, options)=>{
    const url = new URL(value);
    assert.equal(options.redirect,"error");
    if(url.hostname==="openlibrary.org") return Response.json({numFound:1,docs:[{title:"The Iliad"}]});
    if(url.hostname==="www.loc.gov") return Response.json({pagination:{total:1},results:[{title:"Newspaper",date:"1900",url:"https://www.loc.gov/item/1"}]});
    if(url.hostname==="web.archive.org") return Response.json([["timestamp","original","statuscode","digest"],
      ["20100101","https://example.com/","200","A"],["20100102","https://example.com/","200","B"]]);
    return new Response("",{status:403});
  });
  assert.match((await (await post(91,{query:"Homer"})).json()).source,/^https:\/\/openlibrary.org/);
  assert.equal((await (await post(81,{query:"Tabor"})).json()).data.pages[0].title,"Newspaper");
  assert.equal((await (await post(82,{url:"https://example.com/"})).json()).data.captures[1].changed_from_previous_row,true);
  assert.equal((await post(59,{query:"Thoth"})).status,502);
  assert.equal((await post(82,{url:"file:///tmp/data"})).status,400);
  assert.equal((await (await post(89,{text:"First\n\nSecond"})).json()).paragraphs.length,2);
});
