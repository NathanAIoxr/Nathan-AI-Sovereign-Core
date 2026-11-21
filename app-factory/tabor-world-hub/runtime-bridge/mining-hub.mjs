/** TABOR CORP Mining Command Center — monitoring and hardware design, not cloud mining. */
const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
const response=(x,status=200)=>new Response(JSON.stringify(x),{status,headers});
export async function sha256dHex(hex) {
 if(!/^(?:[0-9a-f]{2})+$/i.test(hex))throw Error("Invalid even-length hexadecimal input");
 const bytes=Uint8Array.from(hex.match(/../g),h=>parseInt(h,16));
 const first=await crypto.subtle.digest("SHA-256",bytes);
 const second=await crypto.subtle.digest("SHA-256",first);
 return Array.from(new Uint8Array(second),b=>b.toString(16).padStart(2,"0")).join("");
}
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(request.method!=="GET")return response({error:"read-only service"},405);
 if(url.pathname==="/health")return response({name:"TABOR CORP Mining Command Center",status:"online",mining:false});
 if(url.pathname==="/api/coins"){
  const q=await env.REGISTRY.prepare("SELECT coin_id,symbol,label,network,status,provenance FROM tabor_mining_coins ORDER BY CASE coin_id WHEN 'SIN' THEN 1 WHEN 'SEN' THEN 2 ELSE CAST(SUBSTR(coin_id, 6) AS INTEGER) END, coin_id").all();
  return response({coins:q.results,count:q.results.length,disclaimer:"Design definitions from the author’s 21 Sovereign Coin Matrix."});
 }
 if(url.pathname==="/api/hardware"){
  const q=await env.REGISTRY.prepare("SELECT hardware_id,class,specification,status FROM tabor_mining_hardware ORDER BY hardware_id").all();
  return response({hardware:q.results,physicalHardwareProvisioned:false});
 }
 if(url.pathname==="/api/architecture")return response({architecture:{control:"Cloudflare Workers",registry:"D1",archive:"R2 proposed",mining:"separate authorized physical ASIC/CPU/GPU hosts",validation:"SHA-256d, full-node consensus checks and auditable receipts",security:"hardware keys and secret storage; never passwords as public source"},axioms:["1+1=2","1-1=0","1×1=1","1÷1=1"],claims:{efficiency16x:"unverified",reverseSHA256:"not cryptographic inversion",proxy5m:"unverified",quantumMining:"research only"}});
 if(url.pathname==="/api/sha256d-test"){
  const hex=url.searchParams.get("hex")||"";
  if(hex.length>160)return response({error:"test input too large"},400);
  try{return response({sha256d:await sha256dHex(hex),inputHex:hex,testOnly:true})}catch(e){return response({error:String(e.message)},400)}
 }
 if(url.pathname!=="/")return response({error:"not found"},404);
 const [coins,hw]=await Promise.all([env.REGISTRY.prepare("SELECT COUNT(*) AS n FROM tabor_mining_coins").first(),env.REGISTRY.prepare("SELECT COUNT(*) AS n FROM tabor_mining_hardware").first()]);
 const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TABOR CORP Mining</title><style>body{margin:0;background:#0b1424;color:#e8f2ff;font:16px system-ui}main{max-width:960px;margin:auto;padding:42px 22px}h1{font-size:clamp(2rem,6vw,4rem)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.card{background:#182b41;border:1px solid #39556b;border-radius:14px;padding:24px}a{color:#89d5fa}p{color:#b3c8d9}</style><main><h1>TABOR CORP<br>Mining Command Center</h1><p>Part of Nathan Tabor Supercomputer · Tabor World Hub · Nathan AI</p><div class="grid"><div class="card"><h2>'+coins.n+' Sovereign Coin Records</h2><p>Author-defined names in original ring order</p><a href="/api/coins">Coin Registry</a></div><div class="card"><h2>'+hw.n+' Hardware Classes</h2><p>ASIC · CPU/GPU · ECC RAM · SSD/HDD · Network · Power</p><a href="/api/hardware">Hardware Plan</a></div><div class="card"><h2>SHA-256d</h2><p>Deterministic validation test, not Bitcoin mining</p><a href="/api/sha256d-test?hex=00">Test API</a></div><div class="card"><h2>Architecture</h2><p>Cloudflare control plane and separate physical mining hosts</p><a href="/api/architecture">Architecture API</a></div><div class="card"><h2>Proof ledger</h2><a href="https://tabor-sovereign-currency.nathantaboract.workers.dev/verifier">Verify a Bitcoin header and download source</a></div></div><p>No live mining, coin issuance, wallet balances, or efficiency gains are asserted by this dashboard.</p></main></html>';
 return new Response(html,{headers:{"content-type":"text/html; charset=utf-8"}});
}};
