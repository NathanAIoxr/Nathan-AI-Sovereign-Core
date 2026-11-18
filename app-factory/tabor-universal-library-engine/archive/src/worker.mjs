import { catalogFetch, isCatalogRoute } from "../../../tabor-worker-catalog/src/replica.mjs";
import architecture from "../data/architecture.json" with { type: "json" };
import modules from "../data/edge-registry.json" with { type: "json" };
import act from "../data/act-graph.json" with { type: "json" };
import { bodyKey, cadence, classNames, groups, idPattern, maxEditionBytes, materials, providers, shaPattern, states, vaults } from "./model.mjs";
import { matrixRoute } from "./matrix-route.mjs";
import { sha256 } from "./integrity.mjs";
import { browse, browseParams, editionById, workDetail } from "./catalog.mjs";
import { architecturePage, css, readingRoom, shelvesPage, shell, workPage } from "./ui.mjs";

const coreHeaders = {
  "cache-control": "no-store",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "content-security-policy": "default-src 'none'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
};
const counts = { modules: modules.length, nodes: act.nodes.length, primitives: act.primitives.length, shelves: Object.keys(classNames).length };
const moduleCounts = Object.fromEntries([...new Set(modules.map(x=>x[3]))].map(state=>[state,modules.filter(x=>x[3]===state).length]));
const release = "tabor-archive-v2";
const respond = (body, type, status=200, options={})=>new Response(body,{status,headers:{...coreHeaders,"content-type":type,...options}});
const json = (body,status=200)=>respond(JSON.stringify(body),"application/json; charset=utf-8",status);
const html = (body,status=200)=>respond(body,"text/html; charset=utf-8",status);
const notFound = api=>api ? json({error:"Record not found"},404) : html(shell("Page not found","<h1>Page not found</h1><p><a href='/'>Return to the Reading Room</a></p>"),404);

async function serveEdition(request, env, work, id, action) {
  const edition = await editionById(env.ARCHIVE_DB,work,id);
  if (!edition) return notFound(true);
  const {sha256: digest,bytes,country} = edition;
  if (!shaPattern.test(digest) || bytes < 1 || bytes > maxEditionBytes) {
    return json({error:"Edition failed its integrity check"},503);
  }
  if (action === "text" && country && request.cf?.country !== country) {
    return json({error:"This archived edition is served in "+country+".",source:edition.source_url},451);
  }

  const key = bodyKey(digest);
  const object = request.method === "HEAD" && action === "text" ? await env.ARCHIVE_BLOB.head(key) : await env.ARCHIVE_BLOB.get(key);
  if (!object || object.size !== bytes || object.customMetadata?.sha256 !== digest) {
    if (object?.body) await object.body.cancel();
    return json({error:"Edition failed its storage check"},503);
  }
  if (action === "verify") {
    const actual = await sha256(await object.arrayBuffer());
    const verified = actual === digest;
    return json({work,edition:id,bytes,sha256:digest,format:edition.format??"source-text",verified},verified?200:503);
  }
  const mediaType = edition.format === "tei" ? "application/xml; charset=utf-8" : "text/plain; charset=utf-8";
  return respond(object.body ?? null,mediaType,200,{
    "content-length":String(bytes), etag:'"sha256-'+digest+'"'
  });
}

async function routes(request, env, url) {
  const path = url.pathname;
  if (path === "/archive.css") return respond(css,"text/css; charset=utf-8");
  if (path === "/shelves") return html(shelvesPage());
  if (path === "/architecture") return html(architecturePage(architecture,counts));
  if (path === "/api/shelves") return json({classes:classNames, vaults, states, materials, providers});
  if (path === "/api/architecture") return json({...architecture,cadence,groups,counts});
  if (path === "/api/registry/act") return json({...act,nodeColumns:["index","slug","generation","parent","sourceSeal"]});
  if (path === "/api/registry/modules") {
    const id = url.searchParams.get("id");
    const record = id && modules.find(row=>row[0]===id);
    if (id && !record) return notFound(true);
    return json({upstream:architecture.upstream.syscalls,counts:moduleCounts,columns:["id","ring","title","sourceStatus"],entries:id?[record]:modules});
  }
  if (path === "/api/collections") {
    const [sources,formats] = await env.ARCHIVE_DB.batch([
      env.ARCHIVE_DB.prepare("SELECT provider,material,count(*) AS records FROM archive_sources GROUP BY provider,material ORDER BY provider,material"),
      env.ARCHIVE_DB.prepare("SELECT format,count(*) AS editions FROM archive_edition_formats GROUP BY format ORDER BY format")
    ]);
    return json({collections:sources.results,formats:formats.results});
  }
  if (path === "/api/health") {
    const [catalog,editions,witnesses,receipts] = await env.ARCHIVE_DB.batch([
      env.ARCHIVE_DB.prepare("SELECT COUNT(*) AS count FROM archive_works"),
      env.ARCHIVE_DB.prepare("SELECT COUNT(*) AS count FROM archive_editions"),
      env.ARCHIVE_DB.prepare("SELECT COUNT(*) AS count FROM archive_witnesses"),
      env.ARCHIVE_DB.prepare("SELECT COUNT(*) AS count FROM archive_receipts")
    ]);
    return json({status:"ok",release,...counts,sourceModuleStatus:moduleCounts,
      records:catalog.results[0].count,editions:editions.results[0].count,witnesses:witnesses.results[0].count,
      publicationReceipts:receipts.results[0].count});
  }
  if (path === "/" || path === "/api/catalog") {
    const filters = browseParams(url);
    if (!filters) return json({error:"Invalid catalog filters"},400);
    const rows = await browse(env.ARCHIVE_DB,filters);
    return path === "/" ? html(readingRoom(rows,filters)) : json(rows);
  }
  const asset = /^\/api\/works\/([a-z0-9-]+)\/editions\/([a-z0-9-]+)\/(text|verify)$/.exec(path);
  if (asset) return serveEdition(request,env,...asset.slice(1));
  const detail = /^\/(api\/)?works\/([a-z0-9-]+)$/.exec(path);
  if (detail?.[2] && idPattern.test(detail[2])) {
    const record = await workDetail(env.ARCHIVE_DB,detail[2]);
    if (record) return detail[1] ? json(record) : html(workPage(record));
  }
  return notFound(path.startsWith("/api/"));
}

export default {
  async fetch(request,env) {
    if (isCatalogRoute(new URL(request.url).pathname)) return catalogFetch(request,env);
    const matrix = await matrixRoute(request,env);
    if (matrix) return matrix;
    if (!["GET","HEAD"].includes(request.method)) {
      return respond('{"error":"Method not allowed"}',"application/json; charset=utf-8",405,{allow:"GET, HEAD"});
    }
    let response;
    try {
      response = await routes(request,env,new URL(request.url));
    } catch {
      response = json({error:"Archive storage unavailable"},503);
    }
    return request.method === "HEAD" ? new Response(null,response) : response;
  }
};
