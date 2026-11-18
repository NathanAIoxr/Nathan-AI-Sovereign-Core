interface Env { DB:D1Database; AUTH_TOKEN:string; FLEET?:Fetcher; }
const encoder=new TextEncoder();
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{"cache-control":"no-store"}});
async function hash(s:string){return [...new Uint8Array(await crypto.subtle.digest("SHA-256",encoder.encode(s)))].map(n=>n.toString(16).padStart(2,"0")).join("");}
async function gate(request:Request,secret?:string){const h=request.headers.get("authorization")||"";if(!secret||secret.length<32||!h.startsWith("Bearer ")||h.length>256)return false;const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["verify"]);const candidate=await crypto.subtle.importKey("raw",encoder.encode(h.slice(7)),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const challenge=crypto.getRandomValues(new Uint8Array(32));return crypto.subtle.verify("HMAC",key,await crypto.subtle.sign("HMAC",candidate,challenge),challenge);}
let initialized:Promise<void>|undefined;
async function ensureSchema(db:D1Database){if(!initialized)initialized=(async()=>{await db.prepare("CREATE TABLE IF NOT EXISTS sovereign_records (id INTEGER PRIMARY KEY AUTOINCREMENT,tier INTEGER NOT NULL,anchor TEXT NOT NULL,content TEXT NOT NULL,sha256_hash TEXT NOT NULL,prev_hash TEXT NOT NULL,verbatim_locked INTEGER NOT NULL DEFAULT 1 CHECK(verbatim_locked=1),created_at TEXT NOT NULL)").run()})().catch(e=>{initialized=undefined;throw e});await initialized;}
export default {async fetch(req:Request,env:Env):Promise<Response>{
 if(!await gate(req,env.AUTH_TOKEN))return json({error:"unauthorized"},401);
 const u=new URL(req.url);
 try{await ensureSchema(env.DB)}catch{return json({error:"database_unavailable"},503)}
 if(u.pathname==="/v1/health"&&req.method==="GET"){const r=await env.DB.prepare("SELECT COUNT(*) AS count FROM sovereign_records").first<{count:number}>();return json({gateway:"W-101",database:"connected",records:r?.count??0});}
 if(u.pathname==="/v1/lock"&&req.method==="POST"){let p:{content?:unknown;anchor?:unknown;tier?:unknown};try{p=await req.json()}catch{return json({error:"invalid_json"},400)}if(typeof p.content!=="string"||encoder.encode(p.content).length>65536)return json({error:"invalid_content"},400);const anchor=typeof p.anchor==="string"&&p.anchor.length<=40?p.anchor:"QI";const tier=Number.isInteger(p.tier)?Number(p.tier):1;
 // D1 does not serialize cross-request read/hash/insert. Use a single Durable Object coordinator for production hash-chain appends.
 return json({error:"append_coordinator_required",detail:"W-101 does not write an unsafe concurrent hash chain. Use the SovereignBotAgent serialized ledger."},503);
 }
 if(u.pathname==="/v1/transform"&&req.method==="POST"){const p=await req.json() as {text?:unknown};if(typeof p.text!=="string"||p.text.length>65536)return json({error:"invalid_text"},400);return json({original:p.text,mirror:[...p.text].reverse().join(""),sha256:await hash(p.text)});}
 return json({gateway:"W-101",status:"configured",dispatch:"not_connected",error:"unknown_route"},404);
}} satisfies ExportedHandler<Env>;
