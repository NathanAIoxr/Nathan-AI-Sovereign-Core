import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../worker.js";

const source={source_id:"TCV-A001",kind:"homepage",capture_date:"2004-09-25",evidence:"verified_html",url:"https://web.archive.org/web/20040925234929id_/http://www.theconservativevoice.com/modules/news/"};
function fakeDB(){
 return {prepare(sql){return{
  bind(){return this;},
  async all(){
   if(sql.includes("FROM archive_sources"))return {results:[source]};
   if(sql.includes("FROM editorial_directory"))return {results:[{id:102,label:"Tabor, Nathan",kind:"byline_label",source_url:"https://web.archive.org/"}]};
   if(sql.includes("FROM geographic_topics"))return {results:[{id:58,name:"National",route:"/modules/news/index.php?storytopic=58"}]};
   return {results:[]};
  },
  async first(){return {n:0};},
  async run(){return {meta:{last_row_id:1}};}
 };}};
}
async function get(path){return worker.fetch(new Request("https://example.com"+path),{DB:fakeDB()});}

test("The public homepage renders without private content",async()=>{
 const r=await get("/"); const t=await r.text();
 assert.equal(r.status,200);
 assert.match(t,/THE CONSERVATIVE/);
 assert.match(t,/Nathan Tabor Way/);
 assert.match(t,/Source register|archive capture|archived sources/i);
 assert.match(r.headers.get("content-security-policy"),/frame-ancestors/);
});
test("Historic index provides archive source and provenance",async()=>{
 const r=await get("/archives");const t=await r.text();assert.equal(r.status,200);
 assert.match(t,/TCV-A001/); assert.match(t,/verified_html/);
});
test("Categories expose original 27-section topic taxonomy",async()=>{
 const r=await get("/api/categories");const data=await r.json();
 assert.equal(data.count,27);assert.ok(data.categories.includes("Political Opinion"));
});
test("Editorial directory is clearly an archive, not licensed article text",async()=>{
 const r=await get("/directory");const t=await r.text();
 assert.match(t,/Tabor, Nathan/);assert.match(t,/145 recovered/);
});
test("Geographic topics keep original category identifiers",async()=>{
 const r=await get("/states");const t=await r.text();
 assert.match(t,/storytopic=58/); assert.match(t,/55 archived topic records/);
});
test("Missing articles do not become invented historical bodies",async()=>{
 const r=await get("/article/missing");assert.equal(r.status,404);
});
test("Newsletter does not collect private addresses",async()=>{
 const r=await get("/newsletter");const t=await r.text();
 assert.match(t,/not yet accepting addresses/);assert.doesNotMatch(t,/<input[^>]+type="email"/);
});
test("Admin publishing is disabled without a secret",async()=>{
 const r=await worker.fetch(new Request("https://example.com/api/admin/articles",{method:"POST",body:"{}"}),{DB:fakeDB()});
 assert.equal(r.status,503);
});
test("RSS is syntactically available without articles",async()=>{
 const r=await get("/rss.xml");assert.equal(r.status,200);assert.match(await r.text(),/<rss version="2.0">/);
});
