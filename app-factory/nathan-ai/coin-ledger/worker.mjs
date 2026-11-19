import { blueprint, technicalNote } from "./blueprint.mjs";

const limit = 1024;
const seed = "nathan-ai:64-ledger:development:v1";
const encoder = new TextEncoder();
const columns = "slot,coordinate,ticker,name,source_status";
function response(value,status=200) {
  return Response.json(value,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
function hex(bytes) { return Array.from(bytes,x=>x.toString(16).padStart(2,"0")).join(""); }
export async function digest(row, nonce) {
  const material = [seed,row.slot,row.coordinate,row.ticker,row.name,row.source_status,nonce];
  const first = await crypto.subtle.digest("SHA-256",encoder.encode(JSON.stringify(material)));
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",first)));
}
export async function runProof(row) {
  for (let nonce=0;nonce<limit;nonce++) {
    const hash = await digest(row,nonce);
    if (hash.startsWith("0")) return {scope:"development",algorithm:"SHA-256d",difficultyBits:4,nonce,hash,source:row};
  }
  return null;
}
function escape(text) {
  return String(text).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
}
function page() {
  const base="https://nathan-ai-coin-ledger.nathantaboract.workers.dev";
  const links=[
    [base+"/blueprint","Book blueprint and manuscript"],
    [base+"/api/ledger","64-slot ledger"],
    [base+"/api/receipts","Development mining receipts"],
    [base+"/api/verify?slot=1","Verify the first receipt"],
    ["https://nathan-ai-crypto-64.nathantaboract.workers.dev/restoration","Restoration archive and manuscript"],
    ["https://nathan-ai-crypto-dmsp-dit.nathantaboract.workers.dev/","DMSP / DIT runbooks"]
  ].map(([url,label])=>"<li><a href=\""+escape(url)+"\">"+escape(label)+"</a></li>").join("");
  return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nathan AI 🚀 Coin Ledger</title><main><h1>Nathan AI 🚀 Coin Ledger</h1><p>Seven D1 partitions. The original 64 slot addresses and their source status.</p><p>Development proof-of-work writes verification receipts. No currency is represented by a receipt.</p><ul>'+links+'</ul></main>',{headers:{"Content-Type":"text/html; charset=utf-8","Content-Security-Policy":"default-src 'none'; base-uri 'none'; frame-ancestors 'none'"}});
}
async function findRow(db, slot) { return db.prepare("SELECT "+ columns+" FROM binary_ledger WHERE slot=?").bind(slot).first(); }
async function findReceipt(db, slot) { return db.prepare("SELECT receipt FROM lineage_archive WHERE slot=?").bind(slot).first("receipt"); }
export default {async fetch(request,env) {
  const url=new URL(request.url);
  const path=url.pathname;
  if (request.method==="GET") {
    if(path==="/")return page();
    if(path==="/blueprint.txt")return new Response(blueprint,{headers:{"Content-Type":"text/plain; charset=utf-8","X-Content-Type-Options":"nosniff"}});
    if(path==="/blueprint")return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nathan AI · Book Blueprint</title><main><h1>Nathan AI 🚀 Book Blueprint</h1><nav><a href="/">Coin ledger</a> · <a href="https://nathan-ai-crypto-64.nathantaboract.workers.dev/manuscript.txt">Previous scene</a> · <a href="/blueprint.txt">Original plain text</a></nav><section><h2>Supplied blueprint</h2>'+blueprint.split(/\n\n+/).map(paragraph=>'<p>'+escape(paragraph).replaceAll("\n","<br>")+'</p>').join("")+'</section><section><h2>Technical note</h2><p>'+escape(technicalNote)+'</p></section></main></html>',{headers:{"Content-Type":"text/html; charset=utf-8","Content-Security-Policy":"default-src 'none'; base-uri 'none'; frame-ancestors 'none'"}});

    if(path==="/api/ledger") {
      const grouped=await env.DB.batch([
        env.DB.prepare("SELECT "+columns+" FROM binary_ledger ORDER BY slot"),
        env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('order_engine','binary_ledger','cycle_clock','frequency_interface','gate_protocol','lineage_archive','middle_mediator') ORDER BY name"),
        env.DB.prepare("SELECT count(*) AS n FROM lineage_archive")
      ]);
      return response({slots:grouped[0].results,partitions:grouped[1].results.map(x=>x.name),receipts:grouped[2].results[0].n});
    }
    if(path==="/api/receipts") {
      const {results}=await env.DB.prepare("SELECT receipt FROM lineage_archive ORDER BY slot LIMIT 64").all();
      return response({receipts:results.map(row=>JSON.parse(row.receipt))});
    }
    if(path==="/api/verify") {
      const raw=url.searchParams.get("slot")??"";
      if(!/^(?:[1-9]|[1-5]\d|6[0-4])$/.test(raw))return response({error:"Invalid slot"},400);
      const stored=await findReceipt(env.DB,Number(raw));
      if(!stored)return response({error:"Receipt missing"},404);
      const proof=JSON.parse(stored);
      const sha=await digest(proof.source,proof.nonce);
      return response({valid:sha===proof.hash&&sha.startsWith("0")&&proof.source.slot===Number(raw)&&Number.isInteger(proof.nonce)&&proof.nonce>=0&&proof.nonce<limit,proof});
    }
  }
  if(request.method==="POST"&&path==="/internal/mine") {
    if(!env.LAUNCH_TOKEN||request.headers.get("Authorization")!=="Bearer "+env.LAUNCH_TOKEN)return response({error:"Not found"},404);
    const raw=url.searchParams.get("slot")??"";
    if(!/^(?:[1-9]|[1-5]\d|6[0-4])$/.test(raw))return response({error:"Invalid slot"},400);
    const slot=Number(raw);
    const stored=await findReceipt(env.DB,slot);
    if(stored)return response(JSON.parse(stored));
    const row=await findRow(env.DB,slot);
    if(!row)return response({error:"Slot missing"},404);
    const proof=await runProof(row);
    if(!proof)return response({error:"Nonce limit reached"},503);
    await env.DB.prepare("INSERT INTO lineage_archive(id,slot,receipt,created_at) VALUES(?,?,?,?) ON CONFLICT(slot) DO NOTHING")
      .bind("development-v1:"+slot,slot,JSON.stringify(proof),new Date().toISOString()).run();
    const committed=await findReceipt(env.DB,slot);
    return committed?response(JSON.parse(committed),201):response({error:"Receipt unavailable"},503);
  }
  return response({error:"Not found"},404);
}};
