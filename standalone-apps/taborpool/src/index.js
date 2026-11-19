const PROFILE = {
  "byline": "John Nathan Tabor AKA TABORPOOL",
  "domain": "Ledger, Treasury & Broadsheet Archives",
  "description": "Protect All Innocence",
  "codices": [
    "Codex 1 · TaborUniverse and The Living Threshold",
    "The TABORPOOL Manifesto"
  ],
  "mechanic": {
    "name": "The Rippling Retaliation",
    "attribution": "The Living Threshold · Codex 1",
    "layer": "Figurative",
    "trigger": "An external punch, curse, or lie disturbs his stillness",
    "effect": "Absorbs the impact and returns the exact force as a concentrated shockwave."
  },
  "manifesto": {
    "title": "THE TABORPOOL MANIFESTO: THE UNCOMPROMISED ARCHETYPE OPERATING SYSTEM",
    "motto": "Fear fears me",
    "manual": "King James Bible (KJV)",
    "references": [
      "Matthew 6:22",
      "Matthew 18:9"
    ],
    "themes": [
      "The Preacher’s Kid DNA",
      "Single Eye Focus",
      "Protect All Innocence"
    ],
    "archetypes": [
      "ArchetypeMind",
      "ArchetypeLife",
      "TaborpoolPerimeter"
    ],
    "rules": [
      "NO PEEING OR POOPING IN THE POOL ALLOWED.",
      "Zero tolerance for narrative garbage, backstabbing, or corruption.",
      "Guard the perimeter with a singular, unblinking eye.",
      "Keep the environment pristine for those who belong."
    ]
  },
  "registers": [
    "Historical broadsheet archives",
    "Cryptographic verification",
    "Pool distribution registry"
  ],
  "sourceScope": "Codex 1 supplies Living Threshold lore and the historical broadsheet context. The recovered manifesto supplies the operating rules and archetypes. The ledger and treasury reflect Nathan’s deployment brief.",
  "entity": "TABORPOOL"
};
const SOURCES = [
  {
    "name": "codex-1.txt",
    "sha256": "e98e6f84ec6fda3a983929a8a9049f4d2ff6e3e52b47c119a08899bbaa0c07c8"
  },
  {
    "name": "taborpool_engine.py",
    "sha256": "a940e4a4cfc220a10a8b5c3c71f7197da70cbddee4862066405829459209b9bf"
  },
  {
    "name": "taborpool_demo.json",
    "sha256": "7c7f7cd97d21457a76f6c8cf6174d0908d513eeaa1b849a94a45a9e15cb3b600"
  },
  {
    "name": "taborpool-source-manifesto.txt",
    "sha256": "3460a2e00de8aca4b0426836dee38d15b2b35ff5fab42ef4326807c144a90eb1"
  }
];
const BUCKET = "ARCHIVES";
const CACHE = "LEDGER_KV";
const ACCENT = "#e3bf82";

const HEADERS = {"cache-control":"no-store","x-content-type-options":"nosniff"};
const reply = (body, status = 200) => Response.json(body,{status,headers:HEADERS});

async function hash(value) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256",bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2,"0")).join("");
}

async function authorized(request, secret) {
  const token = request.headers.get("authorization");
  if (!secret || !token?.startsWith("Bearer ")) return false;
  const [given, expected] = await Promise.all([hash(token.slice(7)),hash(secret)]);
  if (typeof crypto.subtle.timingSafeEqual === "function") {
    const encoder = new TextEncoder();
    return crypto.subtle.timingSafeEqual(encoder.encode(given),encoder.encode(expected));
  }
  return given === expected;
}

async function readInput(request) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  try {
    const decoder = new TextDecoder("utf-8",{fatal:true});
    let total = 0;
    let input = "";
    for (;;) {
      const {done,value} = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 8192) {
        await reader.cancel();
        return null;
      }
      input += decoder.decode(value,{stream:true});
    }
    const body = JSON.parse(input + decoder.decode());
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function escape(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}

function home() {
  const mechanic = PROFILE.mechanic;
  const sections = PROFILE.play
    ? [["Identity Blank",PROFILE.identity.blank,PROFILE.identity.modes.join(" · ")], [PROFILE.play.name,PROFILE.play.credit,...PROFILE.play.sequence]]
    : [["The TABORPOOL Manifesto",PROFILE.manifesto.motto,...PROFILE.manifesto.themes],["Archives and ledger",...PROFILE.registers]];
  const blocks = sections.map(([heading,...lines]) => "<section><h2>"+escape(heading)+"</h2>"+lines.map(line => "<p>"+escape(line)+"</p>").join("")+"</section>").join("");
  const html = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+PROFILE.entity+'</title>'+
    '<style>body{margin:0;background:#0e151c;color:#eaf0f6;font:16px/1.6 system-ui,sans-serif}main{max-width:46rem;margin:auto;padding:clamp(1.5rem,6vw,5rem) 1.5rem}h1,h2{line-height:1.1}h1{font-size:clamp(3rem,11vw,6.5rem);margin:.2em 0;letter-spacing:-.065em}h2{font-size:1.35rem}p{margin:.6em 0}section{padding:1rem 0;border-top:1px solid #39444f}header{padding-bottom:1.2rem}a{color:'+ACCENT+'}nav{display:flex;gap:1.25rem;flex-wrap:wrap;padding-top:1.5rem}</style>'+
    '<main><header><p>'+escape(PROFILE.byline)+'</p><h1>'+PROFILE.entity+'</h1><p>'+escape(PROFILE.domain)+'</p><p>'+escape(PROFILE.description)+'</p></header>'+
    '<section><h2>'+escape(mechanic.name)+'</h2><p>'+escape(mechanic.attribution)+'</p><p>'+escape(mechanic.effect)+'</p></section>'+blocks+
    '<nav><a href="/api/profile">Project profile</a><a href="/health">Worker status</a></nav></main></html>';
  return new Response(html,{headers:{...HEADERS,"content-type":"text/html; charset=utf-8","content-security-policy":"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'"}});
}

async function refresh(env) {
  const current = await Promise.all(SOURCES.map(async source => {
    const object = await env[BUCKET].get("sources/" + source.name);
    if (!object || await hash(await object.arrayBuffer()) !== source.sha256) {
      throw new Error("Source verification failed for " + source.name);
    }
    return source.name;
  }));
  const edition = JSON.stringify(PROFILE,null,2);
  const digest = await hash(edition);
  const key = "editions/" + digest + ".json";
  if (!await env[BUCKET].head(key)) {
    await env[BUCKET].put(key, edition, {httpMetadata:{contentType:"application/json"}});
  }
  const projection = {entity:PROFILE.entity,edition:key,sha256:digest,sources:current,...await project(env)};
  const view = JSON.stringify(projection);
  const prior = await env.DB.prepare("SELECT payload FROM build_status WHERE id = 1").first();
  if (prior?.payload !== view || !await env[CACHE].get("current-edition")) {
    await env[CACHE].put("current-edition",view);
  }
  await env.DB.prepare("INSERT INTO build_status (id,payload,verified_at) VALUES (1,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, verified_at=excluded.verified_at")
    .bind(view,Date.now()).run();
  return projection;
}

export default {
  async fetch(request,env) {
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/") return home();
      if (request.method === "GET" && url.pathname === "/api/profile") return reply(PROFILE);
      if (request.method === "GET" && ["/health","/api/health"].includes(url.pathname)) {
        const last = await env.DB.prepare("SELECT verified_at FROM build_status WHERE id = 1").first();
        return reply({entity:PROFILE.entity,status:"ONLINE",last_verified_at:last?.verified_at ?? null});
      }
      if (!PRIVATE_PATHS.includes(url.pathname) && !url.pathname.startsWith("/sources/")) return reply({error:"ROUTE_NOT_FOUND"},404);
      if (!await authorized(request,env.SOVEREIGN_TOKEN)) return reply({box:"0",status:"REJECTED",entity:PROFILE.entity},401);
      if (request.method === "GET" && url.pathname.startsWith("/sources/")) {
        const name = url.pathname.slice("/sources/".length);
        if (!SOURCES.some(source => source.name === name)) return reply({error:"SOURCE_NOT_FOUND"},404);
        const object = await env[BUCKET].get("sources/" + name);
        if (!object) return reply({error:"SOURCE_NOT_FOUND"},404);
        return new Response(object.body,{headers:{...HEADERS,"content-type":"text/plain; charset=utf-8","content-disposition":'attachment; filename="'+name+'"'}});
      }
      if (request.method === "POST" && url.pathname === "/ops/rebuild") return reply(await refresh(env));
      if (request.method === "GET" && url.pathname === "/ops/status") {
        const last = await env.DB.prepare("SELECT payload,verified_at FROM build_status WHERE id = 1").first();
        return reply({entity:PROFILE.entity,verified_at:last?.verified_at ?? null,build:last ? JSON.parse(last.payload) : null});
      }
      return await router(request, env, url.pathname);
    } catch (error) {
      console.error("TABOR request failed",error.name);
      return reply({entity:PROFILE.entity,error:"REQUEST_FAILED"},500);
    }
  },
  async scheduled(_controller,env) {
    await refresh(env);
  }
};
const PRIVATE_PATHS = ["/ledger","/archive","/ops/status","/ops/rebuild"];
const REGISTERS = ["BROADSHEET","TREASURY","POOL_DISTRIBUTION"];
async function project(env) {
  const {results} = await env.DB.prepare("SELECT register,COUNT(*) AS entries,COALESCE(SUM(units),0) AS units FROM taborpool_ledger GROUP BY register ORDER BY register").all();
  return {registers:results,units_type:"SIMULATION"};
}

async function router(request,env,path) {
  if (request.method === "GET" && path === "/archive") return reply({entity:PROFILE.entity,sources:SOURCES});
  if (request.method === "GET" && path === "/ledger") {
    const {results} = await env.DB.prepare("SELECT * FROM taborpool_ledger ORDER BY created_at DESC,id LIMIT 50").all();
    return reply({entity:PROFILE.entity,units_type:"SIMULATION",entries:results});
  }
  if (path !== "/ledger" || request.method !== "POST") return reply({error:"METHOD_NOT_ALLOWED"},405);
  const body = await readInput(request);
  const id = request.headers.get("idempotency-key");
  if (!body || !id || !/^[a-zA-Z0-9_-]{8,80}$/.test(id) || !REGISTERS.includes(body.register) ||
      !SOURCES.some(source => source.name === body.source) || !Number.isSafeInteger(body.units) ||
      Math.abs(body.units) > 1000000 || (body.register === "BROADSHEET" && body.units !== 0)) {
    return reply({error:"INVALID_LEDGER_ENTRY"},400);
  }
  const checksum = await hash(JSON.stringify([body.register,body.source,body.units]));
  const now = Math.floor(Date.now()/1000);
  const [created,lookup] = await env.DB.batch([
    env.DB.prepare("INSERT INTO taborpool_ledger (id,register,source,units,payload_hash,created_at) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING").bind(id,body.register,body.source,body.units,checksum,now),
    env.DB.prepare("SELECT payload_hash FROM taborpool_ledger WHERE id=?").bind(id)
  ]);
  if (lookup.results[0].payload_hash !== checksum) return reply({error:"IDEMPOTENCY_CONFLICT"},409);
  return reply({box:"1",entity:PROFILE.entity,id,status:"COMMITTED",units_type:"SIMULATION"},created.meta.changes ? 201 : 200);
}
