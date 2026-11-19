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
const companionApps = [
  ["https://nathan-ai-crypto-64.nathantaboract.workers.dev/restoration","Original coin restoration"],
  ["https://nathan-ai-mining-lab.nathantaboract.workers.dev/","Mining Lab"],
  ["https://nathan-ai-cryptology.nathantaboract.workers.dev/","Cryptography and Cryptology"],
  ["https://nathan-ai-crypt-operations.nathantaboract.workers.dev/","Crypt Oracles and Operators"],
  ["https://nathan-ai-crypto-dmsp-dit.nathantaboract.workers.dev/","DMSP / DIT runbooks"],
  ["https://nathan-ai-cryptozoology.nathantaboract.workers.dev/","Cryptozoology Fieldbook"],
];
function appLinks(items) {
  return items.map(([url,label])=>"<li><a href=\""+escape(url)+"\">"+escape(label)+"</a></li>").join("");
}
function page() {
  const base="https://nathan-ai-coin-ledger.nathantaboract.workers.dev";
  const links=appLinks([
    [base+"/blueprint","Book blueprint and manuscript"],
    [base+"/api/ledger","64-slot ledger"],
    [base+"/api/receipts","Development mining receipts"],
    [base+"/api/verify?slot=1","Verify the first receipt"],
    [base+"/api/verification","Verify all 64 receipts"],
    [base+"/api/compute","Compute controller and proof checks"],
    ...companionApps
  ]);
  return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nathan AI 🚀 Coin Ledger</title><main><h1>Nathan AI 🚀 Coin Ledger</h1><p>Seven D1 partitions. The original 64 slot addresses and their source status.</p><p>Development proof-of-work writes verification receipts. No currency is represented by a receipt.</p><ul>'+links+'</ul></main>',{headers:{"Content-Type":"text/html; charset=utf-8","Content-Security-Policy":"default-src 'none'; base-uri 'none'; frame-ancestors 'none'"}});
}
async function findRow(db, slot) { return db.prepare("SELECT "+ columns+" FROM binary_ledger WHERE slot=?").bind(slot).first(); }
async function findReceipt(db, slot) { return db.prepare("SELECT receipt FROM lineage_archive WHERE slot=?").bind(slot).first("receipt"); }
async function auditReceipts(db) {
  const {results} = await db.prepare("SELECT slot, receipt FROM lineage_archive ORDER BY slot LIMIT 64").all();
  const valid = await Promise.all(results.map(async row => {
    try {
      const proof = JSON.parse(row.receipt);
      if (proof.scope !== "development" || proof.algorithm !== "SHA-256d" || proof.difficultyBits !== 4 ||
          proof.source.slot !== row.slot || !Number.isInteger(proof.nonce) || proof.nonce < 0 || proof.nonce >= limit) return false;
      const hash = await digest(proof.source,proof.nonce);
      return hash === proof.hash && hash.startsWith("0");
    } catch { return false; }
  }));
  const failedSlots = results.filter((_,i)=>!valid[i]).map(row=>row.slot);
  const known = new Set(results.map(row=>row.slot));
  const missingSlots = Array.from({length:64},(_,i)=>i+1).filter(slot=>!known.has(slot));
  return {ok:failedSlots.length===0 && missingSlots.length===0, scope:"development", checked:results.length,
    verified:valid.filter(Boolean).length, failedSlots, missingSlots};
}
const auditRow = "development-verification";
export default {
async scheduled(controller,env) {
  const audit = await auditReceipts(env.DB);
  if (!audit.ok) throw Error("Development receipt audit failed: "+JSON.stringify(audit));
  const at = new Date(controller.scheduledTime).toISOString();
  await env.DB.prepare("INSERT INTO cycle_clock(id,created_at,slots) VALUES(?,?,64) ON CONFLICT(id) DO UPDATE SET created_at=excluded.created_at WHERE excluded.created_at>cycle_clock.created_at")
    .bind(auditRow,at).run();
},
async fetch(request,env) {
  const url=new URL(request.url);
  const path=url.pathname;
  if (request.method==="GET") {
    if(path==="/")return page();
    if(path==="/blueprint.txt")return new Response(blueprint,{headers:{"Content-Type":"text/plain; charset=utf-8","X-Content-Type-Options":"nosniff"}});
    if(path==="/blueprint")return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nathan AI · Book Blueprint</title><main><h1>Nathan AI 🚀 Book Blueprint</h1><nav><a href="/">Coin ledger</a> · <a href="https://nathan-ai-crypto-64.nathantaboract.workers.dev/manuscript.txt">Previous scene</a> · <a href="/blueprint.txt">Original plain text</a></nav><section><h2>Supplied blueprint</h2>'+blueprint.split(/\n\n+/).map(paragraph=>'<p>'+escape(paragraph).replaceAll("\n","<br>")+'</p>').join("")+'</section><section><h2>Technical note</h2><p>'+escape(technicalNote)+'</p></section><section><h2>Connected Nathan AI apps</h2><ul>'+appLinks(companionApps)+'</ul></section></main></html>',{headers:{"Content-Type":"text/html; charset=utf-8","Content-Security-Policy":"default-src 'none'; base-uri 'none'; frame-ancestors 'none'"}});

    if(path==="/api/compute") {
      const [controller,audit] = await Promise.allSettled([
        Promise.resolve().then(()=>env.DATABASE_COMPUTE.fetch("https://internal/healthz")).then(async result=>{
          if(!result.ok) throw Error("Controller unavailable");
          const data=await result.json();
          if(data.status!=="ok" || !Number.isInteger(data.databases) || data.databases<1 ||
             !Number.isInteger(data.placementsPerDatabase) || data.placementsPerDatabase<1) throw Error("Invalid controller response");
          return {databases:data.databases,placementsPerDatabase:data.placementsPerDatabase};
        }),
        auditReceipts(env.DB)
      ]);
      const health=controller.status==="fulfilled"?controller.value:null;
      const proof=audit.status==="fulfilled"?audit.value:null;
      const ok=Boolean(health&&proof?.ok);
      return response({ok,controller:health,developmentProofs:proof},ok?200:503);
    }
    if(path==="/api/verification") {
      const [audit,lastSuccessfulSchedule] = await Promise.all([
        auditReceipts(env.DB),
        env.DB.prepare("SELECT created_at FROM cycle_clock WHERE id=?").bind(auditRow).first("created_at"),
      ]);
      return response({...audit,lastSuccessfulSchedule:lastSuccessfulSchedule??null},audit.ok?200:503);
    }
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
