const NO_CACHE = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; style-src 'unsafe-inline'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff"
};

const escape = (value) => String(value).replace(/[&<>"']/g, (char) =>
  ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]
);
const validId = (value) => /^[a-z0-9][a-z0-9-]{0,95}$/.test(value);
const json = (data, status = 200) => Response.json(data, {status, headers: NO_CACHE});
const text = (body, status) => new Response(body, {status, headers: NO_CACHE});

function page(title, body, status = 200) {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>body{font:1rem system-ui;margin:3rem auto;padding:0 1rem;max-width:45rem;color:#192e30;background:#f4faf8}a{color:#14635d}li{padding:.35rem 0;overflow-wrap:anywhere}code,dd{overflow-wrap:anywhere}nav{line-height:2}dt{font-weight:600;margin-top:.6rem}dd{margin-left:0}header{border-bottom:2px solid #8db9b1}main{padding-top:1rem}</style><header><p>Nathan AI</p><h1>${escape(title)}</h1></header><main>${body}</main></html>`, {
    status, headers: {...NO_CACHE,"Content-Type":"text/html; charset=utf-8"}
  });
}

function decode(value) {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) throw Error("Malformed token");
  return Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (char) => char.charCodeAt(0));
}

export async function authorize(request, env, fetchKeys = fetch) {
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!jwt || jwt.length > 16000 || !env.ACCESS_AUDIENCE || !env.ACCESS_ISSUER) return false;
  try {
    const issuer = new URL(env.ACCESS_ISSUER);
    if (issuer.protocol !== "https:" || !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer.host) || issuer.origin !== env.ACCESS_ISSUER) return false;
    const parts = jwt.split(".");
    if (parts.length !== 3) return false;
    const [encodedHeader, encodedClaims, encodedSignature] = parts;
    const decoder = new TextDecoder();
    const header = JSON.parse(decoder.decode(decode(encodedHeader)));
    const claims = JSON.parse(decoder.decode(decode(encodedClaims)));
    const now = Math.floor(Date.now() / 1000);
    if (header.alg !== "RS256" || typeof header.kid !== "string" || claims.iss !== issuer.origin) return false;
    if (!Array.isArray(claims.aud) || !claims.aud.includes(env.ACCESS_AUDIENCE) || !claims.sub || !claims.email) return false;
    if (!Number.isFinite(claims.exp) || claims.exp <= now || (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now))) return false;
    const response = await fetchKeys(new URL("/cdn-cgi/access/certs", issuer), {redirect: "manual", signal: AbortSignal.timeout(5000)});
    if (!response.ok) return false;
    const {keys} = await response.json();
    const jwk = keys.find((key) => key.kid === header.kid && key.kty === "RSA");
    if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, {name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"}, false, ["verify"]);
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, decode(encodedSignature), new TextEncoder().encode(`${encodedHeader}.${encodedClaims}`));
  } catch {
    return false;
  }
}

function holding(base) {
  return page("Holding Vault", `<p>This project is in staging.</p><p><a href="${base}/preview">Owner preview</a></p>`, 200);
}

async function projectRow(env, id) {
  return await env.DB.prepare("SELECT workspace_id, project_name, project_kind, domain, domain_status, launch_status, public_url FROM zones_registry WHERE workspace_id=?").bind(id).first();
}

export async function readZoneComponents(db, workspaceId, limit = 100, offset = 0) {
  if (!validId(workspaceId)) throw Error("Invalid project");
  const query = "SELECT component_type,source_table,source_id,source_ref,snapshot_json,snapshot_sha256,captured_at FROM zone_components WHERE workspace_id=? ORDER BY component_type,source_table,source_id LIMIT ? OFFSET ?";
  const {results} = await db.prepare(query).bind(workspaceId,limit+1,offset).all();
  return {rows:results.slice(0,limit),nextOffset:results.length>limit ? offset+limit : null};
}

function partLink(sourceTable, sourceId) {
  const bytes = new TextEncoder().encode(JSON.stringify([sourceTable,sourceId]));
  return btoa(Array.from(bytes,(byte) => String.fromCharCode(byte)).join(""))
    .replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");
}

function partIdentity(token) {
  if (token.length > 3000) return null;
  try {
    const pair = JSON.parse(new TextDecoder().decode(decode(token)));
    return Array.isArray(pair) && pair.length === 2 &&
      pair.every((value) => typeof value === "string" && value.length > 0)
      ? pair : null;
  } catch {
    return null;
  }
}

export async function renderZoneSite(env, record, base, part, cursor = "0") {
  const site = await env.DB.prepare("SELECT preview_hostname FROM zone_preview_sites WHERE workspace_id=?").bind(record.workspace_id).first();
  if (!site) return text("Project website not found",404);

  const root = `${base}/preview/${record.workspace_id}`;
  const title = record.project_name;
  const header = `<nav aria-label="Project preview"><a href="${root}">Workspace</a> · <a href="${root}/site">Website preview</a> · <a href="${root}/snapshot.json">Snapshot</a> · <a href="${base}/preview/readers?workspace=${record.workspace_id}">Integration candidates</a> · <a href="${root}/provenance">Source trail</a></nav><p><strong>Private staging</strong> · <code>${escape(site.preview_hostname)}</code></p>`;
  if (part) {
    const key = partIdentity(part);
    if (!key) return text("Component not found",404);
    const component = await env.DB.prepare("SELECT component_type,source_table,source_id,source_ref,captured_at,snapshot_sha256 FROM zone_preview_parts WHERE workspace_id=? AND source_table=? AND source_id=?").bind(record.workspace_id,...key).first();
    if (!component) return text("Component not found",404);
    return page(component.component_type,`${header}<p>${escape(title)}</p><dl><dt>Staged source</dt><dd>${escape(component.source_ref ?? component.source_id)}</dd><dt>Source catalog</dt><dd>${escape(component.source_table)}</dd><dt>Snapshot captured</dt><dd>${escape(component.captured_at ?? "")}</dd><dt>Snapshot SHA-256</dt><dd><code>${escape(component.snapshot_sha256)}</code></dd></dl>`);
  }

  if (!/^(0|[1-9][0-9]{0,6})$/.test(cursor)) return text("Invalid cursor",400);
  const offset = Number(cursor);
  const pageSize = 40;
  const {results} = await env.DB.prepare("SELECT component_type,source_table,source_id,source_ref FROM zone_preview_parts WHERE workspace_id=? ORDER BY component_type,source_table,source_id LIMIT ? OFFSET ?").bind(record.workspace_id,pageSize+1,offset).all();
  const items = results.slice(0,pageSize).map((row) =>
    `<li><a href="${root}/site/part/${partLink(row.source_table,row.source_id)}">${escape(row.component_type)}</a><div>${escape(row.source_ref ?? row.source_id)}</div></li>`
  ).join("");
  const next = results.length>pageSize ? `<p><a href="${root}/site?offset=${offset+pageSize}">Next components</a></p>` : "";
  const placeholder = record.domain ? escape(record.domain) : "Assigned at launch";
  return page(title,`${header}<dl><dt>Website domain</dt><dd>${placeholder}</dd><dt>Launch state</dt><dd>${escape(record.launch_status)}</dd></dl><h2>Staged areas</h2>${items ? `<ul>${items}</ul>` : "<p>No staged areas yet.</p>"}${next}`);
}

async function showProvenance(env, record, base, search, asJson) {
  const offset = search.get("offset") ?? "0";
  if (!/^(0|[1-9][0-9]{0,6})$/.test(offset)) return text("Invalid cursor",400);
  const {results} = await env.DB.prepare(`
    WITH RECURSIVE reachable(node_key) AS (
      VALUES(?)
      UNION
      SELECT e.target_key FROM zone_reader_provenance_edges e JOIN reachable r ON e.source_key=r.node_key
    ), visible AS (
      SELECT n.node_key,n.kind,n.locator,n.resolution
      FROM reachable r JOIN zone_reader_provenance_nodes n USING(node_key)
      ORDER BY CASE n.resolution WHEN 'verified-leaf' THEN 0 WHEN 'external-reference' THEN 1 WHEN 'unresolved' THEN 2 ELSE 3 END,n.node_key
      LIMIT 51 OFFSET ?
    )
    SELECT v.*, (SELECT json_group_array(json_object('relation',e.relation,'target',e.target_key))
      FROM zone_reader_provenance_edges e WHERE e.source_key=v.node_key) AS references_json
    FROM visible v`).bind("zone:"+record.workspace_id,Number(offset)).all();
  const nextOffset = results.length>50 ? Number(offset)+50 : null;
  const rows = results.slice(0,50).map(({references_json,...row}) => ({...row,references:JSON.parse(references_json)}));
  if (asJson) return json({workspace:record.workspace_id,rows,nextOffset});
  const workspace = `${base}/preview/${record.workspace_id}`;
  const path = `${workspace}/provenance`;
  const list = rows.map(row => `<li><code>${escape(row.locator)}</code> · ${escape(row.kind)} · ${escape(row.resolution)}<details><summary>${row.references.length} direct references</summary><ul>${row.references.map(edge=>`<li>${escape(edge.relation)} · <code>${escape(edge.target)}</code></li>`).join("")}</ul></details></li>`).join("");
  const next = nextOffset===null ? "" : `<p><a href="${path}?offset=${nextOffset}">Next page</a></p>`;
  return page("Source trail",`<p><a href="${workspace}">${escape(record.project_name)}</a> · <a href="${path}.json?offset=${offset}">JSON evidence</a></p>${list?`<ol>${list}</ol>`:"<p>No source trail is available for this workspace.</p>"}${next}`);
}

async function showReaders(env,base,search,asJson) {
  const workspace=search.get("workspace") ?? "";
  const reader=search.get("reader") ?? "";
  const cursor=search.get("offset") ?? "0";
  if ((workspace&&!validId(workspace)) || (reader&&!["github","cloudflare"].includes(reader)) || !/^(0|[1-9][0-9]{0,6})$/.test(cursor)) return text("Invalid filter",400);
  const offset=Number(cursor);
  const {results}=await env.DB.prepare(`SELECT c.reader,c.workspace_id,c.candidate_key,c.action,c.source_ref,c.evidence_json,c.review_status,z.project_name
    FROM zone_reader_candidates c JOIN zones_registry z USING(workspace_id)
    WHERE z.launch_status='HOLDING' AND (?='' OR c.workspace_id=?) AND (?='' OR c.reader=?)
    ORDER BY c.observed_at DESC,c.workspace_id,c.reader,c.candidate_key LIMIT 41 OFFSET ?`).bind(workspace,workspace,reader,reader,offset).all();
  const rows=results.slice(0,40);
  const nextOffset=results.length>40?offset+40:null;
  if (asJson) return json({workspace:workspace||null,reader:reader||null,nextOffset,rows:rows.map(({evidence_json,...row})=>({...row,evidence:JSON.parse(evidence_json)}))});
  const path=base+"/preview/readers";
  function query(next) {
    const params=new URLSearchParams();
    if(workspace)params.set("workspace",workspace);
    if(reader)params.set("reader",reader);
    if(next)params.set("offset",String(next));
    const value=params.toString();
    return value?"?"+escape(value):"";
  }
  const files=rows.map(row=>{
    const label=escape(row.source_ref);
    const origin=row.source_ref.startsWith("https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/")?`<a href="${label}">${label}</a>`:label;
    return `<li><a href="${base}/preview/${escape(row.workspace_id)}/site">${escape(row.project_name)}</a><p>${escape(row.action)} · ${escape(row.reader)} · ${escape(row.review_status)}</p><small>${origin}</small></li>`;
  }).join("");
  const next=nextOffset===null?"":`<p><a href="${path}${query(nextOffset)}">Next candidates</a></p>`;
  return page("Integration candidates",`<p><a href="${base}/preview">Project registry</a> · <a href="${path}.json${query(offset)}">JSON evidence</a></p>${files?`<ol>${files}</ol>`:"<p>No integration candidates for this view.</p>"}${next}`);
}

async function handle(request, env) {
  const base = env.MOUNT_PATH === "/holding-vault" ? "/holding-vault" : "";
  const {pathname, searchParams} = new URL(request.url);
  if (!["GET","HEAD"].includes(request.method)) {
    return new Response("Method not allowed", {status:405,headers:{...NO_CACHE,Allow:"GET, HEAD"}});
  }
  if (pathname === "/health") return json({service:"tabor-holding-vault",status:"ok",launch:env.LAUNCH_STATUS === "LIVE" ? "enabled" : "holding"});
  if (pathname === "/") return holding(base);

  const publicMatch = /^\/holding\/([^/]+)\/?$/.exec(pathname);
  if (publicMatch && validId(publicMatch[1])) {
    if (env.LAUNCH_STATUS === "LIVE") {
      const record = await projectRow(env, publicMatch[1]);
      if (record?.launch_status === "LIVE" && record.domain_status === "active") {
        const target = new URL(record.public_url);
        if (target.protocol === "https:" && target.hostname === record.domain && !target.username && !target.password && !target.port) {
          return new Response(null,{status:302,headers:{...NO_CACHE,Location:target.href}});
        }
      }
    }
    return holding(base);
  }

  if (pathname !== "/preview" && !pathname.startsWith("/preview/")) return text("Page not found",404);
  if (!await authorize(request, env)) return text("Owner authorization required",401);
  if (pathname === "/preview/readers" || pathname === "/preview/readers.json") {
    return await showReaders(env,base,searchParams,pathname.endsWith(".json"));
  }


  if (pathname === "/preview" || pathname === "/preview/") {
    const after = searchParams.get("after") ?? "";
    if (after && !validId(after)) return text("Invalid cursor",400);
    const {results} = await env.DB.prepare("SELECT workspace_id, project_name, project_kind FROM zones_registry WHERE workspace_id>? ORDER BY workspace_id LIMIT 41").bind(after).all();
    const rows = results.slice(0,40);
    const items = rows.map((row) => '<li><a href="' + base + '/preview/' + escape(row.workspace_id) + '">' + escape(row.project_name) + '</a> · ' + escape(row.project_kind) + '</li>').join("");
    const next = results.length > 40 ? '<p><a href="' + base + '/preview?after=' + encodeURIComponent(rows.at(-1).workspace_id) + '">Next page</a></p>' : "";
    return page("Project staging registry", `<p><a href="${base}/preview/readers">Integration candidates</a></p><ul>${items}</ul>${next}`);
  }

  const provenance = /^\/preview\/([^/]+)\/provenance(?:\.json)?\/?$/.exec(pathname);
  if (provenance) {
    if (!validId(provenance[1])) return text("Project not found",404);
    const project = await projectRow(env,provenance[1]);
    if (!project) return text("Project not found",404);
    return await showProvenance(env,project,base,searchParams,pathname.includes(".json"));
  }

  const site = /^\/preview\/([^/]+)\/site(?:\/part\/([^/]+))?\/?$/.exec(pathname);
  if (site) {
    if (!validId(site[1])) return text("Project website not found",404);
    const project = await projectRow(env,site[1]);
    if (!project) return text("Project website not found",404);
    return await renderZoneSite(env,project,base,site[2],searchParams.get("offset") ?? "0");
  }

  const match = /^\/preview\/([^/]+)(?:\/(snapshot\.json|assets\/(.+)))?\/?$/.exec(pathname);
  if (!match || !validId(match[1])) return text("Project not found",404);
  const record = await projectRow(env, match[1]);
  if (!record) return text("Project not found",404);
  if (match[2] === "snapshot.json") {
    const cursor = searchParams.get("offset") ?? "0";
    if (!/^(0|[1-9][0-9]{0,6})$/.test(cursor)) return text("Invalid cursor",400);
    const {rows,nextOffset} = await readZoneComponents(env.DB,record.workspace_id,100,Number(cursor));
    const bytes = JSON.stringify({
      project:record, nextOffset,
      components:rows.map(({snapshot_json,...component}) => ({...component,snapshot:JSON.parse(snapshot_json)}))
    });
    return new Response(bytes,{headers:{...NO_CACHE,"Content-Type":"application/json; charset=utf-8","Content-Disposition":`attachment; filename="${record.workspace_id}-snapshot.json"`}});
  }
  if (!match[3]) {
    const {rows,nextOffset} = await readZoneComponents(env.DB,record.workspace_id,30);
    const list = rows.map((row) => `<li>${escape(row.component_type)} · ${escape(row.source_ref ?? row.source_id)}</li>`).join("");
    const snapshot = `${base}/preview/${record.workspace_id}/snapshot.json`;
    const count = nextOffset === null ? rows.length : "30+";
    return page(record.project_name,`<p><a href="${base}/preview">Project registry</a></p><dl><dt>Project</dt><dd>${escape(record.project_kind)}</dd><dt>Release</dt><dd>${escape(record.launch_status)}</dd><dt>Domain</dt><dd>${escape(record.domain ?? "Awaiting assignment")}</dd><dt>Zone state</dt><dd>${escape(record.domain_status)}</dd></dl><p><a href="${base}/preview/${record.workspace_id}/site">Website preview</a> · <a href="${base}/preview/${record.workspace_id}/provenance">Source trail</a></p><h2>Staged components (${count})</h2><p><a href="${snapshot}">Download project snapshot</a></p><ul>${list}</ul>`);
  }

  const segments = match[3].split("/");
  if (segments.some((segment) => !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(segment))) return text("Asset not found",404);
  const object = await env.VAULT.get(`${record.workspace_id}/${segments.join("/")}`);
  if (!object) return text("Asset not found",404);
  return new Response(object.body, {headers:{...NO_CACHE,"Content-Type":"application/octet-stream","Content-Disposition":`attachment; filename="${segments.at(-1)}"`}});
}

export default {
  async fetch(request, env) {
    let response;
    try {
      response = await handle(request, env);
    } catch {
      response = text("Holding vault temporarily unavailable",503);
    }
    return request.method === "HEAD" ? new Response(null, {status:response.status,headers:response.headers}) : response;
  }
};
