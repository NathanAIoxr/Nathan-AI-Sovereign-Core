import { webResponse } from "./web.js";

const PROFILE = {
  "byline": "Nathan Tabor",
  "origin": "Original Root",
  "domain": "Identity, Motion & Demographic Tiers",
  "description": "Youth, innocence, active kinetic energy",
  "codices": [
    "Codex 1 · TaborUniverse and The Living Threshold",
    "Codex 9 · Tabor Universal Motion + Identity Platform"
  ],
  "identity": {
    "blank": "_ _ _ _ _ _",
    "modes": [
      "I_AM",
      "I_AM_BECOMING",
      "STACKED"
    ]
  },
  "mechanic": {
    "name": "The Skimmer's Paradox",
    "attribution": "The Living Threshold · Codex 1",
    "layer": "Literal",
    "trigger": "Cleaning or absorbing debris/secrets left by others",
    "effect": "Dissolves, catalogs, and permanently stores every secret in his infinite depth."
  },
  "play": {
    "name": "Tabor Sideline Bait — TABORBOY",
    "series": "The Art of Basics",
    "credit": "ORIGINAL PLAY DESIGN CREDIT: NATHAN TABOR",
    "sequence": [
      "Quarterback pump-fakes the sideline throw.",
      "Receiver sells the sideline toe-tap, stays inbounds and plants.",
      "Receiver turns upfield for the real pass."
    ],
    "dedication": "Bear Bryant and Pop"
  },
  "zones": [
    "TABORBOY",
    "TABORGIRL",
    "TABORMAN",
    "TABORWOMAN",
    "TABORTRANS",
    "TABOR2SLGBTQQIPAA+",
    "TABORGSRM",
    "TABORLUI",
    "TABORCHARIVARI",
    "TABORKNAVE",
    "TABORLILLIPUT",
    "TABORKONKRET",
    "TABORROMANZI",
    "TABORSHOSETSU",
    "TABORPULP",
    "TABORCHRONICLE"
  ],
  "motion": {
    "baseball": [
      "Pelvis",
      "Torso",
      "Lead upper arm",
      "Top hand or wrist",
      "Bat knob"
    ],
    "basketball": [
      "Hips",
      "Shooting upper arm",
      "Shooting wrist",
      "Lead knee or thigh"
    ],
    "input": "Generic Bluetooth Low Energy IMU tags"
  },
  "sourceScope": "Codex 1 supplies the root profile and Living Threshold lore. Codex 9 supplies the platform specification. The football play comes from The Art of Basics.",
  "entity": "TABORBOY"
};
const SOURCES = [
  {
    "name": "codex-1.txt",
    "sha256": "e98e6f84ec6fda3a983929a8a9049f4d2ff6e3e52b47c119a08899bbaa0c07c8"
  },
  {
    "name": "codex-9.txt",
    "sha256": "4e96b63ed44e543c2a5853a7ef006749e660b0c44f6c165f78d7f7a6f8160a2c"
  }
];
const BUCKET = "ASSETS";
const CACHE = "ZONES_KV";
const ACCENT = "#8fe1da";

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
    '<nav><a href="/app/">Open app</a><a href="/api/profile">Project profile</a><a href="/health">Worker status</a></nav></main></html>';
  return new Response(html,{headers:{...HEADERS,"content-type":"text/html; charset=utf-8","content-security-policy":"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'"}});
}

async function refresh(env) {
  const current = await Promise.all(SOURCES.map(async source => {
    const object = await (env.TABORBOY_ASSETS ?? env[BUCKET]).get("sources/" + source.name);
    if (!object || await hash(await object.arrayBuffer()) !== source.sha256) {
      throw new Error("Source verification failed for " + source.name);
    }
    return source.name;
  }));
  const edition = JSON.stringify(PROFILE,null,2);
  const digest = await hash(edition);
  const key = "editions/" + digest + ".json";
  if (!await (env.TABORBOY_ASSETS ?? env[BUCKET]).head(key)) {
    await (env.TABORBOY_ASSETS ?? env[BUCKET]).put(key, edition, {httpMetadata:{contentType:"application/json"}});
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
      const app = webResponse(request,url);
      if (app) return app;
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
        const object = await (env.TABORBOY_ASSETS ?? env[BUCKET]).get("sources/" + name);
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
const PRIVATE_PATHS = ["/profile","/skimmer-traverse","/ops/status","/ops/rebuild"];
async function project(env) {
  const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM taborboy_profiles").first("total");
  return {zones:PROFILE.zones,profiles:count};
}

async function router(request,env,path) {
  if (path === "/profile" && request.method === "GET") {
    const {results} = await env.DB.prepare("SELECT * FROM taborboy_profiles ORDER BY updated_at DESC,id LIMIT 50").all();
    return reply({entity:PROFILE.entity,count:results.length,profiles:results});
  }
  if (path !== "/skimmer-traverse" || request.method !== "POST") return reply({error:"METHOD_NOT_ALLOWED"},405);
  const body = await readInput(request);
  const id = request.headers.get("idempotency-key");
  if (!body || !id || !/^[a-zA-Z0-9_-]{8,80}$/.test(id)) return reply({error:"INVALID_INPUT_OR_IDEMPOTENCY_KEY"},400);
  const blank = body.identity_blank ?? PROFILE.identity.blank;
  const mode = body.mode ?? "I_AM";
  const zone = body.zone_masthead ?? "CORE_ZONE";
  const tier = body.demographic_tier ?? "TIER_1";
  const vector = body.motion_vector ?? {x:0,y:0,z:0};
  if (typeof blank !== "string" || blank.length > 256 || !PROFILE.identity.modes.includes(mode) ||
      !["CORE_ZONE",...PROFILE.zones].includes(zone) || typeof tier !== "string" || !/^TIER_[1-9][0-9]?$/.test(tier) ||
      !vector || typeof vector !== "object" || Array.isArray(vector) ||
      Object.keys(vector).length !== 3 || !["x","y","z"].every(axis => Number.isFinite(vector[axis]))) {
    return reply({error:"INVALID_DECLARATION"},400);
  }
  const motion = JSON.stringify({x:vector.x,y:vector.y,z:vector.z});
  const checksum = await hash(JSON.stringify([blank,mode,zone,tier,motion]));
  const now = Math.floor(Date.now()/1000);
  const [created,record] = await env.DB.batch([
    env.DB.prepare("INSERT INTO taborboy_profiles (id,identity_blank,mode,zone_masthead,demographic_tier,skimmer_paradox_state,motion_vector_json,updated_at) VALUES (?,?,?,?,?,'PARADOX_ACTIVE',?,?) ON CONFLICT(id) DO NOTHING").bind(id,blank,mode,zone,tier,motion,now),
    env.DB.prepare("INSERT INTO taborboy_events (event_id,profile_id,action_type,payload_hash,created_at) VALUES (?,?,'SKIMMER_TRAVERSE',?,?) ON CONFLICT(event_id) DO NOTHING").bind(id,id,checksum,now),
    env.DB.prepare("SELECT payload_hash FROM taborboy_events WHERE event_id=?").bind(id)
  ]).then(results => [results[0],results[2].results[0]]);
  if (record.payload_hash !== checksum) return reply({error:"IDEMPOTENCY_CONFLICT"},409);
  return reply({box:"1",entity:PROFILE.entity,id,status:"COMMITTED"},created.meta.changes ? 201 : 200);
}
