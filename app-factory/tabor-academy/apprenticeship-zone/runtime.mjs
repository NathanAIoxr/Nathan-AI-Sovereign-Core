const base = "/tabor-academy/institution/apprenticeship-zone/";
const route = /^\/(?:tabor-academy\/)?institution\/apprenticeship-zone(?:\/(.*))?$/;
const kindLabel = {
  occupation: "Official occupation or trade", standard: "Official standard or unit", college: "College or school example",
  historical: "Historical record", reconstruction: "Prehistoric or ancient exercise", living: "Living tradition", proposal: "Academy proposal",
};
const quick = [
  ["all", "Browse the database", ""],
  ["origin", "Explore the deep past", "?kind=reconstruction"],
  ["evidence", "Find historical records", "?kind=historical"],
  ["living", "See living traditions", "?kind=living"],
  ["retired", "See retired standards and college programmes", "?scope=retired"],
  ["proposal", "See apprenticeships that should exist", "?kind=proposal"],
];
const esc = x => String(x ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const link = (url,label) => `<a href="${esc(url)}">${esc(label)}</a>`;
const p = value => "<p>"+esc(value)+"</p>";
const list = values => "<ul>"+values.map(s=>"<li>"+s+"</li>").join("")+"</ul>";
const count = n => new Intl.NumberFormat("en-US").format(n);
const fold = x => x.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const every = query => `<nav aria-label="Results pages">${query}</nav>`;

function page(title,body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)} · Tabor Academy</title><style>
  :root{color-scheme:dark;color:#f6f1e5;background:#151b16;font:1rem/1.6 system-ui,sans-serif;--paper:#202b22;--line:#596957;--accent:#eed895;--muted:#c5cdbe}
  *{box-sizing:border-box}body{margin:0}header,main{max-width:71rem;margin:auto;padding-inline:clamp(.95rem,5vw,4rem)}header{border-bottom:1px solid var(--line)}main{padding-block:2rem 4rem}a{color:var(--accent);text-underline-offset:.2em}
  nav{display:flex;gap:.5rem 1.15rem;flex-wrap:wrap;padding-block:1rem}h1,h2,h3{font-family:Georgia,serif;line-height:1.12;font-weight:400}h1{font-size:clamp(2.1rem,7vw,4.45rem);max-width:21ch;margin:.2rem 0 1.1rem}h2{font-size:clamp(1.7rem,4vw,2.35rem);margin:1.8rem 0 .85rem}h3{font-size:1.36rem;margin:.15rem 0 .45rem}p{max-width:76ch;margin:.5rem 0 1rem}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,17.5rem),1fr));gap:.8rem}article{padding:1rem;border:1px solid var(--line);background:var(--paper);overflow-wrap:anywhere}
  .muted{color:var(--muted)}.result{margin:.1rem 0 .75rem}form{display:flex;flex-wrap:wrap;gap:.65rem;align-items:end;margin:.7rem 0 1.2rem}label{display:flex;flex-direction:column;min-width:0}input,select,button{font:inherit;border-radius:.22rem;padding:.5rem .67rem;min-width:0;max-width:100%;border:1px solid var(--line);background:#17251a;color:inherit}input{width:min(69vw,26rem)}
  a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid var(--accent);outline-offset:3px}button{background:var(--accent);color:#171b13;font-weight:700;cursor:pointer}.skip{position:absolute;left:-9999px}.skip:focus{left:1rem;z-index:2;background:#151b16}.scroll{overflow:auto}table{border-collapse:collapse;width:100%}th,td{padding:.4rem .6rem;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}dt{font-weight:700}dd{margin:0 0 .5rem}li{margin:.2rem 0}
  @media(max-width:37em){form label,input,select{width:100%}}
  </style></head><body><a class="skip" href="#main">Skip to content</a><header>
  <nav aria-label="Apprenticeship Zone">${link("/tabor-academy/","Tabor Academy")}${link(base,"Apprenticeship Zone")}${link(base+"search/","Search database")}${link(base+"coverage/","Sources & coverage")}${link("/tabor-academy/institution/apprenticeships/","Classes and practice projects")}</nav>
  </header><main id="main"><h1>${esc(title)}</h1>${body}</main></body></html>`;
}

function home(coverage) {
  return page("Tabor Academy Apprenticeship Zone",
    p("Search how people learn through supervised work and practice, from stone-tool evidence and surviving agreements to modern standards and new Academy pathways.")+
    p(count(coverage.totals.records)+" catalog records · "+count(coverage.totals.variants)+" preserved U.S. training variants")+
    form(new URLSearchParams(), coverage.regions)+
    `<div class="cards">${quick.map(([,label,query])=>`<article><h3>${link(base+"search/"+query,label)}</h3></article>`).join("")}</div>`+
    "<h2>Plan your training</h2>"+p("Ask who teaches, what practice is supervised, what you will be paid where the program is a paid placement, and what you can demonstrate or carry forward.")+
    list([link("/tabor-academy/institution/apprenticeships/college/","Community college model and sponsor questions"),
      link("/tabor-academy/institution/mastery/","Human Learning, Survival & Mastery"),link(base+"coverage/","See what the database covers")]));
}

function form(params,regions) {
  const options = (values, selected) => values.map(([value,label])=>`<option value="${esc(value)}"${value===selected?" selected":""}>${esc(label)}</option>`).join("");
  return `<form method="get" action="${base}search/"><label>Skill, title or code<input name="q" type="search" maxlength="100" value="${esc((params.get("q")??"").slice(0,100))}" placeholder="Try weaving, Kente, or ST1459"></label>
  <label>Type<select name="kind"><option value="">All</option>${options(Object.entries(kindLabel),params.get("kind"))}</select></label>
  <label>Place or collection<select name="region"><option value="">All</option>${options(regions.map(x=>[x.region,x.region]),params.get("region"))}</select></label>
  ${params.get("scope")==="retired"?'<input type="hidden" name="scope" value="retired">':""}<button type="submit">Search</button></form>`;
}

const read = async (db,sql,...args) => (await db.prepare(sql).bind(...args).all()).results;
const top = async (db,sql,...args) => db.prepare(sql).bind(...args).first();
async function coverage(db) {
  const queries = await db.batch([
    db.prepare("SELECT (SELECT count(*) FROM records) records,(SELECT count(*) FROM variants) variants,(SELECT count(*) FROM sources) sources"),
    db.prepare("SELECT region,count(*) records FROM records GROUP BY region ORDER BY region"),
    db.prepare("SELECT kind,count(*) records FROM records GROUP BY kind ORDER BY kind"),
    db.prepare("SELECT id,retrieved,source_hash,record_count,notes FROM import_receipts ORDER BY id"),
  ]);
  return {totals:queries[0].results[0],regions:queries[1].results,kinds:queries[2].results,imports:queries[3].results};
}

function queryPlan(params) {
  const q = (params.get("q")??"").trim().slice(0,100);
  const kind = params.get("kind")??"";
  const region = (params.get("region")??"").slice(0,90);
  const scope = params.get("scope")==="retired"?"retired":"";
  const page = Math.min(100000,Math.max(1,Number.parseInt(params.get("page"),10)||1));
  const terms = [];
  const values = [];
  for (const token of fold(q).split(/\s+/).filter(Boolean).slice(0,8)) {
    terms.push("instr(search_key,?)>0"); values.push(token);
  }
  if (Object.hasOwn(kindLabel,kind)) { terms.push("kind=?"); values.push(kind); }
  if (region) { terms.push("region=?"); values.push(region); }
  if (scope) terms.push("status IN ('Retired','Documented withdrawal')");
  return { where:terms.length?" WHERE "+terms.join(" AND "):"",values,params:{q,kind,region,scope},page };
}
async function search(db,params) {
  const input = queryPlan(params);
  const { where,values } = input;
  const hit = await top(db,"SELECT count(*) total FROM records"+where,...values);
  const pages = Math.max(1,Math.ceil(hit.total/28));
  const now = Math.min(pages,input.page);
  const rows = await read(db,"SELECT id,title,region,kind,status,period,reference FROM records"+where+" ORDER BY title COLLATE NOCASE,id LIMIT ? OFFSET ?",...values,28,(now-1)*28);
  return {total:hit.total,page:now,pages,rows,params:input.params};
}
function searchPage(results,params,regions) {
  const jump = (n,label)=>link(base+"search/?"+new URLSearchParams({...results.params,page:n}),label);
  const pager = results.pages>1 ? every((results.page>1?jump(results.page-1,"Previous"):"")+"<span>Page "+results.page+" of "+results.pages+"</span>"+(results.page<results.pages?jump(results.page+1,"Next"):"")) : "";
  const rows = results.rows.map(row=>`<article><h3>${link(base+"record/"+row.id+"/",row.title)}</h3><p class="muted">${esc([row.region,kindLabel[row.kind],row.status].join(" · "))}</p>${row.reference?p(row.reference):""}</article>`).join("");
  return page("Find an apprenticeship record",form(params,regions)+
    `<p class="result" role="status">${count(results.total)} matching records. ${link(base+"search/","Clear filters")}</p>`+
    (rows?`<div class="cards">${rows}</div>`:p("Try a shorter title or remove one of the filters."))+pager);
}

async function record(db,id) {
  const row = await top(db,`SELECT r.id,r.title,r.region,r.kind,r.status,r.period,r.reference,r.detail,r.source_url,
    s.publisher,s.url AS publisher_url,s.note,s.retrieved FROM records r JOIN sources s ON r.source_id=s.id WHERE r.id=?`,id);
  if (!row) return null;
  const details = await read(db,"SELECT source_data FROM variants WHERE record_id=? ORDER BY ordinal",id);
  return { ...row, variants:details.map(x=>JSON.parse(x.source_data)) };
}
function recordPage(item) {
  const metadata = [["Place or collection",item.region],["Type",kindLabel[item.kind]],["Status",item.status],["Period",item.period],["Reference",item.reference]];
  const table = item.variants.length ? `<h2>Training variants in the source</h2><div class="scroll"><table><thead><tr>${["O*NET code","O*NET title","Training approach","Version","Min term","Max term","Bulletins","Career lattice"].map(x=>"<th scope='col'>"+esc(x)+"</th>").join("")}</tr></thead>
  <tbody>${item.variants.map(row=>"<tr>"+row.map(x=>"<td>"+esc(x||"—")+"</td>").join("")+"</tr>").join("")}</tbody></table></div>` : "";
  const next = item.kind==="proposal" ? p("Use the project to define skills, mentor supervision and assessment. An employer and the appropriate recognised authority determine whether a paid, registered programme can be offered.") : "";
  return page(item.title,`<dl>${metadata.filter(([,value])=>value).map(([label,value])=>"<dt>"+esc(label)+"</dt><dd>"+esc(value)+"</dd>").join("")}</dl>`+
    p(item.detail)+next+table+"<h2>Source</h2>"+list([
      link(item.publisher_url,item.publisher),...(item.source_url&&item.source_url!==item.publisher_url?[link(item.source_url,"Open the source record or Academy project")]:[]),
    ])+(item.note?p(item.note):"")+p("Source checked "+item.retrieved+"."));
}

function coveragePage(info) {
  const text = {
    dol:"U.S. Department of Labor approved occupations", england:"Skills England standards, foundation apprenticeships and units",
    germany:"Germany’s recognized training occupations, 2026", canada:"Canada’s Red Seal designated trades", academy:"Academy pathways, archival evidence and future proposals",
  };
  return page("Sources and coverage",
    p("National sources have different units. An occupation, a version of a standard, a dated agreement and a proposed pathway are each indexed as a record.")+
    list(info.imports.map(item=>esc(text[item.id]??item.id)+" · "+count(item.record_count)+" records · "+esc(item.retrieved)))+
    "<h2>What the historic record can show</h2>"+p("Artifacts can support conclusions about tasks and skills. Surviving agreements can establish a specific training arrangement. The database gives each of those records its own label.")+
    "<h2>Where coverage is incomplete</h2>"+list([
      "Historic records favor places, instruments and agreements that survived. Most prehistory and informal family teaching cannot be reconstructed entry by entry.",
      "The Red Seal list is a national designation within a wider Canadian provincial and territorial system. Germany is represented by one edition of an official register.",
      "The national catalogs describe approved entries or standards. Search separately for sponsor openings and training placements.",
    ])+
    `<p>${link(base+"api/coverage","Download counts, snapshot dates and hashes")} · ${link(base+"conductor.json","Conductor handoff")}</p>`);
}

const missing = () => page("Apprenticeship record unavailable",p("Try a title, source code or place in the zone search."));
export async function serveZone(request,db) {
  const url = new URL(request.url);
  const hit = url.pathname.match(route);
  if (!hit) return null;
  const key = (hit[1]??"").replace(/\/$/,"");
  const reply = (body,status=200,type="text/html",extra={}) => new Response(request.method==="HEAD"?null:body,{status,headers:{
    "content-type":type+"; charset=utf-8","cache-control":status===200?"public, max-age=60":"no-store",
    "content-security-policy":"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    "x-content-type-options":"nosniff",...extra,
  }});
  const json = (x,status=200) => reply(JSON.stringify(x),status,"application/json");
  if (!["GET","HEAD"].includes(request.method)) return reply("Method not allowed",405,"text/plain",{allow:"GET, HEAD"});
  if (!db) return reply(page("Database temporarily unavailable",p("Open Classes and practice projects to keep learning.")),503);
  try {
    if (!key) return reply(home(await coverage(db)));
    if (key==="coverage") return reply(coveragePage(await coverage(db)));
    if (key==="api/coverage") return json(await coverage(db));
    if (key==="conductor.json") return json({ project:"Tabor Academy Apprenticeship Zone", route:base,
      database:"tabor-academy-apprenticeships", publicSearch:base+"api/records", coverage:await coverage(db),
      importPolicy:"Keep source-specific identifiers, publisher status, version, and source provenance. Import source updates with repeatable upserts. Label proposals and distinguish an occupation from an actual placement." });
    if (key==="search"||key==="api/records") {
      const results = await search(db,url.searchParams);
      if (key==="api/records") return json(results);
      const regions = await read(db,"SELECT DISTINCT region FROM records ORDER BY region");
      return reply(searchPage(results,url.searchParams,regions));
    }
    const id = key.match(/^(?:api\/)?record\/([a-z0-9-]{1,180})$/)?.[1];
    if (id) {
      const item = await record(db,id);
      if (key.startsWith("api/")) return item?json(item):json({error:"Unknown record"},404);
      return item?reply(recordPage(item)):reply(missing(),404);
    }
    return reply(missing(),404);
  } catch (error) {
    console.error("Apprenticeship catalog read failed",error?.name);
    return key.startsWith("api/") ? json({error:"Apprenticeship database temporarily unavailable"},503) :
      reply(page("Database temporarily unavailable",p("Try the search again shortly or use Classes and practice projects.")),503);
  }
}
export default function withApprenticeshipZone(previous) {
  return { ...previous, async fetch(request,env,ctx) {
    const response = await serveZone(request,env?.APPRENTICESHIP_DB);
    if (response) return response;
    const before = await previous.fetch(request,env,ctx);
    const path=new URL(request.url).pathname.replace(/^\/tabor-academy(?=\/)/,"");
    const addLink=["/","/institution/apprenticeships/","/institution/mastery/"].includes(path);
    if (!addLink||request.method!=="GET"||!before.ok||!before.headers.get("content-type")?.startsWith("text/html")||typeof HTMLRewriter==="undefined") return before;
    let added=false;
    return new HTMLRewriter().on("main h1",{element(element){
      if(added) return;
      added=true;
      element.after(`<p data-apprenticeship-zone-link>${link(base,"Search the Apprenticeship Zone database")}</p>`,{html:true});
    }}).transform(before);
  }};
}
