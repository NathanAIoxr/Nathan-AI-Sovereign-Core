import page from "./index.html";
import css from "./style.css";
import script from "./app.js";

const SUBDOMAIN = ".nathantaboract.workers.dev";
const PROJECTS = {
  "nathan-absolute-intelligence": "Nathan Absolute Intelligence",
  "nathan-ai-sovereign-hive": "Nathan AI Sovereign Hive",
  "nathan-ai-help-wanted": "Help Wanted",
  "nathan-ai-workers": "Nathan AI Worker Workspace",
  "bibletopia": "Bible Topia",
  "hook-and-ring": "Hook & Ring",
  "grapple-it": "Grapple It",
  "dual-screen-arcade": "Dual-Screen Arcade",
  "tabor-tracker-ball": "Tabor Tracker Ball",
  "tabor-universal-library-engine": "Tabor Universal Library Engine",
  "pee-and-dee-books": "Pee and Dee Tabor"
};
const SNAPSHOTS = {
  "tabor-cosmic-body":"Cosmic Body Atlas",
  "tabor-mind-of-minds":"Mind of Minds",
  "tabor-nexus-canon":"Nexus / MAS SPIRIT",
  "tabor-modern-day-bible":"The Modern Day Bible",
  "tabor-language-of-sound":"Language of Sound",
  "tabor-worlds-atlas":"Worlds Atlas",
  "tabor-historical-sports":"Historical Sports",
  "tabor-airtable-one-master":"Airtable ONE Master Index",
  "tabor-airtable-crypto-wallets":"Airtable Crypto Wallets & Assets",
  "tabor-airtable-crypto-mining":"Airtable Crypto Mining Operations",
  "tabor-notion-master-work":"Notion Master Work Registry"
};
const ORIGINS = {github:"GitHub",airtable:"Airtable",notion:"Notion"};
const QUEUE_STATES = {
  QUEUED:"queued",LEASED:"leased",RETRY_WAIT:"retry",PATCH_READY:"patchReady",VERIFIED:"verified",
  IMPLEMENTED:"implemented",DONE:"done",NEEDS_REVIEW:"review"
};
const HEADERS = {
  "Content-Security-Policy":"default-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  "X-Content-Type-Options":"nosniff",
  "Referrer-Policy":"no-referrer"
};
const ASSETS = {
  "/":[page,"text/html; charset=utf-8"], "/index.html":[page,"text/html; charset=utf-8"],
  "/style.css":[css,"text/css; charset=utf-8"], "/app.js":[script,"text/javascript; charset=utf-8"]
};

function projectUrl(project) {
  return "https://" + project + SUBDOMAIN + "/";
}

async function registryStatus(db) {
  const [stats, source] = await db.batch([
    db.prepare(`SELECT
      (SELECT COUNT(*) FROM database_registry WHERE database_id IS NOT NULL) AS tracked,
      (SELECT COUNT(*) FROM verified_snapshots) AS verifiedSnapshots,
      (SELECT COUNT(*) FROM database_registry WHERE status IN ('source_required','backend_required')) AS awaitingAccess,
      (SELECT COUNT(*) FROM snapshot_table_counts WHERE source_count=live_count) AS matchingTables`),
    db.prepare("SELECT name,source_kind,logical_table_count,matching_tables FROM verified_snapshots ORDER BY name")
  ]);
  const snapshots = source.results.flatMap(row => Object.hasOwn(SNAPSHOTS,row.name) && Object.hasOwn(ORIGINS,row.source_kind) ?
    [{title:SNAPSHOTS[row.name],origin:ORIGINS[row.source_kind],tables:row.logical_table_count,matchingTables:row.matching_tables}] : []);
  return {...stats.results[0],snapshots};
}

async function repairsStatus(db) {
  try {
    const {results} = await db.prepare("SELECT scope,status,COUNT(*) AS n FROM repair_jobs GROUP BY scope,status").all();
    const empty = () => Object.fromEntries(Object.values(QUEUE_STATES).map(key => [key,0]));
    const counts = {global:empty(),internal:empty()};
    for (const row of results) {
      const scope = row.scope === "GLOBAL" ? "global" : row.scope === "INTERNAL" ? "internal" : null;
      if (scope && Object.hasOwn(QUEUE_STATES,row.status)) counts[scope][QUEUE_STATES[row.status]] = row.n;
    }
    return counts;
  } catch {
    return null;
  }
}

async function projectStatus(db) {
  const rows = await db.prepare("SELECT project,checked_at,state,http FROM atlas_project_checks").all();
  const checks = new Map(rows.results.map(row => [row.project,row]));
  return Object.entries(PROJECTS).map(([id,title]) => {
    const report = checks.get(id);
    return {title,url:projectUrl(id),state:report?.state ?? "pending",http:report?.http ?? null,checkedAt:report?.checked_at ?? null};
  });
}

async function inspect(project) {
  try {
    const response = await fetch(projectUrl(project),{redirect:"manual",signal:AbortSignal.timeout(4000)});
    const http = response.status;
    await response.body?.cancel().catch(() => {});
    const state = response.ok ? "reachable" : http >= 300 && http < 400 ? "redirect" :
      http === 401 || http === 403 ? "restricted" : "unavailable";
    return {project,state,http};
  } catch {
    return {project,state:"unavailable",http:null};
  }
}

async function workerBee(db, checkedAt) {
  const projects = Object.keys(PROJECTS);
  const results = [];
  for(let i=0;i<projects.length;i+=5) results.push(...await Promise.all(projects.slice(i,i+5).map(inspect)));
  await db.batch(results.map(({project,state,http}) => db.prepare(`INSERT INTO atlas_project_checks VALUES (?,?,?,?)
    ON CONFLICT(project) DO UPDATE SET checked_at=excluded.checked_at,state=excluded.state,http=excluded.http
    WHERE excluded.checked_at>=atlas_project_checks.checked_at`).bind(project,checkedAt,state,http)));
}

async function antBot(db,checkedAt) {
  const row = await db.prepare(`SELECT NOT EXISTS (
    SELECT 1 FROM database_registry r
    LEFT JOIN verified_snapshots v ON v.name=r.name
    WHERE r.status='verified_snapshot' AND (v.matching_tables IS NULL OR v.matching_tables<>r.logical_table_count)
  ) AS ok`).first();
  await db.prepare(`INSERT INTO atlas_audit VALUES (1,?,?)
    ON CONFLICT(id) DO UPDATE SET checked_at=excluded.checked_at,ledger_ok=excluded.ledger_ok
    WHERE excluded.checked_at>=atlas_audit.checked_at`).bind(checkedAt,row.ok).run();
}

function json(request, value, status = 200) {
  const headers = {...HEADERS,"Access-Control-Allow-Origin":"*","Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8"};
  return new Response(request.method === "HEAD" ? null : JSON.stringify(value),{status,headers});
}

export default {
  async fetch(request,env) {
    const path = new URL(request.url).pathname;
    if(request.method!=="GET"&&request.method!=="HEAD") return new Response(null,{status:405,headers:{...HEADERS,Allow:"GET, HEAD"}});
    if(Object.hasOwn(ASSETS,path)) {
      const [asset,mime] = ASSETS[path];
      return new Response(request.method==="HEAD"?null:asset,{headers:{...HEADERS,"Content-Type":mime,"Cache-Control":"public, max-age=300"}});
    }
    if(path!=="/api/status") return json(request,{error:"Route not found"},404);
    try {
      const [registry,projects,repairs,audit] = await Promise.all([
        registryStatus(env.REGISTRY),projectStatus(env.REGISTRY),repairsStatus(env.HIVE),
        env.REGISTRY.prepare("SELECT checked_at,ledger_ok FROM atlas_audit WHERE id=1").first()
      ]);
      return json(request,{registry,projects,repairs,observedAt:Date.now(),
        audit:audit ? {checkedAt:audit.checked_at,ledgerOk:audit.ledger_ok===1}:null});
    } catch {
      return json(request,{error:"Registry unavailable"},503);
    }
  },
  async scheduled(controller,env) {
    await Promise.all([workerBee(env.REGISTRY,controller.scheduledTime),antBot(env.REGISTRY,controller.scheduledTime)]);
  }
};
