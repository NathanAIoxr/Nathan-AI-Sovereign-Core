import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import worker from "./src/worker.mjs";
import { sha256 } from "./src/integrity.mjs";
import { bodyKey, cadence, classNames, evidenceConsensus, groups, mapClass } from "./src/model.mjs";
import { catalogBatch, editionBatch } from "./scripts/seeds.mjs";
import editions from "./data/editions.json" with { type: "json" };

const db = new DatabaseSync(":memory:");
db.exec(readFileSync(new URL("./migrations/0001_archive.sql",import.meta.url),"utf8"));
db.exec(readFileSync(new URL("./migrations/0002_corpora.sql",import.meta.url),"utf8"));
for (const item of catalogBatch) db.prepare(item.sql).run(...item.params);
db.exec(readFileSync(new URL("./migrations/0003_existing_ebooks.sql",import.meta.url),"utf8"));
const demo = new TextEncoder().encode("Verbatim evidence\r\n");
const digest = await sha256(demo);
const example = {...editions[0],bytes:demo.length,sha256:digest};
for (const item of editionBatch(example,"2026-11-18T12:00:00Z")) db.prepare(item.sql).run(...item.params);

const d1 = {
  prepare(sql) {
    const stmt = db.prepare(sql);
    const read = params => ({
      first: async ()=>stmt.get(...params) ?? null,
      all: async ()=>({results:stmt.all(...params)})
    });
    return {...read([]),bind(...params){return read(params);}};
  },
  batch: async statements=>Promise.all(statements.map(item=>item.all()))
};
const bucket = new Map([[bodyKey(digest),demo]]);
const r2 = {
  async head(key) {
    const data = bucket.get(key);
    return data && {size:data.length,customMetadata:{sha256:digest}};
  },
  async get(key) {
    const head = await this.head(key);
    if (!head) return null;
    const payload = new Blob([bucket.get(key)]);
    return {...head,body:payload.stream(),arrayBuffer:()=>payload.arrayBuffer()};
  }
};
const env = {ARCHIVE_DB:d1,ARCHIVE_BLOB:r2};

function fetch(path,{method="GET",country="US"}={}) {
  const request = new Request("https://library.example"+path,{method});
  Object.defineProperty(request,"cf",{value:{country}});
  return worker.fetch(request,env);
}

test("21 official classes, contiguous allocation, and exact cadence",()=>{
  assert.equal(Object.keys(classNames).length,21);
  assert.equal(groups.length,10);
  assert.deepEqual(mapClass("V"),{lo:"301",hi:"360",anchor:"phi+pie"});
  assert.deepEqual(cadence,[{value:13,micro:"25240943"},{value:17,micro:"33007387"},{value:34,micro:"66014775"}]);
});

test("live source registers retain all unique IDs and states",async()=>{
  const modules = await (await fetch("/api/registry/modules")).json();
  assert.equal(modules.entries.length,505);
  assert.equal(new Set(modules.entries.map(row=>row[0])).size,505);
  assert.deepEqual(modules.counts,{"executable":101,"awaiting-spec":202,"fixture":96,"specified":106});
  assert.equal((await (await fetch("/api/registry/modules?id=OG-001")).json()).entries.length,1);
  assert.equal((await fetch("/api/registry/modules?id=OG-999")).status,404);
  const act = await (await fetch("/api/registry/act")).json();
  assert.equal(act.nodes.length,160);
  assert.equal(act.primitives.length,17);
  assert.equal(new Set(act.nodes.map(row=>row[1])).size,160);
});

test("indexed pagination, record type, and source-edition separation",async()=>{
  const page1 = await (await fetch("/api/catalog")).json();
  assert.equal(page1.hasNext,true);
  assert.equal(page1.entries.length,18);
  const page2 = await (await fetch("/api/catalog?page=2")).json();
  assert.equal(page2.entries.length,16);
  assert.equal(new Set([...page1.entries,...page2.entries].map(row=>row.id)).size,34);
  const dossier = await (await fetch("/api/catalog?vault=omega&state=lost-work-dossier&q=Sibylline")).json();
  assert.deepEqual(dossier.entries.map(r=>r.id),["sibylline-books"]);
  const work = await (await fetch("/api/works/sibylline-books")).json();
  assert.equal(work.witnesses.length,1);
  assert.deepEqual(work.editions,[]);
  assert.equal((await (await fetch("/api/catalog?q=%25")).json()).entries.length,0);
  assert.equal((await fetch("/api/catalog?class=X")).status,400);
  assert.equal((await fetch("/api/catalog?page=0000")).status,400);
});

test("the HTML escapes user-provided text and marks status correctly",async()=>{
  const page = await fetch("/?q="+encodeURIComponent('<script>danger</script>'));
  const body = await page.text();
  assert.match(body,/&lt;script&gt;danger&lt;\/script&gt;/);
  assert.doesNotMatch(body,/<script>/);
  assert.match((await fetch("/architecture")).headers.get("content-security-policy"),/default-src 'none'/);
  assert.match(await (await fetch("/works/gilgamesh-flood-tablet")).text(),/K\.3375/);
  assert.equal((await fetch("/works/unknown")).status,404);
});

test("preserved bytes, rights, integrity, method and head contracts",async()=>{
  const url="/api/works/king-james-bible/editions/gutenberg-10-2011";
  const reply=await fetch(url+"/text");
  assert.equal(reply.status,200);
  assert.deepEqual(new Uint8Array(await reply.arrayBuffer()),demo);
  assert.equal(reply.headers.get("etag"),'"sha256-'+digest+'"');
  assert.equal((await fetch(url+"/text",{country:"GB"})).status,451);
  const head=await fetch(url+"/text",{method:"HEAD"});
  assert.equal(head.status,200);
  assert.equal(head.headers.get("content-length"),String(demo.length));
  assert.equal(await head.text(),"");
  assert.equal((await (await fetch(url+"/verify")).json()).verified,true);
  assert.equal((await fetch(url+"/verify",{method:"POST"})).status,405);
  bucket.set(bodyKey(digest),new Uint8Array(demo.length));
  try {
    assert.equal((await fetch(url+"/verify")).status,503);
  } finally {
    bucket.set(bodyKey(digest),demo);
  }
});

test("edition and receipts are immutable and capture seeds are idempotent",()=>{
  for (const item of editionBatch(example,"2026-11-19T00:00:00Z")) db.prepare(item.sql).run(...item.params);
  assert.equal(db.prepare("SELECT count(*) n FROM archive_receipts").get().n,1);
  assert.throws(()=>db.prepare("UPDATE archive_editions SET bytes=10").run(),/publish a new edition/);
  assert.throws(()=>db.prepare("DELETE FROM archive_receipts").run(),/immutable receipt/);
});

test("Vilya requires three independent source families",()=>{
  const a = {family:"catalog-a",locator:"fol. 3",sha256:digest};
  const b = {family:"catalog-b",locator:"fol. 8v",sha256:digest};
  const c = {family:"catalog-c",locator:"line 46",sha256:"b".repeat(64)};
  assert.deepEqual(evidenceConsensus([a,b,c]),{status:"candidate-agreement",sha256:digest});
  assert.equal(evidenceConsensus([a,b,{...c,family:" CATALOG-A "}]).status,"dependent-evidence");
  assert.equal(evidenceConsensus([a,c,{...b,sha256:"c".repeat(64)}]).status,"disagreement");
});

test("Library of Congress discovery preserves IDs and source pagination", async()=>{
  const { readPage } = await import("./scripts/discover-loc.mjs");
  const url = new URL("https://www.loc.gov/books/?q=book+of+hours&fo=json&sp=1");
  const data = {pagination:{next:"https://www.loc.gov/books/?sp=2"},results:[
    {id:"http://www.loc.gov/item/example-1/",title:"Book of hours",contributor:["Anonymous"]},
    {id:"https://outside.example/item/1",title:"Outside provider"},
    {id:"incomplete",title:"Invalid ID"}
  ]};
  assert.deepEqual(readPage(data,url),{hasNext:true,records:[{sourceId:"https://www.loc.gov/item/example-1/",
    title:"Book of hours",date:null,contributors:["Anonymous"],language:[],originalFormat:[],rightsReview:"pending",sourceSearch:url.href}]});
  assert.equal(readPage({pagination:{next:null},results:[]},url).hasNext,false);
  assert.throws(()=>readPage({results:[]},url),/Unexpected Library of Congress response/);
});

test("source receipts, repeat imports, holding filters and archive search agree", async()=>{
  const { putRecords } = await import("./scripts/import-worker.mjs");
  const operators = {ARCHIVE_DB:{
    prepare:sql=>({bind:(...args)=>({sql,args})}),
    async batch(items) {
      db.exec("BEGIN");
      try {
        const values=items.map(({sql,args})=>({results:db.prepare(sql).all(...args)}));
        db.exec("COMMIT");
        return values;
      } catch(error) {
        db.exec("ROLLBACK");
        throw error;
      }
    }
  }};
  const example={work:["cdli-p999999","Trial clay tablet","Ancient catalog","sux","C","ancient",
    "artifact","surviving-witness","Administrative account from Ur",
    "https://cdli.earth/artifacts/999999","P999999","CDLI terms"],
    source:["cdli","P999999","tablet","Holding institution","Ur III","VAT fixture","Pinned test snapshot"]};
  assert.equal((await putRecords(operators,[example])).added,1);
  assert.equal((await putRecords(operators,[example])).added,0);
  const result=await (await fetch("/api/catalog?material=tablet&provider=cdli&q=clay%20Ur")).json();
  assert.deepEqual(result.entries.map(x=>x.id),["cdli-p999999"]);
  const work = await (await fetch("/api/works/cdli-p999999")).json();
  assert.equal(work.source.shelfmark,"VAT fixture");
  assert.equal(work.source.snapshot,"Pinned test snapshot");
  assert.equal(db.prepare("SELECT count(*) AS n FROM archive_import_receipts").get().n,1);
  await assert.rejects(putRecords(operators,[{...example,work:example.work.map((v,i)=>i===9?"https://outside.invalid":v)}]),/Invalid catalog record/);
});
