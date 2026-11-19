const PUBLIC_SERVICES=[["helpdesk","Help desk, ticket triage, self-service, escalation"],["noc","Network and server availability, capacity and latency"],["soc","Security alerts, investigation, incident coordination"],["cloud","Cloud account configuration, spend and reliability"],["endpoint","Managed devices, patch and lifecycle compliance"],["identity","Identity, SSO, MFA, JML access reviews"],["recovery","Backups, restore drills and recovery evidence"],["devops","CI/CD, infrastructure as code and change reviews"],["compliance","Risk register, control mapping and evidence"],["cio","Business IT strategy, budgets and roadmaps"],["success","Customer QBRs, service reporting and SLA reviews"],["finance","Contracts, subscriptions, billing and unit economics"],["asset","Inventory, warranty, software entitlements and CMDB"],["network","DNS, routing, Wi-Fi and network configuration"],["apps","Business SaaS administration and integration"],["data","Data governance, retention and analytics"],["observability","Service-level objectives, telemetry and alert quality"],["integration","API integrations, event bus and connector ownership"],["platform","Platform engineering and internal developer portal"],["knowledge","Runbooks, documentation and searchable knowledge"],["onboarding","Joiner/mover/leaver and client onboarding"],["vendor","Third-party vendor, contract and supply-chain review"],["procurement","Equipment, licensing and purchasing workflows"],["automation","Safe approved automation and verification receipts"],["incident","Major incident command, communications and lessons"],["privacy","Data protection, privacy and secure deletion"],["qa","Release validation, service testing and change assurance"],["field","Authorized on-site visits and hardware logistics"]];
const PUBLIC_GAPS=[["Prevent recurrence","Create an evidence-based root-cause record for every major incident; track effectiveness of fixes"],["Prove recovery","Run scheduled restore tests and record restore point/time metrics; never equate a backup job with recoverability"],["Business outcomes","Connect asset criticality and service health to user-visible business impact and cost"],["Human decision rights","Require explicit approval for destructive, privileged or high-impact changes"],["Tenant isolation","Enforce identity, per-tenant RBAC, separate credentials and strong audit boundaries"],["Continuous verification","Verify patches, remediations and changes after execution with immutable receipts"],["Explainable automation","Describe each proposed automated action, its reason, blast radius and rollback"],["Software supply chain","Track dependencies, SBOMs, licenses, vendor risk and vulnerability exposure"],["Proactive planning","Model capacity, lifecycle costs, tech debt and actual preventive ROI"],["Alert quality","Deduplicate, prioritize by impact, detect monitor outages and avoid alert fatigue"],["Identity hygiene","Verify access offboarding, stale entitlements, MFA coverage and privileged access"],["Customer transparency","Expose ownership, status, SLA measurements, exceptions and disputed outcomes"],["Privacy by default","Minimize telemetry, apply retention limits, and treat unknown results as unknown"],["Accessible support","Offer multilingual, mobile-friendly, inclusive help and follow-up"],["Resilience","Test vendor outages, degraded-mode operation and communications failover"],["Fair contracts","Publish exact scope, exclusions, response definitions and price change rules"]];
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function publicPage(){const cards=PUBLIC_SERVICES.map(([id,desc])=>'<article class="service"><b>'+esc(id.toUpperCase())+'</b><p>'+esc(desc)+'</p></article>').join('');return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nathan Tabor | DMSP + DIT</title><style>body{margin:0;background:#09111b;color:#e7effa;font:16px/1.55 system-ui,Arial,sans-serif}main{max-width:1100px;margin:auto;padding:52px 22px}.eyebrow{color:#70d3ef;font-weight:700;letter-spacing:.12em}h1{font-size:clamp(34px,6vw,68px);line-height:1.05;margin:15px 0}p.lead{max-width:820px;color:#afc1d6;font-size:18px}.stat{display:inline-block;border:1px solid #2a4b61;border-radius:32px;padding:8px 15px;margin:5px;background:#0e2330}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(225px,1fr));gap:14px;margin:25px 0 45px}.service{background:#142332;border:1px solid #294156;border-radius:14px;padding:18px}.service b{color:#79ddf1;letter-spacing:.06em;font-size:13px}.service p{margin:10px 0 0;color:#d8e5ef}.links a{color:#79ddf1;margin-right:20px}.small{color:#a8bbcf;font-size:14px}h2{margin-top:50px}</style><main><div class="eyebrow">NATHAN TABOR · DIGITAL TECHNOLOGY OPERATIONS</div><h1>DMSP + DIT</h1><p class="lead">Digital Managed Service Providers + Digital IT Departments. One operating model for managed service providers, internal IT and co-managed teams: diagnose, authorize, act, verify and learn.</p><div><span class="stat">28 operating departments</span><span class="stat">DMSP / DIT / Co-managed</span><span class="stat">Cloudflare + GitHub</span></div><h2>Service departments</h2><div class="grid">'+cards+'</div><h2>Build status</h2><p class="small">This is an informational, read-only launch portal. It does not mean customer endpoints are enrolled, support SLAs are staffed, or continuous monitoring is enabled. Private operations require secure identity, explicit customer authorization and verified connectors.</p><div class="links"><a href="/api/public/departments">Department registry</a><a href="/api/public/services">Service catalog JSON</a><a href="/api/public/gaps">MSP improvement priorities</a><a href="/healthz">Health</a></div><p class="small">© Nathan Tabor — DMSP + DIT</p></main></html>';}

// DMSP + DIT tenant-scoped API; deploy as an independent Worker with D1 binding DB.
// Auth: Cloudflare Access JWT verification at edge is recommended; until configured,
// require a server-side DMSP_ADMIN_KEY and restrict access to a trusted operator.
const json=(x,status=200)=>Response.json(x,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
const te=new TextEncoder();
function same(a,b){let x=te.encode(a||""),y=te.encode(b||""),d=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)d|=(x[i]||0)^(y[i]||0);return d===0}
function safe(s){return typeof s==="string"&&s.length>0&&s.length<=160}
async function audit(db,tenant,action,resource){await db.prepare("INSERT INTO dmsp_audit(tenant_id,actor,action,resource) VALUES(?,'operator',?,?)").bind(tenant,action,resource).run()}
export default {async fetch(request,env){
 const u=new URL(request.url);
 if(request.method==="GET"&&u.pathname==="/")return new Response(publicPage(),{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","content-security-policy":"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"}});
 if(request.method==="GET"&&u.pathname==="/api/public/services")return json({product:"Nathan Tabor DMSP + DIT",count:PUBLIC_SERVICES.length,services:PUBLIC_SERVICES.map(([id,description])=>({id,description}))});
 if(request.method==="GET"&&u.pathname==="/api/public/gaps")return json({count:PUBLIC_GAPS.length,improvements:PUBLIC_GAPS.map(([title,objective])=>({title,objective}))});
 if(request.method==="GET"&&u.pathname==="/api/public/comparison")return json({traditional_it:"Reactive incidents, projects and time-based billing",msp:"Recurring monitoring, maintenance, security and managed support",dmsp_dit:"Tenant-scoped digital operating model with governance, approved automation, proof of outcome and business alignment",models:["DMSP","DIT","CO_MANAGED"]});
 if(request.method==="GET"&&u.pathname==="/healthz"){let database="unavailable";try{if(env.DB){const r=await env.DB.prepare("SELECT 1 AS ok").first();if(r?.ok===1)database="reachable"}}catch{}return json({service:"nathan-ai-dmsp-dit",state:database==="reachable"?"PUBLIC_PORTAL_ONLINE":"DEGRADED",database,private_api:env.DMSP_ADMIN_KEY?"configured_not_user_verified":"not_configured",customer_monitoring:"not_configured"},database==="reachable"?200:503)}
 if(request.method==="GET"&&u.pathname==="/api/public/departments"){if(!env.DB)return json({error:"database_unavailable"},503);try{const q=await env.DB.prepare("SELECT id,title,scope,requires_human_review FROM dmsp_departments ORDER BY title").all();return json({count:q.results.length,departments:q.results})}catch{return json({error:"database_query_failed"},503)}}

 if(!env.DB||!env.DMSP_ADMIN_KEY)return json({error:"not_configured"},503);
 const bearer=request.headers.get("authorization")||"";
 if(!bearer.startsWith("Bearer ")||!same(bearer.slice(7),env.DMSP_ADMIN_KEY))return json({error:"unauthorized"},401);
 try{
  if(request.method==="GET"&&u.pathname==="/api/departments"){
   const {results}=await env.DB.prepare("SELECT * FROM dmsp_departments ORDER BY id").all();return json({departments:results});
  }
  if(request.method==="GET"&&u.pathname==="/api/tenants"){
   const {results}=await env.DB.prepare("SELECT id,name,mode,status,created_at FROM dmsp_tenants ORDER BY name LIMIT 100").all();return json({tenants:results});
  }
  if(request.method==="POST"&&u.pathname==="/api/tenants"){
   const b=await request.json();if(!safe(b.id)||!safe(b.name)||!['DMSP','DIT','CO_MANAGED'].includes(b.mode))return json({error:"invalid_tenant"},400);
   await env.DB.prepare("INSERT INTO dmsp_tenants(id,name,mode) VALUES(?,?,?)").bind(b.id,b.name,b.mode).run();
   await audit(env.DB,b.id,"TENANT_CREATED",b.id);return json({ok:true,id:b.id},201);
  }
  const tenant=u.searchParams.get("tenant");
  if(request.method==="GET"&&u.pathname==="/api/overview"){
   if(!safe(tenant))return json({error:"tenant_required"},400);
   const [assets,tickets,checks]=await Promise.all([
    env.DB.prepare("SELECT health,COUNT(*) n FROM dmsp_assets WHERE tenant_id=? GROUP BY health").bind(tenant).all(),
    env.DB.prepare("SELECT state,COUNT(*) n FROM dmsp_tickets WHERE tenant_id=? GROUP BY state").bind(tenant).all(),
    env.DB.prepare("SELECT result,COUNT(*) n FROM dmsp_checks WHERE tenant_id=? GROUP BY result").bind(tenant).all()
   ]);return json({tenant,assets:assets.results,tickets:tickets.results,checks:checks.results});
  }
  if(request.method==="GET"&&u.pathname==="/api/tickets"){
   if(!safe(tenant))return json({error:"tenant_required"},400);
   const {results}=await env.DB.prepare("SELECT * FROM dmsp_tickets WHERE tenant_id=? ORDER BY created_at DESC LIMIT 100").bind(tenant).all();return json({tickets:results});
  }
  if(request.method==="POST"&&u.pathname==="/api/tickets"){
   const b=await request.json();if(!safe(b.id)||!safe(b.tenant_id)||!safe(b.department_id)||!safe(b.title)||!['LOW','MEDIUM','HIGH','CRITICAL'].includes(b.severity))return json({error:"invalid_ticket"},400);
   await env.DB.prepare("INSERT INTO dmsp_tickets(id,tenant_id,department_id,title,severity) VALUES(?,?,?,?,?)").bind(b.id,b.tenant_id,b.department_id,b.title,b.severity).run();
   await audit(env.DB,b.tenant_id,"TICKET_CREATED",b.id);return json({ok:true,id:b.id},201);
  }
  if(request.method==="GET"&&u.pathname==="/api/actions"){
   if(!safe(tenant))return json({error:"tenant_required"},400);
   const {results}=await env.DB.prepare("SELECT * FROM dmsp_actions WHERE tenant_id=? ORDER BY created_at DESC LIMIT 100").bind(tenant).all();return json({actions:results});
  }
  return json({error:"not_found"},404);
 }catch(e){return json({error:"request_failed"},400)}
}};
